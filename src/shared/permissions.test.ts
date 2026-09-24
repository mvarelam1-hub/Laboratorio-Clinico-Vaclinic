import { describe, it, expect } from 'vitest';
import { hasPermission, type PermissionSubject } from './permissions';

/**
 * E10 (ACS, Fase 2) — pruebas unitarias sobre módulo crítico "Autenticación y
 * autorización" (src/shared/permissions.ts). Función pura, sin dependencias
 * de red ni de base de datos: no requiere dobles de prueba.
 * Técnica: partición de equivalencia sobre (status, rol, permiso, customPermissions),
 * grounded en el catálogo real INITIAL_ROLES_CONFIG / LAB_PERMISSIONS_CATALOG.
 */
describe('hasPermission', () => {
  it('recepcionista tiene admision_crear_ordenes (permiso de su rol)', () => {
    const subject: PermissionSubject = { status: 'activo', roleId: 'recepcionista' };
    expect(hasPermission(subject, 'admision_crear_ordenes')).toBe(true);
  });

  it('recepcionista NO tiene validacion_publicacion (fuera de su rol)', () => {
    const subject: PermissionSubject = { status: 'activo', roleId: 'recepcionista' };
    expect(hasPermission(subject, 'validacion_publicacion')).toBe(false);
  });

  it('bioanalista_senior tiene validacion_publicacion', () => {
    const subject: PermissionSubject = { status: 'activo', roleId: 'bioanalista_senior' };
    expect(hasPermission(subject, 'validacion_publicacion')).toBe(true);
  });

  it('bioanalista (no senior) NO tiene validacion_publicacion', () => {
    const subject: PermissionSubject = { status: 'activo', roleId: 'bioanalista' };
    expect(hasPermission(subject, 'validacion_publicacion')).toBe(false);
  });

  it('tecnico_flebotomista NO tiene validacion_firma_digital', () => {
    const subject: PermissionSubject = { status: 'activo', roleId: 'tecnico_flebotomista' };
    expect(hasPermission(subject, 'validacion_firma_digital')).toBe(false);
  });

  it('director_laboratorio tiene admin_bitacora_auditoria (rol con todos los permisos)', () => {
    const subject: PermissionSubject = { status: 'activo', roleId: 'director_laboratorio' };
    expect(hasPermission(subject, 'admin_bitacora_auditoria')).toBe(true);
  });

  it('auditor_calidad tiene admin_bitacora_auditoria pero NO admision_crear_ordenes', () => {
    const subject: PermissionSubject = { status: 'activo', roleId: 'auditor_calidad' };
    expect(hasPermission(subject, 'admin_bitacora_auditoria')).toBe(true);
    expect(hasPermission(subject, 'admision_crear_ordenes')).toBe(false);
  });

  it('un usuario con status distinto de "activo" nunca tiene permiso, aunque el rol sí lo incluya', () => {
    const subject: PermissionSubject = { status: 'suspendido', roleId: 'director_laboratorio' };
    expect(hasPermission(subject, 'admin_bitacora_auditoria')).toBe(false);
  });

  it('customPermissions puede otorgar un permiso que el rol no incluye por defecto', () => {
    const subject: PermissionSubject = {
      status: 'activo', roleId: 'recepcionista',
      customPermissions: { validacion_publicacion: true },
    };
    expect(hasPermission(subject, 'validacion_publicacion')).toBe(true);
  });

  it('customPermissions puede revocar un permiso que el rol sí incluye por defecto', () => {
    const subject: PermissionSubject = {
      status: 'activo', roleId: 'director_laboratorio',
      customPermissions: { admin_bitacora_auditoria: false },
    };
    expect(hasPermission(subject, 'admin_bitacora_auditoria')).toBe(false);
  });

  it('un roleId inexistente en el catálogo nunca tiene permisos', () => {
    const subject: PermissionSubject = { status: 'activo', roleId: 'rol_inventado' };
    expect(hasPermission(subject, 'admision_crear_ordenes')).toBe(false);
  });

  it('administrador_ti tiene admin_usuarios_roles', () => {
    const subject: PermissionSubject = { status: 'activo', roleId: 'administrador_ti' };
    expect(hasPermission(subject, 'admin_usuarios_roles')).toBe(true);
  });
});
