/**
 * Cliente HTTP de muestras (tubos y recipientes) — server/routes/muestras.ts,
 * tabla `muestra` (migración 0030).
 */
import { getStaffSessionToken } from './staffSessionToken';

export class MuestrasApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'MuestrasApiError';
  }
}

export type CategoriaMuestra = 'tubo' | 'recipiente' | 'hisopo';
export type EstadoMuestra = 'recolectada' | 'en_proceso' | 'analizada' | 'rechazada';
export type CalidadMuestra = 'optima' | 'hemolisis_leve' | 'hemolisis_severa' | 'lipemica' | 'coagulada';

export interface MuestraApiRow {
  id_muestra: number;
  codigo_barras: string;
  id_orden: number;
  numero_orden: string;
  id_paciente: number;
  paciente_nombre: string;
  paciente_dni: string | null;
  categoria: CategoriaMuestra;
  tipo_contenedor: string;
  etiqueta_contenedor: string;
  examenes: string[];
  flebotomista: string | null;
  fecha_recoleccion: string;
  estado: EstadoMuestra;
  calidad: CalidadMuestra;
  motivo_rechazo: string | null;
  fecha_recepcion: string | null;
  receptor_nombre: string | null;
  fecha_actualizacion: string;
}

export interface CrearMuestraInput {
  idOrden: number;
  categoria: CategoriaMuestra;
  tipoContenedor: string;
  etiquetaContenedor: string;
  examenes: string[];
  flebotomista?: string;
  calidad?: CalidadMuestra;
}

async function llamar<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = getStaffSessionToken();
  if (!token) throw new MuestrasApiError('No hay una sesión de personal activa para llamar a la API.');
  const res = await fetch(`/api/muestras${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opciones.headers || {}) }
  });
  if (!res.ok) {
    let mensaje = `El servidor respondió ${res.status}.`;
    try {
      const cuerpo = await res.json();
      if (cuerpo?.error) mensaje = cuerpo.error;
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    throw new MuestrasApiError(mensaje, res.status);
  }
  return res.json() as Promise<T>;
}

export const listarMuestrasRemotas = () => llamar<MuestraApiRow[]>('');

export const crearMuestraRemota = (datos: CrearMuestraInput) =>
  llamar<MuestraApiRow>('', { method: 'POST', body: JSON.stringify(datos) });

export const escanearMuestraRemota = (codigo: string) =>
  llamar<MuestraApiRow>('/escanear', { method: 'POST', body: JSON.stringify({ codigo }) });

export const actualizarMuestraRemota = (
  idMuestra: number,
  cambios: { estado?: EstadoMuestra; calidad?: CalidadMuestra; motivoRechazo?: string }
) => llamar<MuestraApiRow>(`/${idMuestra}`, { method: 'PATCH', body: JSON.stringify(cambios) });
