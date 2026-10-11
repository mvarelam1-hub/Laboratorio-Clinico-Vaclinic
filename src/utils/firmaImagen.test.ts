import { describe, it, expect } from 'vitest';
import { recuadroDeTrazo, tamanoAjustado, validarArchivoFirma } from './firmaImagen';

function lienzo(ancho: number, alto: number, puntos: Array<[number, number]>): Uint8ClampedArray {
  const d = new Uint8ClampedArray(ancho * alto * 4);
  for (const [x, y] of puntos) d[(y * ancho + x) * 4 + 3] = 255;
  return d;
}

describe('recuadroDeTrazo', () => {
  it('devuelve null si el lienzo está vacío', () => {
    expect(recuadroDeTrazo(lienzo(20, 10, []), 20, 10)).toBeNull();
  });

  it('encuadra el trazo con margen sin salirse del lienzo', () => {
    const r = recuadroDeTrazo(lienzo(40, 20, [[10, 5], [20, 8]]), 40, 20, 2);
    expect(r).toEqual({ x: 8, y: 3, ancho: 15, alto: 8 });
    const borde = recuadroDeTrazo(lienzo(10, 10, [[0, 0], [9, 9]]), 10, 10, 5);
    expect(borde).toEqual({ x: 0, y: 0, ancho: 10, alto: 10 });
  });
});

describe('tamanoAjustado', () => {
  it('no agranda imágenes pequeñas', () => {
    expect(tamanoAjustado(200, 80)).toEqual({ ancho: 200, alto: 80 });
  });

  it('reduce manteniendo la proporción', () => {
    expect(tamanoAjustado(1600, 400, 800, 300)).toEqual({ ancho: 800, alto: 200 });
    expect(tamanoAjustado(600, 900, 800, 300)).toEqual({ ancho: 200, alto: 300 });
  });
});

describe('validarArchivoFirma', () => {
  it('acepta PNG, JPG y WEBP livianos', () => {
    expect(validarArchivoFirma({ type: 'image/png', size: 1000 })).toBeNull();
    expect(validarArchivoFirma({ type: 'image/webp', size: 1000 })).toBeNull();
  });

  it('rechaza otros formatos y archivos pesados', () => {
    expect(validarArchivoFirma({ type: 'application/pdf', size: 1000 })).toMatch(/PNG/);
    expect(validarArchivoFirma({ type: 'image/png', size: 4 * 1024 * 1024 })).toMatch(/3 MB/);
  });
});
