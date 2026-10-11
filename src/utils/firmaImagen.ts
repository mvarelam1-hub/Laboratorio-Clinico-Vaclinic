/**
 * Utilidades puras para preparar la imagen de una firma (subida, dibujada o escrita):
 * encuadrar el trazo y limitar el tamaño para que el informe y la base de datos no carguen imágenes enormes.
 */

export interface Recuadro {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/**
 * Recuadro mínimo que contiene todo lo que no es transparente (con un margen), o null si el lienzo está vacío.
 * `pixeles` es el arreglo RGBA de un ImageData.
 */
export function recuadroDeTrazo(
  pixeles: ArrayLike<number>,
  ancho: number,
  alto: number,
  margen = 6
): Recuadro | null {
  let minX = ancho;
  let minY = alto;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if (pixeles[(y * ancho + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const x0 = Math.max(0, minX - margen);
  const y0 = Math.max(0, minY - margen);
  const x1 = Math.min(ancho - 1, maxX + margen);
  const y1 = Math.min(alto - 1, maxY + margen);
  return { x: x0, y: y0, ancho: x1 - x0 + 1, alto: y1 - y0 + 1 };
}

/** Tamaño reducido (sin deformar ni agrandar) para que quepa en `maxAncho` x `maxAlto`. */
export function tamanoAjustado(
  ancho: number,
  alto: number,
  maxAncho = 800,
  maxAlto = 300
): { ancho: number; alto: number } {
  if (ancho <= 0 || alto <= 0) return { ancho: 1, alto: 1 };
  const factor = Math.min(1, maxAncho / ancho, maxAlto / alto);
  return { ancho: Math.max(1, Math.round(ancho * factor)), alto: Math.max(1, Math.round(alto * factor)) };
}

export const TIPOS_IMAGEN_FIRMA = ['image/png', 'image/jpeg', 'image/webp'];
export const MAX_BYTES_IMAGEN_FIRMA = 3 * 1024 * 1024;

/** Mensaje de error si el archivo no sirve como imagen de firma; null si está bien. */
export function validarArchivoFirma(archivo: { type: string; size: number }): string | null {
  if (!TIPOS_IMAGEN_FIRMA.includes(archivo.type)) return 'Usa una imagen PNG, JPG o WEBP.';
  if (archivo.size > MAX_BYTES_IMAGEN_FIRMA) return 'La imagen pesa más de 3 MB. Usa una más liviana.';
  return null;
}
