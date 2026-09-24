import { LabCatalogItem, LabCustomProfile, ProfileTestItem } from '../types';

/**
 * Parses min and max from standard range strings like "70 - 110 mg/dL", "13.0 - 17.5", etc.
 */
export function extractMinMaxFromRange(rangeStr?: string): { min: string; max: string } {
  if (!rangeStr) return { min: '', max: '' };
  const clean = rangeStr.replace(/[^\d.-]/g, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { min: parts[0], max: parts[1] };
  }
  if (parts.length === 1) {
    return { min: '0', max: parts[0] };
  }
  return { min: '', max: '' };
}

/**
 * Builds a ProfileTestItem from a LabCatalogItem
 */
export function buildProfileTestFromCatalog(
  catalogItem: LabCatalogItem,
  customOverrides?: Partial<ProfileTestItem>
): ProfileTestItem {
  const { min, max } = extractMinMaxFromRange(catalogItem.referenceRange);

  return {
    id: `ptest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    catalogTestId: catalogItem.id,
    name: catalogItem.name,
    code: catalogItem.code || '',
    resultType: catalogItem.resultType || 'Numérico',
    methodology: catalogItem.methodology || '',
    minRange: min || '',
    maxRange: max || '',
    unit: catalogItem.unit || '',
    referenceRange: catalogItem.referenceRange || '',
    ageGenderRanges: [],
    observations: catalogItem.clinicalSignificance || '',
    isRequired: true,
    status: 'Activa',
    ...customOverrides
  };
}

/**
 * Ensures that a profile has its structured `tests` array populated.
 * If tests is empty or undefined, generates them from testNames or testIds or catalog lookup.
 */
export function ensureProfileTests(
  profile: LabCustomProfile,
  catalogTests: LabCatalogItem[]
): ProfileTestItem[] {
  if (profile.tests && profile.tests.length > 0) {
    return profile.tests;
  }

  const catalogMapById = new Map(catalogTests.map(t => [t.id, t]));
  const catalogMapByName = new Map(catalogTests.map(t => [t.name.toLowerCase().trim(), t]));

  const result: ProfileTestItem[] = [];

  // Try from testIds
  if (profile.testIds && profile.testIds.length > 0) {
    profile.testIds.forEach(id => {
      const item = catalogMapById.get(id);
      if (item) {
        result.push(buildProfileTestFromCatalog(item));
      }
    });
  }

  // If still empty or testNames has items
  if (result.length === 0 && profile.testNames && profile.testNames.length > 0) {
    profile.testNames.forEach(name => {
      const found = catalogMapByName.get(name.toLowerCase().trim());
      if (found) {
        result.push(buildProfileTestFromCatalog(found));
      } else {
        result.push({
          id: `ptest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name,
          resultType: 'Numérico',
          status: 'Activa',
          isRequired: true
        });
      }
    });
  }

  return result;
}

/**
 * 10 Official VACLINIC Custom Laboratory Profiles matching clinical reality
 */
export const DEFAULT_VACLINIC_PROFILES: LabCustomProfile[] = [
  {
    id: 'prof-ego',
    code: 'PRF-EGO',
    name: 'EXAMEN DE ORINA COMPLETA',
    categoryName: 'Perfiles Clínicos Personalizados',
    price: 30,
    priceFormatted: 'Q30.00',
    regularPrice: 45,
    description: 'Examen físico, químico y microscópico completo del sedimento urinario.',
    basedOn: 'Orina Completa (Examen General de Orina - EGO)',
    status: 'Activo',
    createdAt: '2026-09-05T08:00:00.000Z',
    createdBy: 'Administrador VACLINIC',
    testIds: [],
    testNames: [
      'Color', 'Aspecto', 'Densidad', 'pH', 'Leucocitos Esterasa', 'Nitritos', 'Proteínas', 'Glucosa', 
      'Cuerpos Cetónicos', 'Urobilinógeno', 'Bilirrubina', 'Sangre Oculta / Hemoglobina',
      'Células Epiteliales', 'Leucocitos por campo', 'Hematíes por campo', 'Cilindros', 
      'Cristales', 'Bacterias', 'Mucus', 'Levaduras', 'Parásitos'
    ],
    tests: [
      { id: 'pt-ego-01', name: 'Color', resultType: 'Texto', unit: '', referenceRange: 'Amarillo', status: 'Activa', isRequired: true },
      { id: 'pt-ego-02', name: 'Aspecto', resultType: 'Texto', unit: '', referenceRange: 'Límpido', status: 'Activa', isRequired: true },
      { id: 'pt-ego-03', name: 'Densidad', resultType: 'Numérico', minRange: '1.005', maxRange: '1.030', unit: '', referenceRange: '1.005 - 1.030', status: 'Activa', isRequired: true },
      { id: 'pt-ego-04', name: 'pH Urinario', resultType: 'Numérico', minRange: '5.0', maxRange: '7.5', unit: '', referenceRange: '5.0 - 7.5', status: 'Activa', isRequired: true },
      { id: 'pt-ego-05', name: 'Leucocitos Esterasa', resultType: 'Texto', unit: '', referenceRange: 'Negativo', status: 'Activa', isRequired: true },
      { id: 'pt-ego-06', name: 'Nitritos', resultType: 'Texto', unit: '', referenceRange: 'Negativo', status: 'Activa', isRequired: true },
      { id: 'pt-ego-07', name: 'Proteínas', resultType: 'Texto', unit: '', referenceRange: 'Negativo', status: 'Activa', isRequired: true },
      { id: 'pt-ego-08', name: 'Glucosa', resultType: 'Texto', unit: '', referenceRange: 'Normal / Negativo', status: 'Activa', isRequired: true },
      { id: 'pt-ego-09', name: 'Cuerpos Cetónicos', resultType: 'Texto', unit: '', referenceRange: 'Negativo', status: 'Activa', isRequired: true },
      { id: 'pt-ego-10', name: 'Urobilinógeno', resultType: 'Texto', unit: '', referenceRange: 'Normal (< 1 mg/dL)', status: 'Activa', isRequired: true },
      { id: 'pt-ego-11', name: 'Bilirrubina', resultType: 'Texto', unit: '', referenceRange: 'Negativo', status: 'Activa', isRequired: true },
      { id: 'pt-ego-12', name: 'Sangre Oculta / Hemoglobina', resultType: 'Texto', unit: '', referenceRange: 'Negativo', status: 'Activa', isRequired: true },
      { id: 'pt-ego-13', name: 'Células Epiteliales', resultType: 'Texto', unit: '', referenceRange: 'Escasas', status: 'Activa', isRequired: true },
      { id: 'pt-ego-14', name: 'Leucocitos por campo', resultType: 'Texto', unit: 'x campo', referenceRange: '0 - 4 por campo', status: 'Activa', isRequired: true },
      { id: 'pt-ego-15', name: 'Hematíes por campo', resultType: 'Texto', unit: 'x campo', referenceRange: '0 - 2 por campo', status: 'Activa', isRequired: true },
      { id: 'pt-ego-16', name: 'Cilindros', resultType: 'Texto', unit: '', referenceRange: 'No se observan', status: 'Activa', isRequired: true },
      { id: 'pt-ego-17', name: 'Cristales', resultType: 'Texto', unit: '', referenceRange: 'Escasos o ausentes', status: 'Activa', isRequired: true },
      { id: 'pt-ego-18', name: 'Bacterias', resultType: 'Texto', unit: '', referenceRange: 'Escasas o ausentes', status: 'Activa', isRequired: true },
      { id: 'pt-ego-19', name: 'Mucus', resultType: 'Texto', unit: '', referenceRange: 'Escaso', status: 'Activa', isRequired: true },
      { id: 'pt-ego-20', name: 'Levaduras', resultType: 'Texto', unit: '', referenceRange: 'No se observan', status: 'Activa', isRequired: true },
      { id: 'pt-ego-21', name: 'Parásitos', resultType: 'Texto', unit: '', referenceRange: 'No se observan', status: 'Activa', isRequired: true }
    ]
  },
  {
    id: 'prof-hemato',
    code: 'PRF-HEM',
    name: 'HEMATOLOGIA COMPLETA',
    categoryName: 'Perfiles Clínicos Personalizados',
    price: 70,
    priceFormatted: 'Q70.00',
    regularPrice: 95,
    description: 'Biometría hemática completa con diferencial de 5 partes, índices eritrocitarios y plaquetas.',
    basedOn: 'Hematología Completa (Hemograma Completo / BHC)',
    status: 'Activo',
    createdAt: '2026-09-05T08:30:00.000Z',
    createdBy: 'Administrador VACLINIC',
    testIds: [],
    testNames: [
      'Glóbulos Blancos (WBC)', 'Glóbulos Rojos (RBC)', 'Hemoglobina (HGB)', 'Hematocrito (HCT)',
      'Volumen Corpuscular Medio (VCM)', 'Hemoglobina Corpuscular Media (HCM)', 'Conc. Media Hemoglobina (CHCM)',
      'RDW-CV', 'Plaquetas (PLT)', 'Volumen Plaquetario Medio (VMP)', 'Neutrófilos %',
      'Linfocitos %', 'Monocitos %', 'Eosinófilos %', 'Basófilos %', 'Neutrófilos Absolutos'
    ],
    tests: [
      { id: 'pt-hem-01', name: 'Glóbulos Blancos (WBC)', resultType: 'Numérico', minRange: '4.5', maxRange: '11.0', unit: '10^3/µL', referenceRange: '4.5 - 11.0 10^3/µL', status: 'Activa', isRequired: true },
      { id: 'pt-hem-02', name: 'Glóbulos Rojos (RBC)', resultType: 'Numérico', minRange: '4.0', maxRange: '5.5', unit: '10^6/µL', referenceRange: '4.0 - 5.5 10^6/µL', status: 'Activa', isRequired: true },
      { id: 'pt-hem-03', name: 'Hemoglobina (HGB)', resultType: 'Numérico', minRange: '12.0', maxRange: '16.5', unit: 'g/dL', referenceRange: '12.0 - 16.5 g/dL', status: 'Activa', isRequired: true },
      { id: 'pt-hem-04', name: 'Hematocrito (HCT)', resultType: 'Numérico', minRange: '36.0', maxRange: '50.0', unit: '%', referenceRange: '36.0 - 50.0 %', status: 'Activa', isRequired: true },
      { id: 'pt-hem-05', name: 'Volumen Corpuscular Medio (VCM)', resultType: 'Numérico', minRange: '80.0', maxRange: '100.0', unit: 'fL', referenceRange: '80.0 - 100.0 fL', status: 'Activa', isRequired: true },
      { id: 'pt-hem-06', name: 'Hemoglobina Corpuscular Media (HCM)', resultType: 'Numérico', minRange: '27.0', maxRange: '32.0', unit: 'pg', referenceRange: '27.0 - 32.0 pg', status: 'Activa', isRequired: true },
      { id: 'pt-hem-07', name: 'Conc. Media Hemoglobina (CHCM)', resultType: 'Numérico', minRange: '32.0', maxRange: '36.0', unit: 'g/dL', referenceRange: '32.0 - 36.0 g/dL', status: 'Activa', isRequired: true },
      { id: 'pt-hem-08', name: 'RDW-CV', resultType: 'Numérico', minRange: '11.5', maxRange: '14.5', unit: '%', referenceRange: '11.5 - 14.5 %', status: 'Activa', isRequired: true },
      { id: 'pt-hem-09', name: 'Plaquetas (PLT)', resultType: 'Numérico', minRange: '150', maxRange: '450', unit: '10^3/µL', referenceRange: '150 - 450 10^3/µL', status: 'Activa', isRequired: true },
      { id: 'pt-hem-10', name: 'Volumen Plaquetario Medio (VMP)', resultType: 'Numérico', minRange: '7.0', maxRange: '11.0', unit: 'fL', referenceRange: '7.0 - 11.0 fL', status: 'Activa', isRequired: true },
      { id: 'pt-hem-11', name: 'Neutrófilos %', resultType: 'Numérico', minRange: '45.0', maxRange: '70.0', unit: '%', referenceRange: '45.0 - 70.0 %', status: 'Activa', isRequired: true },
      { id: 'pt-hem-12', name: 'Linfocitos %', resultType: 'Numérico', minRange: '20.0', maxRange: '40.0', unit: '%', referenceRange: '20.0 - 40.0 %', status: 'Activa', isRequired: true },
      { id: 'pt-hem-13', name: 'Monocitos %', resultType: 'Numérico', minRange: '2.0', maxRange: '10.0', unit: '%', referenceRange: '2.0 - 10.0 %', status: 'Activa', isRequired: true },
      { id: 'pt-hem-14', name: 'Eosinófilos %', resultType: 'Numérico', minRange: '1.0', maxRange: '5.0', unit: '%', referenceRange: '1.0 - 5.0 %', status: 'Activa', isRequired: true },
      { id: 'pt-hem-15', name: 'Basófilos %', resultType: 'Numérico', minRange: '0.0', maxRange: '2.0', unit: '%', referenceRange: '0.0 - 2.0 %', status: 'Activa', isRequired: true },
      { id: 'pt-hem-16', name: 'Neutrófilos Absolutos', resultType: 'Numérico', minRange: '1.8', maxRange: '7.7', unit: '10^3/µL', referenceRange: '1.8 - 7.7 10^3/µL', status: 'Activa', isRequired: true }
    ]
  },
  {
    id: 'prof-heces',
    code: 'PRF-COP',
    name: 'EXAMEN DE HECES COMPLETA',
    categoryName: 'Perfiles Clínicos Personalizados',
    price: 30,
    priceFormatted: 'Q30.00',
    regularPrice: 40,
    description: 'Coproanálisis físico, químico y microscópico parasitológico directo.',
    basedOn: 'Heces Completa (Coproanálisis General)',
    status: 'Activo',
    createdAt: '2026-09-05T09:00:00.000Z',
    createdBy: 'Administrador VACLINIC',
    testIds: [],
    testNames: [
      'Color', 'Consistencia', 'Moco', 'Sangre Macroscópica', 'pH Fecal', 'Restos Alimenticios',
      'Almidones', 'Grasas Neutras', 'Fibras Musculares', 'Leucocitos Fecales', 'Hematíes Fecales',
      'Quistes de Giardia lamblia', 'Quistes de Entamoeba histolytica/dispar', 'Quistes de Entamoeba coli',
      'Trofozoítos', 'Huevos de Helmintos', 'Larvas', 'Levaduras', 'Flora Bacteriana'
    ],
    tests: [
      { id: 'pt-cop-01', name: 'Color', resultType: 'Texto', referenceRange: 'Pardo / Café', status: 'Activa', isRequired: true },
      { id: 'pt-cop-02', name: 'Consistencia', resultType: 'Texto', referenceRange: 'Pastosa / Formada', status: 'Activa', isRequired: true },
      { id: 'pt-cop-03', name: 'Moco', resultType: 'Texto', referenceRange: 'Negativo', status: 'Activa', isRequired: true },
      { id: 'pt-cop-04', name: 'Sangre Macroscópica', resultType: 'Texto', referenceRange: 'Negativo', status: 'Activa', isRequired: true },
      { id: 'pt-cop-05', name: 'pH Fecal', resultType: 'Numérico', minRange: '6.8', maxRange: '7.5', referenceRange: '6.8 - 7.5', status: 'Activa', isRequired: true },
      { id: 'pt-cop-06', name: 'Restos Alimenticios', resultType: 'Texto', referenceRange: 'Escasos', status: 'Activa', isRequired: true },
      { id: 'pt-cop-07', name: 'Almidones', resultType: 'Texto', referenceRange: 'Escasos o Ausentes', status: 'Activa', isRequired: true },
      { id: 'pt-cop-08', name: 'Grasas Neutras', resultType: 'Texto', referenceRange: 'Escasas o Ausentes', status: 'Activa', isRequired: true },
      { id: 'pt-cop-09', name: 'Fibras Musculares', resultType: 'Texto', referenceRange: 'Escasas', status: 'Activa', isRequired: true },
      { id: 'pt-cop-10', name: 'Leucocitos Fecales', resultType: 'Texto', referenceRange: '0 - 2 por campo', status: 'Activa', isRequired: true },
      { id: 'pt-cop-11', name: 'Hematíes Fecales', resultType: 'Texto', referenceRange: 'No se observan', status: 'Activa', isRequired: true },
      { id: 'pt-cop-12', name: 'Quistes de Giardia lamblia', resultType: 'Texto', referenceRange: 'No se observan', status: 'Activa', isRequired: true },
      { id: 'pt-cop-13', name: 'Quistes de Entamoeba histolytica/dispar', resultType: 'Texto', referenceRange: 'No se observan', status: 'Activa', isRequired: true },
      { id: 'pt-cop-14', name: 'Quistes de Entamoeba coli', resultType: 'Texto', referenceRange: 'No se observan', status: 'Activa', isRequired: true },
      { id: 'pt-cop-15', name: 'Trofozoítos', resultType: 'Texto', referenceRange: 'No se observan', status: 'Activa', isRequired: true },
      { id: 'pt-cop-16', name: 'Huevos de Helmintos', resultType: 'Texto', referenceRange: 'No se observan', status: 'Activa', isRequired: true },
      { id: 'pt-cop-17', name: 'Larvas', resultType: 'Texto', referenceRange: 'No se observan', status: 'Activa', isRequired: true },
      { id: 'pt-cop-18', name: 'Levaduras', resultType: 'Texto', referenceRange: 'Escasas o ausentes', status: 'Activa', isRequired: true },
      { id: 'pt-cop-19', name: 'Flora Bacteriana', resultType: 'Texto', referenceRange: 'Normal / Abundante', status: 'Activa', isRequired: true }
    ]
  },
  {
    id: 'prof-qui-bas',
    code: 'PRF-QUI-BAS',
    name: 'PANEL BASICO QUIMICA SANGUINEA Y HEPATICO',
    categoryName: 'Perfiles Clínicos Personalizados',
    price: 200,
    priceFormatted: 'Q200.00',
    regularPrice: 280,
    description: 'Perfil bioquímico esencial de 13 pruebas metabólicas, renales, hepáticas y lipídicas.',
    basedOn: 'PANEL GENERAL 3 (Panel General Básico de Química Sanguínea)',
    status: 'Activo',
    createdAt: '2026-09-05T09:30:00.000Z',
    createdBy: 'Administrador VACLINIC',
    testIds: [],
    testNames: [
      'Glucosa Pre (GLU)', 'Creatinina (CREA)', 'Urea (BUN)', 'Ácido Úrico', 'Colesterol Total',
      'Triglicéridos', 'Colesterol HDL', 'Colesterol LDL', 'Bilirrubina Total', 'TGO / AST',
      'TGP / ALT', 'Fosfatasa Alcalina (ALP)', 'Proteínas Totales'
    ],
    tests: [
      { id: 'pt-qb-01', name: 'Glucosa Pre (GLU)', resultType: 'Numérico', minRange: '70', maxRange: '110', unit: 'mg/dL.', referenceRange: '70 - 110 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-qb-02', name: 'Creatinina (CREA)', resultType: 'Numérico', minRange: '0.70', maxRange: '1.30', unit: 'mg/dL.', referenceRange: '0.70 - 1.30 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-qb-03', name: 'Urea (BUN)', resultType: 'Numérico', minRange: '15', maxRange: '45', unit: 'mg/dL.', referenceRange: '15 - 45 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-qb-04', name: 'Ácido Úrico', resultType: 'Numérico', minRange: '3.5', maxRange: '7.2', unit: 'mg/dL.', referenceRange: '3.5 - 7.2 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-qb-05', name: 'Colesterol Total', resultType: 'Numérico', minRange: '100', maxRange: '200', unit: 'mg/dL.', referenceRange: '100 - 200 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-qb-06', name: 'Triglicéridos', resultType: 'Numérico', minRange: '50', maxRange: '150', unit: 'mg/dL.', referenceRange: '50 - 150 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-qb-07', name: 'Colesterol HDL', resultType: 'Numérico', minRange: '40', maxRange: '60', unit: 'mg/dL.', referenceRange: '40 - 60 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-qb-08', name: 'Colesterol LDL', resultType: 'Numérico', minRange: '0', maxRange: '130', unit: 'mg/dL.', referenceRange: '0 - 130 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-qb-09', name: 'Bilirrubina Total', resultType: 'Numérico', minRange: '0.2', maxRange: '1.2', unit: 'mg/dL.', referenceRange: '0.2 - 1.2 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-qb-10', name: 'TGO / AST', resultType: 'Numérico', minRange: '0', maxRange: '38', unit: 'U/L.', referenceRange: '0 - 38 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-qb-11', name: 'TGP / ALT', resultType: 'Numérico', minRange: '0', maxRange: '41', unit: 'U/L.', referenceRange: '0 - 41 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-qb-12', name: 'Fosfatasa Alcalina (ALP)', resultType: 'Numérico', minRange: '40', maxRange: '130', unit: 'U/L.', referenceRange: '40 - 130 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-qb-13', name: 'Proteínas Totales', resultType: 'Numérico', minRange: '6.4', maxRange: '8.3', unit: 'g/dL.', referenceRange: '6.4 - 8.3 g/dL.', status: 'Activa', isRequired: true }
    ]
  },
  {
    id: 'prof-qui-hep-comp',
    code: 'PRF-QUI-HEP-COMP',
    name: 'PANEL COMPLETO QUIMICA SANGUINEA, PANEL HEPATICO',
    categoryName: 'Perfiles Clínicos Personalizados',
    price: 300,
    priceFormatted: 'Q300.00',
    regularPrice: 480,
    description: 'Batería exhaustiva de 23 determinaciones enzimáticas, lipídicas, metabólicas y hepáticas.',
    basedOn: 'PANEL COMPLETO (Perfil Bioquímico Sanguíneo Completo)',
    status: 'Activo',
    createdAt: '2026-09-05T10:00:00.000Z',
    createdBy: 'Administrador VACLINIC',
    testIds: [],
    testNames: [
      'Glucosa Pre (GLU)', 'Creatinina (CREA)', 'Urea (BUN)', 'Ácido Úrico', 'Colesterol Total',
      'Triglicéridos', 'HDL Colesterol', 'LDL Colesterol', 'VLDL Colesterol', 'Bilirrubina Total',
      'Bilirrubina Directa', 'Bilirrubina Indirecta', 'TGO / AST', 'TGP / ALT', 'Fosfatasa Alcalina (ALP)',
      'GGT', 'Amilasa', 'Lipasa', 'Proteínas Totales', 'Albúmina', 'Globulina', 'Relación A/G', 'Calcio Sérico'
    ],
    tests: [
      { id: 'pt-comp-01', name: 'Glucosa Pre (GLU)', code: 'GLU', resultType: 'Numérico', minRange: '70', maxRange: '110', unit: 'mg/dL.', referenceRange: '70 - 110 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-02', name: 'Creatinina (CREA)', code: 'CREA', resultType: 'Numérico', minRange: '0.70', maxRange: '1.30', unit: 'mg/dL.', referenceRange: '0.70 - 1.30 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-03', name: 'Urea (BUN)', code: 'BUN', resultType: 'Numérico', minRange: '15', maxRange: '45', unit: 'mg/dL.', referenceRange: '15 - 45 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-04', name: 'Ácido Úrico', code: 'UA', resultType: 'Numérico', minRange: '3.5', maxRange: '7.2', unit: 'mg/dL.', referenceRange: '3.5 - 7.2 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-05', name: 'Colesterol Total', code: 'CHOL', resultType: 'Numérico', minRange: '100', maxRange: '200', unit: 'mg/dL.', referenceRange: '100 - 200 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-06', name: 'Triglicéridos', code: 'TRIG', resultType: 'Numérico', minRange: '50', maxRange: '150', unit: 'mg/dL.', referenceRange: '50 - 150 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-07', name: 'HDL Colesterol', code: 'HDL', resultType: 'Numérico', minRange: '40', maxRange: '60', unit: 'mg/dL.', referenceRange: '40 - 60 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-08', name: 'LDL Colesterol', code: 'LDL', resultType: 'Numérico', minRange: '0', maxRange: '130', unit: 'mg/dL.', referenceRange: '0 - 130 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-09', name: 'VLDL Colesterol', code: 'VLDL', resultType: 'Numérico', minRange: '10', maxRange: '30', unit: 'mg/dL.', referenceRange: '10 - 30 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-10', name: 'Bilirrubina Total', code: 'TBIL', resultType: 'Numérico', minRange: '0.2', maxRange: '1.2', unit: 'mg/dL.', referenceRange: '0.2 - 1.2 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-11', name: 'Bilirrubina Directa', code: 'DBIL', resultType: 'Numérico', minRange: '0.0', maxRange: '0.3', unit: 'mg/dL.', referenceRange: '0.0 - 0.3 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-12', name: 'Bilirrubina Indirecta', code: 'IBIL', resultType: 'Numérico', minRange: '0.1', maxRange: '0.9', unit: 'mg/dL.', referenceRange: '0.1 - 0.9 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-13', name: 'TGO / AST', code: 'AST', resultType: 'Numérico', minRange: '0', maxRange: '38', unit: 'U/L.', referenceRange: '0 - 38 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-14', name: 'TGP / ALT', code: 'ALT', resultType: 'Numérico', minRange: '0', maxRange: '41', unit: 'U/L.', referenceRange: '0 - 41 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-15', name: 'Fosfatasa Alcalina (ALP)', code: 'ALP', resultType: 'Numérico', minRange: '40', maxRange: '130', unit: 'U/L.', referenceRange: '40 - 130 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-16', name: 'GGT', code: 'GGT', resultType: 'Numérico', minRange: '8', maxRange: '61', unit: 'U/L.', referenceRange: '8 - 61 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-17', name: 'Amilasa', code: 'AMY', resultType: 'Numérico', minRange: '28', maxRange: '100', unit: 'U/L.', referenceRange: '28 - 100 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-18', name: 'Lipasa', code: 'LIP', resultType: 'Numérico', minRange: '13', maxRange: '60', unit: 'U/L.', referenceRange: '13 - 60 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-19', name: 'Proteínas Totales', code: 'TP', resultType: 'Numérico', minRange: '6.4', maxRange: '8.3', unit: 'g/dL.', referenceRange: '6.4 - 8.3 g/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-20', name: 'Albúmina', code: 'ALB', resultType: 'Numérico', minRange: '3.5', maxRange: '5.2', unit: 'g/dL.', referenceRange: '3.5 - 5.2 g/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-21', name: 'Globulina', code: 'GLOB', resultType: 'Numérico', minRange: '2.0', maxRange: '3.5', unit: 'g/dL.', referenceRange: '2.0 - 3.5 g/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-comp-22', name: 'Relación A/G', code: 'A/G', resultType: 'Numérico', minRange: '1.2', maxRange: '2.2', unit: '', referenceRange: '1.2 - 2.2', status: 'Activa', isRequired: true },
      { id: 'pt-comp-23', name: 'Calcio Sérico', code: 'CA', resultType: 'Numérico', minRange: '8.5', maxRange: '10.5', unit: 'mg/dL.', referenceRange: '8.5 - 10.5 mg/dL.', status: 'Activa', isRequired: true }
    ]
  },
  {
    id: 'prof-hepatico',
    code: 'PRF-HEP',
    name: 'PANEL HEPATICO',
    categoryName: 'Perfiles Clínicos Personalizados',
    price: 200,
    priceFormatted: 'Q200.00',
    regularPrice: 280,
    description: 'Perfil específico para monitoreo integral de parénquima y función hepatobiliar.',
    basedOn: 'Función Hepática (11 Parámetros)',
    status: 'Activo',
    createdAt: '2026-09-05T10:30:00.000Z',
    createdBy: 'Administrador VACLINIC',
    testIds: [],
    testNames: [
      'Bilirrubina Total', 'Bilirrubina Directa', 'Bilirrubina Indirecta', 'TGO / AST',
      'TGP / ALT', 'Fosfatasa Alcalina (ALP)', 'GGT', 'Proteínas Totales', 'Albúmina', 'Globulina', 'Relación A/G'
    ],
    tests: [
      { id: 'pt-hep-01', name: 'Bilirrubina Total', resultType: 'Numérico', minRange: '0.2', maxRange: '1.2', unit: 'mg/dL.', referenceRange: '0.2 - 1.2 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-hep-02', name: 'Bilirrubina Directa', resultType: 'Numérico', minRange: '0.0', maxRange: '0.3', unit: 'mg/dL.', referenceRange: '0.0 - 0.3 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-hep-03', name: 'Bilirrubina Indirecta', resultType: 'Numérico', minRange: '0.1', maxRange: '0.9', unit: 'mg/dL.', referenceRange: '0.1 - 0.9 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-hep-04', name: 'TGO / AST', resultType: 'Numérico', minRange: '0', maxRange: '38', unit: 'U/L.', referenceRange: '0 - 38 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-hep-05', name: 'TGP / ALT', resultType: 'Numérico', minRange: '0', maxRange: '41', unit: 'U/L.', referenceRange: '0 - 41 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-hep-06', name: 'Fosfatasa Alcalina (ALP)', resultType: 'Numérico', minRange: '40', maxRange: '130', unit: 'U/L.', referenceRange: '40 - 130 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-hep-07', name: 'GGT', resultType: 'Numérico', minRange: '8', maxRange: '61', unit: 'U/L.', referenceRange: '8 - 61 U/L.', status: 'Activa', isRequired: true },
      { id: 'pt-hep-08', name: 'Proteínas Totales', resultType: 'Numérico', minRange: '6.4', maxRange: '8.3', unit: 'g/dL.', referenceRange: '6.4 - 8.3 g/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-hep-09', name: 'Albúmina', resultType: 'Numérico', minRange: '3.5', maxRange: '5.2', unit: 'g/dL.', referenceRange: '3.5 - 5.2 g/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-hep-10', name: 'Globulina', resultType: 'Numérico', minRange: '2.0', maxRange: '3.5', unit: 'g/dL.', referenceRange: '2.0 - 3.5 g/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-hep-11', name: 'Relación A/G', resultType: 'Numérico', minRange: '1.2', maxRange: '2.2', unit: '', referenceRange: '1.2 - 2.2', status: 'Activa', isRequired: true }
    ]
  },
  {
    id: 'prof-electrolitos',
    code: 'PRF-ELEC',
    name: 'PANEL DE ELECTROLITOS',
    categoryName: 'Perfiles Clínicos Personalizados',
    price: 200,
    priceFormatted: 'Q200.00',
    regularPrice: 240,
    description: 'Balance hidroelectrolítico y ácido-base de 7 electrolitos séricos.',
    basedOn: 'Electrolitos Séricos (7 Parámetros)',
    status: 'Activo',
    createdAt: '2026-09-05T11:00:00.000Z',
    createdBy: 'Administrador VACLINIC',
    testIds: [],
    testNames: ['Sodio (Na+)', 'Potasio (K+)', 'Cloro (Cl-)', 'Calcio Sérico', 'Magnesio', 'Fósforo Sérico', 'CO2 Total / Bicarbonato'],
    tests: [
      { id: 'pt-el-01', name: 'Sodio (Na+)', resultType: 'Numérico', minRange: '135', maxRange: '145', unit: 'mEq/L.', referenceRange: '135 - 145 mEq/L.', status: 'Activa', isRequired: true },
      { id: 'pt-el-02', name: 'Potasio (K+)', resultType: 'Numérico', minRange: '3.5', maxRange: '5.1', unit: 'mEq/L.', referenceRange: '3.5 - 5.1 mEq/L.', status: 'Activa', isRequired: true },
      { id: 'pt-el-03', name: 'Cloro (Cl-)', resultType: 'Numérico', minRange: '98', maxRange: '107', unit: 'mEq/L.', referenceRange: '98 - 107 mEq/L.', status: 'Activa', isRequired: true },
      { id: 'pt-el-04', name: 'Calcio Sérico', resultType: 'Numérico', minRange: '8.5', maxRange: '10.5', unit: 'mg/dL.', referenceRange: '8.5 - 10.5 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-el-05', name: 'Magnesio', resultType: 'Numérico', minRange: '1.7', maxRange: '2.4', unit: 'mg/dL.', referenceRange: '1.7 - 2.4 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-el-06', name: 'Fósforo Sérico', resultType: 'Numérico', minRange: '2.5', maxRange: '4.5', unit: 'mg/dL.', referenceRange: '2.5 - 4.5 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-el-07', name: 'CO2 Total / Bicarbonato', resultType: 'Numérico', minRange: '22', maxRange: '29', unit: 'mEq/L.', referenceRange: '22 - 29 mEq/L.', status: 'Activa', isRequired: true }
    ]
  },
  {
    id: 'prof-coag-fib',
    code: 'PRF-COAG-FIB',
    name: 'PANEL DE COAGULACION CON FIBRINOGENO',
    categoryName: 'Perfiles Clínicos Personalizados',
    price: 180,
    priceFormatted: 'Q180.00',
    regularPrice: 220,
    description: 'Evaluación de las vías extrínseca, intrínseca y común de la cascada hemostática.',
    basedOn: 'Coagulación (6 Parámetros)',
    status: 'Activo',
    createdAt: '2026-09-05T11:30:00.000Z',
    createdBy: 'Administrador VACLINIC',
    testIds: [],
    testNames: ['Tiempo de Protrombina (TP / PT)', 'INR', 'Tiempo de Tromboplastina (TTP / APTT)', 'Tiempo de Trombina (TT)', 'Fibrinógeno'],
    tests: [
      { id: 'pt-coag-01', name: 'Tiempo de Protrombina (TP / PT)', resultType: 'Numérico', minRange: '11.0', maxRange: '14.0', unit: 'segundos', referenceRange: '11.0 - 14.0 seg', status: 'Activa', isRequired: true },
      { id: 'pt-coag-02', name: 'INR', resultType: 'Numérico', minRange: '0.8', maxRange: '1.2', unit: '', referenceRange: '0.8 - 1.2', status: 'Activa', isRequired: true },
      { id: 'pt-coag-03', name: 'Tiempo de Tromboplastina (TTP / APTT)', resultType: 'Numérico', minRange: '25.0', maxRange: '38.0', unit: 'segundos', referenceRange: '25.0 - 38.0 seg', status: 'Activa', isRequired: true },
      { id: 'pt-coag-04', name: 'Tiempo de Trombina (TT)', resultType: 'Numérico', minRange: '14.0', maxRange: '21.0', unit: 'segundos', referenceRange: '14.0 - 21.0 seg', status: 'Activa', isRequired: true },
      { id: 'pt-coag-05', name: 'Fibrinógeno', resultType: 'Numérico', minRange: '200', maxRange: '400', unit: 'mg/dL.', referenceRange: '200 - 400 mg/dL.', status: 'Activa', isRequired: true }
    ]
  },
  {
    id: 'prof-renal-qui',
    code: 'PRF-REN-QUI',
    name: 'PANEL RENAL Y QUIMICA SANGUINEA',
    categoryName: 'Perfiles Clínicos Personalizados',
    price: 300,
    priceFormatted: 'Q300.00',
    regularPrice: 420,
    description: 'Perfil de filtración glomerular, balance electrolítico y química urinaria.',
    basedOn: 'Química Renal II (17 Parámetros)',
    status: 'Activo',
    createdAt: '2026-09-05T12:00:00.000Z',
    createdBy: 'Administrador VACLINIC',
    testIds: [],
    testNames: [
      'Creatinina', 'Urea / BUN', 'Relación BUN/Creatinina', 'Filtrado Glomerular Estimado (eGFR)',
      'Ácido Úrico', 'Glucosa', 'Sodio', 'Potasio', 'Cloro', 'Calcio Sérico', 'Fósforo Sérico',
      'Proteínas Totales', 'Albúmina', 'Orina Completa (EGO)', 'Microalbuminuria', 'Densidad Urinaria',
      'pH Urinario', 'Proteínas en Orina', 'Sedimento Urinario', 'Urobilinógeno'
    ],
    tests: [
      { id: 'pt-ren-01', name: 'Creatinina', resultType: 'Numérico', minRange: '0.70', maxRange: '1.30', unit: 'mg/dL.', referenceRange: '0.70 - 1.30 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-ren-02', name: 'Urea / BUN', resultType: 'Numérico', minRange: '15', maxRange: '45', unit: 'mg/dL.', referenceRange: '15 - 45 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-ren-03', name: 'Relación BUN/Creatinina', resultType: 'Numérico', minRange: '10', maxRange: '20', unit: '', referenceRange: '10 - 20', status: 'Activa', isRequired: true },
      { id: 'pt-ren-04', name: 'Filtrado Glomerular Estimado (eGFR)', resultType: 'Numérico', minRange: '90', maxRange: '140', unit: 'mL/min/1.73m2', referenceRange: '> 90 mL/min', status: 'Activa', isRequired: true },
      { id: 'pt-ren-05', name: 'Ácido Úrico', resultType: 'Numérico', minRange: '3.5', maxRange: '7.2', unit: 'mg/dL.', referenceRange: '3.5 - 7.2 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-ren-06', name: 'Glucosa', resultType: 'Numérico', minRange: '70', maxRange: '110', unit: 'mg/dL.', referenceRange: '70 - 110 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-ren-07', name: 'Sodio', resultType: 'Numérico', minRange: '135', maxRange: '145', unit: 'mEq/L.', referenceRange: '135 - 145 mEq/L.', status: 'Activa', isRequired: true },
      { id: 'pt-ren-08', name: 'Potasio', resultType: 'Numérico', minRange: '3.5', maxRange: '5.1', unit: 'mEq/L.', referenceRange: '3.5 - 5.1 mEq/L.', status: 'Activa', isRequired: true },
      { id: 'pt-ren-09', name: 'Cloro', resultType: 'Numérico', minRange: '98', maxRange: '107', unit: 'mEq/L.', referenceRange: '98 - 107 mEq/L.', status: 'Activa', isRequired: true },
      { id: 'pt-ren-10', name: 'Calcio Sérico', resultType: 'Numérico', minRange: '8.5', maxRange: '10.5', unit: 'mg/dL.', referenceRange: '8.5 - 10.5 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-ren-11', name: 'Fósforo Sérico', resultType: 'Numérico', minRange: '2.5', maxRange: '4.5', unit: 'mg/dL.', referenceRange: '2.5 - 4.5 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-ren-12', name: 'Proteínas Totales', resultType: 'Numérico', minRange: '6.4', maxRange: '8.3', unit: 'g/dL.', referenceRange: '6.4 - 8.3 g/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-ren-13', name: 'Albúmina', resultType: 'Numérico', minRange: '3.5', maxRange: '5.2', unit: 'g/dL.', referenceRange: '3.5 - 5.2 g/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-ren-14', name: 'Orina Completa (EGO)', resultType: 'Texto', referenceRange: 'Normal', status: 'Activa', isRequired: true },
      { id: 'pt-ren-15', name: 'Microalbuminuria', resultType: 'Numérico', minRange: '0', maxRange: '30', unit: 'mg/24h', referenceRange: '< 30 mg/24h', status: 'Activa', isRequired: true },
      { id: 'pt-ren-16', name: 'Densidad Urinaria', resultType: 'Numérico', minRange: '1.005', maxRange: '1.030', unit: '', referenceRange: '1.005 - 1.030', status: 'Activa', isRequired: true },
      { id: 'pt-ren-17', name: 'pH Urinario', resultType: 'Numérico', minRange: '5.0', maxRange: '7.5', unit: '', referenceRange: '5.0 - 7.5', status: 'Activa', isRequired: true },
      { id: 'pt-ren-18', name: 'Proteínas en Orina', resultType: 'Texto', referenceRange: 'Negativo', status: 'Activa', isRequired: true },
      { id: 'pt-ren-19', name: 'Sedimento Urinario', resultType: 'Texto', referenceRange: 'Sin alteraciones', status: 'Activa', isRequired: true },
      { id: 'pt-ren-20', name: 'Urobilinógeno', resultType: 'Texto', referenceRange: 'Normal', status: 'Activa', isRequired: true }
    ]
  },
  {
    id: 'prof-coag-dimd',
    code: 'PRF-COAG-DIMD',
    name: 'PANEL DE COAGULACION CON DIMERO D',
    categoryName: 'Perfiles Clínicos Personalizados',
    price: 200,
    priceFormatted: 'Q200.00',
    regularPrice: 270,
    description: 'Batería hemostática completa que incluye marcador cuantitativo de degradación de fibrina (Dímero D).',
    basedOn: 'Coagulación (6 Parámetros)',
    status: 'Activo',
    createdAt: '2026-09-07T08:00:00.000Z',
    createdBy: 'Administrador VACLINIC',
    testIds: [],
    testNames: ['Tiempo de Protrombina (TP / PT)', 'INR', 'Tiempo de Tromboplastina (TTP / APTT)', 'Tiempo de Trombina (TT)', 'Fibrinógeno', 'Dímero D'],
    tests: [
      { id: 'pt-cd-01', name: 'Tiempo de Protrombina (TP / PT)', resultType: 'Numérico', minRange: '11.0', maxRange: '14.0', unit: 'segundos', referenceRange: '11.0 - 14.0 seg', status: 'Activa', isRequired: true },
      { id: 'pt-cd-02', name: 'INR', resultType: 'Numérico', minRange: '0.8', maxRange: '1.2', unit: '', referenceRange: '0.8 - 1.2', status: 'Activa', isRequired: true },
      { id: 'pt-cd-03', name: 'Tiempo de Tromboplastina (TTP / APTT)', resultType: 'Numérico', minRange: '25.0', maxRange: '38.0', unit: 'segundos', referenceRange: '25.0 - 38.0 seg', status: 'Activa', isRequired: true },
      { id: 'pt-cd-04', name: 'Tiempo de Trombina (TT)', resultType: 'Numérico', minRange: '14.0', maxRange: '21.0', unit: 'segundos', referenceRange: '14.0 - 21.0 seg', status: 'Activa', isRequired: true },
      { id: 'pt-cd-05', name: 'Fibrinógeno', resultType: 'Numérico', minRange: '200', maxRange: '400', unit: 'mg/dL.', referenceRange: '200 - 400 mg/dL.', status: 'Activa', isRequired: true },
      { id: 'pt-cd-06', name: 'Dímero D', resultType: 'Numérico', minRange: '0', maxRange: '500', unit: 'ng/mL DDU', referenceRange: '< 500 ng/mL DDU', status: 'Activa', isRequired: true }
    ]
  }
];
