/**
 * Cliente HTTP para el módulo real de resultados (server/routes/resultados.ts)
 * — el tercer módulo migrado de localStorage a la API real, después de
 * pacientes (pacientesApiService.ts) y órdenes (ordenesApiService.ts).
 *
 * Cubre las tres transiciones reales del ciclo de vida de un resultado:
 * Borrador (POST) -> Validado (PATCH validar) -> Publicado (PATCH publicar),
 * más "corregir" para una corrección post-publicación. Cada transición exige
 * en el servidor un permiso distinto (ver TRANSICIONES en resultados.ts):
 * un rol sin ese permiso recibe un 403 real del backend, que este cliente
 * propaga tal cual -no es un error a "arreglar" en el frontend, es la
 * separación de roles de captura/validación/publicación que exige la tesis.
 */

import { getFirebaseAuth } from './firebaseConfig';

export class ResultadosApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ResultadosApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new ResultadosApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
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
    /* respuesta sin cuerpo JSON, se usa el status */
  }
  return `El servidor respondió ${res.status}.`;
}

/** Fila cruda tal como la devuelve POST /api/resultados. */
export interface ResultadoApiRow {
  id_resultado: number;
  id_detalle: number;
  valor_capturado: string;
  estado: 'Borrador' | 'Validado' | 'Publicado' | 'En correccion';
  esta_fuera_de_rango: boolean;
}

export interface TransicionResultadoApi {
  ok: boolean;
  idResultado: number;
  estadoAnterior: string;
  estadoNuevo: string;
}

/**
 * Crea (captura) un resultado en estado Borrador para un detalle_orden que
 * todavía no tiene resultado. Un 409 significa que ese detalle YA tiene un
 * resultado -no es un fallo de red, hay que usar la corrección/edición en
 * vez de reintentar la creación (ver ClinicContext.tsx `addReport`/`updateReport`).
 */
export async function crearResultadoRemoto(idDetalle: number, valorCapturado: string | number): Promise<ResultadoApiRow> {
  const res = await authFetch('/api/resultados', {
    method: 'POST',
    body: JSON.stringify({ idDetalle, valorCapturado })
  });
  if (!res.ok) throw new ResultadosApiError(await parseErrorBody(res), res.status);
  return res.json();
}

async function aplicarTransicionResultado(
  idResultado: number,
  accion: 'validar' | 'publicar' | 'corregir',
  body?: Record<string, unknown>
): Promise<TransicionResultadoApi> {
  const res = await authFetch(`/api/resultados/${idResultado}/${accion}`, {
    method: 'PATCH',
    body: JSON.stringify(body || {})
  });
  if (!res.ok) throw new ResultadosApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export const validarResultadoRemoto = (idResultado: number): Promise<TransicionResultadoApi> =>
  aplicarTransicionResultado(idResultado, 'validar');

export const publicarResultadoRemoto = (idResultado: number): Promise<TransicionResultadoApi> =>
  aplicarTransicionResultado(idResultado, 'publicar');

export const corregirResultadoRemoto = (
  idResultado: number,
  motivo: string,
  nuevoValor?: string | number
): Promise<TransicionResultadoApi> =>
  aplicarTransicionResultado(idResultado, 'corregir', { motivo, nuevoValor });
