/**
 * Cliente HTTP de solo lectura para la bitácora REAL (GET /api/auditoria ->
 * tabla `historial_auditoria`, migración 0001/0011).
 *
 * ANTES: esta ruta ya existía completa en el backend (requiere el permiso
 * `admin_bitacora_auditoria`) pero NINGÚN código del frontend la consumía
 * -AuditLogsView.tsx leía exclusivamente `auditLogs` (100% localStorage,
 * vía logAuditEvent en ClinicContext.tsx). Los dos sistemas de auditoría
 * quedaban completamente desconectados: lo que un usuario veía en la
 * pantalla de "Auditoría & Bitácora de Seguridad" nunca había tocado la
 * base de datos.
 *
 * AHORA: server/routes/auth.ts, ordenes.ts y examenes.ts ya escriben en
 * historial_auditoria como efecto secundario de acciones reales (login,
 * autorización biométrica de alto riesgo, cambios de precio de catálogo)
 * -ver server/bitacora.ts, que deliberadamente NUNCA se expone como ruta
 * de escritura pública-. Esta función trae esas filas y las convierte al
 * mismo shape `LabAuditLog` que ya usa la UI, marcadas con
 * `source: 'servidor'` para distinguirlas de los eventos que siguen siendo
 * 100% locales (los que no tienen todavía una acción de servidor autorizada
 * de la cual colgarse, ej. una prueba de WebAuthn).
 */
import { getStaffSessionToken } from './staffSessionToken';
import type { LabAuditLog } from '../types';

export class AuditoriaApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'AuditoriaApiError';
  }
}

export interface AuditoriaApiRow {
  id_registro: number;
  id_resultado: number | null;
  usuario: string;
  rol: string;
  accion: string;
  modulo: LabAuditLog['module'] | null;
  severidad: LabAuditLog['severity'] | null;
  valor_anterior: string | null;
  valor_nuevo: string | null;
  motivo_cambio: string | null;
  fecha_hora: string;
}

async function authFetch(path: string): Promise<Response> {
  const token = getStaffSessionToken();
  if (!token) {
    throw new AuditoriaApiError('No hay una sesión de personal activa para llamar a la API.');
  }
  return fetch(path, { headers: { Authorization: `Bearer ${token}` } });
}

function fromAuditoriaApiRow(row: AuditoriaApiRow): LabAuditLog {
  // motivo_cambio es el campo más descriptivo que deja la bitácora real
  // (equivalente al `detalles` de registrarBitacora()); si falta, se arma
  // uno genérico con lo que sí hay (valor anterior/nuevo).
  const detalles = row.motivo_cambio
    || [row.valor_anterior && `Antes: ${row.valor_anterior}`, row.valor_nuevo && `Ahora: ${row.valor_nuevo}`]
      .filter(Boolean)
      .join(' · ')
    || 'Sin detalles adicionales.';

  return {
    id: `bitacora-${row.id_registro}`,
    timestamp: row.fecha_hora,
    userId: row.usuario,
    userName: row.usuario,
    userRole: row.rol,
    action: row.accion,
    module: row.modulo || 'seguridad',
    details: detalles,
    severity: row.severidad || 'info',
    source: 'servidor'
  };
}

/**
 * Trae hasta `limite` eventos reales de la bitácora, del más reciente al
 * más antiguo (igual orden que ya devuelve el backend). Lanza
 * AuditoriaApiError con el status en 403 si el rol de la sesión actual no
 * tiene `admin_bitacora_auditoria` -quien llama decide si lo trata como un
 * error visible o simplemente omite la sección de bitácora real (ver
 * AuditLogsView.tsx, que lo trata como lo segundo: no todo el personal con
 * acceso a la pestaña tiene este permiso específico).
 */
export async function fetchAuditoriaReal(limite = 200): Promise<LabAuditLog[]> {
  const res = await authFetch(`/api/auditoria?limite=${limite}`);
  if (!res.ok) {
    let mensaje = `El servidor respondió ${res.status}.`;
    try {
      const body = await res.json();
      if (body?.error) mensaje = body.error;
    } catch {
      /* sin cuerpo JSON */
    }
    throw new AuditoriaApiError(mensaje, res.status);
  }
  const filas: AuditoriaApiRow[] = await res.json();
  return filas.map(fromAuditoriaApiRow);
}
