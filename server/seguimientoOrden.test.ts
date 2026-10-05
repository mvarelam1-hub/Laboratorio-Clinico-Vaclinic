import { describe, it, expect } from 'vitest';
import { calcularSeguimiento } from './seguimientoOrden';

const base = { fechaRegistro: '2026-10-02T10:00:00Z', estadoFlujo: 'Pendiente', totalExamenes: 20, informes: [] as any[] };
const hechos = (e: any) => calcularSeguimiento(e).filter((p) => p.completado).map((p) => p.clave);

describe('calcularSeguimiento', () => {
  it('orden recién registrada: solo registro y solicitud', () => {
    expect(hechos(base)).toEqual(['registrado', 'solicitud']);
    expect(calcularSeguimiento(base)[2].etiqueta).toBe('Muestra pendiente de recepción');
  });
  it('muestra recibida cuando la orden salió de Pendiente', () => {
    expect(hechos({ ...base, estadoFlujo: 'En Proceso' })).toEqual(['registrado', 'solicitud', 'muestra']);
  });
  it('un borrador no cuenta como resultados ingresados', () => {
    const r = hechos({ ...base, estadoFlujo: 'En Proceso', informes: [{ estado: 'borrador', fechaCreacion: null, fechaPublicacion: null }] });
    expect(r).not.toContain('ingresados');
  });
  it('en revisión: ingresados, pero aún no validados ni disponibles', () => {
    const r = hechos({ ...base, informes: [{ estado: 'revision', fechaCreacion: '2026-10-02T12:00:00Z', fechaPublicacion: null }] });
    expect(r).toEqual(['registrado', 'solicitud', 'muestra', 'ingresados']);
  });
  it('publicado: todo completo con las fechas reales', () => {
    const pasos = calcularSeguimiento({ ...base, informes: [{ estado: 'publicado', fechaCreacion: '2026-10-02T12:00:00Z', fechaPublicacion: '2026-10-02T15:00:00Z' }] });
    expect(pasos.every((p) => p.completado)).toBe(true);
    expect(pasos[5].fecha).toBe('2026-10-02T15:00:00.000Z');
    expect(pasos[1].etiqueta).toContain('20 exámenes');
  });
});
