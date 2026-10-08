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

import { getStaffSessionToken } from './staffSessionToken';

/**
 * `code` distingue las reglas de negocio de la doble verificación de
 * críticos (migración 0018) sin depender del texto del mensaje:
 *  - DOBLE_VERIFICACION_PENDIENTE: el resultado está fuera de rango y aún no
 *    lo verificó un segundo bioanalista, así que no puede publicarse.
 *  - SEPARACION_DE_FUNCIONES: quien intenta verificar capturó o validó ese
 *    mismo resultado.
 */
export type CodigoErrorResultado = 'DOBLE_VERIFICACION_PENDIENTE' | 'SEPARACION_DE_FUNCIONES';

export class ResultadosApiError extends Error {
  constructor(message: string, public status?: number, public code?: CodigoErrorResultado) {
    super(message);
    this.name = 'ResultadosApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getStaffSessionToken();
  if (!token) {
    throw new ResultadosApiError('No hay una sesión de personal activa para llamar a la API.');
  }
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
}

async function parseError(res: Response): Promise<ResultadosApiError> {
  let mensaje = `El servidor respondió ${res.status}.`;
  let code: CodigoErrorResultado | undefined;
  try {
    const body = await res.json();
    if (body?.error) mensaje = body.error;
    if (body?.code === 'DOBLE_VERIFICACION_PENDIENTE' || body?.code === 'SEPARACION_DE_FUNCIONES') code = body.code;
  } catch {
    /* respuesta sin cuerpo JSON, se usa el status */
  }
  return new ResultadosApiError(mensaje, res.status, code);
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
  if (!res.ok) throw await parseError(res);
  return res.json();
}

async function aplicarTransicionResultado(
  idResultado: number,
  accion: 'validar' | 'publicar' | 'corregir' | 'verificar',
  body?: Record<string, unknown>
): Promise<TransicionResultadoApi> {
  const res = await authFetch(`/api/resultados/${idResultado}/${accion}`, {
    method: 'PATCH',
    body: JSON.stringify(body || {})
  });
  if (!res.ok) throw await parseError(res);
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

/**
 * Segunda verificación obligatoria de un resultado crítico (fuera de rango)
 * por un bioanalista distinto de quien lo capturó y de quien lo validó
 * (server/routes/resultados.ts, migración 0018). Sin esto el servidor no
 * deja publicar el resultado (409 DOBLE_VERIFICACION_PENDIENTE).
 */
export const verificarResultadoRemoto = (idResultado: number): Promise<TransicionResultadoApi> =>
  aplicarTransicionResultado(idResultado, 'verificar');

export interface ResultadoPendienteVerificacion {
  id_resultado: number;
  id_orden: number;
  numero_orden: string;
  paciente: string;
  nombre_examen: string;
  codigo_examen: string | null;
  unidad_medida: string | null;
  valor_capturado: string;
  fecha_captura: string;
  analista: string | null;
  validado_por_nombre: string | null;
  /** false si el usuario autenticado capturó o validó este resultado. */
  puede_verificar: boolean;
}

export async function obtenerPendientesVerificacionRemoto(): Promise<ResultadoPendienteVerificacion[]> {
  const res = await authFetch('/api/resultados/pendientes-verificacion');
  if (!res.ok) throw await parseError(res);
  return res.json();
}
