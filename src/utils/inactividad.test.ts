import { describe, it, expect } from 'vitest';
import {
  estadoInactividad,
  segundosRestantes,
  LIMITE_INACTIVIDAD_MS,
  AVISO_INACTIVIDAD_MS
} from './inactividad';

describe('estadoInactividad', () => {
  const t0 = 1_000_000;

  it('activo mientras falte más que el aviso', () => {
    expect(estadoInactividad(t0, t0)).toBe('activo');
    expect(estadoInactividad(t0, t0 + LIMITE_INACTIVIDAD_MS - AVISO_INACTIVIDAD_MS - 1)).toBe('activo');
  });

  it('aviso durante el último minuto', () => {
    expect(estadoInactividad(t0, t0 + LIMITE_INACTIVIDAD_MS - AVISO_INACTIVIDAD_MS)).toBe('aviso');
    expect(estadoInactividad(t0, t0 + LIMITE_INACTIVIDAD_MS - 1)).toBe('aviso');
  });

  it('expirado al llegar al límite', () => {
    expect(estadoInactividad(t0, t0 + LIMITE_INACTIVIDAD_MS)).toBe('expirado');
    expect(estadoInactividad(t0, t0 + LIMITE_INACTIVIDAD_MS * 2)).toBe('expirado');
  });

  it('respeta límites personalizados', () => {
    expect(estadoInactividad(0, 5_000, 10_000, 3_000)).toBe('activo');
    expect(estadoInactividad(0, 8_000, 10_000, 3_000)).toBe('aviso');
    expect(estadoInactividad(0, 10_000, 10_000, 3_000)).toBe('expirado');
  });
});

describe('segundosRestantes', () => {
  it('cuenta hacia atrás y nunca baja de 0', () => {
    expect(segundosRestantes(0, 0, 60_000)).toBe(60);
    expect(segundosRestantes(0, 45_500, 60_000)).toBe(15);
    expect(segundosRestantes(0, 90_000, 60_000)).toBe(0);
  });
});
