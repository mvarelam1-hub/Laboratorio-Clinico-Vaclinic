/**
 * Cliente HTTP para la creación real de órdenes (server/routes/ordenes.ts,
 * POST /api/ordenes) — transacción real en Postgres: inserta `orden` +
 * un `detalle_orden` por examen + genera el código único de consulta del
 * paciente (fn_generar_codigo_consulta). Ver src/services/pacientesApiService.ts
 * para el mismo patrón aplicado a pacientes.
 */

import { getFirebaseAuth } from './firebaseConfig';

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

export async function createOrdenRemote(idPaciente: number, examenesIds: number[]): Promise<OrdenApiResult> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new OrdenesApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
  }
  const idToken = await user.getIdToken();
  const res = await fetch('/api/ordenes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ idPaciente, examenesIds })
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
