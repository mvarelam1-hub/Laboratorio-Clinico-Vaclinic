import { describe, it, expect } from 'vitest';
import { construirBorradorDeOrden } from './borradorInforme';

const base = { orderNumber: '#201', patientId: 'p1', patientName: 'Paciente Real', nationalId: '123', testsList: ['Glucosa en Ayunas'], sampleDate: '2026-10-04', laboratoryName: 'VACLINIC' };

describe('construirBorradorDeOrden', () => {
  it('es un borrador sin texto clínico precargado', () => {
    const r = construirBorradorDeOrden({ ...base, patientAge: 30, patientGender: 'M' });
    expect(r.status).toBe('borrador');
    expect(r.clinicalFindings).toBe('');
    expect(r.doctorConclusions).toBe('');
    expect(r.patientExplanation).toBe('');
    expect(r.recommendations).toEqual([]);
    expect(r.qrVerificationCode).toBe('');
  });
  it('los valores de cada parámetro quedan vacíos (no se inventan resultados)', () => {
    const r = construirBorradorDeOrden({ ...base, patientAge: 30, patientGender: 'M' });
    expect(r.parameters.length).toBeGreaterThan(0);
    for (const p of r.parameters) expect(String(p.value ?? '')).toBe('');
  });
  it('conserva el vínculo con la orden y no inventa edad', () => {
    const r = construirBorradorDeOrden({ ...base, orderId: 'ord-9' });
    expect(r.orderId).toBe('ord-9');
    expect(r.patientAge).toBe(0);
  });
  it('sexo femenino se normaliza a F y cualquier otro a M', () => {
    expect(construirBorradorDeOrden({ ...base, patientGender: 'Femenino' }).patientGender).toBe('F');
    expect(construirBorradorDeOrden({ ...base, patientGender: 'Masculino' }).patientGender).toBe('M');
  });
});

import { numeroInformeNuevo } from './borradorInforme';

describe('numeroInformeNuevo', () => {
  it('lleva la fecha del día y el año real (no 2026 fijo)', () => {
    const n = numeroInformeNuevo(new Date('2027-03-09T10:00:00'), () => 0.5);
    expect(n).toMatch(/^INF-20270309-[0-9A-Z]{8}$/);
  });
  it('dos informes en momentos distintos no repiten número', () => {
    const a = numeroInformeNuevo(new Date('2026-10-04T10:00:00.000'), () => 0.1);
    const b = numeroInformeNuevo(new Date('2026-10-04T10:00:00.001'), () => 0.1);
    expect(a).not.toBe(b);
  });
});
