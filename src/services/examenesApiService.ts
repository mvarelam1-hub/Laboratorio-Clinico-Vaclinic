/**
 * Cliente HTTP para el catálogo real de exámenes (server/routes/examenes.ts +
 * migración 0010, que volcó los 161 exámenes/perfiles de
 * src/data/factoryCatalog.ts a la tabla `examen`).
 *
 * Sirve principalmente para RESOLVER: el frontend arma sus órdenes con el
 * `code` de negocio del catálogo local (ej. "PAN-01"), pero la API real
 * necesita el `id_examen` numérico de Postgres para crear `detalle_orden`.
 * Este archivo trae el catálogo real una vez y construye ese mapa
 * código -> id, para no tener que tocar la UI de selección de exámenes
 * (que sigue leyendo del catálogo local, ya rico y ya usado en producción).
 */

import { getFirebaseAuth } from './firebaseConfig';

export class ExamenesApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ExamenesApiError';
  }
}

export interface ExamenApiRow {
  id_examen: number;
  codigo_examen: string | null;
  nombre_examen: string;
  categoria: string | null;
  tipo_muestra: string;
  precio: string | number;
}

async function authFetch(path: string): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new ExamenesApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
  }
  const idToken = await user.getIdToken();
  return fetch(path, { headers: { Authorization: `Bearer ${idToken}` } });
}

let cacheCodigoAId: Map<string, number> | null = null;
let cachePromise: Promise<Map<string, number>> | null = null;

async function cargarMapaCodigoAId(): Promise<Map<string, number>> {
  const res = await authFetch('/api/examenes');
  if (!res.ok) {
    let mensaje = `El servidor respondió ${res.status}.`;
    try {
      const body = await res.json();
      if (body?.error) mensaje = body.error;
    } catch {
      /* sin cuerpo JSON */
    }
    throw new ExamenesApiError(mensaje, res.status);
  }
  const filas: ExamenApiRow[] = await res.json();
  const mapa = new Map<string, number>();
  for (const fila of filas) {
    if (fila.codigo_examen) mapa.set(fila.codigo_examen, fila.id_examen);
  }
  return mapa;
}

/**
 * Devuelve el mapa código -> id_examen, cacheado en memoria durante la
 * sesión del navegador (el catálogo real cambia poco). `forzarRecarga`
 * ignora la caché — útil después de que alguien edite el catálogo.
 */
export async function obtenerMapaCodigoExamenAId(forzarRecarga = false): Promise<Map<string, number>> {
  if (cacheCodigoAId && !forzarRecarga) return cacheCodigoAId;
  if (!cachePromise || forzarRecarga) {
    cachePromise = cargarMapaCodigoAId().then((mapa) => {
      cacheCodigoAId = mapa;
      return mapa;
    });
  }
  return cachePromise;
}

/**
 * Resuelve una lista de códigos de catálogo del frontend (ej. ["PAN-01",
 * "GLU-001"]) a los id_examen reales de Postgres. Reporta explícitamente
 * cuáles códigos NO se encontraron en la base de datos real, en vez de
 * omitirlos en silencio -eso escondería un examen completo de la orden sin
 * que nadie se diera cuenta-.
 */
export async function resolverCodigosAIdsExamen(codigos: string[]): Promise<{ ids: number[]; noEncontrados: string[] }> {
  const mapa = await obtenerMapaCodigoExamenAId();
  const ids: number[] = [];
  const noEncontrados: string[] = [];
  for (const codigo of codigos) {
    const id = mapa.get(codigo);
    if (id === undefined) noEncontrados.push(codigo);
    else ids.push(id);
  }
  return { ids, noEncontrados };
}
