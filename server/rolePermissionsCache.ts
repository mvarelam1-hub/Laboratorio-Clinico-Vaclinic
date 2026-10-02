/**
 * Caché en memoria del catálogo de roles EFECTIVO, construido a partir de
 * `rol_permiso_default` (migración 0011) sobre la base de
 * `INITIAL_ROLES_CONFIG` (src/shared/permissions.ts).
 *
 * POR QUÉ UNA CACHÉ Y NO UNA CONSULTA POR PETICIÓN: `hasPermission()` la
 * usan middlewares síncronos (`requirePermission`, ver
 * permissions-middleware.ts) que corren en el camino caliente de cada
 * endpoint protegido. Convertir esa función en async habría obligado a
 * tocar cada ruta del backend. En vez de eso, esta caché se carga una vez
 * al arrancar el servidor (ver server.ts) y se refresca: (a) cada
 * ROLE_CACHE_REFRESH_MS por si hay varias instancias del backend
 * corriendo, y (b) de inmediato cuando `PUT /api/roles/:roleId/permisos`
 * (server/routes/roles.ts) guarda un cambio, vía
 * `invalidateRolePermissionsCache()`.
 *
 * REGLA DE RESPALDO (documentada, no implícita): un rol que NUNCA se ha
 * editado desde la UI de administración no tiene filas en
 * `rol_permiso_default`, así que su catálogo efectivo es exactamente
 * `INITIAL_ROLES_CONFIG` — cero cambio de comportamiento hasta que un
 * administrador guarde una edición real para ese rol. Esto es el mismo
 * principio de "línea base" que ya usa scripts/migrate.mjs.
 */
import { INITIAL_ROLES_CONFIG, type LabRoleConfig } from '../src/shared/permissions';
import { pool } from './db';

const ROLE_CACHE_REFRESH_MS = 60_000;

/** rolId -> (permissionId -> habilitado), solo para roles con al menos una fila guardada. */
let overridesByRole: Map<string, Record<string, boolean>> = new Map();
let loadedOnce = false;
let refreshTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Relee `rol_permiso_default` completa y reconstruye la caché. Nunca
 * lanza: si la consulta falla (por ejemplo, la tabla no existe todavía en
 * un entorno que no ha corrido la migración 0011), se registra el error y
 * se conserva la caché anterior -el sistema sigue funcionando con
 * INITIAL_ROLES_CONFIG como catálogo efectivo, que es exactamente el
 * comportamiento previo a este cambio, nunca un 500 por esto-.
 */
export async function loadRolePermissionOverrides(): Promise<void> {
  try {
    const { rows } = await pool.query<{ id_rol: string; id_permiso: string; habilitado: boolean }>(
      'SELECT id_rol, id_permiso, habilitado FROM rol_permiso_default'
    );
    const next = new Map<string, Record<string, boolean>>();
    for (const row of rows) {
      const porRol = next.get(row.id_rol) ?? {};
      porRol[row.id_permiso] = row.habilitado;
      next.set(row.id_rol, porRol);
    }
    overridesByRole = next;
    loadedOnce = true;
  } catch (err: any) {
    console.error('[rolePermissionsCache] No se pudo leer rol_permiso_default; se conserva la caché/el catálogo estático anterior:', err?.message);
  }
}

/**
 * Catálogo de roles EFECTIVO: `INITIAL_ROLES_CONFIG` con `defaultPermissions`
 * sustituido por la edición guardada en `rol_permiso_default` para los
 * roles que sí tienen filas (edición explícita de un administrador).
 */
export function getEffectiveRolesConfig(): LabRoleConfig[] {
  if (overridesByRole.size === 0) return INITIAL_ROLES_CONFIG;
  return INITIAL_ROLES_CONFIG.map((role) => {
    const override = overridesByRole.get(role.id);
    if (!override) return role;
    return {
      ...role,
      defaultPermissions: Object.keys(override).filter((permissionId) => override[permissionId]),
    };
  });
}

/** Fuerza una relectura inmediata (llamado por roles.ts tras un PUT exitoso). */
export async function invalidateRolePermissionsCache(): Promise<void> {
  await loadRolePermissionOverrides();
}

export function hasLoadedRolePermissionOverridesOnceForTesting(): boolean {
  return loadedOnce;
}

/** Arranca el refresco periódico. Se llama una sola vez desde server.ts. */
export function startRolePermissionsCacheRefresh(): void {
  if (refreshTimer) return;
  refreshTimer = setInterval(() => {
    loadRolePermissionOverrides();
  }, ROLE_CACHE_REFRESH_MS);
  // No debe mantener vivo el proceso (ni bloquear que terminen los tests).
  refreshTimer.unref?.();
}

/** Solo para pruebas: vuelve la caché a su estado inicial. */
export function resetRolePermissionsCacheForTesting(): void {
  overridesByRole = new Map();
  loadedOnce = false;
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
