import { describe, it, expect } from 'vitest';
import { coincidePeriodo, aFechaLocal } from './periodoOrdenes';

// Domingo 4 de octubre de 2026 (semana: lunes 28/09 → hoy)
const ahora = new Date(2026, 9, 4, 22, 30);

describe('coincidePeriodo', () => {
  it('todas incluye cualquier fecha', () => {
    expect(coincidePeriodo('2020-01-01', 'todas', ahora)).toBe(true);
  });
  it('hoy usa la fecha local', () => {
    expect(aFechaLocal(ahora)).toBe('2026-10-04');
    expect(coincidePeriodo('2026-10-04', 'hoy', ahora)).toBe(true);
    expect(coincidePeriodo('2026-10-03', 'hoy', ahora)).toBe(false);
  });
  it('semana va de lunes a hoy', () => {
    expect(coincidePeriodo('2026-09-28', 'semana', ahora)).toBe(true);
    expect(coincidePeriodo('2026-09-27', 'semana', ahora)).toBe(false);
    expect(coincidePeriodo('2026-10-05', 'semana', ahora)).toBe(false);
  });
  it('mes y año', () => {
    expect(coincidePeriodo('2026-10-01', 'mes', ahora)).toBe(true);
    expect(coincidePeriodo('2026-09-30', 'mes', ahora)).toBe(false);
    expect(coincidePeriodo('2026-01-15', 'anio', ahora)).toBe(true);
    expect(coincidePeriodo('2025-12-31', 'anio', ahora)).toBe(false);
  });
  it('fecha inválida no coincide', () => {
    expect(coincidePeriodo('', 'hoy', ahora)).toBe(false);
    expect(coincidePeriodo('basura', 'mes', ahora)).toBe(false);
  });
});
