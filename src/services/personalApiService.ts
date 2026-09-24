/**
 * Cliente HTTP para personal/usuarios (server/routes/personal.ts) —
 * quinto módulo de los 9 migrados desde localStorage. Reutiliza la
 * tabla real `usuario` (ver nota de alcance en personal.ts sobre el
 * colapso de UserStatus a un booleano y sobre `firebaseUid`).
 */
import { getFirebaseAuth } from './firebaseConfig';
import type { LabStaffRole, UserStatus } from '../types';

export class PersonalApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'PersonalApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new PersonalApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
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

export interface PersonalApiRow {
  id_usuario: number;
  nombre_completo: string;
  rol: LabStaffRole | 'sistema';
  estado: boolean;
  pin_code: string | null;
  [key: string]: unknown;
}

export interface CrearPersonalInput {
  fullName: string;
  username?: string;
  email: string;
  phone?: string;
  roleId: LabStaffRole;
  specialty?: string;
  licenseNumber?: string;
  assignedBranch?: string;
  pinCode?: string;
  customPermissions?: Record<string, boolean>;
  avatarColor?: string;
  notes?: string;
}

export async function listarPersonalRemoto(): Promise<PersonalApiRow[]> {
  const res = await authFetch('/api/personal');
  if (!res.ok) throw new PersonalApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function crearPersonalRemoto(input: CrearPersonalInput): Promise<PersonalApiRow> {
  const res = await authFetch('/api/personal', { method: 'POST', body: JSON.stringify(input) });
  if (!res.ok) throw new PersonalApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function actualizarPersonalRemoto(idUsuario: number, updates: Partial<CrearPersonalInput> & {
  signatureStampText?: string; signatureImageUrl?: string; twoFactorEnabled?: boolean;
}): Promise<PersonalApiRow> {
  const res = await authFetch(`/api/personal/${idUsuario}`, { method: 'PATCH', body: JSON.stringify(updates) });
  if (!res.ok) throw new PersonalApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function cambiarEstadoPersonalRemoto(idUsuario: number, status: UserStatus): Promise<PersonalApiRow> {
  const res = await authFetch(`/api/personal/${idUsuario}/estado`, { method: 'PATCH', body: JSON.stringify({ status }) });
  if (!res.ok) throw new PersonalApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function reiniciarPinPersonalRemoto(idUsuario: number, pinCode: string): Promise<PersonalApiRow> {
  const res = await authFetch(`/api/personal/${idUsuario}/pin`, { method: 'PATCH', body: JSON.stringify({ pinCode }) });
  if (!res.ok) throw new PersonalApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function eliminarPersonalRemoto(idUsuario: number): Promise<void> {
  const res = await authFetch(`/api/personal/${idUsuario}`, { method: 'DELETE' });
  if (!res.ok) throw new PersonalApiError(await parseErrorBody(res), res.status);
}
