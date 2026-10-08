import { describe, it, expect, vi, beforeEach } from 'vitest';
import { INITIAL_ROLES_CONFIG } from '../src/shared/permissions';

/**
 * Pruebas de server/rolePermissionsCache.ts — la pieza que cierra la
 * brecha documentada en server/routes/roles.ts: que hasPermission()
 * (vía requirePermission) autorice de verdad contra lo guardado en
 * rol_permiso_default, no solo contra INITIAL_ROLES_CONFIG en memoria.
 * Mismo patrón de doble de prueba (mock de pool.query) que
 * server/routes/roles.test.ts.
 */

const queryMock = vi.fn();
vi.mock('./db', () => ({
  pool: { query: (...args: any[]) => queryMock(...args) },
}));

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
});

describe('getEffectiveRolesConfig', () => {
  it('antes de cargar overrides, es idéntico a INITIAL_ROLES_CONFIG (sin cambio de comportamiento)', async () => {
    const { getEffectiveRolesConfig } = await import('./rolePermissionsCache');
    expect(getEffectiveRolesConfig()).toEqual(INITIAL_ROLES_CONFIG);
  });

  it('un rol sin filas guardadas conserva su defaultPermissions estático tras cargar', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const { loadRolePermissionOverrides, getEffectiveRolesConfig } = await import('./rolePermissionsCache');
    await loadRolePermissionOverrides();
    const efectivo = getEffectiveRolesConfig();
    const recepcionista = efectivo.find((r) => r.id === 'recepcionista')!;
    const original = INITIAL_ROLES_CONFIG.find((r) => r.id === 'recepcionista')!;
    expect(recepcionista.defaultPermissions).toEqual(original.defaultPermissions);
  });

  it('un rol con filas guardadas usa SOLO los permisos marcados habilitado=true de la BD, no el estático', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        { id_rol: 'recepcionista', id_permiso: 'admision_crear_ordenes', habilitado: true },
        { id_rol: 'recepcionista', id_permiso: 'admision_pacientes', habilitado: false },
        { id_rol: 'recepcionista', id_permiso: 'validacion_publicacion', habilitado: true },
      ],
    });
    const { loadRolePermissionOverrides, getEffectiveRolesConfig } = await import('./rolePermissionsCache');
    await loadRolePermissionOverrides();
    const recepcionista = getEffectiveRolesConfig().find((r) => r.id === 'recepcionista')!;
    expect(recepcionista.defaultPermissions.sort()).toEqual(['admision_crear_ordenes', 'validacion_publicacion'].sort());
    // Antes de este cambio, recepcionista SÍ tenía admision_pacientes por defecto
    // (INITIAL_ROLES_CONFIG) — la edición guardada ahora sí lo revoca de verdad.
    expect(recepcionista.defaultPermissions).not.toContain('admision_pacientes');
  });

  it('si la consulta falla, conserva la caché anterior (o el estático) en vez de lanzar', async () => {
    queryMock.mockRejectedValueOnce(new Error('conexión caída'));
    const { loadRolePermissionOverrides, getEffectiveRolesConfig } = await import('./rolePermissionsCache');
    await expect(loadRolePermissionOverrides()).resolves.toBeUndefined();
    expect(getEffectiveRolesConfig()).toEqual(INITIAL_ROLES_CONFIG);
  });

  it('invalidateRolePermissionsCache() relee de inmediato (lo que llama roles.ts tras un PUT)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    queryMock.mockResolvedValueOnce({
      rows: [{ id_rol: 'bioanalista', id_permiso: 'validacion_publicacion', habilitado: true }],
    });
    const { loadRolePermissionOverrides, invalidateRolePermissionsCache, getEffectiveRolesConfig } = await import('./rolePermissionsCache');
    await loadRolePermissionOverrides();
    expect(getEffectiveRolesConfig().find((r) => r.id === 'bioanalista')!.defaultPermissions).not.toContain('validacion_publicacion');

    await invalidateRolePermissionsCache();
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(getEffectiveRolesConfig().find((r) => r.id === 'bioanalista')!.defaultPermissions).toEqual(['validacion_publicacion']);
  });
});
