/**
 * Cliente HTTP para la matriz de permisos por rol (server/routes/roles.ts)
 * — parte del quinto módulo de los 9 migrados desde localStorage.
 *
 * Alcance declarado: igual que documenta roles.ts en el backend, esta
 * llamada persiste de verdad la edición en Postgres, pero todavía no
 * cambia la autorización real (hasPermission() sigue usando
 * INITIAL_ROLES_CONFIG en memoria). ClinicContext.tsx sigue actualizando
 * el estado local `staffRoles` exactamente igual que antes de esta
 * migración -esto solo agrega la persistencia real en paralelo-.
 */
import { getFirebaseAuth } from './firebaseConfig';

export class RolesApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'RolesApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new RolesApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
  }
  const idToken = await user.getIdToken();
  return fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}`, ...(options.headers || {}) }
  });
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error) return body.error;
  } catch {
    /* respuesta sin cuerpo JSON */
  }
  return `El servidor respondió ${res.status}.`;
}

export interface RolPermisoApiRow {
  id_permiso: string;
  habilitado: boolean;
  fecha_actualizacion: string;
}

export async function actualizarPermisosRolRemoto(roleId: string, permissions: string[]): Promise<RolPermisoApiRow[]> {
  const res = await authFetch(`/api/roles/${roleId}/permisos`, { method: 'PUT', body: JSON.stringify({ permissions }) });
  if (!res.ok) throw new RolesApiError(await parseErrorBody(res), res.status);
  return res.json();
}
