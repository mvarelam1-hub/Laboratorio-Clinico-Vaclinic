/**
 * Cliente HTTP para transferencias de muestra (server/routes/transferencias.ts)
 * — tercer módulo de los 9 migrados desde localStorage (ver
 * db/migrations/0011_modulos_restantes.sql, tabla `transferencia_muestra`).
 */
import { getFirebaseAuth } from './firebaseConfig';

export class TransferenciasApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'TransferenciasApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new TransferenciasApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
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

export interface TransferenciaApiRow {
  id_transferencia: number;
  codigo_manifiesto: string;
  estado: 'en_transito' | 'entregado' | 'retrasado';
  hora_llegada_real: string | null;
  [key: string]: unknown;
}

export interface CrearTransferenciaInput {
  originBranch: string;
  destinationBranch: string;
  courierName: string;
  departureTime: string;
  estimatedArrivalTime: string;
  status: 'en_transito' | 'entregado' | 'retrasado';
  temperatureControl: '2_8_grados' | 'congelado_menos_20' | 'temperatura_ambiente';
  temperatureLogged: number;
  samplesCount: number;
  samplesCodes: string[];
}

export async function crearTransferenciaRemota(input: CrearTransferenciaInput): Promise<TransferenciaApiRow> {
  const res = await authFetch('/api/transferencias', { method: 'POST', body: JSON.stringify(input) });
  if (!res.ok) throw new TransferenciasApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function actualizarTransferenciaRemota(
  idTransferencia: number,
  updates: Partial<{ status: 'en_transito' | 'entregado' | 'retrasado'; actualArrivalTime: string; temperatureLogged: number }>
): Promise<TransferenciaApiRow> {
  const res = await authFetch(`/api/transferencias/${idTransferencia}`, { method: 'PATCH', body: JSON.stringify(updates) });
  if (!res.ok) throw new TransferenciasApiError(await parseErrorBody(res), res.status);
  return res.json();
}
