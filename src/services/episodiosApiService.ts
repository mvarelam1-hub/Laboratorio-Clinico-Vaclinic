/**
 * Cliente HTTP para episodios 4D (server/routes/episodios.ts) — segundo
 * módulo de los 9 migrados desde localStorage (ver
 * db/migrations/0011_modulos_restantes.sql, tabla `episodio_4d`).
 */
import { getFirebaseAuth } from './firebaseConfig';

export class EpisodiosApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'EpisodiosApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new EpisodiosApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
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

export interface EpisodioApiRow {
  id_episodio: number;
  numero_episodio: string;
  marca_duplicidad: boolean;
  detalle_duplicidad: string | null;
  dimension_actual: string;
  [key: string]: unknown;
}

export interface CrearEpisodioInput {
  idPaciente: number;
  idOrden?: number;
  tipoPaciente?: string;
  programaSalud?: string;
  origen?: string;
  medicoReferente?: string;
  sede?: string;
  prioridad?: string;
  pruebasSolicitadas: string[];
  codigosTubo?: string[];
  tipoMuestra?: string;
  tatObjetivoMinutos?: number;
  notas?: string;
}

export async function crearEpisodioRemoto(input: CrearEpisodioInput): Promise<EpisodioApiRow> {
  const res = await authFetch('/api/episodios', { method: 'POST', body: JSON.stringify(input) });
  if (!res.ok) throw new EpisodiosApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function actualizarEpisodioRemoto(idEpisodio: number, updates: Partial<{ notas: string; prioridad: string; sedeDestino: string; transferido: boolean }>): Promise<EpisodioApiRow> {
  const res = await authFetch(`/api/episodios/${idEpisodio}`, { method: 'PATCH', body: JSON.stringify(updates) });
  if (!res.ok) throw new EpisodiosApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function avanzarEpisodioRemoto(idEpisodio: number, siguienteDimension: string): Promise<EpisodioApiRow> {
  const res = await authFetch(`/api/episodios/${idEpisodio}/avanzar`, { method: 'PATCH', body: JSON.stringify({ siguienteDimension }) });
  if (!res.ok) throw new EpisodiosApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function resolverDuplicidadRemota(idEpisodio: number, accion: 'keep' | 'cancel' | 'merge'): Promise<{ ok?: true } & Partial<EpisodioApiRow>> {
  const res = await authFetch(`/api/episodios/${idEpisodio}/duplicidad`, { method: 'PATCH', body: JSON.stringify({ accion }) });
  if (!res.ok) throw new EpisodiosApiError(await parseErrorBody(res), res.status);
  return res.json();
}
