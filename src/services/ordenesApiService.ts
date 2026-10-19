/**
 * Cliente HTTP para la creación real de órdenes (server/routes/ordenes.ts,
 * POST /api/ordenes) — transacción real en Postgres: inserta `orden` +
 * un `detalle_orden` por examen + genera el código único de consulta del
 * paciente (fn_generar_codigo_consulta). Ver src/services/pacientesApiService.ts
 * para el mismo patrón aplicado a pacientes.
 */

import { getStaffSessionToken } from './staffSessionToken';

export class OrdenesApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OrdenesApiError';
  }
}

export interface OrdenDetalleApiRow {
  idDetalle: number;
  idExamen: number;
  codigoExamen: string | null;
}

export interface OrdenApiResult {
  id_orden: number;
  numero_orden: string;
  codigo_consulta: string;
  // Un elemento por examen de la orden, con su id_detalle real — necesario
  // para poder crear después cada resultado (POST /api/resultados) contra el
  // detalle_orden exacto (ver src/context/ClinicContext.tsx `addOrder` y
  // `LabOrder.detalleRemoto` en src/types.ts).
  detalle?: OrdenDetalleApiRow[];
}

// Metadata de pago/prioridad/biometría opcional al crear la orden
// (migración 0016) — ver LabOrder en src/types.ts para los campos
// equivalentes del frontend.
export interface OrdenMetadataInput {
  prioridad?: 'rutina' | 'urgente' | 'stat_panico';
  metodoPago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'seguro' | 'por_cobrar';
  promoAplicada?: string;
  sedeCama?: string;
  esAltoRiesgo?: boolean;
  biometriaAutorizada?: boolean;
  datosBiometricos?: Record<string, unknown>;
}

export async function createOrdenRemote(idPaciente: number, examenesIds: number[], metadata?: OrdenMetadataInput): Promise<OrdenApiResult> {
  const token = getStaffSessionToken();
  if (!token) {
    throw new OrdenesApiError('No hay una sesión de personal activa para llamar a la API.');
  }
  const res = await fetch('/api/ordenes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ idPaciente, examenesIds, ...metadata })
  });
  if (!res.ok) {
    let mensaje = `El servidor respondió ${res.status}.`;
    try {
      const body = await res.json();
      if (body?.error) mensaje = body.error;
    } catch {
      /* sin cuerpo JSON */
    }
    throw new OrdenesApiError(mensaje, res.status);
  }
  return res.json();
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getStaffSessionToken();
  if (!token) {
    throw new OrdenesApiError('No hay una sesión de personal activa para llamar a la API.');
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

/**
 * Ciclo de vida de la orden (server/routes/ordenes.ts, migración 0013):
 * archivar/restaurar/eliminar (lógicamente, nunca un DELETE físico) + sus
 * variantes masivas. Ver ClinicContext.tsx archiveOrder/restoreOrder/
 * deleteOrder/bulkArchiveOrders/bulkRestoreOrders/bulkDeleteOrders para el
 * mismo patrón de resiliencia que ya usan reactivos/carpetas/personal: si
 * la llamada remota falla -o la orden todavía no tiene remoteId porque
 * nunca llegó a crearse en Postgres- el cambio se sigue aplicando
 * localmente, avisando con honestidad que no quedó sincronizado.
 */
export async function archivarOrdenRemota(idOrden: number): Promise<{ id_orden: number; archivada: boolean }> {
  const res = await authFetch(`/api/ordenes/${idOrden}/archivar`, { method: 'PATCH' });
  if (!res.ok) throw new OrdenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function restaurarOrdenRemota(idOrden: number): Promise<{ id_orden: number; archivada: boolean }> {
  const res = await authFetch(`/api/ordenes/${idOrden}/restaurar`, { method: 'PATCH' });
  if (!res.ok) throw new OrdenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function eliminarOrdenRemota(idOrden: number, motivo?: string): Promise<void> {
  const res = await authFetch(`/api/ordenes/${idOrden}`, { method: 'DELETE', body: JSON.stringify({ motivo }) });
  if (!res.ok) throw new OrdenesApiError(await parseErrorBody(res), res.status);
}

export async function archivarVariasOrdenesRemoto(idsOrdenes: number[]): Promise<{ ok: boolean; actualizadas: number }> {
  const res = await authFetch('/api/ordenes/archivar-varias', { method: 'PATCH', body: JSON.stringify({ idsOrdenes }) });
  if (!res.ok) throw new OrdenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function restaurarVariasOrdenesRemoto(idsOrdenes: number[]): Promise<{ ok: boolean; actualizadas: number }> {
  const res = await authFetch('/api/ordenes/restaurar-varias', { method: 'PATCH', body: JSON.stringify({ idsOrdenes }) });
  if (!res.ok) throw new OrdenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function eliminarVariasOrdenesRemoto(idsOrdenes: number[], motivo?: string): Promise<{ ok: boolean; actualizadas: number }> {
  const res = await authFetch('/api/ordenes/eliminar-varias', { method: 'PATCH', body: JSON.stringify({ idsOrdenes, motivo }) });
  if (!res.ok) throw new OrdenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

/**
 * Papelera (server/routes/ordenes.ts, GET /papelera + /:id/restaurar-papelera
 * + /restaurar-varias-papelera). Contraparte real de eliminarOrdenRemota/
 * eliminarVariasOrdenesRemoto: antes de esto no existía ninguna forma de
 * listar ni revertir una orden eliminada lógicamente desde el cliente.
 */
export interface OrdenPapeleraApiRow {
  id_orden: number;
  numero_orden: string;
  fecha_eliminacion: string;
  motivo_eliminacion: string | null;
  eliminado_por: string | null;
  [key: string]: unknown;
}

export async function obtenerPapeleraRemota(): Promise<OrdenPapeleraApiRow[]> {
  const res = await authFetch('/api/ordenes/papelera');
  if (!res.ok) throw new OrdenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function restaurarDesdeLaPapeleraRemota(idOrden: number): Promise<{ id_orden: number; eliminada: boolean }> {
  const res = await authFetch(`/api/ordenes/${idOrden}/restaurar-papelera`, { method: 'PATCH' });
  if (!res.ok) throw new OrdenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function restaurarVariasDesdeLaPapeleraRemoto(idsOrdenes: number[]): Promise<{ ok: boolean; actualizadas: number }> {
  const res = await authFetch('/api/ordenes/restaurar-varias-papelera', { method: 'PATCH', body: JSON.stringify({ idsOrdenes }) });
  if (!res.ok) throw new OrdenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

/**
 * Listado general de órdenes (server/routes/ordenes.ts, GET /). Contraparte
 * de la hidratación que faltaba: ANTES ningún componente llamaba a esta
 * ruta y `orders` en ClinicContext.tsx solo existía en memoria del
 * navegador que creó/editó cada orden -una orden creada en otra
 * computadora era invisible hasta que algo la tocara localmente-. Ver
 * ClinicContext.tsx `syncOrdersFromServer` para cómo se usa esto: reconcilia
 * las órdenes ya presentes localmente (por remoteId) y agrega como nuevas
 * las que existen en el servidor pero nunca llegaron a esta copia local.
 */
export interface OrdenListaApiRow {
  id_orden: number;
  numero_orden: string;
  fecha_registro: string;
  estado: string;
  estado_flujo: 'Pendiente' | 'En Proceso' | 'Listo' | 'Entregado';
  total_cobrado: string | number;
  sede: string | null;
  archivada: boolean;
  fecha_archivo: string | null;
  id_carpeta: number | null;
  prioridad: 'rutina' | 'urgente' | 'stat_panico';
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'seguro' | 'por_cobrar' | null;
  saldo_pendiente: string | number | null;
  promo_aplicada: string | null;
  sede_cama: string | null;
  es_alto_riesgo: boolean;
  biometria_autorizada: boolean;
  datos_biometricos: Record<string, unknown> | null;
  id_paciente: number;
  paciente_nombre: string;
  paciente_dni: string | null;
  paciente_telefono: string | null;
  paciente_correo: string | null;
  codigo_consulta: string | null;
  informe_estado: 'borrador' | 'revision' | 'publicado' | 'entregado' | null;
  examenes: Array<{ idDetalle: number; idExamen: number; codigoExamen: string | null; nombreExamen: string }>;
  [key: string]: unknown;
}

export async function obtenerOrdenesRemotas(limite = 500): Promise<OrdenListaApiRow[]> {
  const res = await authFetch(`/api/ordenes?limite=${limite}`);
  if (!res.ok) throw new OrdenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

/**
 * Edición general de la orden (server/routes/ordenes.ts, migración 0016,
 * PATCH /api/ordenes/:id): estado operativo (status), prioridad, método de
 * pago, saldo pendiente, promoción, cama/sede y autorización biométrica.
 * Ver ClinicContext.tsx `updateOrder` para el patrón de resiliencia
 * (actualiza localmente siempre, sincroniza con el backend si hay
 * remoteId y la sesión está online).
 */
export interface OrdenUpdateInput {
  status?: 'Pendiente' | 'En Proceso' | 'Listo' | 'Entregado';
  prioridad?: 'rutina' | 'urgente' | 'stat_panico';
  metodoPago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'seguro' | 'por_cobrar' | null;
  saldoPendiente?: number;
  promoAplicada?: string;
  sedeCama?: string;
  sede?: string;
  esAltoRiesgo?: boolean;
  biometriaAutorizada?: boolean;
  datosBiometricos?: Record<string, unknown>;
}

export async function actualizarOrdenRemota(idOrden: number, updates: OrdenUpdateInput): Promise<Record<string, unknown>> {
  const res = await authFetch(`/api/ordenes/${idOrden}`, { method: 'PATCH', body: JSON.stringify(updates) });
  if (!res.ok) throw new OrdenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export interface AgregarExamenesResultado {
  numero_orden: string;
  monto_agregado: number;
  total_cobrado: number;
  saldo_pendiente: number;
  estado_flujo: 'Pendiente' | 'En Proceso' | 'Listo' | 'Entregado';
  /** Detalle COMPLETO de la orden después de agregar (un elemento por examen). */
  detalle: OrdenDetalleApiRow[];
}

/**
 * Agrega exámenes a una orden que ya existe (POST /api/ordenes/:id/examenes).
 * El número de pago es obligatorio cuando los exámenes tienen costo.
 */
export async function agregarExamenesOrdenRemota(
  idOrden: number,
  examenesIds: number[],
  numeroPago?: string
): Promise<AgregarExamenesResultado> {
  const res = await authFetch(`/api/ordenes/${idOrden}/examenes`, {
    method: 'POST',
    body: JSON.stringify({ examenesIds, numeroPago })
  });
  if (!res.ok) throw new OrdenesApiError(await parseErrorBody(res), res.status);
  return res.json();
}
