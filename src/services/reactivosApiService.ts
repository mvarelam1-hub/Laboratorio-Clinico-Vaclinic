/**
 * Cliente HTTP para reactivos e insumos (server/routes/reactivos.ts) —
 * sexto módulo de los 9 migrados desde localStorage (ver
 * db/migrations/0011_modulos_restantes.sql, tablas `reactivo` y
 * `movimiento_reactivo`).
 */
import { getFirebaseAuth } from './firebaseConfig';

export class ReactivosApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ReactivosApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new ReactivosApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
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

export interface ReactivoApiRow {
  id_reactivo: number;
  codigo: string;
  estado: 'optimo' | 'bajo_stock' | 'critico' | 'vencido';
  stock_actual: string | number;
  [key: string]: unknown;
}

export interface MovimientoApiRow {
  id_movimiento: number;
  id_reactivo: number;
  tipo: string;
  cantidad: string | number;
  stock_anterior: string | number;
  stock_nuevo: string | number;
  [key: string]: unknown;
}

export interface CrearReactivoInput {
  code: string;
  name: string;
  category: string;
  associatedTests?: string[];
  lotNumber: string;
  expirationDate: string;
  currentStock?: number;
  minStockAlert?: number;
  optimalStock?: number;
  unit: string;
  storageCondition?: string;
  supplier?: string;
  location?: string;
  costPerUnit?: number;
  testsPerUnit?: number;
  notes?: string;
}

export async function crearReactivoRemoto(input: CrearReactivoInput): Promise<ReactivoApiRow> {
  const res = await authFetch('/api/reactivos', { method: 'POST', body: JSON.stringify(input) });
  if (!res.ok) throw new ReactivosApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function actualizarReactivoRemoto(idReactivo: number, updates: Partial<CrearReactivoInput>): Promise<ReactivoApiRow> {
  const res = await authFetch(`/api/reactivos/${idReactivo}`, { method: 'PATCH', body: JSON.stringify(updates) });
  if (!res.ok) throw new ReactivosApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function eliminarReactivoRemoto(idReactivo: number): Promise<void> {
  const res = await authFetch(`/api/reactivos/${idReactivo}`, { method: 'DELETE' });
  if (!res.ok) throw new ReactivosApiError(await parseErrorBody(res), res.status);
}

export async function registrarMovimientoReactivoRemoto(
  idReactivo: number,
  type: 'entrada' | 'salida_consumo' | 'ajuste' | 'baja_vencimiento',
  quantity: number,
  reason: string
): Promise<{ reactivo: ReactivoApiRow; movimiento: MovimientoApiRow }> {
  const res = await authFetch(`/api/reactivos/${idReactivo}/movimientos`, {
    method: 'POST', body: JSON.stringify({ type, quantity, reason })
  });
  if (!res.ok) throw new ReactivosApiError(await parseErrorBody(res), res.status);
  return res.json();
}
