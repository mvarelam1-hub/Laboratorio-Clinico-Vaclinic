import { describe, it, expect } from 'vitest';
import { mapInformeApiToReport, combinarInformesRemotos, InformeApiRow } from './informesApiService';
import type { MedicalReport } from '../types';

const fila = (id: number, estado: string, extra: Record<string, unknown> = {}): InformeApiRow => ({
  id_informe: id, numero_informe: `INF-${id}`, estado, titulo: 'Hemograma', categoria: 'hematologia', id_orden: 7,
  fecha_muestra: '2026-10-01T08:00:00Z', fecha_creacion: '2026-10-01T09:00:00Z',
  hallazgos_clinicos: null, conclusiones_medico: 'Concl', explicacion_paciente: null, recomendaciones: ['Control'],
  codigo_verificacion: 'ABCDEFGHJKMNPQRS', hash_contenido: 'h'.repeat(64),
  datos_json: { patientId: '12', patientName: 'Ana Real', patientAge: '34 años', patientGender: 'F', parameters: [{ id: 'p1', name: 'Hb', value: 14 }] },
  ...extra
});
const local = (id: string, remoteId: number | undefined, status: MedicalReport['status']) => ({ id, remoteId, status, reportNumber: id } as MedicalReport);

describe('mapInformeApiToReport', () => {
  it('traduce columnas y datos_json sin inventar nada', () => {
    const r = mapInformeApiToReport(fila(3, 'publicado'));
    expect(r).toMatchObject({ remoteId: 3, reportNumber: 'INF-3', patientName: 'Ana Real', patientAge: 34, patientGender: 'F', status: 'publicado', orderId: 'ord-7', verificationCode: 'ABCDEFGHJKMNPQRS' });
    expect(r.parameters).toHaveLength(1);
    expect(r.clinicalFindings).toBe('');
    expect(r.patientExplanation).toBe('');
    expect(r.signature).toBeUndefined();
  });
  it('edad ilegible → 0 (no 35) y sexo desconocido → Otro', () => {
    const r = mapInformeApiToReport(fila(4, 'borrador', { datos_json: { patientAge: 'abc', patientGender: 'x' } }));
    expect(r.patientAge).toBe(0);
    expect(r.patientGender).toBe('Otro');
  });
  it('datos_json ausente no rompe', () => {
    expect(mapInformeApiToReport(fila(5, 'borrador', { datos_json: null })).parameters).toEqual([]);
  });
});

describe('combinarInformesRemotos', () => {
  it('agrega los que no existen y conserva los solo-locales', () => {
    const r = combinarInformesRemotos([local('rep-local', undefined, 'borrador')], [fila(1, 'publicado')]);
    expect(r.map((x) => x.id)).toEqual(['rep-srv-1', 'rep-local']);
  });
  it('un publicado del servidor reemplaza al local; un borrador local no se pisa', () => {
    const r = combinarInformesRemotos([local('a', 1, 'revision'), local('b', 2, 'borrador')], [fila(1, 'publicado'), fila(2, 'borrador')]);
    expect(r.find((x) => x.id === 'a')?.status).toBe('publicado');
    expect(r.find((x) => x.id === 'b')?.status).toBe('borrador');
    expect(r).toHaveLength(2);
  });
});
