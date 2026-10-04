/**
 * Cliente del asistente de interpretación por IA (server/routes/ia.ts).
 * La IA solo explica; el servidor rechaza diagnósticos y no recibe datos de
 * identificación del paciente.
 */
import { getStaffSessionToken } from './staffSessionToken';

export class IaApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'IaApiError';
  }
}

export interface ParametroParaIA {
  name: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  status?: string;
}

export interface InterpretacionIA {
  modelo: string;
  resumen: string;
  valores: { nombre: string; significado: string }[];
  recordatorio: string;
  texto: string;
}

export async function generarInterpretacionIA(datos: {
  edad?: number | null;
  genero?: string | null;
  titulo?: string;
  parametros: ParametroParaIA[];
}): Promise<InterpretacionIA> {
  const token = getStaffSessionToken();
  if (!token) throw new IaApiError('No hay una sesión de personal activa.');
  const res = await fetch('/api/ia/interpretacion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(datos)
  });
  let cuerpo: any = null;
  try { cuerpo = await res.json(); } catch { /* sin cuerpo */ }
  if (!res.ok) {
    throw new IaApiError(cuerpo?.error || `El servidor respondió ${res.status}.`, res.status, cuerpo?.code);
  }
  return cuerpo as InterpretacionIA;
}
