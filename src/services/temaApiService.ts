/**
 * Paleta de colores del laboratorio (ver server/routes/tema.ts).
 *
 *  - Lectura PÚBLICA (el login y el portal del paciente no tienen sesión): `obtenerTemaRemoto`.
 *  - Guardar/restablecer (requiere sesión y permiso): `guardarTemaRemoto`, `restablecerTemaRemoto`.
 *  - `cargarYAplicarTema` pinta primero la paleta guardada en este navegador (sin parpadeo)
 *    y luego la que tiene el servidor.
 */
import { getStaffSessionToken } from './staffSessionToken';
import { aplicarTema, guardarTemaEnCache, leerTemaEnCache, validarColores, type ColoresTema } from '../utils/tema';

export interface TemaRemoto {
  paleta: string | null;
  colores: ColoresTema;
}

/** `null` = el laboratorio no eligió paleta (diseño original). Si falla la red, también `null`. */
export async function obtenerTemaRemoto(): Promise<TemaRemoto | null | undefined> {
  try {
    const res = await fetch('/api/tema', { cache: 'no-store' });
    if (!res.ok) return undefined;
    const cuerpo = await res.json().catch(() => ({}));
    const tema = (cuerpo as any)?.tema;
    if (tema === null) return null;
    const colores = validarColores(tema?.colores);
    if (!colores) return undefined;
    return { paleta: typeof tema.paleta === 'string' ? tema.paleta : null, colores };
  } catch {
    return undefined;
  }
}

async function llamarAdmin(metodo: 'PUT' | 'DELETE', cuerpo?: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  const token = getStaffSessionToken();
  if (!token) return { ok: false, message: 'No hay una sesión de personal activa.' };
  try {
    const res = await fetch('/api/tema-admin', {
      method: metodo,
      headers: { Authorization: `Bearer ${token}`, ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
    if (res.ok) return { ok: true };
    const datos = await res.json().catch(() => ({}));
    if (res.status === 403) return { ok: false, message: 'Solo el administrador de sistemas y el director pueden cambiar la paleta.' };
    return { ok: false, message: (datos as any).error || 'No se pudo completar la acción.' };
  } catch (err) {
    console.error('[Tema] No se pudo contactar al servidor:', err);
    return { ok: false, message: 'No se pudo contactar al servidor de VACLINIC. Intenta de nuevo.' };
  }
}

export const guardarTemaRemoto = (paleta: string | null, colores: ColoresTema) => llamarAdmin('PUT', { paleta, colores });
export const restablecerTemaRemoto = () => llamarAdmin('DELETE');

/** Se llama al arrancar la aplicación. */
export async function cargarYAplicarTema(): Promise<void> {
  const enCache = leerTemaEnCache();
  if (enCache) aplicarTema(enCache);
  const remoto = await obtenerTemaRemoto();
  if (remoto === undefined) return; // sin respuesta válida: se deja lo que ya se ve
  aplicarTema(remoto ? remoto.colores : null);
  guardarTemaEnCache(remoto ? remoto.colores : null);
}
