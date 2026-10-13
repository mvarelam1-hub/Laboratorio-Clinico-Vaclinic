/**
 * Imágenes de la portada del login del personal (ver server/routes/portada.ts).
 *
 *  - Lectura PÚBLICA (el login aún no tiene sesión): `obtenerPortada`.
 *  - Subir/quitar (requiere sesión y permiso): `subirImagenPortada`, `quitarImagenPortada`.
 *  - `prepararImagen` reduce y comprime la imagen elegida en el navegador antes
 *    de subirla (máx. 1.5 MB), para que cualquier foto del celular sirva.
 */
import { getStaffSessionToken } from './staffSessionToken';

export type ClavePortada = 'logo' | 'fondo' | 'fondo_pagina' | 'escudo' | 'area_hematologia' | 'area_parasitos' | 'area_cristales' | 'area_quimica' | 'nosotros_vision' | 'nosotros_mision' | 'nosotros_servicios' | 'equipo_1' | 'equipo_2' | 'equipo_3' | 'equipo_4';
export type MapaPortada = Record<string, { version: number }>;

export interface PosicionPortada {
  clave: ClavePortada;
  etiqueta: string;
  ayuda: string;
  /** Lado más largo (px) al que se reduce la imagen antes de subirla. */
  maxLado: number;
}

export const POSICIONES_PORTADA: PosicionPortada[] = [
  { clave: 'logo', etiqueta: 'Logo principal', ayuda: 'Va en el centro de la portada. Lo mejor es una imagen cuadrada, PNG con fondo transparente.', maxLado: 600 },
  { clave: 'fondo', etiqueta: 'Fondo de la portada', ayuda: 'Foto o ilustración del laboratorio que va detrás de la tarjeta de la portada. Se oscurece un poco para que el texto se lea bien.', maxLado: 1600 },
  { clave: 'fondo_pagina', etiqueta: 'Fondo de la pantalla de acceso', ayuda: 'Imagen horizontal que cubre toda la pantalla detrás del acceso y del inicio del portal del paciente. Se aclara para que todo se lea bien.', maxLado: 1920 },
  { clave: 'escudo', etiqueta: 'Escudo del acceso', ayuda: 'Imagen pequeña que va arriba del título "Acceso a Personal". Cuadrada y con fondo transparente.', maxLado: 400 },
  { clave: 'area_hematologia', etiqueta: 'Ícono de Hematología', ayuda: 'Imagen cuadrada (por ejemplo, células de la sangre). Se muestra en un círculo.', maxLado: 300 },
  { clave: 'area_parasitos', etiqueta: 'Ícono de Parásitos', ayuda: 'Imagen cuadrada. Se muestra en un círculo.', maxLado: 300 },
  { clave: 'area_cristales', etiqueta: 'Ícono de Cristales', ayuda: 'Imagen cuadrada. Se muestra en un círculo.', maxLado: 300 },
  { clave: 'area_quimica', etiqueta: 'Ícono de Química sanguínea', ayuda: 'Imagen cuadrada (por ejemplo, tubos de ensayo). Se muestra en un círculo.', maxLado: 300 },
  { clave: 'nosotros_vision', etiqueta: 'Nosotros: foto de Visión', ayuda: 'Foto horizontal para la página Nosotros del portal del paciente. Si no pones una, se muestra un dibujo.', maxLado: 1200 },
  { clave: 'nosotros_mision', etiqueta: 'Nosotros: foto de Misión', ayuda: 'Foto horizontal para la página Nosotros del portal del paciente. Si no pones una, se muestra un dibujo.', maxLado: 1200 },
  { clave: 'nosotros_servicios', etiqueta: 'Nosotros: fondo de la invitación final', ayuda: 'Imagen horizontal que va tenue detrás de la invitación del final de la página Nosotros. Si no pones una, solo se ve el color.', maxLado: 1600 },
  { clave: 'equipo_1', etiqueta: 'Nosotros: foto del integrante 1', ayuda: 'Foto cuadrada de la persona 1 del equipo (la que escribas en el editor de Nosotros). Si no pones una, se muestran sus iniciales.', maxLado: 600 },
  { clave: 'equipo_2', etiqueta: 'Nosotros: foto del integrante 2', ayuda: 'Foto cuadrada de la persona 2 del equipo (la que escribas en el editor de Nosotros). Si no pones una, se muestran sus iniciales.', maxLado: 600 },
  { clave: 'equipo_3', etiqueta: 'Nosotros: foto del integrante 3', ayuda: 'Foto cuadrada de la persona 3 del equipo (la que escribas en el editor de Nosotros). Si no pones una, se muestran sus iniciales.', maxLado: 600 },
  { clave: 'equipo_4', etiqueta: 'Nosotros: foto del integrante 4', ayuda: 'Foto cuadrada de la persona 4 del equipo (la que escribas en el editor de Nosotros). Si no pones una, se muestran sus iniciales.', maxLado: 600 }
];

export const MAX_BYTES_IMAGEN = 1.5 * 1024 * 1024;
export const TIPOS_ACEPTADOS = ['image/png', 'image/jpeg', 'image/webp'];

export function urlImagenPortada(clave: string, version: number): string {
  return `/api/portada/imagen/${clave}?v=${version}`;
}

/** Medidas de salida: conserva la proporción y nunca agranda la imagen. */
export function calcularTamano(ancho: number, alto: number, maxLado: number): { ancho: number; alto: number } {
  const mayor = Math.max(ancho, alto);
  if (mayor <= maxLado) return { ancho, alto };
  const factor = maxLado / mayor;
  return { ancho: Math.max(1, Math.round(ancho * factor)), alto: Math.max(1, Math.round(alto * factor)) };
}

/** Qué posiciones tienen imagen. Si falla la red, devuelve vacío (se usa el dibujo por defecto). */
export async function obtenerPortada(): Promise<MapaPortada> {
  try {
    const res = await fetch('/api/portada', { cache: 'no-store' });
    if (!res.ok) return {};
    const cuerpo = await res.json().catch(() => ({}));
    return (cuerpo && cuerpo.imagenes) || {};
  } catch {
    return {};
  }
}

async function llamarAdmin(metodo: 'PUT' | 'DELETE', clave: string, cuerpo?: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  const token = getStaffSessionToken();
  if (!token) return { ok: false, message: 'No hay una sesión de personal activa.' };
  try {
    const res = await fetch(`/api/portada-admin/imagen/${clave}`, {
      method: metodo,
      headers: { Authorization: `Bearer ${token}`, ...(cuerpo ? { 'Content-Type': 'application/json' } : {}) },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
    if (res.ok) return { ok: true };
    const datos = await res.json().catch(() => ({}));
    if (res.status === 403) return { ok: false, message: 'Solo el administrador de sistemas y el director pueden cambiar la portada.' };
    return { ok: false, message: (datos as any).error || 'No se pudo completar la acción.' };
  } catch (err) {
    console.error('[Portada] No se pudo contactar al servidor:', err);
    return { ok: false, message: 'No se pudo contactar al servidor de VACLINIC. Intenta de nuevo.' };
  }
}

export const subirImagenPortada = (clave: ClavePortada, base64: string) => llamarAdmin('PUT', clave, { base64 });
export const quitarImagenPortada = (clave: ClavePortada) => llamarAdmin('DELETE', clave);

function leerComoBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result).split(',')[1] || '');
    lector.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    lector.readAsDataURL(blob);
  });
}

function aBlob(canvas: HTMLCanvasElement, tipo: string, calidad?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), tipo, calidad));
}

/**
 * Lee la imagen elegida, la reduce a `maxLado` y la comprime hasta que pese
 * menos de 1.5 MB. Devuelve el contenido en base64 listo para subir.
 */
export async function prepararImagen(archivo: File, maxLado: number): Promise<{ ok: true; base64: string } | { ok: false; message: string }> {
  if (!TIPOS_ACEPTADOS.includes(archivo.type)) {
    return { ok: false, message: 'Elige una imagen PNG, JPG o WebP.' };
  }
  if (archivo.size > 25 * 1024 * 1024) {
    return { ok: false, message: 'La imagen es demasiado grande (más de 25 MB).' };
  }
  try {
    const bitmap = await createImageBitmap(archivo);
    const { ancho, alto } = calcularTamano(bitmap.width, bitmap.height, maxLado);
    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { ok: false, message: 'Tu navegador no pudo procesar la imagen.' };
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close?.();

    // WebP conserva la transparencia y pesa poco; si el navegador no lo soporta, PNG.
    for (const calidad of [0.9, 0.8, 0.7, 0.55]) {
      const blob = await aBlob(canvas, 'image/webp', calidad);
      if (blob && blob.type === 'image/webp' && blob.size <= MAX_BYTES_IMAGEN) return { ok: true, base64: await leerComoBase64(blob) };
      if (blob && blob.type !== 'image/webp') break;
    }
    const png = await aBlob(canvas, 'image/png');
    if (png && png.size <= MAX_BYTES_IMAGEN) return { ok: true, base64: await leerComoBase64(png) };
    const jpg = await aBlob(canvas, 'image/jpeg', 0.8);
    if (jpg && jpg.size <= MAX_BYTES_IMAGEN) return { ok: true, base64: await leerComoBase64(jpg) };
    return { ok: false, message: 'No se pudo reducir la imagen por debajo de 1.5 MB. Prueba con una más pequeña.' };
  } catch (err) {
    console.error('[Portada] No se pudo procesar la imagen:', err);
    return { ok: false, message: 'No se pudo leer esa imagen. Prueba con otro archivo.' };
  }
}
