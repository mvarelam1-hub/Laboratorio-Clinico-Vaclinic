import { ParameterStatus, ReportParameter, LabCatalogItem, ProfileTestAgeGenderRange } from '../types';

export type DeviationAlertLevel = 'normal' | 'amber' | 'red';

export type AgeGroupCategory = 'neonato' | 'pediatrico' | 'adolescente' | 'adulto' | 'geriatrico';

/**
 * Returns age category bracket according to clinical standards (CLSI C28-A3)
 */
export function getAgeCategory(age?: number): AgeGroupCategory {
  if (age === undefined || age === null || isNaN(age)) return 'adulto';
  if (age <= 1) return 'neonato';
  if (age < 13) return 'pediatrico';
  if (age < 18) return 'adolescente';
  if (age >= 65) return 'geriatrico';
  return 'adulto';
}

/**
 * Returns a human-friendly clinical description of age group
 */
export function getAgeGroupDescription(age?: number): string {
  if (age === undefined || age === null || isNaN(age)) return 'Adulto (18 - 64 años)';
  if (age <= 1) return `Lactante / Neonato (${age <= 0 ? '0' : age} año)`;
  if (age < 13) return `Pediátrico (${age} años)`;
  if (age < 18) return `Adolescente (${age} años)`;
  if (age >= 65) return `Adulto Mayor / Geriátrico (${age} años)`;
  return `Adulto (${age} años)`;
}

/**
 * Returns a readable gender label
 */
export function getGenderLabel(gender?: string): string {
  if (!gender) return 'Sin especificar';
  const g = gender.toUpperCase();
  if (g === 'M' || g === 'MASCULINO' || g === 'VARON' || g === 'HOMBRE') return 'Masculino ♂';
  if (g === 'F' || g === 'FEMENINO' || g === 'MUJER') return 'Femenino ♀';
  return 'General';
}

/**
 * Clinical reference standard table with age and sex stratified intervals
 * Source: Clinical Laboratory Standards Institute (CLSI C28-A3) & Mayo Clinic Laboratories
 */
interface DemographicTestStandard {
  aliases: string[];
  unit: string;
  isSexSpecific: boolean;
  isAgeSpecific: boolean;
  evaluate: (age: number, gender: string) => {
    min?: number;
    max?: number;
    rangeText: string;
    panicMin?: number;
    panicMax?: number;
    demographicLabel: string;
  };
}

export const CLINICAL_DEMOGRAPHIC_STANDARDS: DemographicTestStandard[] = [
  // Hemoglobina
  {
    aliases: ['hemoglobina', 'hb', 'hgb', 'hemoglobina total'],
    unit: 'g/dL',
    isSexSpecific: true,
    isAgeSpecific: true,
    evaluate: (age, gender) => {
      const isMale = gender.toUpperCase() === 'M' || gender.toUpperCase().includes('MASC');
      if (age <= 1) {
        return { min: 14.0, max: 22.0, rangeText: '14.0 - 22.0 g/dL', panicMin: 8.0, panicMax: 24.0, demographicLabel: 'Lactante (0-1a)' };
      }
      if (age < 13) {
        return { min: 11.5, max: 14.5, rangeText: '11.5 - 14.5 g/dL', panicMin: 7.0, panicMax: 18.0, demographicLabel: `Pediátrico (${age}a)` };
      }
      if (age >= 65) {
        if (isMale) {
          return { min: 12.5, max: 17.0, rangeText: '12.5 - 17.0 g/dL', panicMin: 7.0, panicMax: 19.5, demographicLabel: '♂ Hombres Adultos Mayores (65+a)' };
        }
        return { min: 11.5, max: 15.0, rangeText: '11.5 - 15.0 g/dL', panicMin: 7.0, panicMax: 18.0, demographicLabel: '♀ Mujeres Adultas Mayores (65+a)' };
      }
      // Adultos 18-64
      if (isMale) {
        return { min: 13.5, max: 17.5, rangeText: '13.5 - 17.5 g/dL', panicMin: 7.0, panicMax: 20.0, demographicLabel: '♂ Hombres Adultos (18-64a)' };
      }
      return { min: 12.0, max: 15.5, rangeText: '12.0 - 15.5 g/dL', panicMin: 7.0, panicMax: 19.0, demographicLabel: '♀ Mujeres Adultas (18-64a)' };
    }
  },

  // Hematocrito
  {
    aliases: ['hematocrito', 'hto', 'hct'],
    unit: '%',
    isSexSpecific: true,
    isAgeSpecific: true,
    evaluate: (age, gender) => {
      const isMale = gender.toUpperCase() === 'M' || gender.toUpperCase().includes('MASC');
      if (age <= 1) {
        return { min: 42.0, max: 62.0, rangeText: '42.0 - 62.0 %', panicMin: 22.0, panicMax: 65.0, demographicLabel: 'Lactante (0-1a)' };
      }
      if (age < 13) {
        return { min: 35.0, max: 43.0, rangeText: '35.0 - 43.0 %', panicMin: 21.0, panicMax: 55.0, demographicLabel: `Pediátrico (${age}a)` };
      }
      if (isMale) {
        return { min: 41.0, max: 50.0, rangeText: '41.0 - 50.0 %', panicMin: 21.0, panicMax: 60.0, demographicLabel: '♂ Hombres Adultos' };
      }
      return { min: 36.0, max: 46.0, rangeText: '36.0 - 46.0 %', panicMin: 21.0, panicMax: 56.0, demographicLabel: '♀ Mujeres Adultas' };
    }
  },

  // Eritrocitos (Glóbulos Rojos)
  {
    aliases: ['eritrocitos', 'globulos rojos', 'glóbulos rojos', 'rbc'],
    unit: 'x10^6/µL',
    isSexSpecific: true,
    isAgeSpecific: true,
    evaluate: (age, gender) => {
      const isMale = gender.toUpperCase() === 'M' || gender.toUpperCase().includes('MASC');
      if (age < 13) {
        return { min: 4.00, max: 5.20, rangeText: '4.00 - 5.20 x10^6/µL', demographicLabel: `Pediátrico (${age}a)` };
      }
      if (isMale) {
        return { min: 4.50, max: 5.90, rangeText: '4.50 - 5.90 x10^6/µL', demographicLabel: '♂ Hombres Adultos' };
      }
      return { min: 4.00, max: 5.20, rangeText: '4.00 - 5.20 x10^6/µL', demographicLabel: '♀ Mujeres Adultas' };
    }
  },

  // Leucocitos Totales
  {
    aliases: ['leucocitos', 'leucocitos totales', 'globulos blancos', 'wbc'],
    unit: '/mm³',
    isSexSpecific: false,
    isAgeSpecific: true,
    evaluate: (age) => {
      if (age <= 1) {
        return { min: 9000, max: 30000, rangeText: '9000 - 30000 /mm³', panicMin: 3000, panicMax: 40000, demographicLabel: 'Lactante (0-1a)' };
      }
      if (age < 13) {
        return { min: 5000, max: 14500, rangeText: '5000 - 14500 /mm³', panicMin: 2500, panicMax: 30000, demographicLabel: `Pediátrico (${age}a)` };
      }
      return { min: 4500, max: 10500, rangeText: '4500 - 10500 /mm³', panicMin: 2000, panicMax: 30000, demographicLabel: 'Adultos (General)' };
    }
  },

  // Plaquetas
  {
    aliases: ['plaquetas', 'recuento de plaquetas', 'plt'],
    unit: '/mm³',
    isSexSpecific: false,
    isAgeSpecific: false,
    evaluate: () => {
      return { min: 150000, max: 450000, rangeText: '150000 - 450000 /mm³', panicMin: 40000, panicMax: 1000000, demographicLabel: 'Población General' };
    }
  },

  // Creatinina Sérica
  {
    aliases: ['creatinina', 'creatinina serica', 'creatinina sérica'],
    unit: 'mg/dL',
    isSexSpecific: true,
    isAgeSpecific: true,
    evaluate: (age, gender) => {
      const isMale = gender.toUpperCase() === 'M' || gender.toUpperCase().includes('MASC');
      if (age < 13) {
        return { min: 0.30, max: 0.70, rangeText: '0.30 - 0.70 mg/dL', panicMax: 2.0, demographicLabel: `Pediátrico (${age}a)` };
      }
      if (age >= 65) {
        if (isMale) {
          return { min: 0.70, max: 1.35, rangeText: '0.70 - 1.35 mg/dL', panicMax: 3.0, demographicLabel: '♂ Hombres Adultos Mayores (65+a)' };
        }
        return { min: 0.55, max: 1.15, rangeText: '0.55 - 1.15 mg/dL', panicMax: 2.8, demographicLabel: '♀ Mujeres Adultas Mayores (65+a)' };
      }
      if (isMale) {
        return { min: 0.70, max: 1.30, rangeText: '0.70 - 1.30 mg/dL', panicMax: 3.0, demographicLabel: '♂ Hombres Adultos' };
      }
      return { min: 0.50, max: 1.10, rangeText: '0.50 - 1.10 mg/dL', panicMax: 2.8, demographicLabel: '♀ Mujeres Adultas' };
    }
  },

  // Ácido Úrico
  {
    aliases: ['acido urico', 'ácido úrico', 'urato'],
    unit: 'mg/dL',
    isSexSpecific: true,
    isAgeSpecific: true,
    evaluate: (age, gender) => {
      const isMale = gender.toUpperCase() === 'M' || gender.toUpperCase().includes('MASC');
      if (age < 13) {
        return { min: 2.0, max: 5.5, rangeText: '2.0 - 5.5 mg/dL', demographicLabel: `Pediátrico (${age}a)` };
      }
      if (isMale) {
        return { min: 3.5, max: 7.2, rangeText: '3.5 - 7.2 mg/dL', panicMax: 11.0, demographicLabel: '♂ Hombres Adultos' };
      }
      return { min: 2.4, max: 6.0, rangeText: '2.4 - 6.0 mg/dL', panicMax: 10.0, demographicLabel: '♀ Mujeres Adultas' };
    }
  },

  // Colesterol HDL (Protector Cardiovascular)
  {
    aliases: ['colesterol hdl', 'hdl', 'colesterol bueno'],
    unit: 'mg/dL',
    isSexSpecific: true,
    isAgeSpecific: false,
    evaluate: (age, gender) => {
      const isMale = gender.toUpperCase() === 'M' || gender.toUpperCase().includes('MASC');
      if (isMale) {
        return { min: 40, max: 90, rangeText: '> 40 mg/dL (Deseable)', demographicLabel: '♂ Hombres (Deseable > 40)' };
      }
      return { min: 50, max: 95, rangeText: '> 50 mg/dL (Deseable)', demographicLabel: '♀ Mujeres (Deseable > 50)' };
    }
  },

  // Colesterol Total
  {
    aliases: ['colesterol total', 'colesterol'],
    unit: 'mg/dL',
    isSexSpecific: false,
    isAgeSpecific: true,
    evaluate: (age) => {
      if (age < 18) {
        return { min: 0, max: 170, rangeText: '< 170 mg/dL (Deseable)', panicMax: 240, demographicLabel: 'Pediátrico / Adolescente' };
      }
      return { min: 0, max: 200, rangeText: '< 200 mg/dL (Deseable)', panicMax: 300, demographicLabel: 'Adultos (< 200 deseable)' };
    }
  },

  // Colesterol LDL
  {
    aliases: ['colesterol ldl', 'ldl', 'colesterol malo'],
    unit: 'mg/dL',
    isSexSpecific: false,
    isAgeSpecific: true,
    evaluate: (age) => {
      if (age < 18) {
        return { min: 0, max: 110, rangeText: '< 110 mg/dL', panicMax: 190, demographicLabel: 'Pediátrico / Adolescente' };
      }
      return { min: 0, max: 100, rangeText: '< 100 mg/dL (Óptimo)', panicMax: 190, demographicLabel: 'Adultos (< 100 óptimo)' };
    }
  },

  // Triglicéridos
  {
    aliases: ['trigliceridos', 'triglicéridos'],
    unit: 'mg/dL',
    isSexSpecific: false,
    isAgeSpecific: true,
    evaluate: (age) => {
      if (age < 10) {
        return { min: 0, max: 75, rangeText: '< 75 mg/dL', panicMax: 400, demographicLabel: 'Pediátrico (0-9a)' };
      }
      if (age < 18) {
        return { min: 0, max: 90, rangeText: '< 90 mg/dL', panicMax: 400, demographicLabel: 'Adolescente (10-17a)' };
      }
      return { min: 0, max: 150, rangeText: '< 150 mg/dL (Normal)', panicMax: 500, demographicLabel: 'Adultos (< 150 normal)' };
    }
  },

  // Glucosa en Ayunas
  {
    aliases: ['glucosa', 'glucosa en ayunas', 'glucosa basal', 'glicemia'],
    unit: 'mg/dL',
    isSexSpecific: false,
    isAgeSpecific: true,
    evaluate: (age) => {
      if (age <= 1) {
        return { min: 40, max: 90, rangeText: '40 - 90 mg/dL', panicMin: 40, panicMax: 200, demographicLabel: 'Lactante / Neonato' };
      }
      if (age < 13) {
        return { min: 60, max: 100, rangeText: '60 - 100 mg/dL', panicMin: 50, panicMax: 300, demographicLabel: `Pediátrico (${age}a)` };
      }
      if (age >= 65) {
        return { min: 75, max: 105, rangeText: '75 - 105 mg/dL', panicMin: 50, panicMax: 350, demographicLabel: 'Adulto Mayor (75-105 mg/dL)' };
      }
      return { min: 70, max: 100, rangeText: '70 - 100 mg/dL', panicMin: 50, panicMax: 400, demographicLabel: 'Adultos (70-100 mg/dL)' };
    }
  },

  // PSA (Antígeno Prostático Específico)
  {
    aliases: ['psa', 'antigeno prostatico', 'antígeno prostático', 'psa total'],
    unit: 'ng/mL',
    isSexSpecific: true,
    isAgeSpecific: true,
    evaluate: (age, gender) => {
      const isMale = gender.toUpperCase() === 'M' || gender.toUpperCase().includes('MASC');
      if (!isMale) {
        return { min: 0, max: 0.05, rangeText: '< 0.05 ng/mL (No aplica)', demographicLabel: '♀ Femenino (No aplica)' };
      }
      if (age < 50) {
        return { min: 0, max: 2.5, rangeText: '< 2.5 ng/mL', panicMax: 10.0, demographicLabel: '♂ Hombres < 50 años' };
      }
      if (age < 60) {
        return { min: 0, max: 3.5, rangeText: '< 3.5 ng/mL', panicMax: 10.0, demographicLabel: '♂ Hombres 50 - 59 años' };
      }
      if (age < 70) {
        return { min: 0, max: 4.5, rangeText: '< 4.5 ng/mL', panicMax: 12.0, demographicLabel: '♂ Hombres 60 - 69 años' };
      }
      return { min: 0, max: 6.5, rangeText: '< 6.5 ng/mL', panicMax: 15.0, demographicLabel: '♂ Hombres ≥ 70 años' };
    }
  },

  // Ferritina Sérica
  {
    aliases: ['ferritina', 'ferritina serica', 'ferritina sérica'],
    unit: 'ng/mL',
    isSexSpecific: true,
    isAgeSpecific: true,
    evaluate: (age, gender) => {
      const isMale = gender.toUpperCase() === 'M' || gender.toUpperCase().includes('MASC');
      if (age < 13) {
        return { min: 7, max: 140, rangeText: '7 - 140 ng/mL', demographicLabel: `Pediátrico (${age}a)` };
      }
      if (isMale) {
        return { min: 30, max: 400, rangeText: '30 - 400 ng/mL', demographicLabel: '♂ Hombres Adultos' };
      }
      return { min: 15, max: 150, rangeText: '15 - 150 ng/mL', demographicLabel: '♀ Mujeres Adultas' };
    }
  },

  // Fosfatasa Alcalina (ALP)
  {
    aliases: ['fosfatasa alcalina', 'alp'],
    unit: 'U/L',
    isSexSpecific: false,
    isAgeSpecific: true,
    evaluate: (age) => {
      if (age < 18) {
        return { min: 110, max: 360, rangeText: '110 - 360 U/L', demographicLabel: `Crecimiento Óseo Activo (${age}a)` };
      }
      return { min: 44, max: 147, rangeText: '44 - 147 U/L', panicMax: 450, demographicLabel: 'Adultos (44-147 U/L)' };
    }
  },

  // GGT (Gamma-Glutamil Transferasa)
  {
    aliases: ['ggt', 'gamma glutamil transferasa', 'gamma gt'],
    unit: 'U/L',
    isSexSpecific: true,
    isAgeSpecific: false,
    evaluate: (age, gender) => {
      const isMale = gender.toUpperCase() === 'M' || gender.toUpperCase().includes('MASC');
      if (isMale) {
        return { min: 8, max: 61, rangeText: '8 - 61 U/L', panicMax: 200, demographicLabel: '♂ Hombres' };
      }
      return { min: 5, max: 36, rangeText: '5 - 36 U/L', panicMax: 150, demographicLabel: '♀ Mujeres' };
    }
  },

  // Transaminasa AST / TGO
  {
    aliases: ['tgo', 'ast', 'transaminasa glutamico oxalacetica', 'aspartato aminotransferasa'],
    unit: 'U/L',
    isSexSpecific: true,
    isAgeSpecific: false,
    evaluate: (age, gender) => {
      const isMale = gender.toUpperCase() === 'M' || gender.toUpperCase().includes('MASC');
      if (isMale) {
        return { min: 10, max: 40, rangeText: '10 - 40 U/L', panicMax: 300, demographicLabel: '♂ Hombres' };
      }
      return { min: 9, max: 32, rangeText: '9 - 32 U/L', panicMax: 250, demographicLabel: '♀ Mujeres' };
    }
  },

  // Transaminasa ALT / TGP
  {
    aliases: ['tgp', 'alt', 'transaminasa glutamico piruvica', 'alanina aminotransferasa'],
    unit: 'U/L',
    isSexSpecific: true,
    isAgeSpecific: false,
    evaluate: (age, gender) => {
      const isMale = gender.toUpperCase() === 'M' || gender.toUpperCase().includes('MASC');
      if (isMale) {
        return { min: 10, max: 45, rangeText: '10 - 45 U/L', panicMax: 350, demographicLabel: '♂ Hombres' };
      }
      return { min: 7, max: 35, rangeText: '7 - 35 U/L', panicMax: 300, demographicLabel: '♀ Mujeres' };
    }
  },

  // TSH Ultrasensible
  {
    aliases: ['tsh', 'tsh ultrasensible', 'hormona estimulante de tiroides'],
    unit: 'µUI/mL',
    isSexSpecific: false,
    isAgeSpecific: true,
    evaluate: (age) => {
      if (age >= 70) {
        return { min: 0.50, max: 5.90, rangeText: '0.50 - 5.90 µUI/mL', panicMin: 0.1, panicMax: 15.0, demographicLabel: 'Adulto Mayor (≥70a)' };
      }
      return { min: 0.40, max: 4.20, rangeText: '0.40 - 4.20 µUI/mL', panicMin: 0.1, panicMax: 12.0, demographicLabel: 'Adultos (0.40-4.20 µUI/mL)' };
    }
  },

  // Potasio Sérico (K+)
  {
    aliases: ['potasio', 'k+', 'k'],
    unit: 'mEq/L',
    isSexSpecific: false,
    isAgeSpecific: false,
    evaluate: () => {
      return { min: 3.5, max: 5.1, rangeText: '3.5 - 5.1 mEq/L', panicMin: 2.8, panicMax: 6.2, demographicLabel: 'General (Pánico: <2.8 o >6.2)' };
    }
  },

  // Sodio Sérico (Na+)
  {
    aliases: ['sodio', 'na+', 'na'],
    unit: 'mEq/L',
    isSexSpecific: false,
    isAgeSpecific: false,
    evaluate: () => {
      return { min: 135, max: 145, rangeText: '135 - 145 mEq/L', panicMin: 120, panicMax: 160, demographicLabel: 'General (Pánico: <120 o >160)' };
    }
  },

  // Nitrógeno de Urea (BUN) / Urea
  {
    aliases: ['bun', 'nitrogeno de urea', 'nitrógeno de urea', 'nitrogeno ureico', 'urea'],
    unit: 'mg/dL',
    isSexSpecific: false,
    isAgeSpecific: true,
    evaluate: (age) => {
      if (age <= 1) {
        return { min: 5.0, max: 18.0, rangeText: '5.0 - 18.0 mg/dL', panicMax: 40.0, demographicLabel: 'Lactante (0-1a)' };
      }
      if (age < 13) {
        return { min: 6.0, max: 20.0, rangeText: '6.0 - 20.0 mg/dL', panicMax: 50.0, demographicLabel: `Pediátrico (${age}a)` };
      }
      if (age >= 65) {
        return { min: 8.0, max: 23.0, rangeText: '8.0 - 23.0 mg/dL', panicMax: 80.0, demographicLabel: 'Adulto Mayor (65+a)' };
      }
      return { min: 7.0, max: 20.0, rangeText: '7.0 - 20.0 mg/dL', panicMax: 60.0, demographicLabel: 'Adultos (7.0 - 20.0 mg/dL)' };
    }
  },

  // Bilirrubina Total
  {
    aliases: ['bilirrubina total', 'bilirrubina'],
    unit: 'mg/dL',
    isSexSpecific: false,
    isAgeSpecific: true,
    evaluate: (age) => {
      if (age <= 0.08) { // Neonato primeros días
        return { min: 1.0, max: 12.0, rangeText: '1.0 - 12.0 mg/dL', panicMax: 15.0, demographicLabel: 'Neonato (< 1 mes)' };
      }
      if (age <= 1) {
        return { min: 0.2, max: 1.0, rangeText: '0.2 - 1.0 mg/dL', panicMax: 5.0, demographicLabel: 'Lactante (1-12m)' };
      }
      return { min: 0.2, max: 1.2, rangeText: '0.2 - 1.2 mg/dL', panicMax: 15.0, demographicLabel: 'Adultos / Población General' };
    }
  },

  // Hemoglobina Glicosilada (HbA1c)
  {
    aliases: ['hba1c', 'hemoglobina glicosilada', 'glicosilada', 'a1c'],
    unit: '%',
    isSexSpecific: false,
    isAgeSpecific: false,
    evaluate: () => {
      return { min: 4.0, max: 5.6, rangeText: '< 5.7 % (Normal)', panicMax: 10.0, demographicLabel: 'Control Glucémico (< 5.7% Normal)' };
    }
  },

  // Calcio Sérico
  {
    aliases: ['calcio', 'calcio serico', 'calcio sérico', 'ca++'],
    unit: 'mg/dL',
    isSexSpecific: false,
    isAgeSpecific: true,
    evaluate: (age) => {
      if (age < 13) {
        return { min: 8.8, max: 10.8, rangeText: '8.8 - 10.8 mg/dL', panicMin: 6.5, panicMax: 13.0, demographicLabel: `Pediátrico (${age}a)` };
      }
      return { min: 8.5, max: 10.2, rangeText: '8.5 - 10.2 mg/dL', panicMin: 6.5, panicMax: 13.0, demographicLabel: 'Adultos (8.5 - 10.2 mg/dL)' };
    }
  }
];

/**
 * Calculates exact chronological age in years, months, days and classifies clinical cohort
 */
export function calculateChronologicalAge(birthDateStr: string): {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  ageCategory: AgeGroupCategory;
  formattedText: string;
  shortSummary: string;
  isNeonateOrInfant: boolean;
} {
  if (!birthDateStr) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      ageCategory: 'adulto',
      formattedText: 'Sin fecha de nacimiento especificada',
      shortSummary: '0 años',
      isNeonateOrInfant: false
    };
  }

  const birth = new Date(birthDateStr + 'T00:00:00');
  const now = new Date();
  
  const diffTime = now.getTime() - birth.getTime();
  const totalDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const prevMonthLastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  years = Math.max(0, years);
  months = Math.max(0, months);
  days = Math.max(0, days);

  const effectiveAgeForCategory = years === 0 ? (months <= 1 ? 0 : 1) : years;
  const ageCategory = getAgeCategory(effectiveAgeForCategory);
  const isNeonateOrInfant = years === 0 || (years === 1 && months === 0);

  let formattedText = '';
  let shortSummary = '';

  if (years === 0) {
    if (months === 0) {
      formattedText = `${days} ${days === 1 ? 'día' : 'días'} (Neonato / Recién Nacido)`;
      shortSummary = `${days} días`;
    } else {
      formattedText = `${months} ${months === 1 ? 'mes' : 'meses'} y ${days} ${days === 1 ? 'día' : 'días'} (Lactante)`;
      shortSummary = `${months} meses`;
    }
  } else if (years < 3) {
    formattedText = `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'} (Primera Infancia)`;
    shortSummary = `${years}a ${months}m`;
  } else {
    formattedText = `${years} años (${months} ${months === 1 ? 'mes' : 'meses'})`;
    shortSummary = `${years} años`;
  }

  return {
    years,
    months,
    days,
    totalDays,
    ageCategory,
    formattedText,
    shortSummary,
    isNeonateOrInfant
  };
}

/**
 * Calculates approximate birth date from age in years
 */
export function calculateBirthDateFromYears(yearsNum: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yearsNum);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Parses reference range strings that embed both male and female intervals,
 * e.g. "H: 13.5 - 17.5 / M: 12.0 - 15.5 g/dL" or "Hombres: 3.5 - 7.2 | Mujeres: 2.4 - 6.0"
 */
export function parseMultiGenderRange(
  rangeStr: string,
  gender: 'M' | 'F' | 'Otro' | string = 'M'
): { min?: number; max?: number; rangeText?: string } | null {
  if (!rangeStr || typeof rangeStr !== 'string') return null;

  const isMale = gender.toUpperCase() === 'M' || gender.toUpperCase().includes('MASC');
  const clean = rangeStr.trim();

  // Pattern like: H: 13.5 - 17.5 / M: 12.0 - 15.5
  // or Hombres: ... | Mujeres: ...
  // or Varones: ... / Mujeres: ...
  const maleSub = isMale 
    ? clean.match(/(?:h|hombres?|varones?|m)\s*[:=]\s*([0-9.<>=a\s-]+)/i)
    : clean.match(/(?:m|mujeres?|f|femenino)\s*[:=]\s*([0-9.<>=a\s-]+)/i);

  if (maleSub && maleSub[1]) {
    const rawSub = maleSub[1].split(/[\/|;]/)[0].trim();
    const parsed = parseReferenceRange(rawSub);
    if (parsed.min !== undefined || parsed.max !== undefined) {
      return { min: parsed.min, max: parsed.max, rangeText: rawSub };
    }
  }

  return null;
}

/**
 * Resolves the accurate clinical reference range matching the patient's age and sex
 */
export function resolveAgeSexReferenceRange(
  parameterName: string,
  currentRange: string = '',
  patientAge: number = 35,
  patientGender: 'M' | 'F' | 'Otro' | string = 'M',
  customAgeGenderRanges?: ProfileTestAgeGenderRange[],
  preferDemographicStandard: boolean = false
): {
  effectiveRange: string;
  min?: number;
  max?: number;
  isAgeSexSpecific: boolean;
  demographicRuleApplied: string;
  isCustomConfigured: boolean;
  panicMin?: number;
  panicMax?: number;
} {
  const normName = (parameterName || '').toLowerCase().trim();
  const genderNorm = (patientGender || 'M').toUpperCase().startsWith('F') ? 'F' : 'M';

  // 1. Check if parameter has custom configured ageGenderRanges in profile
  if (customAgeGenderRanges && customAgeGenderRanges.length > 0) {
    const matched = customAgeGenderRanges.find(rg => {
      const genderMatch = rg.gender === 'todos' || 
        (rg.gender === 'masculino' && genderNorm === 'M') ||
        (rg.gender === 'femenino' && genderNorm === 'F');
      
      const minAge = rg.minAge !== undefined && rg.minAge !== '' ? Number(rg.minAge) : 0;
      const maxAge = rg.maxAge !== undefined && rg.maxAge !== '' ? Number(rg.maxAge) : 150;
      const ageMatch = patientAge >= minAge && patientAge <= maxAge;

      return genderMatch && ageMatch;
    });

    if (matched) {
      const min = matched.minRange !== undefined && matched.minRange !== '' ? Number(matched.minRange) : undefined;
      const max = matched.maxRange !== undefined && matched.maxRange !== '' ? Number(matched.maxRange) : undefined;
      return {
        effectiveRange: matched.referenceRange || (min !== undefined && max !== undefined ? `${min} - ${max}` : currentRange),
        min,
        max,
        isAgeSexSpecific: true,
        demographicRuleApplied: `Rango configurado: ${matched.gender} (${matched.minAge || 0}-${matched.maxAge || 120}a)`,
        isCustomConfigured: true
      };
    }
  }

  // 2. Check if current range string embeds male/female sub-ranges (e.g. H: 13.5-17.5 / M: 12.0-15.5)
  const multiGenderMatch = parseMultiGenderRange(currentRange, genderNorm);
  if (multiGenderMatch) {
    return {
      effectiveRange: multiGenderMatch.rangeText || currentRange,
      min: multiGenderMatch.min,
      max: multiGenderMatch.max,
      isAgeSexSpecific: true,
      demographicRuleApplied: `Ref. Sexo: ${genderNorm === 'M' ? '♂ Hombres' : '♀ Mujeres'}`,
      isCustomConfigured: false
    };
  }

  // 3. Match against clinical standard database for ubiquitous laboratory tests
  const standardMatch = CLINICAL_DEMOGRAPHIC_STANDARDS.find(std =>
    std.aliases.some(alias => normName.includes(alias))
  );

  if (standardMatch) {
    const evaluated = standardMatch.evaluate(patientAge, genderNorm);
    const shouldUseEvaluated = preferDemographicStandard || 
      !currentRange || 
      currentRange === '-' || 
      currentRange === '—' || 
      currentRange.toLowerCase().includes('estándar') ||
      currentRange.toLowerCase().includes('clinico') ||
      currentRange.includes('/') ||
      currentRange.includes('|');

    return {
      effectiveRange: shouldUseEvaluated ? evaluated.rangeText : currentRange,
      min: evaluated.min,
      max: evaluated.max,
      isAgeSexSpecific: standardMatch.isSexSpecific || standardMatch.isAgeSpecific,
      demographicRuleApplied: evaluated.demographicLabel,
      isCustomConfigured: false,
      panicMin: evaluated.panicMin,
      panicMax: evaluated.panicMax
    };
  }

  // 4. Default: parse standard range string
  const parsed = parseReferenceRange(currentRange);
  return {
    effectiveRange: currentRange || '—',
    min: parsed.min,
    max: parsed.max,
    isAgeSexSpecific: false,
    demographicRuleApplied: 'Rango Estándar General',
    isCustomConfigured: false
  };
}

/**
 * Builds pre-calibrated report parameters for an array of requested test names,
 * automatically applying CLSI age and sex calibrated reference intervals.
 */
export function generateDemographicParametersForTests(
  testsList: string[],
  patientAge: number = 35,
  patientGender: 'M' | 'F' | 'Otro' | string = 'M',
  catalogTests?: LabCatalogItem[],
  // Códigos reales del catálogo (examen.codigo_examen, ej. "PAN-01"),
  // paralelos a testsList por índice -mismo orden en el que
  // NewOrderRegistration.tsx arma `selectedTests`/`examCodes` al crear la
  // orden real. Al tenerlos, cada ReportParameter generado para un test
  // queda etiquetado con el examCode que lo originó (ver el bucle de abajo),
  // lo cual permite después agrupar los parámetros por examen real y
  // mapearlos 1:1 a un id_detalle_orden/resultado del backend (ver
  // ClinicContext.tsx `addReport` y `LabOrder.detalleRemoto`). Es opcional y
  // retrocompatible: si no se pasa, o falta algún código, esos parámetros
  // simplemente no quedan etiquetados (como antes de este cambio).
  testCodes?: Array<string | undefined>
): ReportParameter[] {
  const params: ReportParameter[] = [];
  let pId = 1;

  testsList.forEach((tName, testIdx) => {
    const lower = tName.toLowerCase();
    const examCode = testCodes?.[testIdx];
    // Índice donde empiezan los parámetros de ESTE test en particular -un
    // test puede explotar en varios ReportParameter (ej. hemograma -> 5
    // sub-parámetros); todos comparten el mismo examCode porque todos
    // provienen del mismo examen/detalle_orden real.
    const paramsStartIdx = params.length;

    // Check if matching catalog item exists
    const catalogMatch = catalogTests?.find(c =>
      c.name.toLowerCase() === lower ||
      c.code.toLowerCase() === lower ||
      lower.includes(c.name.toLowerCase())
    );

    // Common Hemogram Profile
    if (lower.includes('hemograma') || lower.includes('hematolog') || lower.includes('cbc') || lower.includes('biometria')) {
      const hemoSub = [
        { name: 'Leucocitos Totales', unit: '/mm³', sampleVal: '6800', sampleType: 'Sangre Total (EDTA)', method: 'Citometría de Flujo / Impedancia' },
        { name: 'Hemoglobina', unit: 'g/dL', sampleVal: '14.2', sampleType: 'Sangre Total (EDTA)', method: 'Fotometría SLS / Cianometahemoglobina' },
        { name: 'Hematocrito', unit: '%', sampleVal: '42.5', sampleType: 'Sangre Total (EDTA)', method: 'Impedancia / Cálculo Automatizado' },
        { name: 'Eritrocitos (RBC)', unit: 'x10^6/µL', sampleVal: '4.80', sampleType: 'Sangre Total (EDTA)', method: 'Conteo Óptico Focalizado' },
        { name: 'Plaquetas', unit: '/mm³', sampleVal: '240000', sampleType: 'Sangre Total (EDTA)', method: 'Impedancia Eléctrica Apertura' }
      ];

      hemoSub.forEach(sub => {
        const resolved = resolveAgeSexReferenceRange(sub.name, '', patientAge, patientGender, undefined, true);
        params.push({
          id: `p-${pId++}`,
          name: sub.name,
          value: sub.sampleVal,
          unit: sub.unit,
          referenceRange: resolved.effectiveRange,
          minVal: resolved.min,
          maxVal: resolved.max,
          status: 'normal',
          sampleType: sub.sampleType,
          methodology: sub.method,
          notes: resolved.demographicRuleApplied
        });
      });
    } else if (lower.includes('lipid') || lower.includes('colest') || lower.includes('trigli')) {
      const lipidSub = [
        { name: 'Colesterol Total', unit: 'mg/dL', sampleVal: '185', sampleType: 'Suero', method: 'CHOD-PAP Enzimático Colorimétrico' },
        { name: 'Triglicéridos Séricos', unit: 'mg/dL', sampleVal: '135', sampleType: 'Suero', method: 'GPO-PAP Enzimático' },
        { name: 'Colesterol HDL (Protector)', unit: 'mg/dL', sampleVal: patientGender.toUpperCase().startsWith('F') ? '58' : '46', sampleType: 'Suero', method: 'Inmuno-inhibición Directa' },
        { name: 'Colesterol LDL', unit: 'mg/dL', sampleVal: '95', sampleType: 'Suero', method: 'Fórmula de Friedewald Modificada' }
      ];

      lipidSub.forEach(sub => {
        const resolved = resolveAgeSexReferenceRange(sub.name, '', patientAge, patientGender, undefined, true);
        params.push({
          id: `p-${pId++}`,
          name: sub.name,
          value: sub.sampleVal,
          unit: sub.unit,
          referenceRange: resolved.effectiveRange,
          minVal: resolved.min,
          maxVal: resolved.max,
          status: 'normal',
          sampleType: sub.sampleType,
          methodology: sub.method,
          notes: resolved.demographicRuleApplied
        });
      });
    } else if (lower.includes('creat') || lower.includes('urea') || lower.includes('renal') || lower.includes('bun')) {
      const renalSub = [
        { name: 'Creatinina en Suero', unit: 'mg/dL', sampleVal: patientGender.toUpperCase().startsWith('F') ? '0.75' : '0.95', sampleType: 'Suero', method: 'Cinética Jaffé Compensada IDMS' },
        { name: 'Nitrógeno de Urea (BUN)', unit: 'mg/dL', sampleVal: '14.0', sampleType: 'Suero', method: 'Ureasa / GLDH UV' },
        { name: 'Ácido Úrico', unit: 'mg/dL', sampleVal: patientGender.toUpperCase().startsWith('F') ? '4.2' : '5.5', sampleType: 'Suero', method: 'Uricasa-PAP Enzimático' }
      ];

      renalSub.forEach(sub => {
        const resolved = resolveAgeSexReferenceRange(sub.name, '', patientAge, patientGender, undefined, true);
        params.push({
          id: `p-${pId++}`,
          name: sub.name,
          value: sub.sampleVal,
          unit: sub.unit,
          referenceRange: resolved.effectiveRange,
          minVal: resolved.min,
          maxVal: resolved.max,
          status: 'normal',
          sampleType: sub.sampleType,
          methodology: sub.method,
          notes: resolved.demographicRuleApplied
        });
      });
    } else if (lower.includes('glucosa') || lower.includes('glicemia') || lower.includes('azucar')) {
      const resolved = resolveAgeSexReferenceRange('Glucosa en Ayunas', '', patientAge, patientGender, undefined, true);
      params.push({
        id: `p-${pId++}`,
        name: 'Glucosa en Ayunas',
        value: '92',
        unit: 'mg/dL',
        referenceRange: resolved.effectiveRange,
        minVal: resolved.min,
        maxVal: resolved.max,
        status: 'normal',
        sampleType: 'Suero / Plasma Fluoruro',
        methodology: 'Glucosa Oxidasa / Hexoquinasa',
        notes: resolved.demographicRuleApplied
      });
    } else if (lower.includes('urin') || lower.includes('ego') || lower.includes('orina')) {
      params.push(
        {
          id: `p-${pId++}`,
          name: 'Aspecto y Color',
          value: 'Transparente / Amarillo Paja',
          unit: '-',
          referenceRange: 'Transparente / Amarillo',
          status: 'normal',
          methodology: 'Examen Físico Macroscópico',
          sampleType: 'Orina Espontánea'
        },
        {
          id: `p-${pId++}`,
          name: 'Densidad Específica',
          value: '1.018',
          unit: '-',
          referenceRange: '1.005 - 1.030',
          minVal: 1.005,
          maxVal: 1.030,
          status: 'normal',
          methodology: 'Refractometría / Tira Reactiva',
          sampleType: 'Orina Espontánea'
        },
        {
          id: `p-${pId++}`,
          name: 'Proteínas y Glucosa en Orina',
          value: 'Negativo (Normal)',
          unit: 'mg/dL',
          referenceRange: 'Negativo (< 15 mg/dL)',
          status: 'normal',
          methodology: 'Colorimetría / Tira Reactiva',
          sampleType: 'Orina Espontánea'
        },
        {
          id: `p-${pId++}`,
          name: 'Sedimento Microscópico (Leucocitos)',
          value: '1 - 2 por campo',
          unit: 'x campo 40x',
          referenceRange: '0 - 3 por campo',
          status: 'normal',
          methodology: 'Microscopía Óptica',
          sampleType: 'Orina Espontánea'
        }
      );
    } else if (catalogMatch) {
      const resolved = resolveAgeSexReferenceRange(catalogMatch.name, catalogMatch.referenceRange || '', patientAge, patientGender, undefined, true);
      params.push({
        id: `p-${pId++}`,
        name: catalogMatch.name,
        value: 'NORMAL',
        unit: catalogMatch.unit || 'mg/dL',
        referenceRange: resolved.effectiveRange,
        minVal: resolved.min,
        maxVal: resolved.max,
        status: 'normal',
        sampleType: catalogMatch.sampleType || 'Suero',
        methodology: catalogMatch.methodology || 'Ensayo Clínico Automatizado',
        notes: resolved.demographicRuleApplied
      });
    } else {
      const resolved = resolveAgeSexReferenceRange(tName, '', patientAge, patientGender, undefined, true);
      params.push({
        id: `p-${pId++}`,
        name: tName,
        value: 'NORMAL / NEGATIVO',
        unit: 'Resultado',
        referenceRange: resolved.effectiveRange !== '—' ? resolved.effectiveRange : 'Valores de Referencia Estándar',
        minVal: resolved.min,
        maxVal: resolved.max,
        status: 'normal',
        sampleType: 'Suero / Muestra Biológica',
        methodology: 'Metodología Estandarizada CLSI',
        notes: resolved.demographicRuleApplied
      });
    }

    if (examCode) {
      for (let i = paramsStartIdx; i < params.length; i++) {
        params[i].examCode = examCode;
      }
    }
  });

  return params;
}

/**
 * Parses reference range string into numerical bounds if possible
 */
export function parseReferenceRange(rangeStr: string): { min?: number; max?: number; isQualitative?: boolean } {
  if (!rangeStr || typeof rangeStr !== 'string') return {};

  const clean = rangeStr.trim().toLowerCase();

  // Qualitative checks
  if (
    clean.includes('negativo') || 
    clean.includes('no reactivo') || 
    clean.includes('ausente') || 
    clean.includes('normal') || 
    clean.includes('claro')
  ) {
    return { isQualitative: true };
  }

  // Range format: "70 - 100" or "70-100" or "70.5 - 100.5" or "0.8 a 1.2"
  const rangeMatch = clean.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:-|–|—|a|hasta)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      return { min, max };
    }
  }

  // Less than: "< 200" or "<= 200" or "hasta 200" or "<200"
  const lessMatch = clean.match(/(?:<|<=|menor a|hasta)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (lessMatch) {
    const max = parseFloat(lessMatch[1]);
    if (!isNaN(max)) {
      return { min: 0, max };
    }
  }

  // Greater than: "> 50" or ">= 50" or "mayor a 50" or ">50"
  const greaterMatch = clean.match(/(?:>|>=|mayor a|superior a)\s*([0-9]+(?:\.[0-9]+)?)/i);
  if (greaterMatch) {
    const min = parseFloat(greaterMatch[1]);
    if (!isNaN(min)) {
      return { min };
    }
  }

  return {};
}

/**
 * Automatically evaluates numerical and text test values against reference ranges
 */
export function evaluateParameterStatus(
  value: string | number, 
  referenceRange: string, 
  customMin?: number, 
  customMax?: number
): ParameterStatus {
  if (value === undefined || value === null || value === '') {
    return 'normal';
  }

  const strVal = String(value).trim().toLowerCase();

  // Qualitative checks
  if (strVal === 'positivo' || strVal === 'reactivo' || strVal === 'detectado' || strVal === 'anormal') {
    if (referenceRange && (referenceRange.toLowerCase().includes('negativo') || referenceRange.toLowerCase().includes('no reactivo'))) {
      return 'high';
    }
  }

  if (strVal === 'negativo' || strVal === 'no reactivo' || strVal === 'no detectado' || strVal === 'normal') {
    return 'normal';
  }

  // Numerical evaluation
  const numVal = parseFloat(strVal.replace(/[^0-9.-]/g, ''));
  if (isNaN(numVal)) {
    return 'normal';
  }

  let min = customMin;
  let max = customMax;

  if (min === undefined && max === undefined && referenceRange) {
    const parsed = parseReferenceRange(referenceRange);
    min = parsed.min;
    max = parsed.max;
  }

  if (min !== undefined && max !== undefined) {
    if (numVal < min) {
      if (min > 0 && numVal < min * 0.7) return 'critical';
      return 'low';
    }
    if (numVal > max) {
      if (numVal > max * 1.5) return 'critical';
      return 'high';
    }
    return 'normal';
  }

  if (max !== undefined) {
    if (numVal > max) {
      if (numVal > max * 1.5) return 'critical';
      return 'high';
    }
    return 'normal';
  }

  if (min !== undefined) {
    if (numVal < min) {
      if (min > 0 && numVal < min * 0.7) return 'critical';
      return 'low';
    }
    return 'normal';
  }

  return 'normal';
}

export interface ParameterDeviationInfo {
  isOutOfRange: boolean;
  isCritical: boolean;
  alertLevel: DeviationAlertLevel; // 'normal' | 'amber' (moderado) | 'red' (severo/crítico)
  status: ParameterStatus;
  deviationText: string;
  badgeLabel: string;
  percentDiff?: number;
  effectiveRange: string;
  min?: number;
  max?: number;
  demographicRuleApplied?: string;
  isAgeSexSpecific: boolean;
  gaugePosition: number; // 0 to 100% position along the visual indicator
  gaugeZone: 'low-red' | 'low-amber' | 'normal' | 'high-amber' | 'high-red';
  ageGroupLabel?: string;
  clinicalInterpretation?: string;
}

/**
 * Options for evaluating a parameter with demographic intelligence
 */
export interface EvaluateParameterOptions {
  patientAge?: number;
  patientGender?: 'M' | 'F' | 'Otro' | string;
  parameterName?: string;
  ageGenderRanges?: ProfileTestAgeGenderRange[];
  panicMin?: number;
  panicMax?: number;
}

/**
 * Provee evaluación detallada de desviación con texto explicativo, porcentaje,
 * clasificación de alerta en ÁMBAR o ROJO, y cálculo para visualización gráfica.
 */
export function evaluateParameterDetailed(
  value: string | number,
  referenceRange: string,
  customMin?: number,
  customMax?: number,
  currentStatus?: ParameterStatus,
  options?: EvaluateParameterOptions
): ParameterDeviationInfo {
  if (value === undefined || value === null || String(value).trim() === '') {
    return {
      isOutOfRange: false,
      isCritical: false,
      alertLevel: 'normal',
      status: currentStatus || 'normal',
      deviationText: 'Sin valor',
      badgeLabel: 'Vacío',
      effectiveRange: referenceRange || '—',
      isAgeSexSpecific: false,
      gaugePosition: 50,
      gaugeZone: 'normal'
    };
  }

  const strVal = String(value).trim().toLowerCase();
  const numVal = parseFloat(strVal.replace(/[^0-9.-]/g, ''));
  
  // Resolve demographic-specific bounds if age or gender or parameter name is provided
  let min = customMin;
  let max = customMax;
  let effectiveRange = referenceRange;
  let demographicRuleApplied: string | undefined;
  let isAgeSexSpecific = false;
  let panicMin = options?.panicMin;
  let panicMax = options?.panicMax;

  if (options?.patientAge !== undefined || options?.patientGender || options?.parameterName) {
    const demoResolution = resolveAgeSexReferenceRange(
      options?.parameterName || '',
      referenceRange,
      options?.patientAge,
      options?.patientGender,
      options?.ageGenderRanges
    );
    if (min === undefined) min = demoResolution.min;
    if (max === undefined) max = demoResolution.max;
    effectiveRange = demoResolution.effectiveRange || referenceRange;
    demographicRuleApplied = demoResolution.demographicRuleApplied;
    isAgeSexSpecific = demoResolution.isAgeSexSpecific;
    if (panicMin === undefined) panicMin = demoResolution.panicMin;
    if (panicMax === undefined) panicMax = demoResolution.panicMax;
  } else if (min === undefined && max === undefined && referenceRange) {
    const parsed = parseReferenceRange(referenceRange);
    min = parsed.min;
    max = parsed.max;
  }

  // Respetamos o calculamos el status
  let computedStatus = currentStatus;
  if (!computedStatus || computedStatus === 'normal') {
    computedStatus = evaluateParameterStatus(value, effectiveRange, min, max);
  }

  // Cálculos numéricos y clasificación de severidad ÁMBAR / ROJO
  let percentDiff: number | undefined;
  let deviationText = 'Dentro del rango esperado para la edad y sexo';
  let badgeLabel = 'NORMAL';
  let alertLevel: DeviationAlertLevel = 'normal';
  let gaugeZone: 'low-red' | 'low-amber' | 'normal' | 'high-amber' | 'high-red' = 'normal';
  let gaugePosition = 50; // 0 - 100%

  if (!isNaN(numVal)) {
    if (max !== undefined && numVal > max) {
      percentDiff = max > 0 ? Math.round(((numVal - max) / max) * 100) : 100;
      
      // Determine if Red (severe/critical/panic) or Amber (moderate out-of-range)
      const isPanic = (panicMax !== undefined && numVal >= panicMax) || percentDiff >= 40 || computedStatus === 'critical';
      
      if (isPanic) {
        alertLevel = 'red';
        computedStatus = 'critical';
        badgeLabel = 'CRÍTICO ▲ (ROJO)';
        gaugeZone = 'high-red';
        gaugePosition = Math.min(100, 85 + Math.round((percentDiff / 100) * 15));
        deviationText = `+${percentDiff}% sobre el límite máximo (${max}). Alerta Crítica (Rojo).`;
      } else {
        alertLevel = 'amber';
        computedStatus = 'high';
        badgeLabel = 'ELEVADO ▲ (ÁMBAR)';
        gaugeZone = 'high-amber';
        gaugePosition = Math.min(84, 70 + Math.round((percentDiff / 40) * 14));
        deviationText = `+${percentDiff}% sobre el límite máximo (${max}). Alerta Moderada (Ámbar).`;
      }
    } else if (min !== undefined && numVal < min) {
      percentDiff = min > 0 ? Math.round(((min - numVal) / min) * 100) : undefined;
      
      const isPanic = (panicMin !== undefined && numVal <= panicMin) || (percentDiff !== undefined && percentDiff >= 30) || computedStatus === 'critical';
      
      if (isPanic) {
        alertLevel = 'red';
        computedStatus = 'critical';
        badgeLabel = 'CRÍTICO ▼ (ROJO)';
        gaugeZone = 'low-red';
        gaugePosition = Math.max(0, 15 - Math.round(((percentDiff || 40) / 100) * 15));
        deviationText = percentDiff 
          ? `-${percentDiff}% bajo el límite mínimo (${min}). Alerta Crítica (Rojo).`
          : `Bajo el mínimo (${min}). Alerta Crítica (Rojo).`;
      } else {
        alertLevel = 'amber';
        computedStatus = 'low';
        badgeLabel = 'BAJO ▼ (ÁMBAR)';
        gaugeZone = 'low-amber';
        gaugePosition = Math.max(16, 30 - Math.round(((percentDiff || 15) / 30) * 14));
        deviationText = percentDiff
          ? `-${percentDiff}% bajo el límite mínimo (${min}). Alerta Moderada (Ámbar).`
          : `Bajo el mínimo (${min}). Alerta Moderada (Ámbar).`;
      }
    } else {
      // Normal inside range
      alertLevel = 'normal';
      gaugeZone = 'normal';
      if (min !== undefined && max !== undefined && max > min) {
        const span = max - min;
        const offset = numVal - min;
        gaugePosition = 30 + Math.round((offset / span) * 40); // Between 30% and 70%
      } else {
        gaugePosition = 50;
      }
      deviationText = 'Resultado normal para la edad y sexo del paciente';
      badgeLabel = 'NORMAL';
    }
  } else {
    // Qualitative evaluation
    if (strVal === 'positivo' || strVal === 'reactivo' || strVal === 'detectado' || strVal === 'anormal') {
      const isCriticalQual = strVal === 'reactivo' || computedStatus === 'critical';
      alertLevel = isCriticalQual ? 'red' : 'amber';
      computedStatus = isCriticalQual ? 'critical' : 'high';
      badgeLabel = isCriticalQual ? 'REACTIVO (ROJO)' : 'ANORMAL (ÁMBAR)';
      gaugeZone = isCriticalQual ? 'high-red' : 'high-amber';
      gaugePosition = isCriticalQual ? 95 : 80;
      deviationText = 'Resultado reactivo fuera de lo esperado clínicamente';
    }
  }

  const isCritical = alertLevel === 'red' || computedStatus === 'critical';
  const isOutOfRange = alertLevel === 'amber' || alertLevel === 'red';

  return {
    isOutOfRange,
    isCritical,
    alertLevel,
    status: computedStatus,
    deviationText,
    badgeLabel,
    percentDiff,
    effectiveRange,
    min,
    max,
    demographicRuleApplied,
    isAgeSexSpecific,
    gaugePosition,
    gaugeZone,
    ageGroupLabel: getAgeGroupDescription(options?.patientAge),
    clinicalInterpretation: isOutOfRange 
      ? (alertLevel === 'red' 
          ? `Alerta Severa / Crítica (Rojo): Desviación acentuada respecto al intervalo de referencia de ${options?.patientGender === 'M' ? 'varón' : 'mujer'} de ${options?.patientAge || 35} años.`
          : `Alerta Moderada (Ámbar): Valor fuera de rango con desviación leve a moderada según edad y sexo.`)
      : 'Parámetro biológicamente adecuado según grupo etario y sexo.'
  };
}

/**
 * Common units used in clinical pathology
 */
export const COMMON_LAB_UNITS = [
  'mg/dL',
  'g/dL',
  'UI/L',
  'U/L',
  'ng/mL',
  'pg/mL',
  'mEq/L',
  'mmol/L',
  'µUI/mL',
  'µg/dL',
  'mm/h',
  '%',
  'x10^3/µL',
  'x10^6/µL',
  'fL',
  'pg',
  'cel/campo',
  'Índice',
  'segundos',
  'mg/24h',
  'ml/min'
];

/**
 * Common reference range templates for quick insertion
 */
export const COMMON_REFERENCE_PRESETS = [
  { label: 'Glucosa Ayunas (70 - 100 mg/dL)', range: '70 - 100 mg/dL' },
  { label: 'Colesterol Total (< 200 mg/dL)', range: '< 200 mg/dL' },
  { label: 'Triglicéridos (< 150 mg/dL)', range: '< 150 mg/dL' },
  { label: 'Hemoglobina Hombres (13.5 - 17.5 g/dL)', range: '13.5 - 17.5 g/dL' },
  { label: 'Hemoglobina Mujeres (12.0 - 15.5 g/dL)', range: '12.0 - 15.5 g/dL' },
  { label: 'Leucocitos (4.5 - 11.0 x10^3/µL)', range: '4.5 - 11.0 x10^3/µL' },
  { label: 'Plaquetas (150 - 450 x10^3/µL)', range: '150 - 450 x10^3/µL' },
  { label: 'Creatinina (0.6 - 1.2 mg/dL)', range: '0.6 - 1.2 mg/dL' },
  { label: 'Ácido Úrico (3.5 - 7.2 mg/dL)', range: '3.5 - 7.2 mg/dL' },
  { label: 'TSH (0.4 - 4.5 µUI/mL)', range: '0.4 - 4.5 µUI/mL' },
  { label: 'Negativo / No Reactivo', range: 'No Reactivo' },
  { label: '0 - 5 por campo', range: '0 - 5 / campo' }
];
