import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { asyncHandler } from '../asyncHandler';

/**
 * Catálogo de exámenes (tabla `examen`, real desde la migración 0001).
 * Solo lectura: cualquier miembro de personal autenticado puede consultarlo
 * para armar una orden (recepción), o para saber qué examen está capturando
 * (bioanalista) — no existe un permiso específico "ver catálogo" porque
 * verlo es un prerrequisito transversal, no una acción sensible. Editarlo
 * sí exige `catalogo_tarifas_editar` / `catalogo_rangos_editar` (fuera del
 * alcance de este archivo, que solo agrega la lectura que faltaba).
 */
export const examenesRouter = Router();
examenesRouter.use(requireStaffAuth);

examenesRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id_examen, codigo_examen, nombre_examen, categoria, tipo_muestra,
            contenedor_requerido, precio, unidad_medida, tiempo_entrega_horas, metodo
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
