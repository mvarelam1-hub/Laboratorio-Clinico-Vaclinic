import { describe, it, expect } from 'vitest';
import { seguimientoDePedido } from './seguimientoPedido';

const base = { date: '2026-10-02', testsCount: 20, status: 'Pendiente' as const, reportStatus: 'Sin Informe' as const };
const hechos = (o: any, i?: any) => seguimientoDePedido(o, i).filter((p) => p.hecho).map((p) => p.clave);

describe('seguimientoDePedido', () => {
  it('orden nueva: solo registrada, con la cantidad real de exámenes', () => {
    expect(hechos(base)).toEqual(['registrada']);
    expect(seguimientoDePedido(base)[0].detalle).toBe('20 examenes');
  });
  it('en proceso: muestra recibida', () => {
    expect(hechos({ ...base, status: 'En Proceso' })).toEqual(['registrada', 'recibida']);
  });
  it('validado con firma real: muestra quién firmó, sin inventar "recibida por"', () => {
    const p = seguimientoDePedido(
      { ...base, status: 'Listo', reportStatus: 'Validado' },
      { status: 'publicado', signature: { bioanalystName: 'Lic. Real', signedAt: '2026-10-02T15:00:00Z' } as any }
    );
    expect(p.find((x) => x.clave === 'validado')).toMatchObject({ hecho: true, detalle: 'Por Lic. Real', fecha: '2026-10-02' });
    expect(p.find((x) => x.clave === 'recibida')!.detalle).toBeUndefined();
    expect(p.find((x) => x.clave === 'enviado')).toMatchObject({ hecho: false, detalle: 'Todavía no ocurre' });
  });
  it('entregado: último paso completo', () => {
    expect(hechos({ ...base, status: 'Entregado', reportStatus: 'Validado' })).toEqual(['registrada', 'recibida', 'capturados', 'validado', 'enviado']);
  });
});
