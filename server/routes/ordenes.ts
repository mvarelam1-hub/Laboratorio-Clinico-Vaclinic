import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-staff';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';

export const ordenesRouter = Router();
ordenesRouter.use(requireStaffAuth);

const PRIORIDADES_VALIDAS = ['rutina', 'urgente', 'stat_panico'];
const METODOS_PAGO_VALIDOS = ['efectivo', 'tarjeta', 'transferencia', 'seguro', 'por_cobrar'];
const ESTADOS_FLUJO_VALIDOS = ['Pendiente', 'En Proceso', 'Listo', 'Entregado'];

ordenesRouter.post('/', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const {
    idPaciente, examenesIds,
    // Metadata de pago/prioridad/biometría (migración 0016) — opcionales,
    // todas tienen default en la propia tabla si no se envían.
    prioridad, metodoPago, promoAplicada, sedeCama,
    esAltoRiesgo, biometriaAutorizada, datosBiometricos
  } = req.body || {};
  if (!idPaciente || !Array.isArray(examenesIds) || examenesIds.length === 0) {
    return res.status(400).json({ error: 'idPaciente y examenesIds (arreglo no vacío) son obligatorios.' });
  }
  if (prioridad !== undefined && !PRIORIDADES_VALIDAS.includes(prioridad)) {
    return res.status(400).json({ error: `prioridad inválida. Valores permitidos: ${PRIORIDADES_VALIDAS.join(', ')}.` });
  }
  if (metodoPago !== undefined && metodoPago !== null && !METODOS_PAGO_VALIDOS.includes(metodoPago)) {
    return res.status(400).json({ error: `metodoPago inválido. Valores permitidos: ${METODOS_PAGO_VALIDOS.join(', ')}.` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const numeroOrden = `ORD-${Date.now()}`;

    // Se acumulan las filas de detalle_orden creadas (con su codigo_examen)
    // para devolverlas en la respuesta: el frontend las necesita para poder
    // enlazar después cada parámetro de un informe (por examCode) con el
    // id_detalle_orden exacto que exige POST /api/resultados (ver
    // ClinicContext.tsx `addOrder`/`addReport` y src/types.ts `LabOrder.detalleRemoto`).
    // Se resuelven los precios ANTES del INSERT de `orden` para poder fijar
    // total_cobrado de una vez (antes quedaba siempre en 0, el default de
    // la columna — ninguna ruta lo escribía nunca).
    const examenesResueltos: Array<{ idExamen: number; precio: number; codigoExamen: string | null }> = [];
    for (const idExamen of examenesIds) {
      const { rows: examRows } = await client.query('SELECT precio, codigo_examen FROM examen WHERE id_examen = $1', [idExamen]);
      if (examRows.length === 0) throw new Error(`Examen ${idExamen} no existe en el catálogo.`);
      examenesResueltos.push({ idExamen, precio: Number(examRows[0].precio) || 0, codigoExamen: examRows[0].codigo_examen ?? null });
    }
    const totalCobrado = examenesResueltos.reduce((sum, e) => sum + e.precio, 0);

    const { rows: ordenRows } = await client.query(
      `INSERT INTO orden (
         numero_orden, id_paciente, id_recepcionista, estado, total_cobrado,
         prioridad, metodo_pago, saldo_pendiente, promo_aplicada, sede_cama,
         es_alto_riesgo, biometria_autorizada, datos_biometricos
       )
       VALUES ($1, $2, $3, 'Registrada', $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
       RETURNING id_orden, numero_orden`,
      [
        numeroOrden, idPaciente, req.staffUser!.idUsuario, totalCobrado,
        prioridad || 'rutina', metodoPago || null,
        metodoPago === 'por_cobrar' ? totalCobrado : 0,
        promoAplicada || null, sedeCama || null,
        esAltoRiesgo === true, biometriaAutorizada === true,
        datosBiometricos ? JSON.stringify(datosBiometricos) : null
      ]
    );
    const idOrden = ordenRows[0].id_orden;

    const detalleCreado: Array<{ idDetalle: number; idExamen: number; codigoExamen: string | null }> = [];
    for (const e of examenesResueltos) {
      const { rows: detalleRows } = await client.query(
        `INSERT INTO detalle_orden (id_orden, id_examen, precio_unitario) VALUES ($1, $2, $3) RETURNING id_detalle`,
        [idOrden, e.idExamen, e.precio]
      );
      detalleCreado.push({ idDetalle: detalleRows[0].id_detalle, idExamen: e.idExamen, codigoExamen: e.codigoExamen });
    }

    // Genera el código único de consulta pública de esta orden (único
    // mecanismo de acceso del paciente al resultado, ver la nota en
    // pacientes.ts y fn_generar_codigo_consulta en la migración 0004).
    // ANTES: esta función ya existía en la base de datos desde esa
    // migración pero nunca se llamaba desde ningún lado — toda orden
    // creada por esta ruta quedaba sin código, es decir, inaccesible desde
    // el Portal del Paciente (POST /api/portal/login).
    const { rows: codigoRows } = await client.query(
      'SELECT fn_generar_codigo_consulta($1) AS codigo',
      [idOrden]
    );

    await client.query('COMMIT');
    return res.status(201).json({ ...ordenRows[0], codigo_consulta: codigoRows[0].codigo, detalle: detalleCreado });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}));

// Listado general de órdenes (historial). Deliberadamente abierto a
// cualquier personal autenticado -sin requirePermission adicional-, porque
// recepción, bioanalistas, director y auditoría necesitan verlo por
// distintos motivos; lo que sí está protegido por permiso es CREAR,
// VALIDAR o PUBLICAR (abajo y en resultados.ts).
//
// Excluye `eliminada = TRUE` (migración 0013): una orden eliminada
// lógicamente no debe reaparecer en el listado general -el borrado sigue
// pareciendo definitivo desde la UI, igual que antes de esta migración-,
// pero el registro permanece en la base de datos para auditoría y se puede
// seguir consultando por id (GET /:id más abajo, que no filtra por esto).
ordenesRouter.get('/', asyncHandler(async (req, res) => {
  const limite = Math.min(Number(req.query.limite) || 100, 500);
  const { rows } = await pool.query(
    `SELECT o.id_orden, o.numero_orden, o.fecha_registro, o.estado, o.total_cobrado, o.sede,
            o.archivada, o.fecha_archivo, o.id_carpeta,
            o.prioridad, o.estado_flujo, o.metodo_pago, o.saldo_pendiente, o.promo_aplicada,
            o.sede_cama, o.es_alto_riesgo, o.biometria_autorizada, o.datos_biometricos,
            p.id_paciente, p.nombre_completo AS paciente_nombre
     FROM orden o
     JOIN paciente p ON p.id_paciente = o.id_paciente
     WHERE o.eliminada = FALSE
     ORDER BY o.fecha_registro DESC
     LIMIT $1`,
    [limite]
  );
  return res.json(rows);
}));

// Alimenta directamente el dashboard con la vista de la Etapa 2 — el
// backend no reimplementa la lógica de "qué está pendiente", la reutiliza.
// IMPORTANTE: estas dos rutas de segmento fijo deben registrarse ANTES que
// la ruta genérica "/:id" (más abajo) — si no, Express interpretaría
// "pendientes-validacion" y "resultados-criticos" como un :id literal y
// esta ruta nunca se alcanzaría.
ordenesRouter.get('/pendientes-validacion', requirePermission('validacion_redaccion'), asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM vw_ordenes_pendientes_validacion ORDER BY fecha_registro ASC');
  return res.json(rows);
}));

ordenesRouter.get('/resultados-criticos', requirePermission('analizadores_panico'), asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM vw_resultados_criticos');
  return res.json(rows);
}));

ordenesRouter.get('/:id', asyncHandler(async (req, res) => {
  const idOrden = Number(req.params.id);
  const { rows: ordenRows } = await pool.query(
    `SELECT o.*, p.nombre_completo AS paciente_nombre
     FROM orden o JOIN paciente p ON p.id_paciente = o.id_paciente
     WHERE o.id_orden = $1`,
    [idOrden]
  );
  if (ordenRows.length === 0) return res.status(404).json({ error: 'Orden no encontrada.' });

  const { rows: detalleRows } = await pool.query(
    `SELECT d.id_detalle, d.id_examen, d.precio_unitario, e.nombre_examen, e.codigo_examen,
            r.id_resultado, r.estado AS estado_resultado, r.valor_capturado
     FROM detalle_orden d
     JOIN examen e ON e.id_examen = d.id_examen
     LEFT JOIN resultado r ON r.id_detalle = d.id_detalle
     WHERE d.id_orden = $1`,
    [idOrden]
  );
  return res.json({ ...ordenRows[0], detalle: detalleRows });
}));

// ------------------------------------------------------------
// Ciclo de vida de la orden: archivar / restaurar / eliminar
// (migración 0013). ANTES: ClinicContext.tsx manejaba las 7 funciones de
// este ciclo (updateOrder, deleteOrder, archiveOrder, restoreOrder,
// bulk*) 100% en el navegador, sin ninguna de estas rutas -y
// deleteOrder/bulkDeleteOrders hacían además un borrado físico del
// arreglo local, lo que habría significado perder la orden para
// siempre de haber existido sincronización-. AHORA: archivar/restaurar
// usan las columnas ya existentes desde la migración 0003
// (archivada/fecha_archivo), completadas aquí con el usuario
// responsable; "eliminar" NUNCA borra la fila, solo la marca
// `eliminada = TRUE` (eliminación lógica, informe técnico sección 4.3).
//
// Se reutiliza el permiso 'admision_crear_ordenes' (igual que
// carpetas.ts para mover/eliminar carpetas): no existe en el catálogo
// un permiso más específico para archivar/eliminar órdenes, y crear uno
// nuevo implicaría tocar el catálogo de roles/permisos (src/shared/
// permissions.ts) y la migración de rol_permiso_default, fuera del
// alcance de esta pieza.
//
// updateOrder (edición general: estado operativo/prioridad/pago/
// biometría) SÍ se implementa, más abajo (PATCH /:id) -resuelto en la
// migración 0016 agregando `estado_flujo` como columna separada de
// `estado` (ver esa migración para el porqué de NO reutilizar `estado`:
// son dos vocabularios distintos que no corresponden 1:1, y mezclarlos
// habría arriesgado una transición clínica incorrecta).

ordenesRouter.patch('/:id/archivar', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idOrden = Number(req.params.id);
  const { rows } = await pool.query(
    `UPDATE orden
     SET archivada = TRUE, fecha_archivo = NOW(), id_usuario_archivo = $1
     WHERE id_orden = $2 AND eliminada = FALSE
     RETURNING id_orden, archivada, fecha_archivo, id_usuario_archivo`,
    [req.staffUser!.idUsuario, idOrden]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada o ya eliminada.' });
  return res.json(rows[0]);
}));

ordenesRouter.patch('/:id/restaurar', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idOrden = Number(req.params.id);
  const { rows } = await pool.query(
    `UPDATE orden
     SET archivada = FALSE, fecha_archivo = NULL, id_usuario_archivo = NULL
     WHERE id_orden = $1 AND eliminada = FALSE
     RETURNING id_orden, archivada`,
    [idOrden]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada o ya eliminada.' });
  return res.json(rows[0]);
}));

ordenesRouter.delete('/:id', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idOrden = Number(req.params.id);
  const { motivo } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE orden
     SET eliminada = TRUE, fecha_eliminacion = NOW(), id_usuario_eliminacion = $1,
         motivo_eliminacion = $2
     WHERE id_orden = $3 AND eliminada = FALSE
     RETURNING id_orden, eliminada, fecha_eliminacion`,
    [req.staffUser!.idUsuario, (motivo && String(motivo).trim()) || null, idOrden]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada o ya estaba eliminada.' });
  return res.json({ ok: true, ...rows[0] });
}));

ordenesRouter.patch('/archivar-varias', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const { idsOrdenes } = req.body || {};
  if (!Array.isArray(idsOrdenes) || idsOrdenes.length === 0) {
    return res.status(400).json({ error: 'idsOrdenes (arreglo no vacío) es obligatorio.' });
  }
  const { rowCount } = await pool.query(
    `UPDATE orden SET archivada = TRUE, fecha_archivo = NOW(), id_usuario_archivo = $1
     WHERE id_orden = ANY($2::int[]) AND eliminada = FALSE`,
    [req.staffUser!.idUsuario, idsOrdenes.map(Number)]
  );
  return res.json({ ok: true, actualizadas: rowCount });
}));

ordenesRouter.patch('/restaurar-varias', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const { idsOrdenes } = req.body || {};
  if (!Array.isArray(idsOrdenes) || idsOrdenes.length === 0) {
    return res.status(400).json({ error: 'idsOrdenes (arreglo no vacío) es obligatorio.' });
  }
  const { rowCount } = await pool.query(
    `UPDATE orden SET archivada = FALSE, fecha_archivo = NULL, id_usuario_archivo = NULL
     WHERE id_orden = ANY($1::int[]) AND eliminada = FALSE`,
    [idsOrdenes.map(Number)]
  );
  return res.json({ ok: true, actualizadas: rowCount });
}));

ordenesRouter.patch('/eliminar-varias', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const { idsOrdenes, motivo } = req.body || {};
  if (!Array.isArray(idsOrdenes) || idsOrdenes.length === 0) {
    return res.status(400).json({ error: 'idsOrdenes (arreglo no vacío) es obligatorio.' });
  }
  const { rowCount } = await pool.query(
    `UPDATE orden
     SET eliminada = TRUE, fecha_eliminacion = NOW(), id_usuario_eliminacion = $1,
         motivo_eliminacion = $2
     WHERE id_orden = ANY($3::int[]) AND eliminada = FALSE`,
    [req.staffUser!.idUsuario, (motivo && String(motivo).trim()) || null, idsOrdenes.map(Number)]
  );
  return res.json({ ok: true, actualizadas: rowCount });
}));

/**
 * PATCH /api/ordenes/:id — edición general de la orden (migración 0016):
 * estado operativo (estado_flujo), prioridad, método de pago, saldo
 * pendiente, promoción aplicada, cama/sede física, y la autorización
 * biométrica de alto riesgo. Mismo patrón que informes.ts: solo
 * actualiza las columnas presentes en el body, nunca pisa las demás.
 *
 * Registrada DELIBERADAMENTE al final del router -después de
 * /archivar-varias, /restaurar-varias y /eliminar-varias- porque
 * Express resuelve rutas en orden de registro y '/:id' coincide con
 * cualquier segmento único: de ir antes, una petición a
 * PATCH /archivar-varias habría caído aquí tratando "archivar-varias"
 * como un id numérico inválido, nunca llegando a su ruta real.
 *
 * `datosBiometricos` se reemplaza entero si se envía (no es un merge
 * JSONB parcial como datos_json de informe_clinico) — es el registro de
 * auditoría de un único evento de autorización, no una estructura que se
 * vaya completando con PATCHes sucesivos.
 */
ordenesRouter.patch('/:id', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idOrden = Number(req.params.id);
  const {
    status, prioridad, metodoPago, saldoPendiente, promoAplicada, sedeCama,
    esAltoRiesgo, biometriaAutorizada, datosBiometricos, sede
  } = req.body || {};

  if (status !== undefined && !ESTADOS_FLUJO_VALIDOS.includes(status)) {
    return res.status(400).json({ error: `status inválido. Valores permitidos: ${ESTADOS_FLUJO_VALIDOS.join(', ')}.` });
  }
  if (prioridad !== undefined && !PRIORIDADES_VALIDAS.includes(prioridad)) {
    return res.status(400).json({ error: `prioridad inválida. Valores permitidos: ${PRIORIDADES_VALIDAS.join(', ')}.` });
  }
  if (metodoPago !== undefined && metodoPago !== null && !METODOS_PAGO_VALIDOS.includes(metodoPago)) {
    return res.status(400).json({ error: `metodoPago inválido. Valores permitidos: ${METODOS_PAGO_VALIDOS.join(', ')}.` });
  }

  const clauses: string[] = [];
  const params: any[] = [];
  let i = 1;

  const addClause = (column: string, value: any, isJsonb = false) => {
    clauses.push(`${column} = $${i}${isJsonb ? '::jsonb' : ''}`);
    params.push(isJsonb ? JSON.stringify(value) : value);
    i++;
  };

  if (status !== undefined) addClause('estado_flujo', status);
  if (prioridad !== undefined) addClause('prioridad', prioridad);
  if (metodoPago !== undefined) addClause('metodo_pago', metodoPago);
  if (saldoPendiente !== undefined) addClause('saldo_pendiente', saldoPendiente);
  if (promoAplicada !== undefined) addClause('promo_aplicada', promoAplicada);
  if (sedeCama !== undefined) addClause('sede_cama', sedeCama);
  if (sede !== undefined) addClause('sede', sede);
  if (esAltoRiesgo !== undefined) addClause('es_alto_riesgo', esAltoRiesgo === true);
  if (biometriaAutorizada !== undefined) addClause('biometria_autorizada', biometriaAutorizada === true);
  if (datosBiometricos !== undefined) addClause('datos_biometricos', datosBiometricos, true);

  if (clauses.length === 0) {
    return res.status(400).json({ error: 'No se recibió ningún campo para actualizar.' });
  }
  if (!Number.isFinite(idOrden)) {
    return res.status(404).json({ error: 'Orden no encontrada.' });
  }

  params.push(idOrden);
  const { rows } = await pool.query(
    `UPDATE orden SET ${clauses.join(', ')}
     WHERE id_orden = $${i} AND eliminada = FALSE
     RETURNING id_orden, numero_orden, estado_flujo, prioridad, metodo_pago, saldo_pendiente,
               promo_aplicada, sede_cama, sede, es_alto_riesgo, biometria_autorizada, datos_biometricos`,
    params
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada o eliminada.' });
  return res.json(rows[0]);
}));
