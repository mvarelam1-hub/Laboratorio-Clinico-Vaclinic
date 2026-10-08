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

import { getStaffSessionToken } from './staffSessionToken';
import type { LabCatalogItem } from '../types';

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
  const token = getStaffSessionToken();
  if (!token) {
    throw new ExamenesApiError('No hay una sesión de personal activa para llamar a la API.');
  }
  return fetch(path, { headers: { Authorization: `Bearer ${token}` } });
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
export async function resolverCodigosAIdsExamen(codigos: string[], forzarRecarga = false): Promise<{ ids: number[]; noEncontrados: string[] }> {
  const mapa = await obtenerMapaCodigoExamenAId(forzarRecarga);
  const ids: number[] = [];
  const noEncontrados: string[] = [];
  for (const codigo of codigos) {
    const id = mapa.get(codigo);
    if (id === undefined) noEncontrados.push(codigo);
    else ids.push(id);
  }
  return { ids, noEncontrados };
}

// ------------------------------------------------------------
// Escritura del catálogo (migración 0017, server/routes/examenes.ts POST
// y PATCH /:id). ANTES: ClinicContext.tsx addCatalogTest/updateCatalogTest
// mutaban LabCatalogItem 100% en localStorage -nunca llegaba a la tabla
// `examen` que POST /api/ordenes usa de verdad para calcular total_cobrado-.
// Mismo patrón aBodyApi/fromDbRow que informesApiService.ts/
// configLabApiService.ts: columnas reales separadas del resto
// (datosAdicionales -> datos_adicionales JSONB en el backend).

async function authFetchJson(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getStaffSessionToken();
  if (!token) {
    throw new ExamenesApiError('No hay una sesión de personal activa para llamar a la API.');
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
    /* sin cuerpo JSON */
  }
  return `El servidor respondió ${res.status}.`;
}

export interface ExamenFullApiRow {
  id_examen: number;
  codigo_examen: string | null;
  nombre_examen: string;
  nombre_tecnico: string | null;
  categoria: string | null;
  categoria_nombre: string | null;
  tipo_muestra: string;
  contenedor_requerido: string | null;
  precio: string | number;
  unidad_medida: string | null;
  tiempo_entrega_horas: number;
  metodo: string | null;
  tipo_resultado: string;
  estado: 'Activo' | 'Inactivo';
  visible_venta: boolean;
  es_perfil: boolean;
  es_fabrica: boolean;
  datos_adicionales: Record<string, unknown>;
}

// Separa las columnas reales de examen del resto de LabCatalogItem (que
// viaja en datosAdicionales) — misma lista exacta de claves "con columna
// propia" que server/routes/examenes.ts espera en el body.
function aBodyApi(item: Partial<LabCatalogItem>): Record<string, unknown> {
  const body: Record<string, unknown> = {
    codigo: item.code,
    nombre: item.name,
    nombreTecnico: item.technicalName,
    categoria: item.category,
    categoriaNombre: item.categoryName,
    tipoMuestra: item.sampleType,
    contenedorRequerido: item.tubeType,
    precio: item.price,
    unidadMedida: item.unit,
    tiempoEntregaHoras: item.deliveryTime !== undefined ? Number(item.deliveryTime) || undefined : undefined,
    metodo: item.methodology,
    tipoResultado: item.resultType,
    estado: item.status,
    visibleVenta: item.visibleForSale,
    esPerfil: item.isProfile,
    // Resto de LabCatalogItem sin columna propia.
    description: item.description,
    referenceRange: item.referenceRange,
    minVal: item.minVal,
    maxVal: item.maxVal,
    fasting: item.fasting,
    requiresFasting: item.requiresFasting,
    patientInstructions: item.patientInstructions,
    panicRange: item.panicRange,
    parametersCount: item.parametersCount,
    includedParameters: item.includedParameters,
    clinicalSignificance: item.clinicalSignificance
  };
  return Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
}

export function fromExamenApiRow(row: ExamenFullApiRow): Partial<LabCatalogItem> {
  const extra = row.datos_adicionales || {};
  return {
    remoteId: row.id_examen,
    code: row.codigo_examen || undefined,
    name: row.nombre_examen,
    technicalName: row.nombre_tecnico || undefined,
    category: (row.categoria || undefined) as LabCatalogItem['category'],
    categoryName: row.categoria_nombre || row.categoria || '',
    sampleType: row.tipo_muestra,
    tubeType: row.contenedor_requerido || undefined,
    price: Number(row.precio) || 0,
    priceFormatted: `Q${Number(row.precio) || 0}`,
    unit: row.unidad_medida || undefined,
    deliveryTime: String(row.tiempo_entrega_horas),
    methodology: row.metodo || undefined,
    resultType: row.tipo_resultado as LabCatalogItem['resultType'],
    status: row.estado,
    visibleForSale: row.visible_venta,
    isProfile: row.es_perfil,
    isFactory: row.es_fabrica,
    description: (extra.description as string) || '',
    referenceRange: extra.referenceRange as string | undefined,
    minVal: extra.minVal as number | undefined,
    maxVal: extra.maxVal as number | undefined,
    fasting: extra.fasting as string | undefined,
    requiresFasting: extra.requiresFasting as boolean | undefined,
    patientInstructions: extra.patientInstructions as string | undefined,
    panicRange: extra.panicRange as string | undefined,
    parametersCount: extra.parametersCount as number | undefined,
    includedParameters: extra.includedParameters as string[] | undefined,
    clinicalSignificance: extra.clinicalSignificance as string | undefined
  };
}

export async function crearExamenRemoto(item: LabCatalogItem): Promise<ExamenFullApiRow> {
  const res = await authFetchJson('/api/examenes', { method: 'POST', body: JSON.stringify(aBodyApi(item)) });
  if (!res.ok) throw new ExamenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function actualizarExamenRemoto(idExamen: number, updates: Partial<LabCatalogItem>): Promise<ExamenFullApiRow> {
  const res = await authFetchJson(`/api/examenes/${idExamen}`, { method: 'PATCH', body: JSON.stringify(aBodyApi(updates)) });
  if (!res.ok) throw new ExamenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}


export interface PerfilParaServidor {
  code: string;
  name: string;
  price: number;
  categoryName?: string;
  description?: string;
  includedParameters?: string[];
  tubeType?: string;
}

/**
 * Asegura que un perfil (orina completa, heces completa, paneles…) exista
 * como examen del catálogo real. Idempotente: si ya existe devuelve el precio
 * que tiene el servidor, que es el que se cobra al registrar la orden.
 */
export async function asegurarPerfilRemoto(perfil: PerfilParaServidor): Promise<{ id_examen: number; precio: number; creado: boolean }> {
  const res = await authFetchJson('/api/examenes/asegurar-perfil', {
    method: 'POST',
    body: JSON.stringify({
      codigo: perfil.code,
      nombre: perfil.name,
      precio: perfil.price,
      categoriaNombre: perfil.categoryName,
      descripcion: perfil.description,
      includedParameters: perfil.includedParameters,
      contenedorRequerido: perfil.tubeType
    })
  });
  if (!res.ok) throw new ExamenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}
