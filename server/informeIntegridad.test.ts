import { describe, it, expect } from 'vitest';
import {
  generarCodigoVerificacion, esCodigoVerificacionValido, formatearCodigo, canonizar, compararCodigo,
  hashContenido, huellaCorta, enmascararNombre, InformeParaSello, LONGITUD_CODIGO
} from './informeIntegridad';

const base: InformeParaSello = {
  numero_informe: 'LAB-2026-0001', titulo: 'Perfil', categoria: 'hematologia', id_orden: 5,
  hallazgos_clinicos: null, conclusiones_medico: 'Normal', explicacion_paciente: null, recomendaciones: ['Control'],
  datos_json: {
    patientName: 'Ana Pérez', patientNationalId: '123', patientAge: 30, patientGender: 'F',
    parameters: [{ name: 'Hb', value: 14, unit: 'g/dL', referenceRange: '12-16', status: 'normal' }]
  },
  publicado_por_nombre: 'Dra. Demo', publicado_por_colegiado: 'COL-1'
};

describe('código de verificación', () => {
  it('tiene 16 caracteres del alfabeto sin ambiguos y es válido', () => {
    const c = generarCodigoVerificacion();
    expect(c).toHaveLength(LONGITUD_CODIGO);
    expect(esCodigoVerificacionValido(c)).toBe(true);
    expect(c).not.toMatch(/[01OIL]/);
  });
  it('no repite en 2000 emisiones', () => {
    expect(new Set(Array.from({ length: 2000 }, generarCodigoVerificacion)).size).toBe(2000);
  });
  it('rechaza formatos inválidos (inyección, longitud, minúsculas, no-string)', () => {
    for (const x of ['', 'abc', "ABCDEFGHJKMNPQR'", 'abcdefghjkmnpqrs', 'ABCDEFGHJKMNPQRST', 123, null, undefined, '<script>aaaaaaaa'])
      expect(esCodigoVerificacionValido(x)).toBe(false);
  });
  it('formatea en grupos de 4', () => {
    expect(formatearCodigo('ABCDEFGHJKMNPQRS')).toBe('ABCD-EFGH-JKMN-PQRS');
  });
});

describe('canonizar', () => {
  it('es independiente del orden de claves y descarta undefined', () => {
    expect(canonizar({ b: 1, a: { d: 2, c: undefined } })).toBe(canonizar({ a: { c: undefined, d: 2 }, b: 1 }));
    expect(canonizar({ a: undefined })).toBe('{}');
  });
  it('distingue tipos (1 vs "1") y orden de arreglos', () => {
    expect(canonizar({ a: 1 })).not.toBe(canonizar({ a: '1' }));
    expect(canonizar([1, 2])).not.toBe(canonizar([2, 1]));
  });
});

describe('hashContenido', () => {
  it('es estable y SHA-256 hex', () => {
    expect(hashContenido(base)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashContenido(base)).toBe(hashContenido(structuredClone(base)));
  });
  it('no depende del orden de claves del jsonb', () => {
    const d = { ...base.datos_json!, parameters: [{ status: 'normal', referenceRange: '12-16', unit: 'g/dL', value: 14, name: 'Hb' }] };
    expect(hashContenido({ ...base, datos_json: d })).toBe(hashContenido(base));
  });
  it('ignora campos volátiles/no clínicos de datos_json (firma, notas internas)', () => {
    const d = { ...base.datos_json!, signature: { hash: 'x' }, notesToStaff: 'interno' };
    expect(hashContenido({ ...base, datos_json: d })).toBe(hashContenido(base));
  });
  it.each([
    ['un valor', { ...base, datos_json: { ...base.datos_json!, parameters: [{ ...base.datos_json!.parameters[0], value: 15 }] } }],
    ['el rango', { ...base, datos_json: { ...base.datos_json!, parameters: [{ ...base.datos_json!.parameters[0], referenceRange: '10-16' }] } }],
    ['las conclusiones', { ...base, conclusiones_medico: 'Anemia' }],
    ['las recomendaciones', { ...base, recomendaciones: [] }],
    ['el nombre del paciente', { ...base, datos_json: { ...base.datos_json!, patientName: 'Otra Persona' } }],
    ['el número de informe', { ...base, numero_informe: 'LAB-2026-0002' }],
    ['quien publicó', { ...base, publicado_por_nombre: 'Otro' }],
    ['el colegiado', { ...base, publicado_por_colegiado: 'COL-9' }],
    ['un parámetro extra', { ...base, datos_json: { ...base.datos_json!, parameters: [...base.datos_json!.parameters, { name: 'X', value: 1 }] } }]
  ])('cambia si cambia %s', (_n, alterado) => {
    expect(hashContenido(alterado as InformeParaSello)).not.toBe(hashContenido(base));
  });
});

describe('presentación', () => {
  it('huellaCorta agrupa 16 hex en mayúsculas', () => {
    expect(huellaCorta('a1b2c3d4e5f60718' + '0'.repeat(48))).toBe('A1B2-C3D4-E5F6-0718');
  });
  it('enmascara el nombre sin revelar letras tras la inicial', () => {
    const m = enmascararNombre('María Fernanda López');
    expect(m).toBe('M**** F****** L****');
    expect(m).not.toMatch(/aría|ernanda|ópez/);
    expect(enmascararNombre(null)).toBe('—');
  });
});

// Remediacion Sonar S2871 (E12): el orden de claves del sello debe seguir siendo el de sort() sin
// argumentos (unidades de codigo), independiente del idioma; si cambiara, los sellos ya emitidos
// dejarian de verificarse.
describe('compararCodigo (orden canonico del sello)', () => {
  it('ordena igual que sort() sin comparador, incluso con mayusculas y acentos', () => {
    const claves = ['b', 'Z', 'a', 'ñ', 'A', 'é', '_x', '10', '2'];
    expect([...claves].sort(compararCodigo)).toEqual([...claves].sort());
  });

  it('canonizar mantiene el mismo texto para el mismo objeto con claves en otro orden', () => {
    expect(canonizar({ b: 1, a: { d: 2, c: 3 } })).toBe(canonizar({ a: { c: 3, d: 2 }, b: 1 }));
    expect(canonizar({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });
});
