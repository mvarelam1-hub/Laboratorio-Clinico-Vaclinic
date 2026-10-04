import { parametrosDeExamenes } from './parametrosDeExamen';
import { describe, it, expect } from 'vitest';
import {
  getAgeCategory,
  parseReferenceRange,
  evaluateParameterStatus,
  evaluateParameterDetailed,
  resolveAgeSexReferenceRange
} from './referenceRangeEvaluator';

/**
 * E10 (ACS, Fase 2) — pruebas unitarias de FRONTEND (requisito "distribuidas
 * entre backend y frontend"). Funciones puras de src/utils/referenceRangeEvaluator.ts,
 * sin DOM ni dependencias externas. Técnicas: partición de equivalencia y
 * análisis de valores límite sobre los umbrales clínicos reales del código
 * (0.7x para "crítico bajo", 1.5x para "crítico alto", cortes de edad en
 * 1, 13, 18 y 65 años).
 */
describe('getAgeCategory', () => {
  it('edad indefinida se clasifica como adulto (valor por defecto)', () => {
    expect(getAgeCategory(undefined)).toBe('adulto');
  });
  it('valor límite: 1 año es neonato', () => {
    expect(getAgeCategory(1)).toBe('neonato');
  });
  it('valor límite: 2 años ya no es neonato, es pediátrico', () => {
    expect(getAgeCategory(2)).toBe('pediatrico');
  });
  it('valor límite: 12 años es pediátrico', () => {
    expect(getAgeCategory(12)).toBe('pediatrico');
  });
  it('valor límite: 13 años es adolescente', () => {
    expect(getAgeCategory(13)).toBe('adolescente');
  });
  it('valor límite: 17 años es adolescente', () => {
    expect(getAgeCategory(17)).toBe('adolescente');
  });
  it('valor límite: 18 años es adulto', () => {
    expect(getAgeCategory(18)).toBe('adulto');
  });
  it('valor límite: 64 años es adulto', () => {
    expect(getAgeCategory(64)).toBe('adulto');
  });
  it('valor límite: 65 años es geriátrico', () => {
    expect(getAgeCategory(65)).toBe('geriatrico');
  });
});

describe('parseReferenceRange', () => {
  it('reconoce un rango numérico simple "70 - 100"', () => {
    expect(parseReferenceRange('70 - 100')).toEqual({ min: 70, max: 100 });
  });
  it('reconoce un rango con guion largo y sin espacios "70–100"', () => {
    expect(parseReferenceRange('70–100')).toEqual({ min: 70, max: 100 });
  });
  it('reconoce un límite superior "< 200"', () => {
    expect(parseReferenceRange('< 200')).toEqual({ min: 0, max: 200 });
  });
  it('reconoce un límite inferior "> 50"', () => {
    expect(parseReferenceRange('> 50')).toEqual({ min: 50 });
  });
  it('reconoce un valor cualitativo ("Negativo") sin límites numéricos', () => {
    expect(parseReferenceRange('Negativo')).toEqual({ isQualitative: true });
  });
  it('una cadena vacía no produce límites', () => {
    expect(parseReferenceRange('')).toEqual({});
  });
});

describe('evaluateParameterStatus', () => {
  it('un valor vacío se considera "normal" (no evaluable)', () => {
    expect(evaluateParameterStatus('', '70-100')).toBe('normal');
  });
  it('un valor dentro del rango es "normal"', () => {
    expect(evaluateParameterStatus(85, '70-100')).toBe('normal');
  });
  it('un valor apenas por debajo del mínimo es "low", no "critical"', () => {
    // min=70; 0.7*70=49 -> por debajo de 49 es "critical"; entre 49 y 70 es "low"
    expect(evaluateParameterStatus(65, '70-100')).toBe('low');
  });
  it('un valor muy por debajo del mínimo sigue siendo "low" (crítico solo por valor de pánico)', () => {
    expect(evaluateParameterStatus(48, '70-100')).toBe('low');
  });
  it('un valor apenas por encima del máximo es "high", no "critical"', () => {
    // max=100; 1.5*100=150 -> por encima de 150 es "critical"; entre 100 y 150 es "high"
    expect(evaluateParameterStatus(120, '70-100')).toBe('high');
  });
  it('un valor muy por encima del máximo sigue siendo "high" (crítico solo por valor de pánico)', () => {
    expect(evaluateParameterStatus(151, '70-100')).toBe('high');
  });
  it('un valor cualitativo "Positivo" contra un rango "Negativo" es "high"', () => {
    expect(evaluateParameterStatus('Positivo', 'Negativo')).toBe('high');
  });
  it('un valor cualitativo "Negativo" siempre es "normal"', () => {
    expect(evaluateParameterStatus('Negativo', 'Negativo')).toBe('normal');
  });
  it('customMin/customMax tienen prioridad sobre el texto del rango', () => {
    expect(evaluateParameterStatus(15, 'esto no se puede parsear', 10, 20)).toBe('normal');
  });
});

describe('Severidad y borradores (Fase 11/14)', () => {
  it('LDL 142 con referencia < 100 es elevado, NO crítico', () => {
    const r = evaluateParameterDetailed('142', '< 100 mg/dL', undefined, undefined, undefined, { patientAge: 40, patientGender: 'M', parameterName: 'Colesterol LDL' });
    expect(r.isOutOfRange).toBe(true);
    expect(r.isCritical).toBe(false);
    expect(r.status).toBe('high');
  });

  it('una desviación grande sin valor de pánico definido sigue siendo solo elevada', () => {
    const r = evaluateParameterDetailed('90', '10 - 40 U/L', 10, 40);
    expect(r.isCritical).toBe(false);
    expect(r.status).toBe('high');
  });

  it('un valor de pánico definido (glucosa 30 mg/dL) sí es crítico', () => {
    const r = evaluateParameterDetailed('30', '70 - 100 mg/dL', undefined, undefined, undefined, { patientAge: 35, patientGender: 'M', parameterName: 'Glucosa en Ayunas' });
    expect(r.isCritical).toBe(true);
  });

  it('lo marcado como crítico por el personal se respeta', () => {
    const r = evaluateParameterDetailed('120', '70 - 100 mg/dL', 70, 100, 'critical');
    expect(r.isCritical).toBe(true);
  });

  it('"Colesterol LDL" y "Colesterol VLDL" usan su propio rango, no el del colesterol total', () => {
    const ldl = resolveAgeSexReferenceRange('Colesterol LDL', '', 40, 'M', undefined, true);
    const vldl = resolveAgeSexReferenceRange('Colesterol VLDL', '', 40, 'M', undefined, true);
    const total = resolveAgeSexReferenceRange('Colesterol Total', '', 40, 'M', undefined, true);
    expect(ldl.max).toBe(100);
    expect(vldl.max).toBe(30);
    expect(total.max).toBe(200);
  });

  it('el borrador generado desde una orden NO trae resultados de ejemplo precargados', () => {
    const tests = ['Hematología Completa (Hemograma Completo / BHC)', 'Creatinina (CREA)', 'Glucosa en Ayunas', 'Hormona X'];
    const params = parametrosDeExamenes(tests, 40, 'F');
    expect(params.length).toBeGreaterThan(5);
    expect(params.every(p => p.value === '')).toBe(true);
  });
});
