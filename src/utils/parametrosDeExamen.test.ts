import { describe, it, expect } from 'vitest';
import { parametrosDeExamenes, buscarExamen, componentesDePerfil } from './parametrosDeExamen';
import { evaluateParameterDetailed } from './referenceRangeEvaluator';
import { FACTORY_CATALOG_TESTS } from '../data/factoryCatalog';

const cat = FACTORY_CATALOG_TESTS;
const HEM = 'Hematología Completa (Hemograma Completo / BHC)';
const EGO = 'Orina Completa (Examen General de Orina - EGO)';

describe('parametrosDeExamenes (generador basado en el catálogo)', () => {
  it('un examen individual da exactamente una fila, con unidad y rango del catálogo', () => {
    const p = parametrosDeExamenes(['Glucosa en Ayunas'], 30, 'M', cat, ['QUI-27']);
    expect(p).toHaveLength(1);
    expect(p[0].unit).toBe('mg/dL');
    expect(p[0].examCode).toBe('QUI-27');
    expect(p[0].value).toBe('');
  });

  it('un perfil se expande a TODOS sus componentes y los etiqueta con el código del perfil', () => {
    const p = parametrosDeExamenes([HEM], 30, 'F', cat, ['HEM-10']);
    expect(p.length).toBe(15);
    expect(p.every((x) => x.examCode === 'HEM-10')).toBe(true);
    expect(p.map((x) => x.name)).toContain('Hemoglobina (Hb)');
    expect(p.map((x) => x.name)).toContain('Recuento de Plaquetas (Trombocitos)');
  });

  it('el EGO se expande a sus componentes físico-químicos y microscópicos', () => {
    const p = parametrosDeExamenes([EGO], 30, 'F', cat, ['URO-33']);
    expect(p.length).toBeGreaterThanOrEqual(20);
    expect(p.map((x) => x.name.toLowerCase())).toEqual(expect.arrayContaining(['color', 'aspecto', 'nitritos']));
  });

  it('no agrega exámenes que no se pidieron', () => {
    const p = parametrosDeExamenes(['Glucosa en Ayunas', 'Creatinina (CREA)'], 40, 'M', cat, ['QUI-27', 'QUI-21']);
    expect(p).toHaveLength(2);
  });

  it('un examen desconocido queda como una fila vacía, sin unidad ni rango inventados', () => {
    const p = parametrosDeExamenes(['Hormona X'], 40, 'F', cat);
    expect(p).toHaveLength(1);
    expect(p[0].unit).toBe('');
    expect(p[0].referenceRange).toBe('');
    expect(p[0].examCode).toBeUndefined();
  });

  it('los componentes cualitativos no traen unidad ni rango numérico inventados', () => {
    const p = parametrosDeExamenes([EGO], 30, 'F', cat, ['URO-33']);
    const color = p.find((x) => x.name === 'COLOR')!;
    expect(color.unit).toBe('');
    expect(color.referenceRange).toBe('');
  });

  it('un componente no hereda el rango de otro analito por compartir una palabra', () => {
    const p = parametrosDeExamenes([HEM, EGO], 30, 'F', cat, ['HEM-10', 'URO-33']);
    const hcm = p.find((x) => x.name.startsWith('Hemoglobina Corpuscular Media'))!;
    expect(hcm.referenceRange).toBe('27-33');
    const glucosaOrina = p.find((x) => x.name.startsWith('Glucosa (Químico Orina)'))!;
    expect(glucosaOrina.referenceRange).not.toMatch(/70/);
    const hbOrina = p.find((x) => x.name === 'Sangre/Hemoglobina')!;
    expect(hbOrina.referenceRange).toBe('');
  });

  it('con edad y sexo conocidos, la hemoglobina usa su norma demográfica', () => {
    const f = parametrosDeExamenes(['Hemoglobina (Hb)'], 30, 'F', cat, ['HEM-11'])[0];
    const m = parametrosDeExamenes(['Hemoglobina (Hb)'], 30, 'M', cat, ['HEM-11'])[0];
    expect(f.maxVal).toBeLessThan(m.maxVal as number);
  });

  it('con edad o sexo desconocidos NO se aplica la norma de un adulto varón: se usa el rango del catálogo', () => {
    const p = parametrosDeExamenes(['Hemoglobina (Hb)'], undefined, undefined, cat, ['HEM-11'])[0];
    expect(p.referenceRange).toBe('12-16');
    expect(p.notes).toBeUndefined();
  });

  it('leucocitos y plaquetas usan la misma escala (x10³/µL) que la unidad del catálogo, sin falsos críticos', () => {
    const [wbc, plt] = parametrosDeExamenes(['Glóbulos Blancos (Leucocitos Totales)', 'Recuento de Plaquetas (Trombocitos)'], 30, 'F', cat, ['HEM-06', 'HEM-16']);
    expect(wbc.unit).toBe('x10³/µL');
    expect(wbc.maxVal).toBeLessThan(100);
    const leve = evaluateParameterDetailed('3.2', wbc.referenceRange, wbc.minVal, wbc.maxVal, undefined, { patientAge: 30, patientGender: 'F', parameterName: wbc.name });
    expect(leve.status).toBe('low');
    expect(leve.isCritical).toBe(false);
    const grave = evaluateParameterDetailed('1.5', wbc.referenceRange, wbc.minVal, wbc.maxVal, undefined, { patientAge: 30, patientGender: 'F', parameterName: wbc.name });
    expect(grave.isCritical).toBe(true);
    const normal = evaluateParameterDetailed('250', plt.referenceRange, plt.minVal, plt.maxVal, undefined, { patientAge: 30, patientGender: 'F', parameterName: plt.name });
    expect(normal.status).toBe('normal');
  });

  it('con varios exámenes cada grupo recibe el examCode que le corresponde por posición', () => {
    const p = parametrosDeExamenes(['Glucosa en Ayunas', HEM], 40, 'M', cat, ['QUI-27', 'HEM-10']);
    expect(p.filter((x) => x.examCode === 'QUI-27')).toHaveLength(1);
    expect(p.filter((x) => x.examCode === 'HEM-10')).toHaveLength(15);
  });

  it('si testCodes es más corto, los exámenes sin código quedan etiquetados por su coincidencia exacta en el catálogo o sin etiqueta', () => {
    const p = parametrosDeExamenes(['Glucosa en Ayunas', 'Hormona X'], 40, 'M', cat, ['QUI-27']);
    expect(p[0].examCode).toBe('QUI-27');
    expect(p[1].examCode).toBeUndefined();
  });
});

describe('composición de perfiles', () => {
  it('buscarExamen es estricto: no resuelve por "contiene"', () => {
    expect(buscarExamen('Glucosa', cat)).toBeUndefined();
    expect(buscarExamen('QUI-27', cat)?.name).toBe('Glucosa en Ayunas');
  });

  it('todo componente declarado en COMPOSICION_POR_CODIGO existe en el catálogo', () => {
    for (const code of ['HEM-10', 'URO-33', 'URO-24', 'URO-34']) {
      const item = cat.find((c) => c.code === code)!;
      const comps = componentesDePerfil(item, cat);
      expect(comps.length).toBeGreaterThan(0);
      expect(comps.every((c) => !!c.examen)).toBe(true);
    }
  });
});
