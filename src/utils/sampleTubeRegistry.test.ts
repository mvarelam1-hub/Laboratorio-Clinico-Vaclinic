import { describe, it, expect } from 'vitest';
import { FACTORY_CATALOG_TESTS } from '../data/factoryCatalog';
import { DEFAULT_VACLINIC_PROFILES } from './profileTestUtils';
import { analyzeTubesForParameters, parametrosParaTubos, ItemParaTubos } from './sampleTubeRegistry';

const tubosDe = (item: ItemParaTubos) =>
  analyzeTubesForParameters(parametrosParaTubos(item)).tubesGrouped.map((g) => g.tube.id);

const perfil = (code: string): ItemParaTubos => {
  const p = DEFAULT_VACLINIC_PROFILES.find((x) => x.code === code)!;
  return {
    name: p.name, code: p.code, category: '01_perfiles_paneles', categoryName: 'Perfiles Clínicos Personalizados',
    isProfile: true, includedParameters: p.testNames, basedOn: p.basedOn, description: p.description, sampleType: 'Múltiple según perfil'
  };
};
const examen = (code: string) => tubosDe(FACTORY_CATALOG_TESTS.find((t) => t.code === code) as any);

describe('contenedor correcto por examen y perfil', () => {
  it('EXAMEN DE HECES COMPLETA usa solo el frasco de heces (sin tubos de sangre)', () => {
    expect(tubosDe(perfil('PRF-COP'))).toEqual(['frasco_heces']);
  });
  it('EXAMEN DE ORINA COMPLETA usa solo el frasco de orina', () => {
    expect(tubosDe(perfil('PRF-EGO'))).toEqual(['frasco_orina']);
  });
  it('Hematología completa usa solo tubo lila', () => {
    expect(tubosDe(perfil('PRF-HEM'))).toEqual(['lila']);
  });
  it('Panel renal con orina pide tubo de suero + frasco de orina', () => {
    expect(tubosDe(perfil('PRF-REN-QUI'))).toEqual(['rojo_gel', 'frasco_orina']);
  });
  it('los exámenes de orina de la categoría Uroanálisis y Coprología ya no caen en heces', () => {
    for (const c of ['URO-01', 'URO-17', 'URO-32', 'URO-38', 'URO-22', 'URO-28', 'URO-33']) expect(examen(c)).toEqual(['frasco_orina']);
    for (const c of ['URO-13', 'URO-24', 'URO-34', 'URO-44', 'URO-19']) expect(examen(c)).toEqual(['frasco_heces']);
  });
  it('paquetes con sangre, orina y heces piden los tres', () => {
    expect(examen('PAQ-02')).toEqual(['rojo_gel', 'frasco_orina', 'frasco_heces']);
  });
  it('casos que antes caían en el tubo equivocado', () => {
    expect(examen('PAN-13')).toEqual(['celeste']);   // APTT
    expect(examen('HEM-18')).toEqual(['negro']);     // VSG
    expect(examen('INF-06')).toEqual(['rojo_gel']);  // Sífilis TP
    expect(examen('QUI-31')).toEqual(['rojo_gel']);  // LDH
    expect(examen('HEM-05')).toEqual(['rojo_gel']);  // Ferritina
    expect(examen('MIC-03')).toEqual(['frasco_urocultivo']);
  });
});
