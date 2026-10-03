import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-staff';
import { requirePermission } from '../permissions-middleware';
import { hasPermission } from '../../src/shared/permissions';
import { getEffectiveRolesConfig } from '../rolePermissionsCache';
import { asyncHandler } from '../asyncHandler';

/**
 * Catálogo de exámenes (tabla `examen`, real desde la migración 0001;
 * columnas de edición agregadas en la migración 0017).
 *
 * Lectura: cualquier miembro de personal autenticado puede consultarlo
 * para armar una orden (recepción), o para saber qué examen está capturando
 * (bioanalista) — no existe un permiso específico "ver catálogo" porque
 * verlo es un prerrequisito transversal, no una acción sensible.
 *
 * Escritura (migración 0017 — ANTES: 100% local en ClinicContext.tsx
 * `addCatalogTest`/`updateCatalogTest`/`deleteCatalogTest`, nunca llegaba
 * a esta tabla. Riesgo real de negocio, no solo un hueco técnico: POST
 * /api/ordenes calcula total_cobrado leyendo `examen.precio`, así que un
 * precio "actualizado" solo en la UI dejaba la orden real facturándose con
 * el precio viejo de Postgres):
 *
 * - `catalogo_tarifas_editar` exige a quien toca `precio` (crear SIEMPRE
 *   lo exige, porque toda fila nueva fija un precio).
 * - `catalogo_rangos_editar` exige a quien toca rango de referencia,
 *   unidad, metodología o tiempo de entrega.
 * Un PATCH que solo cambia campos "neutros" (nombre, categoría, estado,
 * visibilidad de venta, datos_adicionales no relacionados a rango) exige
 * cualquiera de los dos — ya implica que la persona tiene algún permiso de
 * edición del catálogo, y no hay un tercer permiso más genérico en el
 * catálogo de roles para ese caso.
 *
 * Nunca hay DELETE físico: un examen se desactiva (`estado = 'Inactivo'`,
 * vía el mismo PATCH general), nunca se borra — detalle_orden.id_examen
 * tiene ON DELETE RESTRICT (migración 0001), así que un examen ya usado en
 * alguna orden real no podría borrarse de todas formas.
 */
export const examenesRouter = Router();
examenesRouter.use(requireStaffAuth);

const TIPOS_RESULTADO_VALIDOS = ['Numérico', 'Texto', 'Opciones'];
const ESTADOS_EXAMEN_VALIDOS = ['Activo', 'Inactivo'];

// Campos DENTRO de datosAdicionales (JSONB) cuyo cambio también exige
// catalogo_rangos_editar — las columnas reales equivalentes (unidad_medida,
// tiempo_entrega_horas, metodo, tipo_muestra, contenedor_requerido) ya se
// revisan aparte, directamente, más abajo.
const CAMPOS_RANGO_JSON = new Set(['referenceRange', 'minVal', 'maxVal', 'panicRange']);

examenesRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id_examen, codigo_examen, nombre_examen, nombre_tecnico, categoria, categoria_nombre,
            tipo_muestra, contenedor_requerido, precio, unidad_medida, tiempo_entrega_horas, metodo,
            tipo_resultado, estado, visible_venta, es_perfil, es_fabrica, datos_adicionales
     FROM examen
     ORDER BY categoria, nombre_examen`
  );
  return res.json(rows);
}));

examenesRouter.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM examen WHERE id_examen = $1', [Number(req.params.id)]);
  if (rows.length === 0) return res.status(404).json({ error: 'Examen no encontrado.' });
  return res.json(rows[0]);
}));

/**
 * POST /api/examenes — crea un examen nuevo en el catálogo real. Siempre
 * exige catalogo_tarifas_editar: toda fila nueva fija un precio (incluso
 * si es 0), así que no hay forma de crear sin tocar esa responsabilidad.
 */
examenesRouter.post('/', requirePermission('catalogo_tarifas_editar'), asyncHandler(async (req, res) => {
  const {
    codigo, nombre, nombreTecnico, categoria, categoriaNombre, tipoMuestra,
    contenedorRequerido, precio, unidadMedida, tiempoEntregaHoras, metodo,
    tipoResultado, estado, visibleVenta, esPerfil,
    // Resto de LabCatalogItem sin columna propia -ver datos_adicionales.
    ...datosAdicionales
  } = req.body || {};

  if (!nombre || !tipoMuestra) {
    return res.status(400).json({ error: 'nombre y tipoMuestra son obligatorios.' });
  }
  if (tipoResultado !== undefined && !TIPOS_RESULTADO_VALIDOS.includes(tipoResultado)) {
    return res.status(400).json({ error: `tipoResultado inválido. Valores permitidos: ${TIPOS_RESULTADO_VALIDOS.join(', ')}.` });
  }
  if (estado !== undefined && !ESTADOS_EXAMEN_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: `estado inválido. Valores permitidos: ${ESTADOS_EXAMEN_VALIDOS.join(', ')}.` });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO examen (
         codigo_examen, nombre_examen, nombre_tecnico, categoria, categoria_nombre, tipo_muestra,
         contenedor_requerido, precio, unidad_medida, tiempo_entrega_horas, metodo,
         tipo_resultado, estado, visible_venta, es_perfil, es_fabrica, datos_adicionales,
         id_usuario_ultima_mod
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, FALSE, $16::jsonb, $17)
       RETURNING *`,
      [
        codigo || null, nombre, nombreTecnico || null, categoria || null, categoriaNombre || null, tipoMuestra,
        contenedorRequerido || null, precio || 0, unidadMedida || null, tiempoEntregaHoras || 24, metodo || null,
        tipoResultado || 'Numérico', estado || 'Activo', visibleVenta !== false, esPerfil === true,
        JSON.stringify(datosAdicionales), req.staffUser!.idUsuario
      ]
    );
    return res.status(201).json(rows[0]);
  } catch (err: any) {
    if (err.code === '23505') { // unique_violation (codigo_examen)
      return res.status(409).json({ error: `El código de examen "${codigo}" ya existe en el catálogo.` });
    }
    throw err;
  }
}));

/**
 * PATCH /api/examenes/:id — edición general. Solo actualiza las columnas
 * presentes en el body (nunca pisa las demás); `datosAdicionales` se
 * fusiona con el operador JSONB || (igual que informe_clinico/
 * configuracion_laboratorio), nunca lo reemplaza entero.
 */
examenesRouter.patch('/:id', asyncHandler(async (req, res) => {
  const idExamen = Number(req.params.id);
  const {
    codigo, nombre, nombreTecnico, categoria, categoriaNombre, tipoMuestra,
    contenedorRequerido, precio, unidadMedida, tiempoEntregaHoras, metodo,
    tipoResultado, estado, visibleVenta, esPerfil,
    ...datosAdicionales
  } = req.body || {};

  if (tipoResultado !== undefined && !TIPOS_RESULTADO_VALIDOS.includes(tipoResultado)) {
    return res.status(400).json({ error: `tipoResultado inválido. Valores permitidos: ${TIPOS_RESULTADO_VALIDOS.join(', ')}.` });
  }
  if (estado !== undefined && !ESTADOS_EXAMEN_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: `estado inválido. Valores permitidos: ${ESTADOS_EXAMEN_VALIDOS.join(', ')}.` });
  }

  // Revalidación de permisos EN EL SERVIDOR, campo por campo -no basta con
  // ocultar el control en la UI (ver la nota de permissions-middleware.ts).
  // precio es siempre "tarifas"; unidad/tiempo/método/muestra/contenedor y
  // cualquier dato de rango en datosAdicionales son siempre "rangos";
  // el resto de campos neutros exige al menos uno de los dos permisos.
  const rolesConfig = getEffectiveRolesConfig();
  const tocaPrecio = precio !== undefined;
  const tocaRango = unidadMedida !== undefined || tiempoEntregaHoras !== undefined
    || metodo !== undefined || tipoMuestra !== undefined || contenedorRequerido !== undefined
    || Object.keys(datosAdicionales).some((k) => CAMPOS_RANGO_JSON.has(k));

  if (tocaPrecio && !hasPermission(req.staffUser!, 'catalogo_tarifas_editar', rolesConfig)) {
    return res.status(403).json({ error: `El rol "${req.staffUser!.roleId}" no tiene el permiso "catalogo_tarifas_editar" (requerido para modificar el precio).` });
  }
  if (tocaRango && !hasPermission(req.staffUser!, 'catalogo_rangos_editar', rolesConfig)) {
    return res.status(403).json({ error: `El rol "${req.staffUser!.roleId}" no tiene el permiso "catalogo_rangos_editar" (requerido para modificar rango/unidad/método/tiempo de entrega/muestra).` });
  }
  const tieneAlgunPermiso = hasPermission(req.staffUser!, 'catalogo_tarifas_editar', rolesConfig)
    || hasPermission(req.staffUser!, 'catalogo_rangos_editar', rolesConfig);
  if (!tocaPrecio && !tocaRango && !tieneAlgunPermiso) {
    return res.status(403).json({ error: `El rol "${req.staffUser!.roleId}" no tiene permiso para editar el catálogo de exámenes.` });
  }

  const clauses: string[] = [];
  const params: any[] = [];
  let i = 1;
  const addClause = (column: string, value: any) => { clauses.push(`${column} = $${i}`); params.push(value); i++; };

  if (codigo !== undefined) addClause('codigo_examen', codigo);
  if (nombre !== undefined) addClause('nombre_examen', nombre);
  if (nombreTecnico !== undefined) addClause('nombre_tecnico', nombreTecnico);
  if (categoria !== undefined) addClause('categoria', categoria);
  if (categoriaNombre !== undefined) addClause('categoria_nombre', categoriaNombre);
  if (tipoMuestra !== undefined) addClause('tipo_muestra', tipoMuestra);
  if (contenedorRequerido !== undefined) addClause('contenedor_requerido', contenedorRequerido);
  if (precio !== undefined) addClause('precio', precio);
  if (unidadMedida !== undefined) addClause('unidad_medida', unidadMedida);
  if (tiempoEntregaHoras !== undefined) addClause('tiempo_entrega_horas', tiempoEntregaHoras);
  if (metodo !== undefined) addClause('metodo', metodo);
  if (tipoResultado !== undefined) addClause('tipo_resultado', tipoResultado);
  if (estado !== undefined) addClause('estado', estado);
  if (visibleVenta !== undefined) addClause('visible_venta', visibleVenta === true);
  if (esPerfil !== undefined) addClause('es_perfil', esPerfil === true);
  if (Object.keys(datosAdicionales).length > 0) {
    clauses.push(`datos_adicionales = datos_adicionales || $${i}::jsonb`);
    params.push(JSON.stringify(datosAdicionales));
    i++;
  }

  if (clauses.length === 0) {
    return res.status(400).json({ error: 'No se recibió ningún campo para actualizar.' });
  }

  clauses.push('fecha_actualizacion = NOW()');
  clauses.push(`id_usuario_ultima_mod = $${i}`);
  params.push(req.staffUser!.idUsuario);
  i++;

  params.push(idExamen);
  try {
    const { rows } = await pool.query(
      `UPDATE examen SET ${clauses.join(', ')} WHERE id_examen = $${i} RETURNING *`,
      params
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Examen no encontrado.' });
    return res.json(rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `El código de examen "${codigo}" ya existe en el catálogo.` });
    }
    throw err;
  }
}));
