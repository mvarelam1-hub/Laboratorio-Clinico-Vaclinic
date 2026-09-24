/**
 * Cliente HTTP para perfiles personalizados (server/routes/perfiles.ts)
 * — cuarto módulo de los 9 migrados desde localStorage (ver
 * db/migrations/0011_modulos_restantes.sql, tabla `perfil_personalizado`).
 */
import { getFirebaseAuth } from './firebaseConfig';
import type { ProfileTestItem } from '../types';

export class PerfilesApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'PerfilesApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new PerfilesApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
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

export interface PerfilApiRow {
  id_perfil: number;
  codigo: string;
  nombre: string;
  estado: 'Activo' | 'Inactivo';
  [key: string]: unknown;
}

export interface CrearPerfilInput {
  code: string;
  name: string;
  categoryName?: string;
  price: number;
  regularPrice?: number;
  description?: string;
  testIds: string[];
  testNames: string[];
  tests?: ProfileTestItem[];
  status?: 'Activo' | 'Inactivo';
  basedOn?: string;
  createdBy?: string;
  notes?: string;
}

export async function crearPerfilRemoto(input: CrearPerfilInput): Promise<PerfilApiRow> {
  const res = await authFetch('/api/perfiles', { method: 'POST', body: JSON.stringify(input) });
  if (!res.ok) throw new PerfilesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function actualizarPerfilRemoto(idPerfil: number, updates: Partial<CrearPerfilInput>): Promise<PerfilApiRow> {
  const res = await authFetch(`/api/perfiles/${idPerfil}`, { method: 'PATCH', body: JSON.stringify(updates) });
  if (!res.ok) throw new PerfilesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function eliminarPerfilRemoto(idPerfil: number): Promise<void> {
  const res = await authFetch(`/api/perfiles/${idPerfil}`, { method: 'DELETE' });
  if (!res.ok) throw new PerfilesApiError(await parseErrorBody(res), res.status);
}
