export type ContainerCategory = 'tubo' | 'recipiente' | 'hisopo';

export interface TubeDefinition {
  id: string;
  name: string;
  shortName: string;
  containerType: ContainerCategory; // 'tubo' (venopunción/ensayo) | 'recipiente' (frasco recolección) | 'hisopo'
  capColorName: string;
  capHex: string;
  capBorderHex?: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  additive: string;
  sampleMatrix: string;
  inversions: string;
  drawOrder: number; // 1 to 8 according to CLSI H3-A6
  recommendedVolume: string;
  clinicalUse: string;
  commonTests: string[];
  handlingNotes: string;
}

export interface SampleTypeDefinition {
  id: string;
  name: string;
  category: 'sangre' | 'orina' | 'fecal' | 'respiratorio' | 'biologico' | 'otro';
  defaultTubeId?: string;
  preservation: string;
  fastingRecommended: boolean;
  notes: string;
}

export const LAB_SAMPLE_TYPES: SampleTypeDefinition[] = [
  {
    id: 'suero',
    name: 'Suero sanguíneo (Serum)',
    category: 'sangre',
    defaultTubeId: 'rojo_gel',
    preservation: 'Centrifugar a 3000 RPM x 10 min tras 30 min de coagulación. Estable 7 días a 2-8°C.',
    fastingRecommended: true,
    notes: 'Requiere retracción completa del coágulo antes del centrifugado.'
  },
  {
    id: 'sangre_total_edta',
    name: 'Sangre total con EDTA (Whole Blood)',
    category: 'sangre',
    defaultTubeId: 'lila',
    preservation: 'Mezclar suavemente por inversión 8-10 veces. No centrifugar. Estable 24h a 2-8°C.',
    fastingRecommended: false,
    notes: 'Indispensable para recuento celular hemático y morfología leucocitaria.'
  },
  {
    id: 'plasma_citratado',
    name: 'Plasma citratado (1:9 Citrato 3.2%)',
    category: 'sangre',
    defaultTubeId: 'celeste',
    preservation: 'Centrifugar inmediatamente a 1500g x 15 min para plasma pobre en plaquetas (PPP).',
    fastingRecommended: false,
    notes: 'Proporción estricta de 9 partes de sangre por 1 de citrato. Llenar exactamente hasta la marca.'
  },
  {
    id: 'plasma_heparina',
    name: 'Plasma con Heparina de Litio',
    category: 'sangre',
    defaultTubeId: 'verde',
    preservation: 'Invertir 8-10 veces. Centrifugar inmediatamente. No requiere tiempo de espera para coagulación.',
    fastingRecommended: true,
    notes: 'Ideal para química STAT de urgencias y electrolitos rápidos.'
  },
  {
    id: 'plasma_fluoruro',
    name: 'Plasma fluorurado / Glucosa',
    category: 'sangre',
    defaultTubeId: 'gris',
    preservation: 'Invertir 8-10 veces. Inhibe la glucólisis in vitro hasta por 24 horas a temperatura ambiente.',
    fastingRecommended: true,
    notes: 'Tubo de referencia para curvas de tolerancia a la glucosa y glucemias basales exactas.'
  },
  {
    id: 'orina_espontanea',
    name: 'Orina espontánea para Uroanálisis (EGO)',
    category: 'orina',
    defaultTubeId: 'frasco_orina',
    preservation: 'Procesar dentro de las 2 horas de recolección o refrigerar a 2-8°C máx 24 horas.',
    fastingRecommended: false,
    notes: 'Previo aseo genital. Descartar el primer chorro y recolectar la porción media en recipiente limpio.'
  },
  {
    id: 'urocultivo',
    name: 'Orina Estéril para Urocultivo (Chorro medio aséptico)',
    category: 'orina',
    defaultTubeId: 'frasco_urocultivo',
    preservation: 'Recipiente estéril hermético sellado. Procesar antes de 2 horas o refrigerar a 2-8°C máx 24 horas.',
    fastingRecommended: false,
    notes: 'Aseo genital riguroso sin antisépticos. Recolectar chorro medio directamente en frasco estéril sin tocar bordes internos.'
  },
  {
    id: 'orina_24h',
    name: 'Orina de 24 horas (Volumen cuantificado)',
    category: 'orina',
    defaultTubeId: 'galon_orina',
    preservation: 'Mantener en refrigeración durante todo el periodo de recolección. Anotar volumen total exacto.',
    fastingRecommended: false,
    notes: 'Descartar la primera orina del día de inicio y recolectar todas las micciones hasta la primera del día siguiente.'
  },
  {
    id: 'heces_frescas',
    name: 'Muestra fecal / Heces frescas (Coprología & Parásitos)',
    category: 'fecal',
    defaultTubeId: 'frasco_heces',
    preservation: 'Transportar inmediatamente antes de 2 horas para búsqueda de trofozoítos móviles.',
    fastingRecommended: false,
    notes: 'Recolectar con cucharilla del tamaño de una nuez o 5-10 mL si es líquida, evitando orina o agua del inodoro.'
  },
  {
    id: 'hisopado_faringeo',
    name: 'Hisopado faríngeo / Exudado',
    category: 'respiratorio',
    defaultTubeId: 'hisopo_transporte',
    preservation: 'Colocar en medio de transporte Stuart o Amies a temperatura ambiente.',
    fastingRecommended: false,
    notes: 'Frotar firmemente las amígdalas y pared faríngea posterior sin tocar la lengua ni úvula.'
  },
  {
    id: 'hisopado_nasofaringeo',
    name: 'Hisopado nasofaríngeo (Panel Viral / PCR)',
    category: 'respiratorio',
    defaultTubeId: 'tubo_mtv',
    preservation: 'Tubo con Medio de Transporte Viral (MTV/VTM) a 2-8°C.',
    fastingRecommended: false,
    notes: 'Introducir el hisopo flexible de dacrón hasta la nasofaringe posterior y rotar suavemente.'
  },
  {
    id: 'lcr',
    name: 'Líquido Cefalorraquídeo (LCR)',
    category: 'biologico',
    defaultTubeId: 'tubo_esteril',
    preservation: 'Procesamiento STAT inmediato. NO refrigerar las muestras destinadas a microbiología.',
    fastingRecommended: false,
    notes: 'Obtenido por punción lumbar médica estéril en tubos cónicos sin conservante.'
  },
  {
    id: 'liquido_biologico',
    name: 'Líquido sinovial / pleural / peritoneal',
    category: 'biologico',
    defaultTubeId: 'tubo_esteril',
    preservation: 'Dividir en tubo con EDTA para citoquímico y frasco estéril para cultivo.',
    fastingRecommended: false,
    notes: 'Extracción estéril bajo técnica aséptica médica.'
  },
  {
    id: 'sangre_hemocultivo',
    name: 'Sangre para Hemocultivo (Aerobio / Anaerobio)',
    category: 'sangre',
    defaultTubeId: 'frasco_hemocultivo',
    preservation: 'Incubar de inmediato a 35-37°C. NO refrigerar los frascos inoculados.',
    fastingRecommended: false,
    notes: 'Asepsia quirúrgica del sitio de punción. Inocular 8-10 mL de sangre venosa por frasco en adultos.'
  }
];

export const LAB_TUBE_REGISTRY: TubeDefinition[] = [
  {
    id: 'frasco_hemocultivo',
    name: 'Frascos de Hemocultivo (Aerobio / Anaerobio)',
    shortName: 'Hemocultivo',
    containerType: 'recipiente',
    capColorName: 'Frasco con Caldo',
    capHex: '#1e293b',
    capBorderHex: '#0f172a',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-white',
    badgeBorder: 'border-slate-800',
    additive: 'Caldo enriquecido con SPS (Polianetolsulfonato de Sodio)',
    sampleMatrix: 'Sangre total venosa estéril',
    inversions: '8 - 10 inversiones suaves',
    drawOrder: 1, // Primer frasco en el orden de extracción según CLSI H3-A6
    recommendedVolume: '8 - 10 mL por frasco (Adultos) / 1 - 3 mL (Pediátrico)',
    clinicalUse: 'Detección bacteriológica de bacteriemias, sepsis y fungemias',
    commonTests: ['Hemocultivo Aerobio', 'Hemocultivo Anaerobio', 'Hemocultivo Pediátrico'],
    handlingNotes: 'Siempre se recolecta primero para evitar contaminación bacteriana cruzada.'
  },
  {
    id: 'celeste',
    name: 'Tubo Celeste / Azul Claro (Citrato de Sodio 3.2%)',
    shortName: 'Tubo Celeste',
    containerType: 'tubo',
    capColorName: 'Celeste / Azul Claro',
    capHex: '#0284c7',
    capBorderHex: '#0369a1',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/80',
    badgeText: 'text-sky-800 dark:text-sky-300',
    badgeBorder: 'border-sky-300 dark:border-sky-800',
    additive: 'Citrato trisódico tamponado 3.2% (0.109 M, proporción 1:9)',
    sampleMatrix: 'Plasma citratado',
    inversions: '3 - 4 inversiones suaves',
    drawOrder: 2,
    recommendedVolume: '2.7 mL (marca exacta)',
    clinicalUse: 'Estudios de hemostasia y factores de coagulación',
    commonTests: [
      'Tiempo de Protrombina (TP / INR)',
      'Tiempo de Tromboplastina Parcial (TTPa)',
      'Fibrinógeno',
      'Dímero D',
      'Factores de Coagulación (VIII, IX)',
      'Actividad de Protrombina (%)',
      'Tiempo de Trombina (TT)'
    ],
    handlingNotes: 'Llenado crítico: el volumen debe alcanzar la marca del 90-100% para mantener la relación anticoagulante/sangre.'
  },
  {
    id: 'rojo_gel',
    name: 'Tubo Oro / Amarillo / Rojo con Gel (SST Activador)',
    shortName: 'Tubo Oro / Gel SST',
    containerType: 'tubo',
    capColorName: 'Amarillo / Oro / Rojo SST',
    capHex: '#eab308',
    capBorderHex: '#ca8a04',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
    badgeText: 'text-amber-900 dark:text-amber-300',
    badgeBorder: 'border-amber-300 dark:border-amber-800',
    additive: 'Gel separador polimérico + Partículas de Sílice (Activador de Coágulo)',
    sampleMatrix: 'Suero sanguíneo',
    inversions: '5 inversiones suaves',
    drawOrder: 3,
    recommendedVolume: '4.0 - 5.0 mL',
    clinicalUse: 'Química clínica general, perfiles lipídicos, hepáticos, renales, hormonas e inmunología',
    commonTests: [
      'Glucosa Basal',
      'Perfil Lipídico Completo',
      'Perfil Hepático (TGO, TGP, Bilirrubinas)',
      'Perfil Renal (Urea, Creatinina, Ácido Úrico)',
      'Electrolitos Séricos (Na, K, Cl, Ca)',
      'Perfil Tiroideo (TSH, T3, T4 Libre)',
      'Marcadores Tumorales (PSA, CEA, CA-125)',
      'Serología Infecciosa (VIH, Hepatitis, VDRL)',
      'Inmunoglobulinas y PCR Cuantitativa'
    ],
    handlingNotes: 'Dejar coagular verticalmente 20-30 min antes de centrifugar a 3000 RPM x 10 min.'
  },
  {
    id: 'rojo_seco',
    name: 'Tubo Rojo Seco (Sin Gel / Sin Anticoagulante)',
    shortName: 'Tubo Rojo Seco',
    containerType: 'tubo',
    capColorName: 'Rojo',
    capHex: '#dc2626',
    capBorderHex: '#b91c1c',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/80',
    badgeText: 'text-rose-800 dark:text-rose-300',
    badgeBorder: 'border-rose-300 dark:border-rose-800',
    additive: 'Sin anticoagulante / Recubrimiento de partículas de sílice',
    sampleMatrix: 'Suero sanguíneo',
    inversions: '5 inversiones suaves',
    drawOrder: 3,
    recommendedVolume: '4.0 - 6.0 mL',
    clinicalUse: 'Banco de sangre, pruebas cruzadas, fármacos terapéuticos y serología especial',
    commonTests: ['Pruebas Cruzadas', 'Coombs Indirecto', 'Niveles de Medicamentos', 'Serología'],
    handlingNotes: 'Dejar coagular 30-60 min antes de centrifugar si no contiene activador.'
  },
  {
    id: 'verde',
    name: 'Tubo Verde (Heparina de Litio / Sodio PST)',
    shortName: 'Tubo Verde',
    containerType: 'tubo',
    capColorName: 'Verde',
    capHex: '#16a34a',
    capBorderHex: '#15803d',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800',
    additive: 'Heparina de Litio o Sodio (con o sin gel separador PST)',
    sampleMatrix: 'Plasma con heparina',
    inversions: '8 - 10 inversiones suaves',
    drawOrder: 4,
    recommendedVolume: '3.0 - 4.0 mL',
    clinicalUse: 'Bioquímica STAT de emergencia, gasometría venosa y electrolitos urgentes',
    commonTests: ['Troponina I Cuantitativa STAT', 'Gases Venosos', 'Electrolitos Rápidos', 'Amonio Plasmático'],
    handlingNotes: 'Centrifugación inmediata. No apto para pruebas de coagulación ni PCR molecular.'
  },
  {
    id: 'lila',
    name: 'Tubo Lila / Lavanda (EDTA K2 / K3)',
    shortName: 'Tubo Lila (EDTA)',
    containerType: 'tubo',
    capColorName: 'Lila / Lavanda',
    capHex: '#9333ea',
    capBorderHex: '#7e22ce',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/80',
    badgeText: 'text-purple-800 dark:text-purple-300',
    badgeBorder: 'border-purple-300 dark:border-purple-800',
    additive: 'EDTA Dipotásico o Tripotásico spray (K2 EDTA / K3 EDTA)',
    sampleMatrix: 'Sangre total con EDTA',
    inversions: '8 - 10 inversiones suaves completas',
    drawOrder: 5,
    recommendedVolume: '3.0 - 4.0 mL',
    clinicalUse: 'Hematología completa, morfología hemática, frotis, inmunohematología y hemoglobina glicosilada',
    commonTests: [
      'Hemograma Completo Automatizado (5 Estirpes)',
      'Recuento Plaquetario',
      'Frotis de Sangre Periférica',
      'Hemoglobina Glicosilada (HbA1c)',
      'Grupo Sanguíneo y Factor Rh',
      'Velocidad de Sedimentación Globular (VSG)',
      'Reticulocitos',
      'Gota Gruesa / Malaria',
      'Coombs Directo'
    ],
    handlingNotes: 'Invertir inmediatamente tras la extracción para evitar microcoágulos que alteren el recuento plaquetario.'
  },
  {
    id: 'gris',
    name: 'Tubo Gris (Fluoruro de Sodio + Oxalato de Potasio)',
    shortName: 'Tubo Gris (Fluoruro)',
    containerType: 'tubo',
    capColorName: 'Gris',
    capHex: '#64748b',
    capBorderHex: '#475569',
    badgeBg: 'bg-slate-200 dark:bg-slate-800',
    badgeText: 'text-slate-800 dark:text-slate-200',
    badgeBorder: 'border-slate-400 dark:border-slate-600',
    additive: 'Fluoruro de Sodio (Inhibidor de glucólisis) + Oxalato de Potasio',
    sampleMatrix: 'Plasma fluorurado',
    inversions: '8 - 10 inversiones suaves',
    drawOrder: 6,
    recommendedVolume: '2.0 - 4.0 mL',
    clinicalUse: 'Dosaje exacto de glucosa, curvas de tolerancia (PTOG) y lactato en sangre',
    commonTests: [
      'Glucosa Basal de Referencia',
      'Curva de Tolerancia Oral a la Glucosa (PTOG 2h / 3h)',
      'Curva de Glucosa en Embarazadas (O\'Sullivan)',
      'Lactato Plasmático'
    ],
    handlingNotes: 'Inhibe la enolasa enzimática, manteniendo estable el nivel de glucosa por más de 24h.'
  },
  {
    id: 'negro',
    name: 'Tubo Negro (Citrato de Sodio 4:1 para VSG Westergren)',
    shortName: 'Tubo Negro (VSG)',
    containerType: 'tubo',
    capColorName: 'Negro',
    capHex: '#0f172a',
    capBorderHex: '#020617',
    badgeBg: 'bg-slate-900 text-white',
    badgeText: 'text-white',
    badgeBorder: 'border-black',
    additive: 'Citrato de Sodio tamponado 3.8% (Proporción 1:4)',
    sampleMatrix: 'Sangre total citratada',
    inversions: '8 - 10 inversiones',
    drawOrder: 7,
    recommendedVolume: '1.6 - 2.4 mL (Tubo delgado con escala)',
    clinicalUse: 'Medición directa de Velocidad de Sedimentación Globular (VSG Westergren)',
    commonTests: ['Velocidad de Sedimentación Globular (VSG Westergren)'],
    handlingNotes: 'Montar directamente en la gradilla vertical de lectura milimetrada.'
  },
  {
    id: 'royal_blue',
    name: 'Tubo Azul Marino Real (Libre de Metales Traza)',
    shortName: 'Tubo Royal Blue',
    containerType: 'tubo',
    capColorName: 'Azul Marino Real',
    capHex: '#1d4ed8',
    capBorderHex: '#1e40af',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/80',
    badgeText: 'text-blue-900 dark:text-blue-200',
    badgeBorder: 'border-blue-400 dark:border-blue-700',
    additive: 'K2 EDTA libre de metales traza / Sin aditivo químicamente purificado',
    sampleMatrix: 'Suero / Plasma libre de oligoelementos',
    inversions: '8 - 10 inversiones',
    drawOrder: 8,
    recommendedVolume: '6.0 mL',
    clinicalUse: 'Determinación toxicológica y nutricional de metales pesados y oligoelementos',
    commonTests: ['Plomo en Sangre', 'Zinc Sérico', 'Cobre Sérico', 'Mercurio', 'Cadmio', 'Arsénico'],
    handlingNotes: 'Envase libre de contaminación metálica para lecturas en absorción atómica / ICP-MS.'
  },
  {
    id: 'frasco_orina',
    name: 'Recipiente / Frasco para Examen General de Orina (EGO / Sedimento)',
    shortName: 'Recipiente Orina',
    containerType: 'recipiente',
    capColorName: 'Recipiente Tapa Amarilla / Rosca',
    capHex: '#f59e0b',
    capBorderHex: '#d97706',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-400 dark:border-amber-700',
    additive: 'Recipiente limpio estéril libre de conservantes',
    sampleMatrix: 'Orina espontánea (chorro medio)',
    inversions: 'Homogeneizar suavemente antes de verter en tubo cónico',
    drawOrder: 9,
    recommendedVolume: '20 - 50 mL',
    clinicalUse: 'Examen General de Orina (EGO), sedimento microscópico, tiras químicas y pruebas de embarazo',
    commonTests: ['Examen General de Orina (EGO)', 'Orina Completa y Sedimento', 'Microalbuminuria al Azar', 'Prueba de Embarazo en Orina (hCG)', 'Proteinuria al Azar'],
    handlingNotes: 'Recipiente de recolección para el paciente. Procesar dentro de las 2 horas de emisión o refrigerar.'
  },
  {
    id: 'frasco_urocultivo',
    name: 'Recipiente Estéril Hermético para Urocultivo (Con Precinto)',
    shortName: 'Recipiente Urocultivo',
    containerType: 'recipiente',
    capColorName: 'Recipiente Tapa Roja/Celeste Sellada',
    capHex: '#0284c7',
    capBorderHex: '#0369a1',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/80',
    badgeText: 'text-cyan-900 dark:text-cyan-200',
    badgeBorder: 'border-cyan-400 dark:border-cyan-700',
    additive: 'Estéril libre de agentes bacteriostáticos (opcional: con conservante de ácido bórico)',
    sampleMatrix: 'Orina de chorro medio (técnica aséptica rigurosa)',
    inversions: 'No invertir. Mantener vertical y sellado',
    drawOrder: 9,
    recommendedVolume: '10 - 30 mL',
    clinicalUse: 'Urocultivo cuantitativo, aislamiento bacteriano, recuento de UFC/mL y antibiograma con CIM',
    commonTests: ['Urocultivo con Antibiograma', 'Urocultivo Cuantitativo', 'Cultivo de Orina con Antibiograma Automatizado'],
    handlingNotes: 'Estrictamente estéril. No retirar el precinto ni tocar el interior de la tapa hasta el momento exacto de la micción.'
  },
  {
    id: 'frasco_heces',
    name: 'Recipiente con Cucharilla para Heces (Coprología & Parásitos)',
    shortName: 'Recipiente Heces',
    containerType: 'recipiente',
    capColorName: 'Recipiente Tapa Marrón o Verde con Espátula',
    capHex: '#854d0e',
    capBorderHex: '#713f12',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-950/80',
    badgeText: 'text-yellow-900 dark:text-yellow-300',
    badgeBorder: 'border-yellow-400 dark:border-yellow-700',
    additive: 'Frasco limpio seco con cucharilla recolectora (o medio conservante MIF/SAF)',
    sampleMatrix: 'Muestra fecal fresca',
    inversions: 'No aplica',
    drawOrder: 10,
    recommendedVolume: 'Porción del tamaño de una nuez (5 a 10 g) tomada con cucharilla',
    clinicalUse: 'Examen Coprológico (EGH), Coproparasitario seriado, Sangre oculta en heces, Calprotectina, Antígeno H. pylori',
    commonTests: ['Examen General de Heces (EGH)', 'Coproparasitológico Seriado', 'Sangre Oculta en Heces (Thevenon / Guayaco)', 'Parásitos en Heces', 'Coprocultivo', 'Rotavirus y Adenovirus en Heces'],
    handlingNotes: 'Recipiente con espátula incorporada. Tomar muestras de zonas con moco o sangre si están presentes. Evitar orina.'
  },
  {
    id: 'galon_orina',
    name: 'Recipiente / Galón Graduado para Orina de 24 Horas',
    shortName: 'Galón Orina 24h',
    containerType: 'recipiente',
    capColorName: 'Galón Ámbar / Tapa Rosca',
    capHex: '#d97706',
    capBorderHex: '#b45309',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
    badgeText: 'text-amber-900 dark:text-amber-200',
    badgeBorder: 'border-amber-400 dark:border-amber-700',
    additive: 'Sin aditivo o con ácido clorhídrico 6N (según metabolito)',
    sampleMatrix: 'Orina de 24 horas recolectada',
    inversions: 'Mezclar suavemente el galón antes de cuantificar y fraccionar',
    drawOrder: 10,
    recommendedVolume: 'Volumen total recolectado en 24 horas',
    clinicalUse: 'Depuración de Creatinina (Clearance), Proteinuria de 24 Horas, Microalbuminuria 24h, Calciuria, Ácido Úrico en Orina 24h',
    commonTests: ['Depuración de Creatinina (Clearance)', 'Proteinuria de 24 Horas', 'Microalbuminuria de 24 Horas', 'Calciuria de 24 Horas'],
    handlingNotes: 'Mantener el galón refrigerado durante el periodo de recolección de 24 horas. Reportar volumen total en mL.'
  },
  {
    id: 'hisopo_transporte',
    name: 'Tubo con Hisopo en Medio de Transporte (Stuart / Amies / Cary-Blair)',
    shortName: 'Medio Transporte',
    containerType: 'hisopo',
    capColorName: 'Hisopo / Medio Gel',
    capHex: '#0d9488',
    capBorderHex: '#0f766e',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/80',
    badgeText: 'text-teal-900 dark:text-teal-300',
    badgeBorder: 'border-teal-400 dark:border-teal-700',
    additive: 'Medio de transporte semi-sólido no nutritivo',
    sampleMatrix: 'Exudado faríngeo / herida / secreción',
    inversions: 'No aplica',
    drawOrder: 11,
    recommendedVolume: '1 hisopo con muestra representativa',
    clinicalUse: 'Cultivos bacteriológicos de exudados, heridas, secreciones óticas, conjuntivales o genitales',
    commonTests: ['Cultivo Faríngeo', 'Cultivo de Secreción Vaginal', 'Cultivo de Herida / Absceso', 'Cultivo Ótico / Conjuntival'],
    handlingNotes: 'Mantener a temperatura ambiente y sembrar antes de 24 horas.'
  }
];

/**
 * Helper functions to distinguish between venipuncture vacuum tubes and collection containers (recipientes)
 */
export function isContainer(tube: TubeDefinition): boolean {
  return tube.containerType === 'recipiente';
}

export function isTube(tube: TubeDefinition): boolean {
  return tube.containerType === 'tubo';
}

export function getContainerClassificationLabel(tube: TubeDefinition): string {
  if (tube.id === 'frasco_urocultivo') return 'Recipiente Estéril (Urocultivo)';
  if (tube.id === 'frasco_orina') return 'Recipiente / Frasco (Orina EGO)';
  if (tube.id === 'frasco_heces') return 'Recipiente con Cucharilla (Heces)';
  if (tube.id === 'galon_orina') return 'Recipiente Galón (Orina 24h)';
  if (tube.containerType === 'recipiente') return `Recipiente (${tube.shortName})`;
  if (tube.containerType === 'hisopo') return `Hisopo (${tube.shortName})`;
  return `Tubo (${tube.shortName})`;
}

/**
 * Returns detailed tube or container information based on test name, category, sample type, or explicit tube id/name.
 * Automatically determines if a sample requires a vacuum TUBE or a collection RECIPIENTE (Heces, Orina, Urocultivo).
 */
export function inferTubeForTest(
  testName: string,
  category?: string,
  sampleTypeStr?: string,
  explicitTubeType?: string
): TubeDefinition {
  // If explicit tube id or tube name provided
  if (explicitTubeType) {
    const normExplicit = explicitTubeType.toLowerCase().trim();
    // Direct ID match
    const byId = LAB_TUBE_REGISTRY.find(t => t.id === normExplicit);
    if (byId) return byId;

    // Direct name or short name match
    const byName = LAB_TUBE_REGISTRY.find(t => 
      t.name.toLowerCase().includes(normExplicit) || 
      t.shortName.toLowerCase().includes(normExplicit)
    );
    if (byName) return byName;

    // Specific container matches
    if (normExplicit.includes('urocultivo')) return LAB_TUBE_REGISTRY.find(t => t.id === 'frasco_urocultivo')!;
    if (normExplicit.includes('heces') || normExplicit.includes('copro') || normExplicit.includes('fecal')) return LAB_TUBE_REGISTRY.find(t => t.id === 'frasco_heces')!;
    if (normExplicit.includes('24h') || normExplicit.includes('galon') || normExplicit.includes('24 horas')) return LAB_TUBE_REGISTRY.find(t => t.id === 'galon_orina')!;
    if (normExplicit.includes('orina') || normExplicit.includes('ego')) return LAB_TUBE_REGISTRY.find(t => t.id === 'frasco_orina')!;

    // Specific blood tube matches
    if (normExplicit.includes('lila') || normExplicit.includes('edta')) return LAB_TUBE_REGISTRY.find(t => t.id === 'lila')!;
    if (normExplicit.includes('celeste') || normExplicit.includes('citrato 3.2') || normExplicit.includes('citrato')) return LAB_TUBE_REGISTRY.find(t => t.id === 'celeste')!;
    if (normExplicit.includes('negro') || normExplicit.includes('westergren')) return LAB_TUBE_REGISTRY.find(t => t.id === 'negro')!;
    if (normExplicit.includes('oro') || normExplicit.includes('amarillo') || normExplicit.includes('sst') || normExplicit.includes('gel')) return LAB_TUBE_REGISTRY.find(t => t.id === 'rojo_gel')!;
    if (normExplicit.includes('rojo seco') || normExplicit.includes('rojo_seco')) return LAB_TUBE_REGISTRY.find(t => t.id === 'rojo_seco')!;
    if (normExplicit.includes('verde') || normExplicit.includes('heparina')) return LAB_TUBE_REGISTRY.find(t => t.id === 'verde')!;
    if (normExplicit.includes('gris') || normExplicit.includes('fluoruro') || normExplicit.includes('oxalato')) return LAB_TUBE_REGISTRY.find(t => t.id === 'gris')!;
    if (normExplicit.includes('royal') || normExplicit.includes('metales') || normExplicit.includes('azul')) return LAB_TUBE_REGISTRY.find(t => t.id === 'royal_blue')!;
    if (normExplicit.includes('hisopo') || normExplicit.includes('medio de transporte') || normExplicit.includes('stuart')) return LAB_TUBE_REGISTRY.find(t => t.id === 'hisopo_transporte')!;
    if (normExplicit.includes('hemocultivo')) return LAB_TUBE_REGISTRY.find(t => t.id === 'frasco_hemocultivo')!;
  }

  const normName = (testName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normCat = (category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normSample = (sampleTypeStr || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Urocultivo microbiológico -> RECIPIENTE ESTÉRIL HERMÉTICO PARA UROCULTIVO
  if (
    normName.includes('urocultivo') ||
    normSample.includes('urocultivo') ||
    (normName.includes('cultivo') && (normName.includes('orina') || normCat.includes('uro') || normSample.includes('orina'))) ||
    normCat.includes('urocultivo')
  ) {
    return LAB_TUBE_REGISTRY.find(t => t.id === 'frasco_urocultivo')!;
  }

  // 2. Orina de 24 horas -> RECIPIENTE / GALÓN GRADUADO PARA ORINA 24H
  if (
    normName.includes('24h') ||
    normName.includes('24 h') ||
    normName.includes('24 horas') ||
    normName.includes('depuracion de creatinina') ||
    normName.includes('clearance') ||
    normSample.includes('24h') ||
    normSample.includes('24 horas') ||
    normCat.includes('24 horas')
  ) {
    return LAB_TUBE_REGISTRY.find(t => t.id === 'galon_orina')!;
  }

  // 3. Heces / Coprología / Parásitos / Sangre Oculta -> RECIPIENTE CON CUCHARILLA PARA HECES
  if (
    normCat.includes('coprologia') ||
    normCat.includes('fecal') ||
    normName.includes('heces') ||
    normName.includes('egh') ||
    normName.includes('parasito') ||
    normName.includes('coprocultivo') ||
    normName.includes('copro') ||
    normName.includes('sangre oculta') ||
    normName.includes('guayaco') ||
    normName.includes('thevenon') ||
    normName.includes('calprotectina') ||
    normName.includes('rotavirus') ||
    normName.includes('adenovirus fecal') ||
    normName.includes('ameba') ||
    normName.includes('giardia') ||
    normSample.includes('heces') ||
    normSample.includes('fecal')
  ) {
    return LAB_TUBE_REGISTRY.find(t => t.id === 'frasco_heces')!;
  }

  // 4. Orina General / EGO / Sedimento -> RECIPIENTE PARA ORINA
  if (
    normCat.includes('uroanalisis') ||
    normName.includes('ego') ||
    normName.includes('orina') ||
    normName.includes('sedimento urinario') ||
    normName.includes('microalbuminuria') ||
    normName.includes('proteinuria') ||
    normName.includes('creatinuria') ||
    normName.includes('embarazo en orina') ||
    normSample.includes('orina')
  ) {
    return LAB_TUBE_REGISTRY.find(t => t.id === 'frasco_orina')!;
  }

  // 5. Hemocultivos -> Frasco con SPS
  if (normName.includes('hemocultivo') || normName.includes('bacteriemia') || normSample.includes('hemocultivo')) {
    return LAB_TUBE_REGISTRY.find(t => t.id === 'frasco_hemocultivo')!;
  }

  // 6. Coagulación (Tubo Celeste - Citrato de Sodio 3.2% 1:9)
  if (
    normCat.includes('coagulacion') ||
    normName.includes('protrombina') ||
    normName.includes('tp ') ||
    normName.includes('t.p') ||
    normName.includes('inr') ||
    normName.includes('ttpa') ||
    normName.includes('ttp ') ||
    normName.includes('t.t.p') ||
    normName.includes('fibrinogeno') ||
    normName.includes('dimero d') ||
    normName.includes('tiempo de trombina') ||
    normName.includes('antitrombina') ||
    normName.includes('factor viii') ||
    normName.includes('factor ix') ||
    normName.includes('hemostasia') ||
    normSample.includes('citrato') ||
    normSample.includes('celeste')
  ) {
    return LAB_TUBE_REGISTRY.find(t => t.id === 'celeste')!;
  }

  // 7. VSG Westergren (Tubo Negro - Citrato 4:1)
  if (
    normName.includes('vsg') ||
    normName.includes('sedimentacion globular') ||
    normName.includes('westergren') ||
    normSample.includes('tubo negro')
  ) {
    return LAB_TUBE_REGISTRY.find(t => t.id === 'negro') || LAB_TUBE_REGISTRY.find(t => t.id === 'lila')!;
  }

  // 8. Hematología & EDTA (Tubo Lila - K2/K3 EDTA)
  if (
    normCat.includes('hematologia') ||
    normName.includes('hemograma') ||
    normName.includes('biometria hematica') ||
    normName.includes('cbc') ||
    normName.includes('leucocito') ||
    normName.includes('linfocito') ||
    normName.includes('neutrofilo') ||
    normName.includes('eosinofilo') ||
    normName.includes('basofilo') ||
    normName.includes('monocito') ||
    normName.includes('plaqueta') ||
    normName.includes('frotis') ||
    normName.includes('hba1c') ||
    normName.includes('glicosilada') ||
    normName.includes('glucosilada') ||
    normName.includes('hemoglobina') ||
    normName.includes('hematocrito') ||
    normName.includes('vcm') ||
    normName.includes('hcm') ||
    normName.includes('chcm') ||
    normName.includes('rdw') ||
    normName.includes('grupo sanguineo') ||
    normName.includes('factor rh') ||
    normName.includes('coombs directo') ||
    normName.includes('reticulocito') ||
    normName.includes('malaria') ||
    normName.includes('gota gruesa') ||
    normName.includes('chagas') ||
    normSample.includes('lila') ||
    normSample.includes('edta')
  ) {
    return LAB_TUBE_REGISTRY.find(t => t.id === 'lila')!;
  }

  // 9. Glucosa especial / Curvas / Lactato (Tubo Gris - Fluoruro de Sodio / Oxalato)
  if (
    normName.includes('curva de tolerancia') ||
    normName.includes('ptog') ||
    normName.includes('o\'sullivan') ||
    normName.includes('lactato') ||
    normName.includes('curva glucosa') ||
    normSample.includes('fluoruro') ||
    normSample.includes('gris')
  ) {
    return LAB_TUBE_REGISTRY.find(t => t.id === 'gris')!;
  }

  // 10. Urgencias / Gases venosos / Troponina STAT (Tubo Verde - Heparina)
  if (
    normName.includes('troponina i stat') ||
    normName.includes('gases arteriales') ||
    normName.includes('gases venosos') ||
    normSample.includes('heparina') ||
    normSample.includes('verde')
  ) {
    return LAB_TUBE_REGISTRY.find(t => t.id === 'verde')!;
  }

  // 11. Microbiología / Cultivos de exudados (Hisopo Transporte)
  if (
    normCat.includes('microbiologia') ||
    normName.includes('exudado') ||
    normName.includes('faringeo') ||
    normName.includes('cultivo de herida') ||
    normName.includes('cultivo vaginal') ||
    normName.includes('hisopado') ||
    normName.includes('antibiograma') ||
    normSample.includes('hisopo')
  ) {
    return LAB_TUBE_REGISTRY.find(t => t.id === 'hisopo_transporte')!;
  }

  // 12. Metales pesados y oligoelementos (Royal Blue)
  if (
    normName.includes('plomo') ||
    normName.includes('mercurio') ||
    normName.includes('arsenico') ||
    normName.includes('cadmio') ||
    normName.includes('zinc') ||
    normName.includes('cobre') ||
    normSample.includes('royal blue') ||
    normSample.includes('metal')
  ) {
    return LAB_TUBE_REGISTRY.find(t => t.id === 'royal_blue')!;
  }

  // Default: Química Sanguínea / Inmunología / Hormonas / Suero (Tubo Oro / Gel SST)
  return LAB_TUBE_REGISTRY.find(t => t.id === 'rojo_gel')!;
}

/**
 * Given a list of tests requested for a patient, aggregates the required vacuum tubes and containers,
 * distinguishing blood collection tubes from recipient containers (feces, urine, uroculture).
 */
export interface OrderTubesSummary {
  tubes: {
    tube: TubeDefinition;
    tests: string[];
    count: number;
  }[];
  tubesList: {
    tube: TubeDefinition;
    tests: string[];
    count: number;
  }[];
  containersList: {
    tube: TubeDefinition;
    tests: string[];
    count: number;
  }[];
  swabsList: {
    tube: TubeDefinition;
    tests: string[];
    count: number;
  }[];
  totalItemsCount: number;
  tubesCount: number;
  containersCount: number;
  totalTubesCount: number; // Backwards compatible alias for totalItemsCount
  estimatedBloodVolumeMl: number;
  orderOfDrawList: string[];
  sampleMatrices: string[];
}

export function computeTubesForOrder(testItems: Array<{ name: string; category?: string; sampleType?: string; tubeType?: string }>): OrderTubesSummary {
  const tubeMap = new Map<string, { tube: TubeDefinition; tests: string[]; count: number }>();

  testItems.forEach(item => {
    const tubeDef = inferTubeForTest(item.name, item.category, item.sampleType, item.tubeType);
    if (!tubeMap.has(tubeDef.id)) {
      tubeMap.set(tubeDef.id, {
        tube: tubeDef,
        tests: [item.name],
        count: 1
      });
    } else {
      const existing = tubeMap.get(tubeDef.id)!;
      if (!existing.tests.includes(item.name)) {
        existing.tests.push(item.name);
      }
    }
  });

  // Sort according to official CLSI Order of Draw (drawOrder ascending)
  const sortedItems = Array.from(tubeMap.values()).sort((a, b) => a.tube.drawOrder - b.tube.drawOrder);

  const tubesList = sortedItems.filter(item => item.tube.containerType === 'tubo');
  const containersList = sortedItems.filter(item => item.tube.containerType === 'recipiente');
  const swabsList = sortedItems.filter(item => item.tube.containerType === 'hisopo');

  const tubesCount = tubesList.length;
  const containersCount = containersList.length;
  const totalItemsCount = sortedItems.length;
  
  // Calculate approximate blood volume ONLY for blood tubes and hemoculture
  const bloodTubes = sortedItems.filter(t => t.tube.containerType === 'tubo' || t.tube.id === 'frasco_hemocultivo');
  const estimatedBloodVolumeMl = bloodTubes.reduce((acc, curr) => {
    if (curr.tube.id === 'frasco_hemocultivo') return acc + 10;
    if (curr.tube.id === 'celeste') return acc + 2.7;
    if (curr.tube.id === 'lila') return acc + 3.5;
    if (curr.tube.id === 'rojo_gel' || curr.tube.id === 'rojo_seco') return acc + 4.5;
    if (curr.tube.id === 'gris') return acc + 2.5;
    if (curr.tube.id === 'verde') return acc + 3.5;
    if (curr.tube.id === 'negro') return acc + 2.0;
    if (curr.tube.id === 'royal_blue') return acc + 6.0;
    return acc + 3.0;
  }, 0);

  const orderOfDrawList = sortedItems.map((t, idx) => `${idx + 1}°. [${t.tube.containerType.toUpperCase()}] ${t.tube.name}`);
  const sampleMatrices = Array.from(new Set(sortedItems.map(t => t.tube.sampleMatrix)));

  return {
    tubes: sortedItems,
    tubesList,
    containersList,
    swabsList,
    totalItemsCount,
    tubesCount,
    containersCount,
    totalTubesCount: totalItemsCount, // Kept for backwards compatibility
    estimatedBloodVolumeMl: Math.round(estimatedBloodVolumeMl * 10) / 10,
    orderOfDrawList,
    sampleMatrices
  };
}

/**
 * Analyzes parameters of a template/order and generates a comprehensive CLSI tube breakdown
 */
export interface TemplateTubeAuditSummary {
  parametersMap: Array<{
    parameterName: string;
    tube: TubeDefinition;
    drawOrderText: string;
    category?: string;
    sampleType?: string;
  }>;
  tubesGrouped: Array<{
    tube: TubeDefinition;
    parameters: string[];
    count: number;
    drawOrderIndex: number;
  }>;
  tubesOnly: Array<{
    tube: TubeDefinition;
    parameters: string[];
    count: number;
  }>;
  containersOnly: Array<{
    tube: TubeDefinition;
    parameters: string[];
    count: number;
  }>;
  totalTubesRequired: number;
  totalContainersRequired: number;
  requiresMultipleTubes: boolean;
  orderOfDrawList: string[];
  estimatedBloodVolumeMl: number;
  preanalyticalWarning?: string;
}

export function analyzeTubesForParameters(
  parameters: Array<{ name: string; sampleType?: string; category?: string; tubeType?: string }>,
  defaultCategory?: string
): TemplateTubeAuditSummary {
  const parametersMap: TemplateTubeAuditSummary['parametersMap'] = [];
  const tubeMap = new Map<string, { tube: TubeDefinition; parameters: string[]; count: number }>();

  parameters.forEach(p => {
    const tubeDef = inferTubeForTest(p.name, p.category || defaultCategory, p.sampleType, p.tubeType);
    parametersMap.push({
      parameterName: p.name,
      tube: tubeDef,
      drawOrderText: `${tubeDef.drawOrder}° Orden CLSI`,
      category: p.category || defaultCategory,
      sampleType: p.sampleType
    });

    if (!tubeMap.has(tubeDef.id)) {
      tubeMap.set(tubeDef.id, {
        tube: tubeDef,
        parameters: [p.name],
        count: 1
      });
    } else {
      const existing = tubeMap.get(tubeDef.id)!;
      if (!existing.parameters.includes(p.name)) {
        existing.parameters.push(p.name);
        existing.count += 1;
      }
    }
  });

  const tubesGrouped = Array.from(tubeMap.values())
    .sort((a, b) => a.tube.drawOrder - b.tube.drawOrder)
    .map((g, idx) => ({
      ...g,
      drawOrderIndex: idx + 1
    }));

  const tubesOnly = tubesGrouped.filter(g => g.tube.containerType === 'tubo');
  const containersOnly = tubesGrouped.filter(g => g.tube.containerType === 'recipiente');

  const totalTubesRequired = tubesOnly.length;
  const totalContainersRequired = containersOnly.length;
  const requiresMultipleTubes = tubesGrouped.length > 1;

  // Approximate blood draw volume (only for blood tubes and hemoculture)
  const bloodTubes = tubesGrouped.filter(t => t.tube.containerType === 'tubo' || t.tube.id === 'frasco_hemocultivo');
  const estimatedBloodVolumeMl = bloodTubes.reduce((acc, curr) => {
    if (curr.tube.id === 'frasco_hemocultivo') return acc + 10;
    if (curr.tube.id === 'celeste') return acc + 2.7;
    if (curr.tube.id === 'lila') return acc + 3.5;
    if (curr.tube.id === 'rojo_gel' || curr.tube.id === 'rojo_seco') return acc + 4.5;
    if (curr.tube.id === 'gris') return acc + 2.5;
    if (curr.tube.id === 'verde') return acc + 3.5;
    if (curr.tube.id === 'negro') return acc + 2.0;
    if (curr.tube.id === 'royal_blue') return acc + 6.0;
    return acc + 3.0;
  }, 0);

  const orderOfDrawList = tubesGrouped.map((t, idx) => `${idx + 1}°. [${t.tube.containerType.toUpperCase()}] ${t.tube.name} (Aditivo: ${t.tube.additive})`);

  let preanalyticalWarning: string | undefined = undefined;
  if (requiresMultipleTubes) {
    const names = tubesGrouped.map(t => `${t.tube.containerType === 'recipiente' ? 'Recipiente' : 'Tubo'} ${t.tube.shortName}`).join(' + ');
    preanalyticalWarning = `Esta orden requiere recolección en ${tubesGrouped.length} contenedores separados (${names}). Según la norma CLSI H3-A6, para los tubos de venopunción debe respetarse estrictamente el orden de extracción para evitar la transferencia de aditivos anticoagulantes; los recipientes de orina o heces deben entregarse con sus instrucciones específicas de recolección.`;
  }

  return {
    parametersMap,
    tubesGrouped,
    tubesOnly,
    containersOnly,
    totalTubesRequired,
    totalContainersRequired,
    requiresMultipleTubes,
    orderOfDrawList,
    estimatedBloodVolumeMl: Math.round(estimatedBloodVolumeMl * 10) / 10,
    preanalyticalWarning
  };
}
