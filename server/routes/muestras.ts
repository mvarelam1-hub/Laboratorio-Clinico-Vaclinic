/**
 * Muestras (tubos y recipientes) de una orden: recepción, rotulado y
 * trazabilidad pre-analítica. Tabla real: `muestra` (migración 0030).
 *
 * - Cada muestra pertenece a UNA orden y tiene un código de barras único que
 *   genera el servidor (TUB-AAAA-000123 / REC- / HIS-); el navegador nunca lo
 *   inventa.
 * - Escanear un código en recepción solo funciona con códigos YA registrados:
 *   un código desconocido no se asigna a ningún paciente.
 * - Registrar, escanear y cambiar de estado exigen el permiso
 *   `flebotomia_recoleccion`; ver el listado es para todo el personal.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-staff';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';
import { registrarBitacora } from '../bitacora';

export const muestrasRouter = Router();
muestrasRouter.use(requireStaffAuth);

export const CATEGORIAS = ['tubo', 'recipiente', 'hisopo'] as const;
export const ESTADOS = ['recolectada', 'en_proceso', 'analizada', 'rechazada'] as const;
export const CALIDADES = ['optima', 'hemolisis_leve', 'hemolisis_severa', 'lipemica', 'coagulada'] as const;

const PREFIJO: Record<(typeof CATEGORIAS)[number], string> = { tubo: 'TUB', recipiente: 'REC', hisopo: 'HIS' };

/** Qué estados pueden seguir a cada uno (una analizada no vuelve atrás). */
const TRANSICIONES: Record<(typeof ESTADOS)[number], readonly (typeof ESTADOS)[number][]> = {
  recolectada: ['en_proceso', 'rechazada'],
  en_proceso: ['analizada', 'rechazada', 'recolectada'],
  analizada: [],
  rechazada: ['recolectada']
};

const SELECT_MUESTRA = `
  SELECT m.id_muestra, m.codigo_barras, m.id_orden, o.numero_orden,
         p.id_paciente, p.nombre_completo AS paciente_nombre, p.dni AS paciente_dni,
         m.categoria, m.tipo_contenedor, m.etiqueta_contenedor, m.examenes,
         m.flebotomista, m.fecha_recoleccion, m.estado, m.calidad, m.motivo_rechazo,
         m.fecha_recepcion, ur.nombre_completo AS receptor_nombre,
         m.fecha_actualizacion
  FROM muestra m
  JOIN orden o ON o.id_orden = m.id_orden
  JOIN paciente p ON p.id_paciente = o.id_paciente
  LEFT JOIN usuario ur ON ur.id_usuario = m.id_receptor`;

async function leerMuestra(idMuestra: number) {
  const { rows } = await pool.query(`${SELECT_MUESTRA} WHERE m.id_muestra = $1`, [idMuestra]);
  return rows[0];
}

async function bitacora(idUsuario: number, accion: string, detalles: string, extra: { anterior?: string; nuevo?: string; severidad?: 'info' | 'warning' } = {}) {
  // "Best effort": la bitácora nunca debe impedir que se guarde la muestra.
  try {
    await registrarBitacora({
      idUsuario,
      accion,
      modulo: 'episodios',
      detalles,
      severidad: extra.severidad ?? 'info',
      valorAnterior: extra.anterior,
      valorNuevo: extra.nuevo
    });
  } catch (err) {
    console.error('No se pudo registrar la muestra en la bitácora de auditoría:', err);
  }
}

// Listado (las más recientes primero). ?ordenId=N filtra por una orden.
muestrasRouter.get('/', asyncHandler(async (req, res) => {
  const ordenId = req.query.ordenId !== undefined ? Number(req.query.ordenId) : null;
  if (ordenId !== null && !Number.isInteger(ordenId)) {
    return res.status(400).json({ error: 'ordenId debe ser un número entero.' });
  }
  const { rows } = ordenId === null
    ? await pool.query(`${SELECT_MUESTRA} WHERE o.eliminada IS NOT TRUE ORDER BY m.fecha_recoleccion DESC LIMIT 500`)
    : await pool.query(`${SELECT_MUESTRA} WHERE m.id_orden = $1 ORDER BY m.fecha_recoleccion DESC`, [ordenId]);
  return res.json(rows);
}));

// Registrar un tubo/recipiente de una orden.
muestrasRouter.post('/', requirePermission('flebotomia_recoleccion'), asyncHandler(async (req, res) => {
  const { idOrden, categoria, tipoContenedor, etiquetaContenedor, examenes, flebotomista, calidad } = req.body || {};

  const id = Number(idOrden);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'idOrden es obligatorio: toda muestra pertenece a una orden.' });
  }
  if (!CATEGORIAS.includes(categoria)) {
    return res.status(400).json({ error: `categoria debe ser una de: ${CATEGORIAS.join(', ')}.` });
  }
  if (!tipoContenedor || !etiquetaContenedor) {
    return res.status(400).json({ error: 'tipoContenedor y etiquetaContenedor son obligatorios.' });
  }
  const calidadFinal = calidad ?? 'optima';
  if (!CALIDADES.includes(calidadFinal)) {
    return res.status(400).json({ error: `calidad debe ser una de: ${CALIDADES.join(', ')}.` });
  }
  const listaExamenes = Array.isArray(examenes)
    ? examenes.map((e) => String(e).trim()).filter((e) => e.length > 0)
    : [];

  const { rows: ordenes } = await pool.query(
    'SELECT id_orden, numero_orden, eliminada FROM orden WHERE id_orden = $1',
    [id]
  );
  if (ordenes.length === 0 || ordenes[0].eliminada) {
    return res.status(404).json({ error: 'La orden no existe o está en la papelera.' });
  }

  const { rows: seq } = await pool.query("SELECT nextval('muestra_codigo_seq') AS n");
  const codigo = `${PREFIJO[categoria as (typeof CATEGORIAS)[number]]}-${new Date().getFullYear()}-${String(seq[0].n).padStart(6, '0')}`;

  const { rows } = await pool.query(
    `INSERT INTO muestra
       (codigo_barras, id_orden, categoria, tipo_contenedor, etiqueta_contenedor,
        examenes, flebotomista, calidad, id_registrador)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id_muestra`,
    [
      codigo, id, categoria, String(tipoContenedor), String(etiquetaContenedor),
      listaExamenes, flebotomista ? String(flebotomista) : req.staffUser!.nombreCompleto || null,
      calidadFinal, req.staffUser!.idUsuario
    ]
  );

  await bitacora(req.staffUser!.idUsuario, 'Muestra registrada', `Orden ${ordenes[0].numero_orden}`, { nuevo: codigo });
  return res.status(201).json(await leerMuestra(rows[0].id_muestra));
}));

// Escanear un código en recepción: pasa de "recolectada" a "en_proceso".
// Declarado ANTES de '/:id' para que "escanear" no se confunda con un :id.
muestrasRouter.post('/escanear', requirePermission('flebotomia_recoleccion'), asyncHandler(async (req, res) => {
  const codigo = String(req.body?.codigo ?? '').trim().toUpperCase();
  if (!codigo) return res.status(400).json({ error: 'codigo es obligatorio.' });

  const { rows } = await pool.query(
    'SELECT id_muestra, estado FROM muestra WHERE UPPER(codigo_barras) = $1',
    [codigo]
  );
  if (rows.length === 0) {
    return res.status(404).json({ error: `El código ${codigo} no está registrado. Registra la muestra primero con su orden.` });
  }

  const { id_muestra: idMuestra, estado } = rows[0];
  if (estado === 'recolectada') {
    await pool.query(
      `UPDATE muestra
         SET estado = 'en_proceso', id_receptor = $2, fecha_recepcion = NOW(), fecha_actualizacion = NOW()
       WHERE id_muestra = $1`,
      [idMuestra, req.staffUser!.idUsuario]
    );
    await bitacora(req.staffUser!.idUsuario, 'Muestra recibida (escaneada)', codigo, { anterior: 'recolectada', nuevo: 'en_proceso' });
  }
  return res.json(await leerMuestra(idMuestra));
}));

// Cambiar estado y/o calidad de una muestra.
muestrasRouter.patch('/:id', requirePermission('flebotomia_recoleccion'), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'El id de la muestra no es válido.' });

  const { estado, calidad, motivoRechazo } = req.body || {};
  if (estado !== undefined && !ESTADOS.includes(estado)) {
    return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS.join(', ')}.` });
  }
  if (calidad !== undefined && !CALIDADES.includes(calidad)) {
    return res.status(400).json({ error: `calidad debe ser una de: ${CALIDADES.join(', ')}.` });
  }
  if (estado === undefined && calidad === undefined) {
    return res.status(400).json({ error: 'Indica estado y/o calidad para actualizar.' });
  }

  const { rows: actuales } = await pool.query('SELECT codigo_barras, estado, calidad FROM muestra WHERE id_muestra = $1', [id]);
  if (actuales.length === 0) return res.status(404).json({ error: 'La muestra no existe.' });
  const actual = actuales[0];

  if (estado !== undefined && estado !== actual.estado
      && !TRANSICIONES[actual.estado as (typeof ESTADOS)[number]].includes(estado)) {
    return res.status(409).json({ error: `Una muestra "${actual.estado}" no puede pasar a "${estado}".` });
  }

  const nuevoEstado = estado ?? actual.estado;
  const esRechazo = nuevoEstado === 'rechazada';
  await pool.query(
    `UPDATE muestra
        SET estado = $2,
            calidad = $3,
            motivo_rechazo = $4,
            id_receptor = CASE WHEN $2 = 'en_proceso' AND id_receptor IS NULL THEN $5 ELSE id_receptor END,
            fecha_recepcion = CASE WHEN $2 = 'en_proceso' AND fecha_recepcion IS NULL THEN NOW() ELSE fecha_recepcion END,
            fecha_actualizacion = NOW()
      WHERE id_muestra = $1`,
    [
      id, nuevoEstado, calidad ?? actual.calidad,
      esRechazo ? (motivoRechazo ? String(motivoRechazo) : `Calidad: ${calidad ?? actual.calidad}`) : null,
      req.staffUser!.idUsuario
    ]
  );

  await bitacora(
    req.staffUser!.idUsuario,
    esRechazo ? 'Muestra rechazada' : 'Muestra actualizada',
    actual.codigo_barras,
    {
      anterior: `${actual.estado} / ${actual.calidad}`,
      nuevo: `${nuevoEstado} / ${calidad ?? actual.calidad}`,
      severidad: esRechazo ? 'warning' : 'info'
    }
  );
  return res.json(await leerMuestra(id));
}));
