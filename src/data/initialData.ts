import { Patient, MedicalReport, ReportTemplate, BranchSite, LabEpisode, SampleTransferManifest } from '../types';

export const INITIAL_BRANCHES: BranchSite[] = [
  {
    id: 'central',
    name: 'VACLINIC Laboratorio Clínico - Sede Única',
    code: 'VAC-01',
    city: 'Oratorio, Santa Rosa',
    address: 'Entrada de Pineda, Oratorio, Santa Rosa km 79.5',
    isMain: true,
    activeSamplesCount: 142,
    analyzersConnected: 8,
    slaCompliance: 99.8
  }
];

export const INITIAL_EPISODES: LabEpisode[] = [
  {
    id: 'ep-101',
    episodeNumber: '4D-2026-EP0842',
    patientId: 'pat-1',
    patientName: 'Carlos Alberto Mendoza Rojas',
    nationalId: '104829104',
    patientType: 'ambulatorio',
    healthProgram: 'cardiovascular',
    origin: 'cardiologia',
    referringDoctor: 'Dr. Alejandro Valenzuela',
    branchId: 'central',
    admissionTime: '2026-08-25T07:15:00.000Z',
    phlebotomyTime: '2026-08-25T07:45:00.000Z',
    analyzerStartTime: '2026-08-25T09:00:00.000Z',
    validationTime: '2026-08-25T15:30:00.000Z',
    currentDimension: 'D4_validacion',
    priority: 'rutina',
    requestedTests: ['Perfil Lipídico Integral', 'Glucosa Basal', 'Hemograma Completo'],
    tubeBarcodes: ['4D-BAR-89410', '4D-BAR-89411'],
    tatTargetMinutes: 180,
    tatElapsedMinutes: 95,
    duplicityFlag: false
  },
  {
    id: 'ep-102',
    episodeNumber: '4D-2026-EP0850',
    patientId: 'pat-2',
    patientName: 'Valeria Sofía Ortiz Ramírez',
    nationalId: '208491823',
    patientType: 'ambulatorio',
    healthProgram: 'materno_infantil',
    origin: 'consulta_externa',
    referringDoctor: 'Dra. Elena Gutiérrez Silva',
    branchId: 'central',
    admissionTime: '2026-08-27T08:00:00.000Z',
    phlebotomyTime: '2026-08-27T08:15:00.000Z',
    analyzerStartTime: '2026-08-27T09:30:00.000Z',
    validationTime: '2026-08-27T17:00:00.000Z',
    currentDimension: 'D4_validacion',
    priority: 'rutina',
    requestedTests: ['Perfil Tiroideo T3 - T4 - TSH', 'Vitamina D (25-OH)'],
    tubeBarcodes: ['4D-BAR-89433'],
    tatTargetMinutes: 240,
    tatElapsedMinutes: 130,
    duplicityFlag: false
  },
  {
    id: 'ep-103',
    episodeNumber: '4D-2026-EP0855',
    patientId: 'pat-3',
    patientName: 'Rodrigo Morales Echeverría',
    nationalId: '309182741',
    patientType: 'ambulatorio',
    healthProgram: 'diabeticos',
    origin: 'medicina_interna',
    referringDoctor: 'Dr. Sergio Paredes',
    branchId: 'central',
    admissionTime: '2026-08-28T07:10:00.000Z',
    phlebotomyTime: '2026-08-28T07:30:00.000Z',
    analyzerStartTime: '2026-08-28T08:15:00.000Z',
    currentDimension: 'D3_analizadores',
    priority: 'urgente',
    requestedTests: ['Química Sanguínea', 'Hemoglobina Glicosilada HbA1c', 'Microalbuminuria'],
    tubeBarcodes: ['4D-BAR-89450', '4D-BAR-89451'],
    tatTargetMinutes: 90,
    tatElapsedMinutes: 62,
    duplicityFlag: false
  },
  {
    id: 'ep-104',
    episodeNumber: '4D-2026-EP0891',
    patientId: 'pat-1',
    patientName: 'Carlos Alberto Mendoza Rojas',
    nationalId: '104829104',
    patientType: 'ambulatorio',
    healthProgram: 'preventivo_360',
    origin: 'consulta_externa',
    referringDoctor: 'Dr. Roberto Méndez',
    branchId: 'central',
    admissionTime: '2026-08-28T19:40:00.000Z',
    currentDimension: 'D1_admision',
    priority: 'rutina',
    requestedTests: ['Perfil Lipídico Integral', 'Glucosa Basal'],
    tubeBarcodes: ['4D-BAR-89510'],
    tatTargetMinutes: 180,
    tatElapsedMinutes: 15,
    duplicityFlag: true,
    duplicityDetails: 'ALERTA 4D LAB: Paciente cuenta con orden idéntica [Perfil Lipídico Integral, Glucosa Basal] validada en Sede Única hace 3 días (Episodio 4D-2026-EP0842).'
  },
  {
    id: 'ep-105',
    episodeNumber: '4D-2026-EP0892',
    patientId: 'pat-4',
    patientName: 'Dra. Elena Gutiérrez Silva',
    nationalId: '401928372',
    patientType: 'hospitalizado',
    healthProgram: 'cardiovascular',
    origin: 'uci',
    referringDoctor: 'Dr. Alejandro Valenzuela',
    branchId: 'central',
    admissionTime: '2026-08-28T20:10:00.000Z',
    phlebotomyTime: '2026-08-28T20:25:00.000Z',
    currentDimension: 'D2_flebotomia',
    priority: 'stat_panico',
    requestedTests: ['Troponina I Cuantitativa Ultra', 'Dímero D', 'Gasometría Arterial'],
    tubeBarcodes: ['4D-BAR-89520', '4D-BAR-89521'],
    tatTargetMinutes: 30,
    tatElapsedMinutes: 18,
    duplicityFlag: false
  },
  {
    id: 'ep-106',
    episodeNumber: '4D-2026-EP0893',
    patientId: 'pat-2',
    patientName: 'Valeria Sofía Ortiz Ramírez',
    nationalId: '208491823',
    patientType: 'empresa_convenio',
    healthProgram: 'ocupacional',
    origin: 'empresa_externa',
    referringDoctor: 'Dr. Hugo Benavides (Med. Ocupacional TechCorp)',
    branchId: 'este',
    admissionTime: '2026-08-28T18:00:00.000Z',
    phlebotomyTime: '2026-08-28T18:20:00.000Z',
    analyzerStartTime: '2026-08-28T19:30:00.000Z',
    currentDimension: 'D3_analizadores',
    priority: 'rutina',
    requestedTests: ['Examen General de Orina', 'Audiometría & Espirometría', 'Tamizaje Toxicológico'],
    tubeBarcodes: ['4D-BAR-89530'],
    tatTargetMinutes: 240,
    tatElapsedMinutes: 70,
    duplicityFlag: false,
    isTransferred: true,
    destinationBranch: 'central'
  }
];

export const INITIAL_TRANSFERS: SampleTransferManifest[] = [
  {
    id: 'trans-01',
    manifestCode: 'MAN-4D-2026-089',
    originBranch: 'este',
    destinationBranch: 'central',
    courierName: 'Logística Médica Labymed (Unidad Refrigerada #04)',
    departureTime: '2026-08-28T18:45:00.000Z',
    estimatedArrivalTime: '2026-08-28T19:25:00.000Z',
    actualArrivalTime: '2026-08-28T19:22:00.000Z',
    status: 'entregado',
    temperatureControl: '2_8_grados',
    temperatureLogged: 4.3,
    samplesCount: 18,
    samplesCodes: ['4D-BAR-89530', '4D-BAR-89531', '4D-BAR-89532', '4D-BAR-89533']
  },
  {
    id: 'trans-02',
    manifestCode: 'MAN-4D-2026-090',
    originBranch: 'norte',
    destinationBranch: 'central',
    courierName: 'Courier Especializado BioMed Express',
    departureTime: '2026-08-28T20:00:00.000Z',
    estimatedArrivalTime: '2026-08-28T20:50:00.000Z',
    status: 'en_transito',
    temperatureControl: '2_8_grados',
    temperatureLogged: 3.8,
    samplesCount: 12,
    samplesCodes: ['4D-BAR-89510', '4D-BAR-89512', '4D-BAR-89514']
  }
];

export const INITIAL_TEMPLATES: ReportTemplate[] = [
  {
    id: 'hemograma-completo',
    name: 'Hemograma Completo Automatizado (5 Estirpes)',
    category: 'hematologia',
    description: 'Citometría hematológica completa dividida en Serie Roja, Serie Blanca y Plaquetas.',
    defaultParameters: [
      // SERIE ROJA
      { name: 'Eritrocitos (Glóbulos Rojos)', value: '4.85', unit: 'M/µL', referenceRange: '4.20 - 5.40', status: 'normal', minVal: 4.2, maxVal: 5.4, section: 'Serie Roja (Eritrocitaria)', methodology: 'Impedancia / Citometría Láser' },
      { name: 'Hemoglobina', value: '14.6', unit: 'g/dL', referenceRange: '13.0 - 17.0', status: 'normal', minVal: 13.0, maxVal: 17.0, section: 'Serie Roja (Eritrocitaria)', methodology: 'SLS Hemoglobina Fotometría' },
      { name: 'Hematocrito', value: '43.2', unit: '%', referenceRange: '39.0 - 50.0', status: 'normal', minVal: 39.0, maxVal: 50.0, section: 'Serie Roja (Eritrocitaria)', methodology: 'Cálculo Acumulativo' },
      { name: 'VCM (Volumen Corpuscular Medio)', value: '89.1', unit: 'fL', referenceRange: '80.0 - 98.0', status: 'normal', minVal: 80.0, maxVal: 98.0, section: 'Serie Roja (Eritrocitaria)', methodology: 'Distribución Histograma' },
      { name: 'HCM (Hemoglobina Corpuscular Media)', value: '30.1', unit: 'pg', referenceRange: '27.0 - 33.0', status: 'normal', minVal: 27.0, maxVal: 33.0, section: 'Serie Roja (Eritrocitaria)', methodology: 'Cálculo Índices' },
      { name: 'CHCM (Concentración Media de Hb)', value: '33.8', unit: 'g/dL', referenceRange: '32.0 - 36.0', status: 'normal', minVal: 32.0, maxVal: 36.0, section: 'Serie Roja (Eritrocitaria)', methodology: 'Cálculo Índices' },
      
      // SERIE BLANCA
      { name: 'Leucocitos Totales (Glóbulos Blancos)', value: '6,800', unit: '/mm³', referenceRange: '4,500 - 10,500', status: 'normal', minVal: 4500, maxVal: 10500, section: 'Serie Blanca (Leucocitaria)', methodology: 'Citometría de Flujo Fluorescente' },
      { name: 'Neutrófilos Segmentados', value: '62.0', unit: '%', referenceRange: '45.0 - 70.0', status: 'normal', minVal: 45.0, maxVal: 70.0, section: 'Serie Blanca (Leucocitaria)', methodology: 'Dif. 5 Poblaciones' },
      { name: 'Linfocitos', value: '29.5', unit: '%', referenceRange: '20.0 - 45.0', status: 'normal', minVal: 20.0, maxVal: 45.0, section: 'Serie Blanca (Leucocitaria)', methodology: 'Dif. 5 Poblaciones' },
      { name: 'Monocitos', value: '5.8', unit: '%', referenceRange: '2.0 - 10.0', status: 'normal', minVal: 2.0, maxVal: 10.0, section: 'Serie Blanca (Leucocitaria)', methodology: 'Dif. 5 Poblaciones' },
      { name: 'Eosinófilos', value: '2.2', unit: '%', referenceRange: '1.0 - 5.0', status: 'normal', minVal: 1.0, maxVal: 5.0, section: 'Serie Blanca (Leucocitaria)', methodology: 'Dif. 5 Poblaciones' },

      // PLAQUETAS
      { name: 'Recuento de Plaquetas', value: '245,000', unit: '/mm³', referenceRange: '150,000 - 450,000', status: 'normal', minVal: 150000, maxVal: 450000, section: 'Plaquetas & Coagulación', methodology: 'Impedancia Enfocada' },
      { name: 'Volumen Plaquetario Medio (VPM)', value: '9.4', unit: 'fL', referenceRange: '7.5 - 11.5', status: 'normal', minVal: 7.5, maxVal: 11.5, section: 'Plaquetas & Coagulación', methodology: 'Cálculo Histograma' },
    ],
    defaultRecommendations: [
      'Valores hematológicos normales en las tres series celulares.',
      'Mantener dieta balanceada con adecuado aporte de hierro y folatos.',
      'Control hematológico rutinario anual según indicación médica.',
    ]
  },
  {
    id: 'perfil-lipidico',
    name: 'Perfil Lipídico Integral',
    category: 'bioquimica',
    description: 'Evaluación de riesgo cardiovascular, colesterol total, fracciones y triglicéridos.',
    defaultParameters: [
      { name: 'Colesterol Total', value: '215', unit: 'mg/dL', referenceRange: '< 200 mg/dL', status: 'high', minVal: 0, maxVal: 200, section: 'Perfil Lipídico & Riesgo Cardiovascular', methodology: 'Enzimático Colorimétrico (CHOD-PAP)' },
      { name: 'Colesterol HDL (Bueno)', value: '44', unit: 'mg/dL', referenceRange: '> 40 mg/dL', status: 'normal', minVal: 40, maxVal: 100, section: 'Perfil Lipídico & Riesgo Cardiovascular', methodology: 'Inmuno-inhibición Homogénea' },
      { name: 'Colesterol LDL (Malo)', value: '138', unit: 'mg/dL', referenceRange: '< 100 mg/dL', status: 'high', minVal: 0, maxVal: 100, section: 'Perfil Lipídico & Riesgo Cardiovascular', methodology: 'Cálculo Friedewald / Directo' },
      { name: 'Colesterol VLDL', value: '33', unit: 'mg/dL', referenceRange: '5 - 30 mg/dL', status: 'high', minVal: 5, maxVal: 30, section: 'Perfil Lipídico & Riesgo Cardiovascular', methodology: 'Cálculo triglicerídico' },
      { name: 'Triglicéridos', value: '165', unit: 'mg/dL', referenceRange: '< 150 mg/dL', status: 'high', minVal: 0, maxVal: 150, section: 'Perfil Lipídico & Riesgo Cardiovascular', methodology: 'Enzimático GPO-PAP' },
      { name: 'Índice de Riesgo Coronario (CT/HDL)', value: '4.88', unit: 'Ratio', referenceRange: '< 4.5', status: 'high', minVal: 0, maxVal: 4.5, section: 'Perfil Lipídico & Riesgo Cardiovascular', methodology: 'Cálculo de Riesgo' },
    ],
    defaultRecommendations: [
      'Reducir el consumo de grasas saturadas, frituras y azúcares refinados.',
      'Realizar actividad física aeróbica al menos 150 minutos a la semana.',
      'Seguimiento y control de perfil lipídico en 3 meses.',
    ]
  },
  {
    id: 'quimica-metabolica',
    name: 'Perfil Metabólico & Bioquímica Integral',
    category: 'bioquimica',
    description: 'Panel integral dividido en Glucemia, Función Renal, Hepática y Perfil Lipídico.',
    defaultParameters: [
      // GLUCEMIA
      { name: 'Glucosa Basal en Ayunas', value: '94', unit: 'mg/dL', referenceRange: '70 - 100 mg/dL', status: 'normal', minVal: 70, maxVal: 100, section: 'Metabolismo & Glucosa', methodology: 'Hexoquinasa / GOD-PAP' },
      { name: 'Hemoglobina Glicosilada (HbA1c)', value: '5.4', unit: '%', referenceRange: '4.0 - 5.7 %', status: 'normal', minVal: 4.0, maxVal: 5.7, section: 'Metabolismo & Glucosa', methodology: 'HPLC Cromatografía de Intercambio' },

      // LIPIDOS
      { name: 'Colesterol Total', value: '188', unit: 'mg/dL', referenceRange: '< 200 mg/dL', status: 'normal', minVal: 0, maxVal: 200, section: 'Perfil Lipídico & Riesgo Cardiovascular', methodology: 'CHOD-PAP' },
      { name: 'Triglicéridos', value: '130', unit: 'mg/dL', referenceRange: '< 150 mg/dL', status: 'normal', minVal: 0, maxVal: 150, section: 'Perfil Lipídico & Riesgo Cardiovascular', methodology: 'GPO-PAP' },

      // RENAL
      { name: 'Urea Sérica', value: '28.4', unit: 'mg/dL', referenceRange: '15.0 - 45.0 mg/dL', status: 'normal', minVal: 15, maxVal: 45, section: 'Función Renal', methodology: 'Ureasa / GLDH Cinético' },
      { name: 'Creatinina Sérica', value: '0.92', unit: 'mg/dL', referenceRange: '0.60 - 1.20 mg/dL', status: 'normal', minVal: 0.6, maxVal: 1.2, section: 'Función Renal', methodology: 'Jaffé Compensado / Enzimático' },
      { name: 'Ácido Úrico', value: '5.8', unit: 'mg/dL', referenceRange: '3.5 - 7.2 mg/dL', status: 'normal', minVal: 3.5, maxVal: 7.2, section: 'Función Renal', methodology: 'Uricasa / PAP' },

      // HEPATICA
      { name: 'TGO / AST (Transaminasa)', value: '22', unit: 'U/L', referenceRange: '10 - 40 U/L', status: 'normal', minVal: 10, maxVal: 40, section: 'Función Hepática & Enzimas', methodology: 'IFCC UV con Piridoxal Fosfato' },
      { name: 'TGP / ALT (Transaminasa)', value: '26', unit: 'U/L', referenceRange: '10 - 45 U/L', status: 'normal', minVal: 10, maxVal: 45, section: 'Función Hepática & Enzimas', methodology: 'IFCC UV con Piridoxal Fosfato' },
      { name: 'Fosfatasa Alcalina (ALP)', value: '68', unit: 'U/L', referenceRange: '40 - 130 U/L', status: 'normal', minVal: 40, maxVal: 130, section: 'Función Hepática & Enzimas', methodology: 'p-Nitrofenilfosfato' },
    ],
    defaultRecommendations: [
      'Valores de química clínica y perfil renal/hepático dentro de límites normales.',
      'Mantener consumo regular de agua pura (mínimo 2 litros diarios).',
      'Evitar el exceso de sodio y alimentos ultraprocesados.',
      'Control metabólico periódico anual.',
    ]
  },
  {
    id: 'perfil-tiroideo',
    name: 'Perfil Tiroideo T3 - T4 - TSH',
    category: 'laboratorio',
    description: 'Evaluación funcional de glándula tiroides y eje hipotálamo-hipofisario.',
    defaultParameters: [
      { name: 'TSH Ultrasensible (Hormona Tiroestimulante)', value: '2.45', unit: 'µUI/mL', referenceRange: '0.40 - 4.20', status: 'normal', minVal: 0.4, maxVal: 4.2, section: 'Hormonas & Endocrinología', methodology: 'Quimioluminiscencia (CLIA)' },
      { name: 'T4 Libre (Tiroxina Libre)', value: '1.28', unit: 'ng/dL', referenceRange: '0.80 - 1.80', status: 'normal', minVal: 0.8, maxVal: 1.8, section: 'Hormonas & Endocrinología', methodology: 'Quimioluminiscencia (CLIA)' },
      { name: 'T3 Total (Triyodotironina)', value: '1.15', unit: 'ng/mL', referenceRange: '0.80 - 2.00', status: 'normal', minVal: 0.8, maxVal: 2.0, section: 'Hormonas & Endocrinología', methodology: 'Quimioluminiscencia (CLIA)' },
    ],
    defaultRecommendations: [
      'Valores hormonales en rango eutiroideo (normal).',
      'Consultar con endocrinología si persisten síntomas clínicos de fatiga o cambios de peso.',
    ]
  },
  {
    id: 'examen-orina',
    name: 'Examen General de Orina (EGO)',
    category: 'laboratorio',
    description: 'Análisis físico, químico de tira reactiva y sedimento microscópico.',
    defaultParameters: [
      // FISICO
      { name: 'Color Urinario', value: 'Amarillo Claro', unit: 'Visual', referenceRange: 'Amarillo Pálido / Ámbar', status: 'normal', section: 'Examen Físico de Orina', methodology: 'Inspección Visual' },
      { name: 'Aspecto', value: 'Transparente / Límpido', unit: 'Visual', referenceRange: 'Límpido', status: 'normal', section: 'Examen Físico de Orina', methodology: 'Inspección Visual' },
      { name: 'Densidad Específica', value: '1.018', unit: 'g/mL', referenceRange: '1.005 - 1.030', status: 'normal', minVal: 1.005, maxVal: 1.030, section: 'Examen Físico de Orina', methodology: 'Refractometría / Tira' },

      // QUIMICO
      { name: 'pH Urinario', value: '6.0', unit: 'pH', referenceRange: '5.0 - 7.5', status: 'normal', minVal: 5.0, maxVal: 7.5, section: 'Examen Químico (Tira Reactiva)', methodology: 'Tira Reactiva Multianalito' },
      { name: 'Proteínas / Albúmina', value: 'Negativo', unit: 'mg/dL', referenceRange: 'Negativo', status: 'normal', section: 'Examen Químico (Tira Reactiva)', methodology: 'Error Proteico de Indicador' },
      { name: 'Glucosa en Orina', value: 'Negativo', unit: 'mg/dL', referenceRange: 'Negativo', status: 'normal', section: 'Examen Químico (Tira Reactiva)', methodology: 'Glucosa Oxidasa' },
      { name: 'Cuerpos Cetónicos', value: 'Negativo', unit: 'mg/dL', referenceRange: 'Negativo', status: 'normal', section: 'Examen Químico (Tira Reactiva)', methodology: 'Nitroprusiato de Sodio' },
      { name: 'Hemoglobina / Sangre Oculta', value: 'Negativo', unit: 'Eritrocitos', referenceRange: 'Negativo', status: 'normal', section: 'Examen Químico (Tira Reactiva)', methodology: 'Actividad Peroxidásica' },
      { name: 'Nitritos', value: 'Negativo', unit: 'Cualitativo', referenceRange: 'Negativo', status: 'normal', section: 'Examen Químico (Tira Reactiva)', methodology: 'Reacción de Griess' },
      { name: 'Esterasa Leucocitaria', value: 'Negativo', unit: 'Leu/µL', referenceRange: 'Negativo', status: 'normal', section: 'Examen Químico (Tira Reactiva)', methodology: 'Hidrólisis de Indoxilo' },

      // SEDIMENTO
      { name: 'Leucocitos (Sedimento)', value: '1 - 2 por campo', unit: '/campo (400x)', referenceRange: '0 - 4 por campo', status: 'normal', section: 'Sedimento Microscópico Urinario', methodology: 'Microscopía Óptica Contraste' },
      { name: 'Hematíes (Sedimento)', value: '0 - 1 por campo', unit: '/campo (400x)', referenceRange: '0 - 2 por campo', status: 'normal', section: 'Sedimento Microscópico Urinario', methodology: 'Microscopía Óptica Contraste' },
      { name: 'Células Epiteliales Planas', value: 'Escasas', unit: 'Cualitativo', referenceRange: 'Escasas', status: 'normal', section: 'Sedimento Microscópico Urinario', methodology: 'Microscopía Óptica' },
      { name: 'Bacterias', value: 'Escasas', unit: 'Cualitativo', referenceRange: 'Escasas o Ausentes', status: 'normal', section: 'Sedimento Microscópico Urinario', methodology: 'Microscopía Óptica' },
      { name: 'Cristales', value: 'No se observan', unit: 'Hallazgo', referenceRange: 'Ausentes o no patológicos', status: 'normal', section: 'Sedimento Microscópico Urinario', methodology: 'Microscopía Óptica' },
      { name: 'Cilindros', value: 'No se observan', unit: 'Hallazgo', referenceRange: 'Ausentes o hialinos escasos', status: 'normal', section: 'Sedimento Microscópico Urinario', methodology: 'Microscopía Óptica' },
    ],
    defaultRecommendations: [
      'Sedimento urinario dentro de límites fisiológicos normales.',
      'No se evidencia bacteriuria significativa ni hematuria.',
      'Mantener hidratación adecuada con consumo regular de agua pura.',
    ]
  },
  {
    id: 'coproparasitologico',
    name: 'Examen Coproparasitológico & Físico-Químico',
    category: 'laboratorio',
    description: 'Análisis macroscópico, microscópico parasitológico y sangre oculta en heces.',
    defaultParameters: [
      // MACROSCOPICO
      { name: 'Color Fecal', value: 'Marrón / Pardo', unit: 'Visual', referenceRange: 'Pardo habitual', status: 'normal', section: 'Examen Macroscópico Fecal', methodology: 'Inspección Visual' },
      { name: 'Consistencia', value: 'Formada / Blanda (Bristol 4)', unit: 'Escala Bristol', referenceRange: 'Formada / Pastosa', status: 'normal', section: 'Examen Macroscópico Fecal', methodology: 'Inspección Visual' },
      { name: 'Moco Fecal', value: 'Ausente', unit: 'Cualitativo', referenceRange: 'Ausente', status: 'normal', section: 'Examen Macroscópico Fecal', methodology: 'Inspección Visual' },
      { name: 'Restos Alimenticios Indigeridos', value: 'Escasos', unit: 'Cualitativo', referenceRange: 'Escasos', status: 'normal', section: 'Examen Macroscópico Fecal', methodology: 'Inspección Visual' },

      // MICROSCOPICO
      { name: 'Quistes de Protozoarios', value: 'No se observan', unit: 'Lugol / Salina', referenceRange: 'Ausentes', status: 'normal', section: 'Examen Microscópico Parasitológico', methodology: 'Frotis Directo Lugol y Salina' },
      { name: 'Trofozoítos', value: 'No se observan', unit: 'Lugol / Salina', referenceRange: 'Ausentes', status: 'normal', section: 'Examen Microscópico Parasitológico', methodology: 'Frotis Directo Inmediato' },
      { name: 'Huevos de Helmintos', value: 'No se observan', unit: 'Directo / Faust', referenceRange: 'Ausentes', status: 'normal', section: 'Examen Microscópico Parasitológico', methodology: 'Concentración Faust / Ritchie' },
      { name: 'Larvas', value: 'No se observan', unit: 'Hallazgo', referenceRange: 'Ausentes', status: 'normal', section: 'Examen Microscópico Parasitológico', methodology: 'Microscopía Óptica' },
      { name: 'Leucocitos Fecales', value: '0 - 1 por campo', unit: '/campo (400x)', referenceRange: 'Ausentes o < 2 por campo', status: 'normal', section: 'Examen Microscópico Parasitológico', methodology: 'Azul de Metileno / Lugol' },
      { name: 'Hematíes Fecales', value: 'No se observan', unit: '/campo (400x)', referenceRange: 'Ausentes', status: 'normal', section: 'Examen Microscópico Parasitológico', methodology: 'Microscopía Óptica' },

      // QUIMICO
      { name: 'Sangre Oculta en Heces (Thevenon / Guayaco)', value: 'Negativo', unit: 'Cualitativo', referenceRange: 'Negativo', status: 'normal', section: 'Pruebas Químicas Fecales', methodology: 'Inmunocromatografía / Guayaco' },
      { name: 'pH Fecal', value: '7.0', unit: 'pH', referenceRange: '6.8 - 7.5', status: 'normal', section: 'Pruebas Químicas Fecales', methodology: 'Tira Indicadora' },
    ],
    defaultRecommendations: [
      'Examen coprológico negativo para parásitos y sangre oculta.',
      'Mantener medidas de higiene en la manipulación y consumo de alimentos.',
      'Control rutinario según evaluación clínica.',
    ]
  },
  {
    id: 'informe-radiologico',
    name: 'Informe Radiológico de Tórax (PA)',
    category: 'radiologia',
    description: 'Evaluación imagenológica de campos pulmonares, silueta cardiaca y estructuras óseas.',
    defaultParameters: [
      { name: 'Campos Pulmonares', value: 'Expansión simétrica, parénquima libre de condensaciones', unit: 'Hallazgo', referenceRange: 'Sin infiltrados ni consolidaciones', status: 'normal', section: 'Hallazgos Pleuropulmonares' },
      { name: 'Silueta Cardiotorácica', value: 'Índice cardiotorácico 0.46 (Normal)', unit: 'ICT', referenceRange: 'Índice < 0.50', status: 'normal', section: 'Silueta Cardiovascular' },
      { name: 'Senos Costofrénicos y Cardiofrénicos', value: 'Libres y agudos bilateralmente', unit: 'Hallazgo', referenceRange: 'Libres', status: 'normal', section: 'Espacio Pleural & Recesos' },
      { name: 'Estructuras Óseas y Partes Blandas', value: 'Sin alteraciones ni fracturas visibles', unit: 'Hallazgo', referenceRange: 'Sin lesiones óseas', status: 'normal', section: 'Pared Torácica & Óseo' },
    ],
    defaultRecommendations: [
      'Radiografía de tórax dentro de límites radiológicos normales.',
      'Correlacionar clínicamente ante eventual aparición de tos persistente o dificultad respiratoria.',
    ]
  }
];

import { INITIAL_PATIENTS } from './patientsData';
export { INITIAL_PATIENTS };

export const INITIAL_REPORTS: MedicalReport[] = [
  {
    id: 'rep-1',
    reportNumber: 'LAB-2026-0842',
    patientId: 'pat-1',
    patientName: 'Carlos Alberto Mendoza Rojas',
    patientNationalId: '104829104',
    patientAge: 42,
    patientGender: 'M',
    category: 'bioquimica',
    title: 'Perfil Lipídico Integral y Riesgo Cardiovascular',
    sampleDate: '2026-08-25T07:45:00.000Z',
    emissionDate: '2026-08-25T15:30:00.000Z',
    laboratoryName: 'VACLINIC - Laboratorio Clínico',
    status: 'publicado',
    parameters: [
      { id: 'p1', name: 'Colesterol Total', value: 218, unit: 'mg/dL', referenceRange: '< 200 mg/dL', status: 'high', minVal: 0, maxVal: 200, notes: 'Ligeramente elevado sobre el límite ideal de 200 mg/dL' },
      { id: 'p2', name: 'Colesterol HDL (Bueno)', value: 42, unit: 'mg/dL', referenceRange: '> 40 mg/dL', status: 'normal', minVal: 40, maxVal: 100, notes: 'Fracción protectora cardiovascular en rango adecuado' },
      { id: 'p3', name: 'Colesterol LDL (Malo)', value: 142, unit: 'mg/dL', referenceRange: '< 100 mg/dL', status: 'high', minVal: 0, maxVal: 100, notes: 'Fracción aterogénica moderadamente elevada' },
      { id: 'p4', name: 'Colesterol VLDL', value: 34, unit: 'mg/dL', referenceRange: '5 - 30 mg/dL', status: 'high', minVal: 5, maxVal: 30, notes: 'Transportador de triglicéridos con leve incremento' },
      { id: 'p5', name: 'Triglicéridos', value: 170, unit: 'mg/dL', referenceRange: '< 150 mg/dL', status: 'high', minVal: 0, maxVal: 150, notes: 'Elevación moderada relacionada con dieta y carbohidratos' },
      { id: 'p6', name: 'Índice Aterogénico (CT/HDL)', value: 5.19, unit: 'Ratio', referenceRange: '< 4.5', status: 'high', minVal: 0, maxVal: 4.5, notes: 'Riesgo coronario leve a moderado' },
      { id: 'p7', name: 'Glucosa en Ayunas', value: 98, unit: 'mg/dL', referenceRange: '70 - 100 mg/dL', status: 'normal', minVal: 70, maxVal: 100, notes: 'Nivel óptimo normalizado gracias a cambios en el estilo de vida' },
    ],
    clinicalFindings: 'Se evidencia hipercolesterolemia moderada con elevación concomitante de triglicéridos e incremento en la fracción aterogénica LDL.',
    doctorConclusions: 'Dislipidemia mixta de predominio aterogénico (elevación de LDL y triglicéridos). Riesgo cardiovascular leve a moderado. Función hepato-metabólica global estable.',
    patientExplanation: 'Hola Carlos. En este análisis revisamos tus niveles de grasas en sangre. Encontramos que el colesterol total (218 mg/dL) y los triglicéridos (170 mg/dL) están ligeramente por encima de lo ideal. Tu colesterol protector (HDL) se mantiene bien. Con pequeños ajustes en la dieta, disminuyendo frituras y azúcares, junto con caminatas regulares, podrás normalizar estos valores con facilidad.',
    recommendations: [
      'Adoptar plan nutricional bajo en grasas saturadas y harinas refinadas.',
      'Caminatas activas o ejercicio cardiovascular de 30 minutos al menos 5 días a la semana.',
      'Aumentar la ingesta de fibra soluble (avena, legumbres, vegetales verdes).',
      'Control de laboratorio en 90 días para evaluar progreso metabólico.'
    ],
    signature: {
      doctorName: 'Dr. Alejandro Valenzuela Morales',
      doctorSpecialty: 'Médico Patólogo Clínico & Bioquímica Médica',
      doctorLicense: 'CMP-649102 / RNE-28491',
      signedAt: '2026-08-25T16:00:00.000Z',
      validationHash: '0x8f2a99c4b1e77d33a61f22490b'
    },
    qrVerificationCode: 'VALID-SANRAFAEL-LAB-2026-0842'
  },
  {
    id: 'rep-1-prev',
    reportNumber: 'LAB-2026-0312',
    patientId: 'pat-1',
    patientName: 'Carlos Alberto Mendoza Rojas',
    patientNationalId: '104829104',
    patientAge: 42,
    patientGender: 'M',
    category: 'bioquimica',
    title: 'Perfil Lipídico de Control Previo',
    sampleDate: '2026-03-10T08:00:00.000Z',
    emissionDate: '2026-03-10T16:00:00.000Z',
    laboratoryName: 'VACLINIC - Laboratorio Clínico',
    status: 'publicado',
    parameters: [
      { id: 'p1p', name: 'Colesterol Total', value: 245, unit: 'mg/dL', referenceRange: '< 200 mg/dL', status: 'high', minVal: 0, maxVal: 200 },
      { id: 'p2p', name: 'Colesterol HDL (Bueno)', value: 38, unit: 'mg/dL', referenceRange: '> 40 mg/dL', status: 'low', minVal: 40, maxVal: 100 },
      { id: 'p3p', name: 'Colesterol LDL (Malo)', value: 162, unit: 'mg/dL', referenceRange: '< 100 mg/dL', status: 'high', minVal: 0, maxVal: 100 },
      { id: 'p4p', name: 'Colesterol VLDL', value: 45, unit: 'mg/dL', referenceRange: '5 - 30 mg/dL', status: 'high', minVal: 5, maxVal: 30 },
      { id: 'p5p', name: 'Triglicéridos', value: 225, unit: 'mg/dL', referenceRange: '< 150 mg/dL', status: 'high', minVal: 0, maxVal: 150 },
      { id: 'p6p', name: 'Índice Aterogénico (CT/HDL)', value: 6.44, unit: 'Ratio', referenceRange: '< 4.5', status: 'high', minVal: 0, maxVal: 4.5 },
      { id: 'p7p', name: 'Glucosa en Ayunas', value: 114, unit: 'mg/dL', referenceRange: '70 - 100 mg/dL', status: 'high', minVal: 70, maxVal: 100 },
    ],
    clinicalFindings: 'Hipercolesterolemia marcada con hipertrigliceridemia y descenso de HDL.',
    doctorConclusions: 'Dislipidemia moderada a severa. Se indican cambios estrictos en estilo de vida.',
    patientExplanation: 'Tus niveles lipídicos estaban notablemente elevados. Se requirió ajuste dietético urgente.',
    recommendations: [
      'Iniciar restricción de grasas saturadas.',
      'Incrementar actividad física diaria.',
      'Control en 5 meses.'
    ],
    signature: {
      doctorName: 'Dr. Alejandro Valenzuela Morales',
      doctorSpecialty: 'Médico Patólogo Clínico & Bioquímica Médica',
      doctorLicense: 'CMP-649102 / RNE-28491',
      signedAt: '2026-03-10T17:00:00.000Z',
      validationHash: '0x33b1e7790b'
    },
    qrVerificationCode: 'VALID-SANRAFAEL-LAB-2026-0312'
  },
  {
    id: 'rep-1-prev2',
    reportNumber: 'LAB-2025-1104',
    patientId: 'pat-1',
    patientName: 'Carlos Alberto Mendoza Rojas',
    patientNationalId: '104829104',
    patientAge: 41,
    patientGender: 'M',
    category: 'bioquimica',
    title: 'Chequeo Metabólico y Glucosa Anual',
    sampleDate: '2025-11-15T07:30:00.000Z',
    emissionDate: '2025-11-15T15:00:00.000Z',
    laboratoryName: 'VACLINIC - Laboratorio Clínico',
    status: 'publicado',
    parameters: [
      { id: 'p1p2', name: 'Colesterol Total', value: 260, unit: 'mg/dL', referenceRange: '< 200 mg/dL', status: 'high', minVal: 0, maxVal: 200 },
      { id: 'p2p2', name: 'Colesterol HDL (Bueno)', value: 36, unit: 'mg/dL', referenceRange: '> 40 mg/dL', status: 'low', minVal: 40, maxVal: 100 },
      { id: 'p3p2', name: 'Colesterol LDL (Malo)', value: 175, unit: 'mg/dL', referenceRange: '< 100 mg/dL', status: 'high', minVal: 0, maxVal: 100 },
      { id: 'p5p2', name: 'Triglicéridos', value: 245, unit: 'mg/dL', referenceRange: '< 150 mg/dL', status: 'high', minVal: 0, maxVal: 150 },
      { id: 'p7p2', name: 'Glucosa en Ayunas', value: 122, unit: 'mg/dL', referenceRange: '70 - 100 mg/dL', status: 'high', minVal: 70, maxVal: 100 },
      { id: 'p8p2', name: 'Hemoglobina', value: 14.8, unit: 'g/dL', referenceRange: '13.0 - 17.0', status: 'normal', minVal: 13.0, maxVal: 17.0 }
    ],
    clinicalFindings: 'Glucemia alterada en ayunas y dislipidemia aterogénica pronunciada.',
    doctorConclusions: 'Síndrome metabólico en estadio inicial. Requiere abordaje nutricional y ejercicio regular.',
    patientExplanation: 'Tus exámenes del año pasado mostraron glucosa y colesterol altos.',
    recommendations: [
      'Plan hipocalórico.',
      'Control metabólico periódico.'
    ],
    signature: {
      doctorName: 'Dr. Alejandro Valenzuela Morales',
      doctorSpecialty: 'Médico Patólogo Clínico & Bioquímica Médica',
      doctorLicense: 'CMP-649102 / RNE-28491',
      signedAt: '2025-11-15T16:00:00.000Z',
      validationHash: '0x11b98a77f2'
    },
    qrVerificationCode: 'VALID-SANRAFAEL-LAB-2025-1104'
  },
  {
    id: 'rep-1-prev3',
    reportNumber: 'LAB-2025-0620',
    patientId: 'pat-1',
    patientName: 'Carlos Alberto Mendoza Rojas',
    patientNationalId: '104829104',
    patientAge: 41,
    patientGender: 'M',
    category: 'bioquimica',
    title: 'Control Metabólico Trimestral',
    sampleDate: '2025-06-20T08:00:00.000Z',
    emissionDate: '2025-06-20T16:30:00.000Z',
    laboratoryName: 'VACLINIC - Laboratorio Clínico',
    status: 'publicado',
    parameters: [
      { id: 'p1p3', name: 'Colesterol Total', value: 250, unit: 'mg/dL', referenceRange: '< 200 mg/dL', status: 'high', minVal: 0, maxVal: 200 },
      { id: 'p2p3', name: 'Colesterol HDL (Bueno)', value: 37, unit: 'mg/dL', referenceRange: '> 40 mg/dL', status: 'low', minVal: 40, maxVal: 100 },
      { id: 'p3p3', name: 'Colesterol LDL (Malo)', value: 168, unit: 'mg/dL', referenceRange: '< 100 mg/dL', status: 'high', minVal: 0, maxVal: 100 },
      { id: 'p5p3', name: 'Triglicéridos', value: 230, unit: 'mg/dL', referenceRange: '< 150 mg/dL', status: 'high', minVal: 0, maxVal: 150 },
      { id: 'p7p3', name: 'Glucosa en Ayunas', value: 118, unit: 'mg/dL', referenceRange: '70 - 100 mg/dL', status: 'high', minVal: 70, maxVal: 100 },
    ],
    clinicalFindings: 'Control previo con niveles moderadamente elevados.',
    doctorConclusions: 'Monitoreo metabólico.',
    patientExplanation: 'Control de rutina anterior.',
    recommendations: ['Seguimiento continuo.'],
    signature: {
      doctorName: 'Dr. Alejandro Valenzuela Morales',
      doctorSpecialty: 'Médico Patólogo Clínico & Bioquímica Médica',
      doctorLicense: 'CMP-649102 / RNE-28491',
      signedAt: '2025-06-20T17:00:00.000Z',
      validationHash: '0x22c4d9a101'
    },
    qrVerificationCode: 'VALID-SANRAFAEL-LAB-2025-0620'
  },
  {
    id: 'rep-2',
    reportNumber: 'LAB-2026-0843',
    patientId: 'pat-1',
    patientName: 'Carlos Alberto Mendoza Rojas',
    patientNationalId: '104829104',
    patientAge: 42,
    patientGender: 'M',
    category: 'hematologia',
    title: 'Hemograma Completo Automatizado',
    sampleDate: '2026-08-25T07:45:00.000Z',
    emissionDate: '2026-08-25T14:10:00.000Z',
    laboratoryName: 'VACLINIC - Laboratorio Clínico',
    status: 'publicado',
    parameters: [
      { id: 'p11', name: 'Eritrocitos (Glóbulos Rojos)', value: 5.12, unit: 'M/µL', referenceRange: '4.20 - 5.40', status: 'normal', minVal: 4.2, maxVal: 5.4, notes: 'Producción de glóbulos rojos saludable' },
      { id: 'p12', name: 'Hemoglobina', value: 15.2, unit: 'g/dL', referenceRange: '13.0 - 17.0', status: 'normal', minVal: 13.0, maxVal: 17.0, notes: 'Capacidad óptima de oxigenación tisular' },
      { id: 'p13', name: 'Hematocrito', value: 45.0, unit: '%', referenceRange: '39.0 - 50.0', status: 'normal', minVal: 39.0, maxVal: 50.0, notes: 'Volumen globular porcentual adecuado' },
      { id: 'p14', name: 'Leucocitos Totales', value: 7200, unit: '/mm³', referenceRange: '4500 - 10500', status: 'normal', minVal: 4500, maxVal: 10500, notes: 'Sistema inmunitario y defensas en equilibrio' },
      { id: 'p15', name: 'Plaquetas', value: 260000, unit: '/mm³', referenceRange: '150000 - 450000', status: 'normal', minVal: 150000, maxVal: 450000, notes: 'Coagulación sanguínea normal' },
    ],
    clinicalFindings: 'Serie eritroide, leucocitaria y plaquetaria cuantitativa y cualitativamente conservadas sin desviaciones.',
    doctorConclusions: 'Hemograma sin alteraciones hematológicas. Descartada anemia y procesos infecciosos agudos.',
    patientExplanation: 'Tu conteo sanguíneo está en excelente estado. La hemoglobina (15.2 g/dL) descarta anemia y tus defensas (glóbulos blancos) están en un número ideal y trabajando de forma adecuada.',
    recommendations: [
      'Mantener estilo de vida activo y alimentación balanceada.',
      'Control preventivo anual.'
    ],
    signature: {
      doctorName: 'Dra. Patricia Méndez Cárdenas',
      doctorSpecialty: 'Hematología y Diagnóstico Clínico',
      doctorLicense: 'CMP-774192 / RNE-19402',
      signedAt: '2026-08-25T14:45:00.000Z',
      validationHash: '0x99a2c10b77e814df33b49'
    },
    qrVerificationCode: 'VALID-SANRAFAEL-LAB-2026-0843'
  },
  {
    id: 'rep-3',
    reportNumber: 'LAB-2026-0850',
    patientId: 'pat-2',
    patientName: 'Valeria Sofía Ortiz Ramírez',
    patientNationalId: '208491823',
    patientAge: 30,
    patientGender: 'F',
    category: 'laboratorio',
    title: 'Perfil Tiroideo T3 - T4 - TSH',
    sampleDate: '2026-08-27T08:15:00.000Z',
    emissionDate: '2026-08-27T17:00:00.000Z',
    laboratoryName: 'VACLINIC - Laboratorio Clínico',
    status: 'publicado',
    parameters: [
      { id: 'p21', name: 'TSH Ultrasensible', value: 2.15, unit: 'µUI/mL', referenceRange: '0.40 - 4.20', status: 'normal', minVal: 0.4, maxVal: 4.2, notes: 'Control hipofisario tiroideo óptimo' },
      { id: 'p22', name: 'T4 Libre', value: 1.34, unit: 'ng/dL', referenceRange: '0.80 - 1.80', status: 'normal', minVal: 0.8, maxVal: 1.8, notes: 'Hormona tiroidea activa en equilibrio' },
      { id: 'p23', name: 'T3 Total', value: 1.22, unit: 'ng/mL', referenceRange: '0.80 - 2.00', status: 'normal', minVal: 0.8, maxVal: 2.0, notes: 'Regulación metabólica celular normal' },
    ],
    clinicalFindings: 'Concentraciones séricas de TSH y hormonas tiroideas periféricas dentro de rangos biológicos estándar.',
    doctorConclusions: 'Eutiroidismo bioquímico normofuncionante.',
    patientExplanation: 'Hola Valeria. Tu glándula tiroides está funcionando de manera óptima y equilibrada. La hormona TSH (2.15) y la T4 Libre están en rangos completamente normales.',
    recommendations: [
      'No requiere tratamiento farmacológico tiroideo.',
      'Seguimiento médico de rutina.'
    ],
    signature: {
      doctorName: 'Dr. Alejandro Valenzuela Morales',
      doctorSpecialty: 'Médico Patólogo Clínico & Bioquímica Médica',
      doctorLicense: 'CMP-649102 / RNE-28491',
      signedAt: '2026-08-27T17:30:00.000Z',
      validationHash: '0x14f9d233e88aa0b5c102'
    },
    qrVerificationCode: 'VALID-SANRAFAEL-LAB-2026-0850'
  },
  {
    id: 'rep-4',
    reportNumber: 'LAB-2026-0855',
    patientId: 'pat-3',
    patientName: 'Rodrigo Morales Echeverría',
    patientNationalId: '309182741',
    patientAge: 58,
    patientGender: 'M',
    category: 'bioquimica',
    title: 'Química Sanguínea & Perfil Glucémico',
    sampleDate: '2026-08-28T07:30:00.000Z',
    emissionDate: '2026-08-28T12:00:00.000Z',
    laboratoryName: 'VACLINIC - Laboratorio Clínico',
    status: 'revision',
    parameters: [
      { id: 'p31', name: 'Glucosa Basal en Ayunas', value: 126, unit: 'mg/dL', referenceRange: '70 - 100 mg/dL', status: 'high', minVal: 70, maxVal: 100, notes: 'Requiere atención para control glucémico' },
      { id: 'p32', name: 'Hemoglobina Glicosilada (HbA1c)', value: 6.7, unit: '%', referenceRange: '< 5.7 %', status: 'high', minVal: 4.0, maxVal: 5.7, notes: 'Promedio glucémico de 90 días elevado' },
      { id: 'p33', name: 'Creatinina Sérica', value: 1.15, unit: 'mg/dL', referenceRange: '0.60 - 1.20 mg/dL', status: 'normal', minVal: 0.6, maxVal: 1.2, notes: 'Filtración renal dentro de parámetros saludables' },
      { id: 'p34', name: 'Urea', value: 34, unit: 'mg/dL', referenceRange: '15 - 45 mg/dL', status: 'normal', minVal: 15, maxVal: 45, notes: 'Metabolismo proteico normal' },
    ],
    clinicalFindings: 'Glucemia basal en ayunas elevada compatible con alteración del metabolismo de carbohidratos. Función renal conservada.',
    doctorConclusions: 'Niveles glucémicos y HbA1c sugestivos de Diabetes Mellitus tipo 2 incipiente. Requiere valoración por endocrinología / medicina interna.',
    patientExplanation: 'Hola Rodrigo. Tu nivel de azúcar en sangre (126 mg/dL) y el promedio de los últimos tres meses (HbA1c en 6.7%) están por encima del rango normal. Tu función renal está protegida y sana. Es fundamental programar tu consulta médica para iniciar un plan de cuidado que estabilice tu glucosa.',
    recommendations: [
      'Consulta prioritaria con su médico tratante o endocrinólogo.',
      'Control diario de glucemia capilar en ayunas.',
      'Plan alimentario bajo en índice glicémico (reducir refrescos, pan blanco y dulces).'
    ],
    urgentAlert: false,
    qrVerificationCode: 'VALID-SANRAFAEL-LAB-2026-0855'
  }
];

export const INITIAL_PUSH_NOTIFICATIONS = [
  {
    id: 'push-1',
    patientId: 'pat-1',
    patientName: 'Carlos Alberto Mendoza Rojas',
    reportId: 'rep-1',
    reportNumber: 'LAB-2026-0842',
    type: 'report_ready' as const,
    title: '📄 ¡Tus Resultados de Laboratorio Están Listos!',
    body: 'El informe "Hemograma Completo Automatizado & Perfil Lipídico" (LAB-2026-0842) ha sido firmado y validado por el especialista.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    read: false,
    urgent: false,
    actionLabel: 'Ver y Descargar Informe',
    channel: 'web_push' as const,
    deliveredViaBrowser: true
  },
  {
    id: 'push-2',
    patientId: 'pat-1',
    patientName: 'Carlos Alberto Mendoza Rojas',
    episodeId: 'ep-101',
    type: 'sample_processed' as const,
    title: '🧪 Muestras Ingresadas a Analizadores Automatizados',
    body: 'Tus tubos con código de barras han completado la etapa de flebotomía y están siendo procesados en el autoanalizador Sysmex XN-550.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    read: true,
    urgent: false,
    actionLabel: 'Ver Trazabilidad 4D',
    channel: 'in_app' as const
  },
  {
    id: 'push-3',
    patientId: 'pat-1',
    patientName: 'Carlos Alberto Mendoza Rojas',
    type: 'health_tip' as const,
    title: '💧 Tip de Salud VACLINIC: Hidratación & Riñones',
    body: 'Tus valores renales se encuentran estables. Mantener una ingesta de 2L diarios de agua pura previene la precipitación de cristales.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    urgent: false,
    actionLabel: 'Explorar Tips de Salud',
    channel: 'in_app' as const
  },
  {
    id: 'push-4',
    patientId: 'pat-2',
    patientName: 'Valeria Sofía Carrillo Vega',
    reportId: 'rep-3',
    reportNumber: 'LAB-2026-0850',
    type: 'report_ready' as const,
    title: '📄 Informe Disponible: Perfil Tiroideo Completo',
    body: 'Tu informe médico LAB-2026-0850 está disponible para consulta y descarga con firma electrónica.',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: false,
    urgent: false,
    actionLabel: 'Descargar Resultados',
    channel: 'web_push' as const
  }
];
