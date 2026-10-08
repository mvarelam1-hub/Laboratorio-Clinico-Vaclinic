/** Cliente (personal) para gestionar las noticias y promociones del portal público. */
import { getStaffSessionToken } from './staffSessionToken';

export type TipoContenido = 'noticia' | 'promocion';

export interface ContenidoAdmin {
  id_contenido: number;
  tipo: TipoContenido;
  titulo: string;
  resumen: string;
  cuerpo: string;
  etiqueta: string | null;
  fuente: string | null;
  enlace: string | null;
  fecha_publicacion: string;
  vigente_hasta: string | null;
  publicado: boolean;
}

export interface ContenidoEntrada {
  tipo: TipoContenido; titulo: string; resumen: string; cuerpo: string; etiqueta: string;
  fuente: string; enlace: string; fechaPublicacion: string; vigenteHasta: string; publicado: boolean;
}

async function llamar<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const token = getStaffSessionToken();
  if (!token) throw new Error('No hay una sesión de personal activa.');
  const r = await fetch(`/api/contenido-publico${ruta}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((datos as any).error || 'No se pudo completar la acción.');
  return datos as T;
}

export const listarContenido = () => llamar<ContenidoAdmin[]>('GET', '');
export const crearContenido = (c: ContenidoEntrada) => llamar<ContenidoAdmin>('POST', '', c);
export const actualizarContenido = (id: number, c: ContenidoEntrada) => llamar<ContenidoAdmin>('PUT', `/${id}`, c);
export const eliminarContenido = (id: number) => llamar<{ ok: true }>('DELETE', `/${id}`);
