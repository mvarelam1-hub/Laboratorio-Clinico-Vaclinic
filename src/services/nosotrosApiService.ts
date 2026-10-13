/**
 * Página "Nosotros" del Portal del Paciente (ver server/nosotros.ts).
 *
 *  - Lectura PÚBLICA: `obtenerNosotros` (el portal no tiene sesión).
 *  - Leer/guardar desde Ajustes (requiere sesión y permiso): `obtenerNosotrosAdmin`, `guardarNosotros`.
 */
import { getStaffSessionToken } from './staffSessionToken';

export interface ValorNosotros { titulo: string; texto: string; }
export interface IntegranteNosotros { nombre: string; cargo: string; }
export interface Nosotros {
  intro: string;
  vision: string;
  mision: string;
  valores: ValorNosotros[];
  /** Siempre 4 posiciones; la foto N va con el integrante N. Sin nombre = no se muestra. */
  equipo: IntegranteNosotros[];
}

/** Límites que también valida el servidor (se usan para los contadores del editor). */
export const LIMITES_NOSOTROS = { intro: 220, vision: 600, mision: 600, valorTitulo: 40, valorTexto: 160, nombre: 80, cargo: 80 };
export const MAX_VALORES_NOSOTROS = 4;
export const MAX_EQUIPO_NOSOTROS = 4;

export async function obtenerNosotros(): Promise<Nosotros> {
  const res = await fetch('/api/portada/nosotros', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar la página Nosotros.');
  return (await res.json()) as Nosotros;
}

type Resultado<T> = { ok: true; datos: T } | { ok: false; message: string };

async function llamarAdmin(metodo: 'GET' | 'PUT', cuerpo?: Nosotros): Promise<Resultado<Nosotros>> {
  const credencial = getStaffSessionToken();
  if (!credencial) return { ok: false, message: 'No hay una sesión de personal activa.' };
  try {
    const res = await fetch('/api/portada-admin/nosotros', {
      method: metodo,
      headers: { Authorization: `Bearer ${credencial}`, ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    const datos = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, datos: ((datos as any).datos ?? datos) as Nosotros };
    if (res.status === 403) return { ok: false, message: 'Solo el administrador de sistemas y el director pueden cambiar esta página.' };
    return { ok: false, message: (datos as any).error || 'No se pudo completar la acción.' };
  } catch (err) {
    console.error('[Nosotros] No se pudo contactar al servidor:', err);
    return { ok: false, message: 'No se pudo contactar al servidor de VACLINIC. Intenta de nuevo.' };
  }
}

export const obtenerNosotrosAdmin = () => llamarAdmin('GET');
export const guardarNosotros = (datos: Nosotros) => llamarAdmin('PUT', datos);
