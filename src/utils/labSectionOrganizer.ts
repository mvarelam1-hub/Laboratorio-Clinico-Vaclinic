import { ReportParameter, ReportCategory } from '../types';

export interface ParameterGroupSection {
  id: string;
  title: string;
  code: string;
  color: 'rose' | 'cyan' | 'amber' | 'emerald' | 'purple' | 'blue' | 'indigo' | 'slate' | 'teal';
  iconType: string;
  sampleType?: string;
  methodology?: string;
  parameters: ReportParameter[];
  stats: {
    total: number;
    normal: number;
    high: number;
    low: number;
    critical: number;
    altered: number;
  };
}

/**
 * Catálogo de secciones y áreas comunes de laboratorio clínico
 */
export const COMMON_LAB_SECTIONS = [
  // Hematología
  'Serie Roja (Eritrocitaria)',
  'Serie Blanca (Leucocitaria)',
  'Plaquetas & Coagulación',
  'Morfología Sanguínea (Frotis)',
  // Bioquímica
  'Metabolismo & Glucemia',
  'Perfil Lipídico & Riesgo Cardiovascular',
  'Función Renal',
  'Electrolitos Séricos',
  'Función Hepática & Enzimas',
  'Proteínas & Fracciones',
  'Marcadores Cardíacos',
  // Uroanálisis
  'Examen Físico de Orina',
  'Examen Químico (Tira Reactiva)',
  'Sedimento Microscópico Urinario',
  // Coprología
  'Examen Macroscópico Fecal',
  'Examen Microscópico Parasitológico',
  'Química Fecal & Sangre Oculta',
  // Inmunología & Hormonas
  'Perfil Tiroideo',
  'Hormonas & Fertilidad',
  'Serología & Enfermedades Infecciosas',
  'Inmunología & Autoinmunidad',
  'Marcadores Tumorales',
  // Microbiología
  'Examen Microscópico Directo (Gram / Tinciones)',
  'Cultivo & Antibiograma',
  // General
  'Determinaciones Generales'
];

/**
 * Detecta inteligentemente el área o sección correspondiente para un parámetro
 * de laboratorio según su nombre y la categoría del reporte.
 */
export function detectParameterSection(paramName: string, category?: ReportCategory | string): string {
  const norm = paramName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 1. Hematología: Serie Roja
  if (
    norm.includes('eritrocito') || 
    norm.includes('globulo rojo') || 
    norm.includes('hemoglobina') && !norm.includes('glicosilada') && !norm.includes('hba1c') || 
    norm.includes('hematocrito') || 
    norm.includes('vcm') || 
    norm.includes('hcm') || 
    norm.includes('chcm') || 
    norm.includes('rdw') || 
    norm.includes('reticulocito') ||
    norm.includes('volumen corpuscular') ||
    norm.includes('hemoglobina corpuscular')
  ) {
    return 'Serie Roja (Eritrocitaria)';
  }

  // 2. Hematología: Serie Blanca
  if (
    norm.includes('leucocito') || 
    norm.includes('globulo blanco') || 
    norm.includes('neutrofilo') || 
    norm.includes('linfocito') || 
    norm.includes('monocito') || 
    norm.includes('eosinofilo') || 
    norm.includes('basofilo') || 
    norm.includes('cayado') || 
    norm.includes('banda') ||
    norm.includes('abastonado') ||
    norm.includes('mielocito') ||
    norm.includes('metamielocito')
  ) {
    return 'Serie Blanca (Leucocitaria)';
  }

  // 3. Hematología: Plaquetas y Coagulación
  if (
    norm.includes('plaqueta') || 
    norm.includes('vpm') || 
    norm.includes('tiempo de protrombina') || 
    norm.includes('tp') && norm.length <= 4 || 
    norm.includes('ttpa') || 
    norm.includes('inr') || 
    norm.includes('fibrinogeno') || 
    norm.includes('dimero d') ||
    norm.includes('tiempo de trombina')
  ) {
    return 'Plaquetas & Coagulación';
  }

  // 4. Uroanálisis: Examen Físico
  if (
    norm.includes('color') || 
    norm.includes('aspecto') || 
    norm.includes('olor') || 
    norm.includes('densidad') ||
    norm.includes('turbidez')
  ) {
    if (category === 'laboratorio' || norm.includes('orina') || norm.includes('urinario')) {
      return 'Examen Físico de Orina';
    }
  }

  // 5. Uroanálisis: Examen Químico (Tira Reactiva)
  if (
    norm.includes('ph') && (norm.includes('orina') || category === 'laboratorio') ||
    norm.includes('proteina') && norm.includes('orina') ||
    norm.includes('glucosa en orina') ||
    norm.includes('cuerpos cetonico') ||
    norm.includes('cetona') ||
    norm.includes('urobilinogeno') ||
    norm.includes('nitrito') ||
    norm.includes('esterasa leucocitaria') ||
    norm.includes('sangre oculta') && norm.includes('orina')
  ) {
    return 'Examen Químico (Tira Reactiva)';
  }

  // 6. Uroanálisis: Sedimento Microscópico
  if (
    norm.includes('sedimento') ||
    norm.includes('celulas epiteliales') ||
    norm.includes('cristales') ||
    norm.includes('cilindros') ||
    norm.includes('bacterias') && (norm.includes('campo') || category === 'laboratorio') ||
    norm.includes('hematies') && norm.includes('campo') ||
    norm.includes('leucocitos') && norm.includes('campo') ||
    norm.includes('mucus') || norm.includes('moco') && category === 'laboratorio'
  ) {
    return 'Sedimento Microscópico Urinario';
  }

  // 7. Coprología: Macroscópico
  if (
    norm.includes('consistencia') ||
    norm.includes('restos alimenticios') ||
    (norm.includes('color') || norm.includes('aspecto')) && (norm.includes('heces') || norm.includes('fecal'))
  ) {
    return 'Examen Macroscópico Fecal';
  }

  // 8. Coprología: Microscópico Parasitológico
  if (
    norm.includes('quiste') ||
    norm.includes('trofozoito') ||
    norm.includes('parasito') ||
    norm.includes('helminto') ||
    norm.includes('huevo') ||
    norm.includes('larva') ||
    norm.includes('ameba') ||
    norm.includes('giardia') ||
    norm.includes('blastocystis') ||
    norm.includes('leucocitos fecales')
  ) {
    return 'Examen Microscópico Parasitológico';
  }

  // 9. Bioquímica: Metabolismo y Glucemia
  if (
    norm.includes('glucosa') || 
    norm.includes('glicemia') || 
    norm.includes('hba1c') || 
    norm.includes('hemoglobina glicosilada') || 
    norm.includes('insulina') || 
    norm.includes('curva de tolerancia') || 
    norm.includes('indice homa') ||
    norm.includes('fructosamina')
  ) {
    return 'Metabolismo & Glucemia';
  }

  // 10. Bioquímica: Perfil Lipídico
  if (
    norm.includes('colesterol') || 
    norm.includes('triglicerido') || 
    norm.includes('hdl') || 
    norm.includes('ldl') || 
    norm.includes('vldl') || 
    norm.includes('aterogenico') || 
    norm.includes('lipoproteina') ||
    norm.includes('apolipoproteina')
  ) {
    return 'Perfil Lipídico & Riesgo Cardiovascular';
  }

  // 11. Bioquímica: Función Renal
  if (
    norm.includes('creatinina') || 
    norm.includes('urea') || 
    norm.includes('bun') || 
    norm.includes('acido urico') || 
    norm.includes('filtrado glomerular') || 
    norm.includes('egfr') || 
    norm.includes('depuracion') ||
    norm.includes('microalbumina')
  ) {
    return 'Función Renal';
  }

  // 12. Bioquímica: Electrolitos
  if (
    norm.includes('sodio') || 
    norm.includes('potasio') || 
    norm.includes('cloro') || 
    norm.includes('calcio') || 
    norm.includes('fosforo') || 
    norm.includes('magnesio') || 
    norm.includes('electrolito')
  ) {
    return 'Electrolitos Séricos';
  }

  // 13. Bioquímica: Función Hepática & Enzimas
  if (
    norm.includes('tgo') || 
    norm.includes('tgp') || 
    norm.includes('ast') || 
    norm.includes('alt') || 
    norm.includes('transaminasa') || 
    norm.includes('bilirrubina') || 
    norm.includes('fosfatasa alcalina') || 
    norm.includes('ggt') || 
    norm.includes('gamma glutamil') || 
    norm.includes('amilasa') || 
    norm.includes('lipasa') || 
    norm.includes('ldh') || 
    norm.includes('deshidrogenasa')
  ) {
    return 'Función Hepática & Enzimas';
  }

  // 14. Bioquímica: Proteínas
  if (
    norm.includes('proteinas totales') || 
    norm.includes('albumina') && !norm.includes('micro') || 
    norm.includes('globulina') || 
    norm.includes('relacion a/g')
  ) {
    return 'Proteínas & Fracciones';
  }

  // 15. Hormonas: Perfil Tiroideo
  if (
    norm.includes('tsh') || 
    norm.includes('t4 libre') || 
    norm.includes('t4 total') || 
    norm.includes('t3 libre') || 
    norm.includes('t3 total') || 
    norm.includes('tiroglobulina') || 
    norm.includes('anti-tpo') || 
    norm.includes('tiroideo')
  ) {
    return 'Perfil Tiroideo';
  }

  // 16. Hormonas & Fertilidad
  if (
    norm.includes('fsh') || 
    norm.includes('lh') || 
    norm.includes('prolactina') || 
    norm.includes('estradiol') || 
    norm.includes('progesterona') || 
    norm.includes('testosterona') || 
    norm.includes('bhcg') || 
    norm.includes('gonadotropina')
  ) {
    return 'Hormonas & Fertilidad';
  }

  // 17. Inmunología & Serología
  if (
    norm.includes('vdrl') || 
    norm.includes('rpr') || 
    norm.includes('vih') || 
    norm.includes('hiv') || 
    norm.includes('hepatitis') || 
    norm.includes('dengue') || 
    norm.includes('helicobacter') || 
    norm.includes('chagas') || 
    norm.includes('pcr cuantitativa') || 
    norm.includes('proteina c reactiva') || 
    norm.includes('vsg') || 
    norm.includes('factor reumatoide') || 
    norm.includes('antigeno') || 
    norm.includes('anticuerpo')
  ) {
    return 'Serología & Enfermedades Infecciosas';
  }

  // Fallback según categoría general
  if (category === 'hematologia') return 'Determinaciones Hematológicas';
  if (category === 'bioquimica') return 'Determinaciones Bioquímicas';
  if (category === 'radiologia') return 'Hallazgos Radiológicos';
  if (category === 'cardiologia') return 'Parámetros Cardiovasculares';
  if (category === 'patologia') return 'Hallazgos Histopatológicos';

  return 'Determinaciones Generales';
}

/**
 * Obtiene el color e icono para un nombre de sección
 */
export function getSectionVisuals(sectionName: string): {
  color: ParameterGroupSection['color'];
  iconType: string;
} {
  const norm = sectionName.toLowerCase();

  if (norm.includes('roja') || norm.includes('eritrocit')) {
    return { color: 'rose', iconType: 'droplet' };
  }
  if (norm.includes('blanca') || norm.includes('leucocit')) {
    return { color: 'blue', iconType: 'shield' };
  }
  if (norm.includes('plaqueta') || norm.includes('coagulacion')) {
    return { color: 'purple', iconType: 'layers' };
  }
  if (norm.includes('lipid') || norm.includes('cardio')) {
    return { color: 'indigo', iconType: 'heart' };
  }
  if (norm.includes('glucosa') || norm.includes('metabolismo') || norm.includes('glucem')) {
    return { color: 'amber', iconType: 'zap' };
  }
  if (norm.includes('renal') || norm.includes('electrolito')) {
    return { color: 'cyan', iconType: 'filter' };
  }
  if (norm.includes('hepatic') || norm.includes('enzima')) {
    return { color: 'emerald', iconType: 'flask' };
  }
  if (norm.includes('tiroid') || norm.includes('hormon')) {
    return { color: 'purple', iconType: 'sparkles' };
  }
  if (norm.includes('fisico')) {
    return { color: 'amber', iconType: 'eye' };
  }
  if (norm.includes('quimico') || norm.includes('tira')) {
    return { color: 'teal', iconType: 'flask' };
  }
  if (norm.includes('microscopic') || norm.includes('sedimento') || norm.includes('parasit')) {
    return { color: 'cyan', iconType: 'microscope' };
  }
  if (norm.includes('serolog') || norm.includes('inmuno')) {
    return { color: 'blue', iconType: 'shield' };
  }
  if (norm.includes('microbiol') || norm.includes('cultivo')) {
    return { color: 'emerald', iconType: 'bug' };
  }
  if (norm.includes('radiolog') || norm.includes('imagen')) {
    return { color: 'indigo', iconType: 'scan' };
  }

  return { color: 'slate', iconType: 'file' };
}

/**
 * Agrupa los parámetros por área o sección de manera ordenada y consistente.
 */
export function groupParametersBySection(
  parameters: ReportParameter[],
  defaultCategory?: ReportCategory | string
): ParameterGroupSection[] {
  if (!parameters || parameters.length === 0) return [];

  // Mapeo ordenado preservando el orden de aparición o categorización estándar
  const sectionMap = new Map<string, ReportParameter[]>();

  parameters.forEach((param) => {
    // Si el parámetro tiene sección definida (o área), úsala. Si no, detecta automáticamente.
    const sectionName = (param.section && param.section.trim()) || 
                        (param.area && param.area.trim()) || 
                        detectParameterSection(param.name, param.sampleType || defaultCategory);

    if (!sectionMap.has(sectionName)) {
      sectionMap.set(sectionName, []);
    }
    sectionMap.get(sectionName)!.push(param);
  });

  const sections: ParameterGroupSection[] = [];
  let index = 1;

  sectionMap.forEach((params, sectionName) => {
    const visuals = getSectionVisuals(sectionName);
    
    // Estadísticas del grupo
    const total = params.length;
    const normal = params.filter(p => p.status === 'normal').length;
    const high = params.filter(p => p.status === 'high').length;
    const low = params.filter(p => p.status === 'low').length;
    const critical = params.filter(p => p.status === 'critical').length;
    const altered = high + low + critical;

    // Detectar muestra predominante en esta sección
    const sampleType = params.find(p => p.sampleType)?.sampleType;
    const methodology = params.find(p => p.methodology)?.methodology;

    sections.push({
      id: `section-${index}`,
      title: sectionName,
      code: `SEC-${index < 10 ? '0' + index : index}`,
      color: visuals.color,
      iconType: visuals.iconType,
      sampleType,
      methodology,
      parameters: params,
      stats: {
        total,
        normal,
        high,
        low,
        critical,
        altered
      }
    });

    index++;
  });

  return sections;
}

/**
 * Reordena y categoriza una lista plana de parámetros asegurando que queden
 * agrupados por su respectiva área o sección clínica.
 */
export function organizeParametersByClinicalArea(
  parameters: ReportParameter[], 
  defaultCategory?: string
): ReportParameter[] {
  const sections = groupParametersBySection(parameters, defaultCategory);
  const organized: ReportParameter[] = [];

  sections.forEach(section => {
    section.parameters.forEach(param => {
      organized.push({
        ...param,
        section: param.section || section.title,
        sampleType: param.sampleType || section.sampleType,
      });
    });
  });

  return organized;
}
