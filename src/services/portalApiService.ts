/**
 * Cliente del Portal del Paciente REAL (server/routes/portal.ts).
 *
 * El paciente entra con el código único de consulta que recibe en recepción;
 * el servidor lo valida y devuelve un token de 15 minutos limitado a SU orden.
 * El navegador nunca recibe la lista de pacientes ni los códigos de otros.
 */

export class PortalApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'PortalApiError';
  }
  /** Token vencido o inválido: hay que volver a iniciar sesión. */
  get sesionVencida(): boolean { return this.status === 401; }
}

export interface ParametroPortal {
  nombre: string;
  valor: string | number;
  unidad: string;
  referencia: string;
  estado: string;
  seccion: string | null;
}

export interface InformePortal {
  id: number;
  numero: string;
  titulo: string;
  categoria: string | null;
  fechaMuestra: string | null;
  fechaPublicacion: string | null;
  publicadoPor: string | null;
  codigoVerificacion: string | null;
  parametros: ParametroPortal[];
  conclusion: string | null;
  recomendaciones: string[];
}

export interface RespuestaInformesPortal {
  numeroOrden: string;
  paciente: string;
  informes: InformePortal[];
}

async function leerError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error) return body.error;
  } catch { /* sin cuerpo JSON */ }
  return `El servidor respondió ${res.status}.`;
}

async function pedir(ruta: string, token: string | null, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(ruta, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers || {}) }
    });
  } catch {
    throw new PortalApiError('No hay conexión con el laboratorio. Revisa tu internet e inténtalo de nuevo.');
  }
  if (!res.ok) throw new PortalApiError(await leerError(res), res.status);
  return res;
}

export async function iniciarSesionPortal(codigo: string): Promise<{ token: string; expiresInSeconds: number }> {
  const res = await pedir('/api/portal/login', null, { method: 'POST', body: JSON.stringify({ codigo: codigo.trim() }) });
  return res.json();
}

export async function obtenerInformesPortal(token: string): Promise<RespuestaInformesPortal> {
  const res = await pedir('/api/portal/informes', token);
  return res.json();
}

/** Descarga el PDF oficial (sellado) y lo devuelve como Blob. */
export async function descargarPdfPortal(token: string, idInforme: number): Promise<Blob> {
  const res = await pedir(`/api/portal/informes/${idInforme}/pdf`, token, { headers: { 'Content-Type': 'application/pdf' } });
  return res.blob();
}

/** Texto claro del estado de un parámetro (sin depender del color). */
export function etiquetaEstado(estado: string): { texto: string; anormal: boolean; critico: boolean } {
  switch ((estado || 'normal').toLowerCase()) {
    case 'normal': return { texto: 'Normal', anormal: false, critico: false };
    case 'high': return { texto: 'Alto ↑', anormal: true, critico: false };
    case 'low': return { texto: 'Bajo ↓', anormal: true, critico: false };
    case 'critical': return { texto: 'CRÍTICO – consulta a tu médico', anormal: true, critico: true };
    default: return { texto: estado, anormal: true, critico: false };
  }
}
