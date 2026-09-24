import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';

export const auditoriaRouter = Router();
auditoriaRouter.use(requireStaffAuth, requirePermission('admin_bitacora_auditoria'));

auditoriaRouter.get('/', asyncHandler(async (req, res) => {
  const limite = Math.min(Number(req.query.limite) || 100, 500);
  const { rows } = await pool.query(
    `SELECT h.id_registro, h.id_resultado, u.nombre_completo AS usuario, u.rol,
            h.accion, h.modulo, h.severidad, h.valor_anterior, h.valor_nuevo, h.motivo_cambio, h.fecha_hora
     FROM historial_auditoria h
     JOIN usuario u ON u.id_usuario = h.id_usuario
     ORDER BY h.fecha_hora DESC
     LIMIT $1`,
    [limite]
  );
  return res.json(rows);
}));
