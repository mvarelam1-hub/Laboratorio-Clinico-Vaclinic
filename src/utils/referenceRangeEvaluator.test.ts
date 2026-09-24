import { describe, it, expect } from 'vitest';
import {
  getAgeCategory,
  parseReferenceRange,
  evaluateParameterStatus,
  generateDemographicParametersForTests
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
  it('valor límite: un valor por debajo del 70% del mínimo es "critical"', () => {
    expect(evaluateParameterStatus(48, '70-100')).toBe('critical');
  });
  it('un valor apenas por encima del máximo es "high", no "critical"', () => {
    // max=100; 1.5*100=150 -> por encima de 150 es "critical"; entre 100 y 150 es "high"
    expect(evaluateParameterStatus(120, '70-100')).toBe('high');
  });
  it('valor límite: un valor por encima del 150% del máximo es "critical"', () => {
    expect(evaluateParameterStatus(151, '70-100')).toBe('critical');
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

/**
 * Módulo 3 (Resultados, "Diseñar el vínculo completo ahora"): estas pruebas
 * cubren el nuevo parámetro opcional `testCodes` de
 * generateDemographicParametersForTests, que etiqueta cada ReportParameter
 * generado con el `examCode` real del catálogo (examen.codigo_examen) que lo
 * originó. Esto es lo que permite después, en ClinicContext.tsx `addReport`,
 * agrupar los parámetros por examen real y enlazarlos con el
 * id_detalle_orden exacto que exige POST /api/resultados -antes de este
 * cambio no existía ningún campo que conectara un ReportParameter con un
 * examen real de la orden.
 */
describe('generateDemographicParametersForTests (vínculo con examCode)', () => {
  it('sin testCodes (retrocompatibilidad), ningún parámetro queda etiquetado con examCode', () => {
    const params = generateDemographicParametersForTests(['Glucosa en Ayunas'], 30, 'M');
    expect(params.length).toBeGreaterThan(0);
    expect(params.every(p => p.examCode === undefined)).toBe(true);
  });

  it('un test de un solo parámetro (glucosa) queda etiquetado con su examCode', () => {
    const params = generateDemographicParametersForTests(['Glucosa en Ayunas'], 30, 'M', undefined, ['GLU-001']);
    expect(params).toHaveLength(1);
    expect(params[0].examCode).toBe('GLU-001');
  });

  it('un test que explota en varios parámetros (hemograma) etiqueta TODOS sus sub-parámetros con el mismo examCode', () => {
    const params = generateDemographicParametersForTests(['Hemograma Completo'], 30, 'F', undefined, ['HEM-01']);
    expect(params.length).toBeGreaterThan(1);
    expect(params.every(p => p.examCode === 'HEM-01')).toBe(true);
  });

  it('con varios tests, cada grupo de parámetros recibe el examCode que le corresponde por posición', () => {
    const params = generateDemographicParametersForTests(
      ['Glucosa en Ayunas', 'Perfil Lipídico'],
      40,
      'M',
      undefined,
      ['GLU-001', 'LIP-01']
    );
    const glucosa = params.filter(p => p.name === 'Glucosa en Ayunas');
    const lipidicos = params.filter(p => p.name !== 'Glucosa en Ayunas');
    expect(glucosa.every(p => p.examCode === 'GLU-001')).toBe(true);
    expect(lipidicos.length).toBeGreaterThan(0);
    expect(lipidicos.every(p => p.examCode === 'LIP-01')).toBe(true);
  });

  it('si testCodes es más corto que testsList, los tests sin código correspondiente quedan sin examCode (no revienta)', () => {
    const params = generateDemographicParametersForTests(
      ['Glucosa en Ayunas', 'Ácido Úrico'],
      40,
      'M',
      undefined,
      ['GLU-001']
    );
    const glucosa = params.filter(p => p.name === 'Glucosa en Ayunas');
    const resto = params.filter(p => p.name !== 'Glucosa en Ayunas');
    expect(glucosa.every(p => p.examCode === 'GLU-001')).toBe(true);
    expect(resto.every(p => p.examCode === undefined)).toBe(true);
  });
});
