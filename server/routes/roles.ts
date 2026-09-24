/**
 * Matriz de permisos por rol (LabRoleConfig.defaultPermissions) — parte
 * del quinto módulo de los 9 migrados desde localStorage (ver
 * ClinicContext.tsx updateRolePermissions). Migración real:
 * db/migrations/0011_modulos_restantes.sql (tabla `rol_permiso_default`).
 *
 * ALCANCE DECLARADO HONESTAMENTE (ya documentado en la migración 0011 y
 * en el commit que la introdujo): estas rutas SÍ persisten los cambios
 * de verdad en Postgres, pero `hasPermission()` (src/shared/permissions.ts),
 * que es la única función que de verdad autoriza cada petición HTTP real
 * -tanto en el backend como en el frontend-, sigue leyendo del arreglo
 * estático INITIAL_ROLES_CONFIG en memoria, no de esta tabla. Es decir:
 * hoy se puede guardar y consultar una edición de permisos por rol, pero
 * todavía NO cambia qué puede hacer ese rol en el sistema real. Cerrar esa
 * brecha requiere que hasPermission() consulte esta tabla (o una caché de
 * ella) en tiempo de autorización, lo cual es un cambio de arquitectura
 * más grande que se deja pendiente a propósito en vez de fabricar un
 * wiring falso.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';
import { LAB_PERMISSIONS_CATALOG } from '../../src/shared/permissions';

export const rolesRouter = Router();
rolesRouter.use(requireStaffAuth);

rolesRouter.get('/:roleId/permisos', requirePermission('admin_usuarios_roles'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id_permiso, habilitado, fecha_actualizacion FROM rol_permiso_default WHERE id_rol = $1',
    [req.params.roleId]
  );
  return res.json(rows);
}));

rolesRouter.put('/:roleId/permisos', requirePermission('admin_usuarios_roles'), asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const { permissions } = req.body || {};
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: 'permissions (arreglo de ids de permiso) es obligatorio.' });
  }
  const idsValidos = new Set(LAB_PERMISSIONS_CATALOG.map((p) => p.id));
  const invalidos = permissions.filter((p: string) => !idsValidos.has(p));
  if (invalidos.length > 0) {
    return res.status(400).json({ error: `Permiso(s) desconocido(s): ${invalidos.join(', ')}.` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM rol_permiso_default WHERE id_rol = $1', [roleId]);
    for (const permiso of LAB_PERMISSIONS_CATALOG) {
      await client.query(
        `INSERT INTO rol_permiso_default (id_rol, id_permiso, habilitado, actualizado_por)
         VALUES ($1, $2, $3, $4)`,
        [roleId, permiso.id, permissions.includes(permiso.id), req.staffUser!.idUsuario]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const { rows } = await pool.query(
    'SELECT id_permiso, habilitado, fecha_actualizacion FROM rol_permiso_default WHERE id_rol = $1',
    [roleId]
  );
  return res.json(rows);
}));
