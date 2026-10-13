import { describe, it, expect } from 'vitest';
import { puntosMicroscopio, contornoMicroscopio } from './microscopio';

describe('microscopio', () => {
  it('reparte aproximadamente la cantidad de puntos pedida', () => {
    const pts = puntosMicroscopio(70);
    expect(pts.length).toBeGreaterThan(60);
    expect(pts.length).toBeLessThan(100);
  });

  it('todos los puntos caen dentro de la caja 0..1', () => {
    for (const q of puntosMicroscopio(80)) {
      expect(q.x).toBeGreaterThanOrEqual(0);
      expect(q.x).toBeLessThanOrEqual(1);
      expect(q.y).toBeGreaterThanOrEqual(0);
      expect(q.y).toBeLessThanOrEqual(1);
    }
  });

  it('el contorno tiene varias partes y ninguna coordenada inválida', () => {
    const lineas = contornoMicroscopio();
    expect(lineas.length).toBeGreaterThanOrEqual(6);
    for (const l of lineas) for (const q of l) expect(Number.isFinite(q.x) && Number.isFinite(q.y)).toBe(true);
  });

  it('con pocos puntos pedidos no falla ni se queda vacío', () => {
    expect(puntosMicroscopio(1).length).toBeGreaterThan(0);
  });
});
