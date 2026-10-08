/**
 * Cliente HTTP para personal/usuarios (server/routes/personal.ts) —
 * quinto módulo de los 9 migrados desde localStorage. Reutiliza la
 * tabla real `usuario` (ver nota de alcance en personal.ts sobre el
 * colapso de UserStatus a un booleano y sobre `firebaseUid`).
 */
import { getStaffSessionToken } from './staffSessionToken';
import type { LabStaffRole, LabStaffUser, UserStatus } from '../types';

export class PersonalApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'PersonalApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getStaffSessionToken();
  if (!token) {
    throw new PersonalApiError('No hay una sesión de personal activa para llamar a la API.');
  }
  return fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
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

/** Traduce una fila real de `usuario` al perfil de personal del frontend. */
export function mapPersonalApiToStaffUser(row: PersonalApiRow, nombresDeRol: Record<string, string> = {}): LabStaffUser {
  const r = row as Record<string, any>;
  return {
    id: `usr-remote-${row.id_usuario}`,
    remoteId: row.id_usuario,
    fullName: row.nombre_completo,
    username: r.nombre_usuario || r.correo || '',
    email: r.correo || '',
    phone: r.telefono || '',
    roleId: row.rol as LabStaffRole,
    roleName: nombresDeRol[row.rol] || String(row.rol),
    specialty: r.especialidad || '',
    licenseNumber: r.numero_colegiado || '',
    assignedBranch: (r.sede_asignada || 'todas') as LabStaffUser['assignedBranch'],
    status: (row.estado ? 'activo' : 'inactivo') as UserStatus,
    pinCode: row.pin_code || '',
    customPermissions: r.permisos_personalizados && typeof r.permisos_personalizados === 'object' ? r.permisos_personalizados : undefined,
    avatarColor: r.color_avatar || 'bg-teal-600',
    createdAt: r.fecha_creacion ? new Date(r.fecha_creacion).toISOString() : new Date(0).toISOString(),
    lastLogin: r.ultimo_login ? new Date(r.ultimo_login).toISOString() : undefined,
    signatureStampText: r.texto_sello_firma || undefined,
    signatureImageUrl: r.url_imagen_firma || undefined,
    twoFactorEnabled: !!r.doble_factor_habilitado,
    notes: r.notas || undefined
  };
}

/** Los usuarios reales mandan; los que solo existen en este equipo (sin remoteId) se conservan. */
export function combinarPersonalRemoto(locales: LabStaffUser[], filas: PersonalApiRow[], nombresDeRol: Record<string, string> = {}): LabStaffUser[] {
  if (filas.length === 0) return locales;
  const porRemoto = new Map(locales.filter((u) => u.remoteId != null).map((u) => [u.remoteId as number, u]));
  const remotos = filas.map((f) => {
    const nuevo = mapPersonalApiToStaffUser(f, nombresDeRol);
    const previo = porRemoto.get(f.id_usuario);
    // Se conservan los datos de perfil que la base no guarda (biometría, etc.).
    return previo ? { ...previo, ...nuevo, biometricEnrolled: previo.biometricEnrolled, biometricCredentials: previo.biometricCredentials, biometricLastAuthAt: previo.biometricLastAuthAt } : nuevo;
  });
  const idsRemotos = new Set(filas.map((f) => f.id_usuario));
  return [...remotos, ...locales.filter((u) => u.remoteId == null || !idsRemotos.has(u.remoteId))];
}
