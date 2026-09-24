import { 
  AttachedAnalyzerReport, 
  MedicalReport, 
  ReportParameter, 
  VolumeHistogramData, 
  CellDistributionMicrograph, 
  CellMorphologyItem 
} from '../types';

// Helper generating SVG data URLs for cell micrographs
const createCellSvg = (label: string, bg: string, nucleusColor: string, shape: string, granules?: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <radialGradient id="bgGrad" cx="45%" cy="45%" r="60%">
        <stop offset="0%" stop-color="#fdfbf7"/>
        <stop offset="60%" stop-color="#f0ebe0"/>
        <stop offset="100%" stop-color="#dcd3c3"/>
      </radialGradient>
      <radialGradient id="cytoGrad" cx="40%" cy="40%" r="65%">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="${bg}" stop-opacity="0.85"/>
      </radialGradient>
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.25"/>
      </filter>
    </defs>
    <!-- Background field -->
    <rect width="100" height="100" fill="url(#bgGrad)"/>
    <!-- Stray faint RBCs in background -->
    <circle cx="18" cy="22" r="9" fill="#f0c2a8" opacity="0.6"/>
    <circle cx="86" cy="18" r="8.5" fill="#f0c2a8" opacity="0.5"/>
    <circle cx="14" cy="80" r="8" fill="#f0c2a8" opacity="0.65"/>
    <circle cx="82" cy="78" r="9.5" fill="#f0c2a8" opacity="0.6"/>
    <!-- Main Cell Cytoplasm -->
    <circle cx="50" cy="50" r="34" fill="url(#cytoGrad)" filter="url(#shadow)" stroke="#cbb29c" stroke-width="0.8"/>
    <!-- Granules if any -->
    ${granules || ''}
    <!-- Nucleus path -->
    ${shape}
    <!-- Label -->
    <rect x="2" y="82" width="40" height="16" rx="3" fill="#1e293b" opacity="0.75"/>
    <text x="22" y="94" fill="#ffffff" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Distinct cell morphology SVG representations
const NST_SHAPE = `<path d="M 38 32 C 30 38, 30 62, 38 68 C 44 72, 60 70, 62 62 C 64 54, 52 52, 48 48 C 45 42, 56 36, 54 30 C 50 24, 42 26, 38 32 Z" fill="#2d1b4e"/>`;
const NSG_SHAPE_1 = `<path d="M 36 34 C 32 38, 32 46, 38 48 C 42 45, 48 46, 46 54 C 44 62, 38 66, 42 70 C 48 72, 56 68, 58 60 C 60 52, 54 48, 58 42 C 62 36, 56 30, 48 30 C 42 30, 38 30, 36 34 Z" fill="#2e1a47"/>`;
const NSG_SHAPE_2 = `<path d="M 40 28 A 9 9 0 0 0 34 42 L 38 48 A 8 8 0 0 0 46 58 L 52 52 A 9 9 0 0 0 62 38 Z" fill="#2c1a45"/>`;
const NSG_SHAPE_3 = `<g fill="#2e1a47"><ellipse cx="36" cy="38" rx="8" ry="10"/><ellipse cx="44" cy="58" rx="9" ry="8"/><ellipse cx="60" cy="44" rx="8" ry="10"/><line x1="38" y1="44" x2="42" y2="52" stroke="#2e1a47" stroke-width="4"/><line x1="48" y1="54" x2="56" y2="48" stroke="#2e1a47" stroke-width="4"/></g>`;
const NSH_SHAPE = `<g fill="#27143f"><circle cx="34" cy="36" r="7"/><circle cx="48" cy="32" r="7"/><circle cx="62" cy="40" r="6.5"/><circle cx="58" cy="58" r="7.5"/><circle cx="40" cy="62" r="7"/><path d="M 34 36 Q 48 32 62 40 Q 58 58 40 62 Z" fill="none" stroke="#27143f" stroke-width="3"/></g>`;
const LYM_SHAPE = `<circle cx="50" cy="50" r="27" fill="#1e1b4b"/>`;
const MON_SHAPE = `<path d="M 36 32 C 28 42, 28 60, 38 68 C 48 74, 62 72, 66 60 C 68 50, 56 50, 52 48 C 48 45, 58 38, 54 30 C 50 24, 42 25, 36 32 Z" fill="#312e81"/>`;
const EOS_SHAPE = `<g fill="#371a4f"><ellipse cx="42" cy="48" rx="9" ry="13"/><ellipse cx="58" cy="50" rx="9" ry="12"/><path d="M 44 48 L 56 50" stroke="#371a4f" stroke-width="5"/></g>`;
const EOS_GRANULES = `<g fill="#ea580c" opacity="0.85"><circle cx="32" cy="36" r="2"/><circle cx="38" cy="30" r="2.2"/><circle cx="60" cy="32" r="2"/><circle cx="66" cy="40" r="2.4"/><circle cx="68" cy="56" r="2"/><circle cx="54" cy="68" r="2.5"/><circle cx="36" cy="64" r="2.2"/><circle cx="30" cy="52" r="2"/><circle cx="50" cy="30" r="2.2"/><circle cx="46" cy="68" r="2.1"/><circle cx="28" cy="44" r="2.3"/></g>`;
const BAS_SHAPE = `<ellipse cx="50" cy="50" rx="18" ry="16" fill="#1e1b4b" opacity="0.7"/>`;
const BAS_GRANULES = `<g fill="#0f172a" opacity="0.95"><circle cx="36" cy="40" r="3.2"/><circle cx="48" cy="36" r="3.5"/><circle cx="60" cy="42" r="3.1"/><circle cx="44" cy="50" r="3.8"/><circle cx="56" cy="54" r="3.5"/><circle cx="38" cy="58" r="3.2"/><circle cx="50" cy="64" r="3.4"/><circle cx="64" cy="58" r="3"/><circle cx="32" cy="48" r="2.8"/><circle cx="62" cy="48" r="3.3"/></g>`;
const RET_SHAPE = `<g><circle cx="50" cy="50" r="26" fill="#f87171" opacity="0.85"/><path d="M 42 42 Q 46 48 50 44 T 58 52 M 46 54 Q 52 50 54 58" fill="none" stroke="#1e3a8a" stroke-width="2.5" stroke-linecap="round"/></g>`;

// 8 Cell Morphology Categories
export const OZELLE_MORPHOLOGY_GALLERY: CellMorphologyItem[] = [
  {
    cellCode: 'NST#',
    cellName: 'Neutrófilos en banda (Células en cayado)',
    countValue: '0.02 x 10³/µL',
    refRange: '0.04 - 0.5 10³/µL',
    magnification: '100x Óptico / Inmersión',
    images: [
      createCellSvg('NST-01', '#dbeafe', '#2d1b4e', NST_SHAPE),
      createCellSvg('NST-02', '#dbeafe', '#2d1b4e', NST_SHAPE)
    ]
  },
  {
    cellCode: 'NSG#',
    cellName: 'Neutrófilos segmentados polimorfonucleares',
    countValue: '2.90 x 10³/µL',
    refRange: '2.0 - 7.0 10³/µL',
    magnification: '100x Óptico / Inmersión',
    images: [
      createCellSvg('NSG-01', '#e0e7ff', '#2e1a47', NSG_SHAPE_1),
      createCellSvg('NSG-02', '#e0e7ff', '#2c1a45', NSG_SHAPE_2),
      createCellSvg('NSG-03', '#e0e7ff', '#2e1a47', NSG_SHAPE_3),
      createCellSvg('NSG-04', '#e0e7ff', '#2e1a47', NSG_SHAPE_1),
      createCellSvg('NSG-05', '#e0e7ff', '#2c1a45', NSG_SHAPE_2),
      createCellSvg('NSG-06', '#e0e7ff', '#2e1a47', NSG_SHAPE_3),
      createCellSvg('NSG-07', '#e0e7ff', '#2e1a47', NSG_SHAPE_1),
      createCellSvg('NSG-08', '#e0e7ff', '#2c1a45', NSG_SHAPE_2)
    ]
  },
  {
    cellCode: 'NSH#',
    cellName: 'Neutrófilos hipersegmentados (>5 lóbulos)',
    countValue: '0.06 x 10³/µL',
    refRange: '0.0 - 0.3 10³/µL',
    magnification: '100x Óptico / Inmersión',
    images: [
      createCellSvg('NSH-01', '#ede9fe', '#27143f', NSH_SHAPE),
      createCellSvg('NSH-02', '#ede9fe', '#27143f', NSH_SHAPE)
    ]
  },
  {
    cellCode: 'LYM#',
    cellName: 'Linfocitos maduros de morfología típica',
    countValue: '2.75 x 10³/µL',
    refRange: '1.1 - 3.2 10³/µL',
    magnification: '100x Óptico / Inmersión',
    images: [
      createCellSvg('LYM-01', '#c7d2fe', '#1e1b4b', LYM_SHAPE),
      createCellSvg('LYM-02', '#c7d2fe', '#1e1b4b', LYM_SHAPE),
      createCellSvg('LYM-03', '#c7d2fe', '#1e1b4b', LYM_SHAPE),
      createCellSvg('LYM-04', '#c7d2fe', '#1e1b4b', LYM_SHAPE),
      createCellSvg('LYM-05', '#c7d2fe', '#1e1b4b', LYM_SHAPE),
      createCellSvg('LYM-06', '#c7d2fe', '#1e1b4b', LYM_SHAPE),
      createCellSvg('LYM-07', '#c7d2fe', '#1e1b4b', LYM_SHAPE)
    ]
  },
  {
    cellCode: 'MON#',
    cellName: 'Monocitos grandes con citoplasma gris-azulado',
    countValue: '0.49 x 10³/µL',
    refRange: '0.1 - 0.6 10³/µL',
    magnification: '100x Óptico / Inmersión',
    images: [
      createCellSvg('MON-01', '#cbd5e1', '#312e81', MON_SHAPE),
      createCellSvg('MON-02', '#cbd5e1', '#312e81', MON_SHAPE),
      createCellSvg('MON-03', '#cbd5e1', '#312e81', MON_SHAPE),
      createCellSvg('MON-04', '#cbd5e1', '#312e81', MON_SHAPE),
      createCellSvg('MON-05', '#cbd5e1', '#312e81', MON_SHAPE),
      createCellSvg('MON-06', '#cbd5e1', '#312e81', MON_SHAPE),
      createCellSvg('MON-07', '#cbd5e1', '#312e81', MON_SHAPE)
    ]
  },
  {
    cellCode: 'EOS#',
    cellName: 'Eosinófilos con granulación naranja refringente',
    countValue: '0.04 x 10³/µL',
    refRange: '0.02 - 0.52 10³/µL',
    magnification: '100x Óptico / Inmersión',
    images: [
      createCellSvg('EOS-01', '#ffedd5', '#371a4f', EOS_SHAPE, EOS_GRANULES),
      createCellSvg('EOS-02', '#ffedd5', '#371a4f', EOS_SHAPE, EOS_GRANULES),
      createCellSvg('EOS-03', '#ffedd5', '#371a4f', EOS_SHAPE, EOS_GRANULES),
      createCellSvg('EOS-04', '#ffedd5', '#371a4f', EOS_SHAPE, EOS_GRANULES),
      createCellSvg('EOS-05', '#ffedd5', '#371a4f', EOS_SHAPE, EOS_GRANULES)
    ]
  },
  {
    cellCode: 'BAS#',
    cellName: 'Basófilos con granulación gruesa metacromática',
    countValue: '0.06 x 10³/µL',
    refRange: '0.0 - 0.06 10³/µL',
    magnification: '100x Óptico / Inmersión',
    images: [
      createCellSvg('BAS-01', '#e2e8f0', '#1e1b4b', BAS_SHAPE, BAS_GRANULES),
      createCellSvg('BAS-02', '#e2e8f0', '#1e1b4b', BAS_SHAPE, BAS_GRANULES),
      createCellSvg('BAS-03', '#e2e8f0', '#1e1b4b', BAS_SHAPE, BAS_GRANULES),
      createCellSvg('BAS-04', '#e2e8f0', '#1e1b4b', BAS_SHAPE, BAS_GRANULES),
      createCellSvg('BAS-05', '#e2e8f0', '#1e1b4b', BAS_SHAPE, BAS_GRANULES),
      createCellSvg('BAS-06', '#e2e8f0', '#1e1b4b', BAS_SHAPE, BAS_GRANULES),
      createCellSvg('BAS-07', '#e2e8f0', '#1e1b4b', BAS_SHAPE, BAS_GRANULES)
    ]
  },
  {
    cellCode: 'RET#',
    cellName: 'Reticulocitos con tinción de Azul de Cresil Brillante',
    countValue: '16.97 x 10³/µL',
    refRange: '24.0 - 84.0 10³/µL',
    magnification: '100x Inmersión / Tinción Supravital',
    images: [
      createCellSvg('RET-01', '#fee2e2', '#1e3a8a', RET_SHAPE),
      createCellSvg('RET-02', '#fee2e2', '#1e3a8a', RET_SHAPE),
      createCellSvg('RET-03', '#fee2e2', '#1e3a8a', RET_SHAPE),
      createCellSvg('RET-04', '#fee2e2', '#1e3a8a', RET_SHAPE),
      createCellSvg('RET-05', '#fee2e2', '#1e3a8a', RET_SHAPE),
      createCellSvg('RET-06', '#fee2e2', '#1e3a8a', RET_SHAPE),
      createCellSvg('RET-07', '#fee2e2', '#1e3a8a', RET_SHAPE)
    ]
  }
];

// Cell Microscopic Fields
export const OZELLE_CELL_DISTRIBUTION: CellDistributionMicrograph[] = [
  {
    cellType: 'WBC',
    title: 'Campo Microscópico Leucocitario (WBC)',
    description: 'Visualización automatizada de citometría por flujo e imágenes digitales de alta resolución. Distribución uniforme sin acúmulos patológicos.',
    colorTone: '#e0e7ff'
  },
  {
    cellType: 'RBC',
    title: 'Campo Microscópico Eritrocitario (RBC)',
    description: 'Frotis monocapa para evaluación de anisocitosis y poiquilocitosis. Discreta hipocromía y anisocitosis leve.',
    colorTone: '#fee2e2'
  },
  {
    cellType: 'PLT',
    title: 'Campo Plaquetario (PLT)',
    description: 'Plaquetas aisladas y normodistribuidas sin agregación plaquetaria macroscópica. MPV y PDW en rangos fisiológicos.',
    colorTone: '#dcfce7'
  }
];

// Exact Volume Histograms matching Ozelle CBC curves
export const OZELLE_HISTOGRAMS: VolumeHistogramData[] = [
  {
    title: 'WBC Histogram (Curva Leucocitaria)',
    type: 'WBC',
    xAxisUnit: 'FL (volumen)',
    xTicks: [40, 80, 120, 160, 200, 240, 280, 320],
    peakFl: 65,
    curvePoints: [
      { x: 30, y: 0 },
      { x: 40, y: 15 },
      { x: 50, y: 65 },
      { x: 65, y: 92 }, // Linfocitos peak
      { x: 80, y: 48 },
      { x: 95, y: 35 },
      { x: 120, y: 22 },
      { x: 150, y: 55 },
      { x: 180, y: 78 }, // Granulocitos peak
      { x: 210, y: 40 },
      { x: 250, y: 12 },
      { x: 290, y: 2 },
      { x: 320, y: 0 }
    ]
  },
  {
    title: 'RBC Histogram (Curva Eritrocitaria)',
    type: 'RBC',
    xAxisUnit: 'FL (volumen)',
    xTicks: [50, 100, 150, 200, 250, 300],
    peakFl: 87.13,
    curvePoints: [
      { x: 45, y: 0 },
      { x: 55, y: 8 },
      { x: 65, y: 28 },
      { x: 75, y: 65 },
      { x: 87, y: 95 }, // VCM Peak at 87.13 fL
      { x: 100, y: 68 },
      { x: 115, y: 32 },
      { x: 130, y: 14 },
      { x: 150, y: 3 },
      { x: 180, y: 0 }
    ]
  },
  {
    title: 'PLT Histogram (Curva Plaquetaria)',
    type: 'PLT',
    xAxisUnit: 'FL (volumen)',
    xTicks: [10, 20, 30, 40, 50],
    peakFl: 10.79,
    curvePoints: [
      { x: 2, y: 0 },
      { x: 5, y: 45 },
      { x: 10, y: 92 }, // MPV Peak at 10.79 fL
      { x: 15, y: 42 },
      { x: 20, y: 16 },
      { x: 25, y: 6 },
      { x: 30, y: 2 },
      { x: 40, y: 0.5 },
      { x: 50, y: 0 }
    ]
  }
];

// Full Reyna Calanche Ozelle Dataset
export const OZELLE_SAMPLE_REYNA_CALANCHE: AttachedAnalyzerReport = {
  id: 'ozelle-20260908001',
  analyzerBrand: 'Ozelle',
  model: 'Ozelle CBC Hematology Analyzer V4.0.26',
  reportTitle: 'CBC Report (Hemograma Automatizado 5-Diff con Morfología Digital)',
  reportNumber: '20260908001',
  sampleId: '20260908001',
  testDate: '2026.09.08 08:16',
  printDate: '2026.09.08 09:05',
  sampleType: 'WB (Sangre Total con EDTA K3)',
  patientName: 'Reyna Calanche',
  patientGender: 'F',
  birthDateOrYear: '195909',
  labName: 'Laboratorio Clinico V',
  location: 'Oratorio',
  phone: '56125563',
  lotNumber: 'C25YH-HC20011002',
  serialNumber: 'FAM200125082800025',
  operator: 'admin',
  pageCount: 5,
  rawPdfName: 'CBC_Report_Reyna_Calanche_20260908001.pdf',
  
  leukocyteSeries: [
    { code: 'WBC', name: 'Recuento de leucocitos', value: '6.32', unit: '10³/µL', refRange: '3.5 - 9.5', status: 'normal' },
    { code: 'NEU#', name: 'Recuento de neutrófilos', value: '2.97', unit: '10³/µL', refRange: '1.8 - 6.3', status: 'normal' },
    { code: 'NST#', name: 'Recuento de neutrófilos en banda', value: '0.02', unit: '10³/µL', refRange: '0.04 - 0.5', status: 'low' },
    { code: 'NSG#', name: 'Recuento de neutrófilos segmentados', value: '2.90', unit: '10³/µL', refRange: '2.0 - 7.0', status: 'normal' },
    { code: 'NSH#', name: 'Recuento de neutrófilos hipersegmentados', value: '0.06', unit: '10³/µL', refRange: '0.0 - 0.3', status: 'normal' },
    { code: 'LYM#', name: 'Recuento de linfocitos', value: '2.75', unit: '10³/µL', refRange: '1.1 - 3.2', status: 'normal' },
    { code: 'MON#', name: 'Recuento de monocitos', value: '0.49', unit: '10³/µL', refRange: '0.1 - 0.6', status: 'normal' },
    { code: 'EOS#', name: 'Recuento de eosinófilos', value: '0.04', unit: '10³/µL', refRange: '0.02 - 0.52', status: 'normal' },
    { code: 'BAS#', name: 'Recuento de basófilos', value: '0.06', unit: '10³/µL', refRange: '0.0 - 0.06', status: 'normal' },
    { code: 'ALY#', name: 'Recuento de linfocitos atípicos', value: '0.0', unit: '10³/µL', refRange: '0.0 - 0.2', status: 'normal' },
    { code: 'NEU%', name: 'Porcentaje de neutrófilos', value: '47.07', unit: '%', refRange: '40.0 - 75.0', status: 'normal' },
    { code: 'NST%', name: 'Porcentaje de neutrófilos en banda', value: '0.26', unit: '%', refRange: '0.0 - 5.0', status: 'normal' },
    { code: 'NSG%', name: 'Porcentaje de neutrófilos segmentados', value: '45.9', unit: '%', refRange: '50.0 - 70.0', status: 'low' },
    { code: 'NSH%', name: 'Porcentaje de neutrófilos hipersegmentados', value: '0.91', unit: '%', refRange: '0.0 - 3.0', status: 'normal' },
    { code: 'LYM%', name: 'Porcentaje de linfocitos', value: '43.56', unit: '%', refRange: '20.0 - 50.0', status: 'normal' },
    { code: 'MON%', name: 'Porcentaje de monocitos', value: '7.80', unit: '%', refRange: '3.0 - 10.0', status: 'normal' },
    { code: 'EOS%', name: 'Porcentaje de eosinófilos', value: '0.65', unit: '%', refRange: '0.4 - 8.0', status: 'normal' },
    { code: 'BAS%', name: 'Porcentaje de basófilos', value: '0.91', unit: '%', refRange: '0.0 - 1.0', status: 'normal' }
  ],

  erythrocyteSeries: [
    { code: 'RBC', name: 'Recuento de eritrocitos', value: '3.59', unit: '10⁶/µL', refRange: '3.8 - 5.1', status: 'low' },
    { code: 'HGB', name: 'Concentración de hemoglobina', value: '11.1', unit: 'g/dL', refRange: '11.5 - 15.0', status: 'low' },
    { code: 'HCT', name: 'Hematocrito', value: '31.27', unit: '%', refRange: '35.0 - 45.0', status: 'low' },
    { code: 'MCV', name: 'Volumen corpuscular medio', value: '87.13', unit: 'fL', refRange: '82.0 - 100.0', status: 'normal' },
    { code: 'MCH', name: 'Hemoglobina corpuscular media', value: '30.98', unit: 'pg', refRange: '27.0 - 34.0', status: 'normal' },
    { code: 'MCHC', name: 'Concentración de hemoglobina corpuscular media', value: '35.6', unit: 'g/dL', refRange: '31.6 - 35.4', status: 'high' },
    { code: 'RDW_CV', name: 'Amplitud distrib. eritrocitaria-CV', value: '12.98', unit: '%', refRange: '12.0 - 14.3', status: 'normal' },
    { code: 'RDW_SD', name: 'Amplitud distrib. eritrocitaria-SD', value: '39.27', unit: 'fL', refRange: '37.0 - 50.0', status: 'normal' },
    { code: 'RET#', name: 'Recuento de reticulocitos', value: '16.97', unit: '10³/µL', refRange: '24.0 - 84.0', status: 'low' },
    { code: 'RET%', name: 'Porcentaje de reticulocitos', value: '0.47', unit: '%', refRange: '0.5 - 1.5', status: 'low' }
  ],

  plateletSeries: [
    { code: 'PLT', name: 'Recuento de plaquetas', value: '230.67', unit: '10³/µL', refRange: '100.0 - 350.0', status: 'normal' },
    { code: 'MPV', name: 'Volumen plaquetario medio', value: '10.79', unit: 'fL', refRange: '6.0 - 14.0', status: 'normal' },
    { code: 'PDW', name: 'Amplitud de distribución plaquetaria', value: '8.77', unit: 'fL', refRange: '6.0 - 14.0', status: 'normal' },
    { code: 'PCT', name: 'Plaquetocrito', value: '0.25', unit: '%', refRange: '0.1 - 0.28', status: 'normal' },
    { code: 'PAg#', name: 'Recuento de plaquetas agregadas', value: '0.0', unit: '10³/µL', refRange: '0.0 - 0.0', status: 'normal' },
    { code: 'P_LCC', name: 'Recuento de plaquetas grandes', value: '38.07', unit: '10³/µL', refRange: '13.0 - 130.0', status: 'normal' },
    { code: 'P_LCR', name: 'Proporción de plaquetas grandes', value: '16.51', unit: '%', refRange: '12.0 - 45.0', status: 'normal' },
    { code: 'NLR', name: 'Relación neutrófilos/linfocitos', value: '1.08', unit: '/', refRange: '1.25 - 3.5', status: 'low' },
    { code: 'PLR', name: 'Relación plaquetas/linfocitos', value: '83.8', unit: '/', refRange: '69.5 - 182.6', status: 'normal' }
  ],

  histograms: OZELLE_HISTOGRAMS,
  cellDistribution: OZELLE_CELL_DISTRIBUTION,
  morphologyGallery: OZELLE_MORPHOLOGY_GALLERY,

  interpretation: {
    primaryTitle: 'Imagen sanguínea de anemia normocítica',
    flags: ['HGB ↓', 'MCV ~'],
    primaryAdvice: 'La hemoglobina está reducida y el volumen corpuscular medio está dentro del rango de referencia, lo que resulta en un cuadro sanguíneo anémico normocítico. Se puede observar en enfermedades crónicas, función renal anormal, pérdida de sangre reciente o factores mixtos. Debe juzgarse en función de los reticulocitos, el historial médico y otros exámenes.',
    causesAnalysis: 'Cuando los glóbulos rojos se pierden, no se producen lo suficiente o se produce una combinación de factores, el volumen medio de glóbulos rojos se puede mantener dentro del rango de referencia.',
    abnormalFindings: [
      {
        parameter: 'RBC (3.59 10⁶/µL ↓)',
        value: '3.59',
        status: 'low',
        clinicalAdvice: 'El recuento de glóbulos rojos disminuye. Si se acompaña de una disminución de HGB y HCT, puede soportar anemia; el resultado único debe juzgarse más a fondo en combinación con MCV, RDW y los reticulocitos.',
        causesAnalysis: 'La pérdida de sangre, la hemólisis o la producción insuficiente de glóbulos rojos pueden provocar un recuento bajo de glóbulos rojos.'
      },
      {
        parameter: 'HCT (31.27 % ↓)',
        value: '31.27',
        status: 'low',
        clinicalAdvice: 'Disminución del hematocrito. Si RBC y HGB disminuyen simultáneamente, puede favorecer la anemia; el resultado único debe juzgarse junto con otros parámetros de los glóbulos rojos.',
        causesAnalysis: 'Una disminución en la cantidad total de glóbulos rojos o un cambio en el volumen plasmático puede afectar el hematocrito.'
      },
      {
        parameter: 'MCHC (35.6 g/dL ↑)',
        value: '35.6',
        status: 'high',
        clinicalAdvice: 'La elevación es relativamente rara en condiciones fisiológicas y puede estar relacionada con interferencias en la detección como hemólisis, lipemia, aglutinación por frío, etc. También se puede observar en la esferocitosis.',
        causesAnalysis: 'La interferencia en la detección puede causar HGB o una desviación de los parámetros de los glóbulos rojos; los glóbulos rojos esferoidales también pueden aumentar el valor real de MCHC.'
      },
      {
        parameter: 'RET# (16.97 10³/µL ↓) & RET% (0.47 % ↓)',
        value: '16.97',
        status: 'low',
        clinicalAdvice: 'El valor absoluto y proporción reducida de los reticulocitos disminuyen. Si hay anemia al mismo tiempo, puede indicar una compensación insuficiente de la médula ósea (anemia hipo/arregenerativa).',
        causesAnalysis: 'La inhibición de la eritropoyesis, una cantidad insuficiente de materias primas hematopoyéticas o una estimulación insuficiente pueden provocar una disminución de los reticulocitos.'
      },
      {
        parameter: 'NLR (1.08 / ↓)',
        value: '1.08',
        status: 'low',
        clinicalAdvice: 'La especificidad única de la disminución es limitada y puede deberse a factores como neutropenia leve relativa o linfocitosis.',
        causesAnalysis: 'El cambio relativo entre NEU# y LYM# puede reducir la proporción.'
      },
      {
        parameter: 'NSG% (45.9 % ↓)',
        value: '45.9',
        status: 'low',
        clinicalAdvice: 'Disminución relativa en la proporción de neutrófilos en núcleos segmentados.',
        causesAnalysis: 'Los cambios relativos en los neutrófilos maduros u otras categorías pueden alterar esta proporción.'
      }
    ],
    possibleConditions: [
      {
        condition: 'Enfermedad crónica o anemia renal',
        probability: 'media',
        clinicalNote: 'Juicio basado en indicadores inflamatorios, función renal y antecedentes clínicos.'
      },
      {
        condition: 'Pérdida de sangre reciente',
        probability: 'media',
        clinicalNote: 'Juicio basado en antecedentes de hemorragia y cambios de reticulocitos.'
      },
      {
        condition: 'Anemia mixta',
        probability: 'baja',
        clinicalNote: 'Cuando coexisten diferentes tipos de anemia, MCV pueden compensarse entre sí y permanecer dentro del rango de referencia.'
      }
    ],
    references: [
      '[1] Int J Lab Hematology - 2016 - Vis - Verification and quality control of routine hematology analyzers',
      '[2] How to interpret and pursue an abnormal CBC in adults',
      '[3] Practical approach to the Interpretation of CBC Report and Histograms',
      '[4] A comparative study of blood cell count in four automated hematology analyzers',
      '[5] Int J Lab Hematology - 2018 - Merino - Optimizing morphology through blood cell image analysis'
    ]
  },
  attachedToOfficialPdf: true
};

/**
 * Converts Ozelle Analyzer series into standard MedicalReport ReportParameters
 * with zero manual typing!
 */
export function convertOzelleToReportParameters(ozelle: AttachedAnalyzerReport): ReportParameter[] {
  const result: ReportParameter[] = [];

  // Serie Leucocitaria
  ozelle.leukocyteSeries.forEach((item, index) => {
    result.push({
      id: `p-wbc-${index}`,
      name: `${item.code} (${item.name})`,
      value: item.value,
      unit: item.unit,
      referenceRange: item.refRange,
      status: item.status,
      section: '1. Serie Leucocitaria (WBC & Diferencial)',
      methodology: 'Citometría de Flujo Óptica / Ozelle AI 5-Diff'
    });
  });

  // Serie Eritrocitaria
  ozelle.erythrocyteSeries.forEach((item, index) => {
    result.push({
      id: `p-rbc-${index}`,
      name: `${item.code} (${item.name})`,
      value: item.value,
      unit: item.unit,
      referenceRange: item.refRange,
      status: item.status,
      section: '2. Serie Eritrocitaria (Glóbulos Rojos & Índices)',
      methodology: 'Impedancia Hidrodinámica & Fotometría SLS'
    });
  });

  // Serie Plaquetaria
  ozelle.plateletSeries.forEach((item, index) => {
    result.push({
      id: `p-plt-${index}`,
      name: `${item.code} (${item.name})`,
      value: item.value,
      unit: item.unit,
      referenceRange: item.refRange,
      status: item.status,
      section: '3. Serie Plaquetaria & Ratios',
      methodology: 'Enfoque Hidrodinámico por Impedancia'
    });
  });

  return result;
}

/**
 * Generates an official MedicalReport instance from the Ozelle data
 */
export function createOzelleMedicalReport(
  patientId: string = 'pat-reyna-calanche',
  customOzelle: AttachedAnalyzerReport = OZELLE_SAMPLE_REYNA_CALANCHE
): MedicalReport {
  const params = convertOzelleToReportParameters(customOzelle);

  return {
    id: `rep-ozelle-${customOzelle.reportNumber}`,
    reportNumber: `LAB-2026-${customOzelle.reportNumber.slice(-4)}`,
    patientId: patientId,
    patientName: customOzelle.patientName,
    patientNationalId: customOzelle.sampleId,
    patientAge: 66,
    patientGender: customOzelle.patientGender,
    referringDoctor: 'Dr. Roberto Mendoza / Consulta General',
    company: 'PARTICULAR',
    category: 'hematologia',
    title: 'Hemograma Completo Automatizado 5-Diff con Morfología Digital Ozelle',
    sampleDate: '2026-09-08T08:16:00.000Z',
    emissionDate: '2026-09-08T09:05:00.000Z',
    laboratoryName: `${customOzelle.labName} - ${customOzelle.location}`,
    status: 'publicado',
    sampleType: customOzelle.sampleType,
    tubeType: 'Tubo Tapa Lila (K3-EDTA)',
    parameters: params,
    clinicalFindings: `Evaluación automatizada Ozelle CBC V4.0.26: ${customOzelle.interpretation.primaryTitle}. Anemia normocítica leve (HGB: 11.1 g/dL, VCM: 87.13 fL, HCT: 31.27%). Reticulocitos disminuidos (RET: 16.97 10³/µL - 0.47%). Serie blanca y plaquetaria cuantitativamente normales.`,
    doctorConclusions: 'Imagen sugestiva de anemia normocítica arregenerativa (enfermedad crónica / origen renal / pérdida reciente en compensación). Se sugiere correlación con cinética de hierro, ferritina sérica, creatinina y uroanálisis.',
    patientExplanation: 'Hola Reyna. Tu hemograma muestra un nivel de hemoglobina ligeramente bajo (11.1 g/dL), con glóbulos rojos de tamaño promedio normal (normocíticos). Tus glóbulos blancos (defensas) y plaquetas (coagulación) se encuentran en rangos saludables. Te recomendamos llevar este resultado a tu médico de cabecera para que evalúe si necesitas algún suplemento o estudio de control.',
    recommendations: [
      'Correlacionar con perfil de hierro sérico, ferritina y porcentaje de saturación de transferrina.',
      'Evaluar función renal mediante química sanguínea (creatinina y nitrógeno de urea).',
      'Control hematológico en 3 a 4 semanas según indicación del médico tratante.',
      'No iniciar suplementación con hierro sin previa confirmación médica.'
    ],
    urgentAlert: false,
    signature: {
      doctorName: 'Dr. Carlos Morales Galindo',
      doctorSpecialty: 'Patología Clínica y Hematología',
      doctorLicense: 'CMP-74819 / Col. 8421',
      bioanalystName: 'Licda. María José Alvarado',
      bioanalystSpecialty: 'Química Bióloga',
      bioanalystLicense: 'Col. QB-5120',
      signedAt: '2026-09-08T09:10:00.000Z',
      validationHash: '0xozelle908reynacalanche9509'
    },
    qrVerificationCode: `VALID-OZELLE-CBC-${customOzelle.reportNumber}`,
    notesToStaff: 'Resultados importados automáticamente desde analizador Ozelle CBC V4.0.26 con anexo digital de morfología celular e histogramas adjunto.',
    attachedAnalyzerReport: customOzelle
  };
}
