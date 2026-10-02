/**
 * Matriz de permisos por rol (LabRoleConfig.defaultPermissions) — parte
 * del quinto módulo de los 9 migrados desde localStorage (ver
 * ClinicContext.tsx updateRolePermissions). Migración real:
 * db/migrations/0011_modulos_restantes.sql (tabla `rol_permiso_default`).
 *
 * HISTORIAL DEL ALCANCE (declarado honestamente, no borrado): hasta la
 * rama feature/mejoras-estructura-profesional, estas rutas SÍ persistían
 * los cambios de verdad en Postgres, pero `hasPermission()`
 * (src/shared/permissions.ts) seguía leyendo siempre del arreglo estático
 * INITIAL_ROLES_CONFIG en memoria, nunca de esta tabla -se podía guardar
 * una edición que no cambiaba la autorización real-. Eso quedó
 * documentado aquí mismo en vez de fabricar un wiring falso.
 *
 * CERRADO: `hasPermission()` ahora acepta un catálogo de roles efectivo
 * (ver server/rolePermissionsCache.ts), y `requirePermission` /
 * episodios.ts / resultados.ts se lo pasan en cada verificación. Por eso
 * el PUT de abajo llama a `invalidateRolePermissionsCache()` justo
 * después de confirmar la transacción: así la edición que se acaba de
 * guardar aquí ya autoriza (o deja de autorizar) la siguiente petición,
 * sin esperar el refresco periódico de la caché.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';
import { LAB_PERMISSIONS_CATALOG } from '../../src/shared/permissions';
import { invalidateRolePermissionsCache } from '../rolePermissionsCache';

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

  await invalidateRolePermissionsCache();

  const { rows } = await pool.query(
    'SELECT id_permiso, habilitado, fecha_actualizacion FROM rol_permiso_default WHERE id_rol = $1',
    [roleId]
  );
  return res.json(rows);
}));
