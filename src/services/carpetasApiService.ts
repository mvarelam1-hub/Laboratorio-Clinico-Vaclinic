/**
 * Cliente HTTP para carpetas de órdenes (server/routes/carpetas.ts) —
 * primer módulo de los 9 que hasta esta migración solo existían en
 * localStorage (ver db/migrations/0011_modulos_restantes.sql).
 */
import { getFirebaseAuth } from './firebaseConfig';

export class CarpetasApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'CarpetasApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new CarpetasApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
  }
  const idToken = await user.getIdToken();
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      ...(options.headers || {})
    }
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

export interface CarpetaApiRow {
  id_carpeta: number;
  nombre: string;
  color: string;
  icono: string | null;
  descripcion: string | null;
  es_sistema: boolean;
  fecha_creacion: string;
  cantidad_ordenes?: number;
}

export async function crearCarpetaRemota(nombre: string, color: string, icono?: string, descripcion?: string): Promise<CarpetaApiRow> {
  const res = await authFetch('/api/carpetas', { method: 'POST', body: JSON.stringify({ nombre, color, icono, descripcion }) });
  if (!res.ok) throw new CarpetasApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function actualizarCarpetaRemota(idCarpeta: number, updates: Partial<{ nombre: string; color: string; icono: string; descripcion: string }>): Promise<CarpetaApiRow> {
  const res = await authFetch(`/api/carpetas/${idCarpeta}`, { method: 'PATCH', body: JSON.stringify(updates) });
  if (!res.ok) throw new CarpetasApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function eliminarCarpetaRemota(idCarpeta: number): Promise<void> {
  const res = await authFetch(`/api/carpetas/${idCarpeta}`, { method: 'DELETE' });
  if (!res.ok) throw new CarpetasApiError(await parseErrorBody(res), res.status);
}

export async function moverOrdenACarpetaRemota(idOrden: number, idCarpeta: number): Promise<{ id_orden: number; id_carpeta: number }> {
  const res = await authFetch(`/api/carpetas/ordenes/${idOrden}/mover`, { method: 'PATCH', body: JSON.stringify({ idCarpeta }) });
  if (!res.ok) throw new CarpetasApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function moverVariasOrdenesACarpetaRemota(idsOrdenes: number[], idCarpeta: number): Promise<{ ok: true; actualizadas: number }> {
  const res = await authFetch('/api/carpetas/ordenes/mover-varias', { method: 'PATCH', body: JSON.stringify({ idsOrdenes, idCarpeta }) });
  if (!res.ok) throw new CarpetasApiError(await parseErrorBody(res), res.status);
  return res.json();
}
