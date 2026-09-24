/**
 * Carpetas de órdenes (OrderFolder) — primer módulo de los 9 que hasta
 * ahora vivían solo en localStorage (ver ClinicContext.tsx
 * createOrderFolder/updateOrderFolder/deleteOrderFolder/moveOrderToFolder/
 * bulkMoveOrdersToFolder). Migración real: db/migrations/0011_modulos_restantes.sql
 * (tabla `carpeta_orden` + columna `orden.id_carpeta`).
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';

export const carpetasRouter = Router();
carpetasRouter.use(requireStaffAuth);

carpetasRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT c.id_carpeta, c.nombre, c.color, c.icono, c.descripcion, c.es_sistema, c.fecha_creacion,
            COUNT(o.id_orden)::int AS cantidad_ordenes
     FROM carpeta_orden c
     LEFT JOIN orden o ON o.id_carpeta = c.id_carpeta
     GROUP BY c.id_carpeta
     ORDER BY c.es_sistema DESC, c.fecha_creacion ASC`
  );
  return res.json(rows);
}));

carpetasRouter.post('/', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const { nombre, color, icono, descripcion } = req.body || {};
  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ error: 'El nombre de la carpeta es obligatorio.' });
  }
  const { rows } = await pool.query(
    `INSERT INTO carpeta_orden (nombre, color, icono, descripcion)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [String(nombre).trim(), color || 'slate', icono || 'Folder', descripcion || null]
  );
  return res.status(201).json(rows[0]);
}));

carpetasRouter.patch('/:id', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idCarpeta = Number(req.params.id);
  const { nombre, color, icono, descripcion } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE carpeta_orden
     SET nombre = COALESCE($1, nombre), color = COALESCE($2, color),
         icono = COALESCE($3, icono), descripcion = COALESCE($4, descripcion)
     WHERE id_carpeta = $5 RETURNING *`,
    [nombre || null, color || null, icono || null, descripcion || null, idCarpeta]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Carpeta no encontrada.' });
  return res.json(rows[0]);
}));

carpetasRouter.delete('/:id', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idCarpeta = Number(req.params.id);
  const { rows: existente } = await pool.query('SELECT es_sistema FROM carpeta_orden WHERE id_carpeta = $1', [idCarpeta]);
  if (existente.length === 0) return res.status(404).json({ error: 'Carpeta no encontrada.' });
  if (existente[0].es_sistema) {
    return res.status(400).json({ error: 'No se puede eliminar una carpeta de sistema.' });
  }
  // Las órdenes de la carpeta eliminada pasan a "Sin asignar" (id 1),
  // igual que hacía deleteOrderFolder en el frontend antes de esta migración.
  await pool.query('UPDATE orden SET id_carpeta = 1 WHERE id_carpeta = $1', [idCarpeta]);
  await pool.query('DELETE FROM carpeta_orden WHERE id_carpeta = $1', [idCarpeta]);
  return res.json({ ok: true });
}));

carpetasRouter.patch('/ordenes/:idOrden/mover', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idOrden = Number(req.params.idOrden);
  const { idCarpeta } = req.body || {};
  const destino = idCarpeta ? Number(idCarpeta) : 1;
  const { rows } = await pool.query(
    'UPDATE orden SET id_carpeta = $1 WHERE id_orden = $2 RETURNING id_orden, id_carpeta',
    [destino, idOrden]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada.' });
  return res.json(rows[0]);
}));

carpetasRouter.patch('/ordenes/mover-varias', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const { idsOrdenes, idCarpeta } = req.body || {};
  if (!Array.isArray(idsOrdenes) || idsOrdenes.length === 0) {
    return res.status(400).json({ error: 'idsOrdenes (arreglo no vacío) es obligatorio.' });
  }
  const destino = idCarpeta ? Number(idCarpeta) : 1;
  const { rowCount } = await pool.query(
    'UPDATE orden SET id_carpeta = $1 WHERE id_orden = ANY($2::int[])',
    [destino, idsOrdenes.map(Number)]
  );
  return res.json({ ok: true, actualizadas: rowCount });
}));
