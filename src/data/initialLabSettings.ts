import { LabSettings } from '../types/labSettings';

export const COLOR_PALETTE_PRESETS = [
  {
    id: 'teal',
    name: 'Teal Clínico VACLINIC',
    primary: '#0d9488',
    secondary: '#0f766e',
    accent: '#14b8a6',
    headerBg: '#f0fdfa',
    headerText: '#115e59'
  },
  {
    id: 'blue',
    name: 'Azul Zafiro Médico',
    primary: '#0284c7',
    secondary: '#0369a1',
    accent: '#38bdf8',
    headerBg: '#f0f9ff',
    headerText: '#075985'
  },
  {
    id: 'navy',
    name: 'Azul Marino Corporativo',
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#3b82f6',
    headerBg: '#f8fafc',
    headerText: '#0f172a'
  },
  {
    id: 'emerald',
    name: 'Esmeralda Bioquímica',
    primary: '#059669',
    secondary: '#047857',
    accent: '#10b981',
    headerBg: '#ecfdf5',
    headerText: '#065f46'
  },
  {
    id: 'burgundy',
    name: 'Borgoña Hematología',
    primary: '#991b1b',
    secondary: '#7f1d1d',
    accent: '#ef4444',
    headerBg: '#fef2f2',
    headerText: '#991b1b'
  },
  {
    id: 'indigo',
    name: 'Índigo Diagnóstico',
    primary: '#4f46e5',
    secondary: '#4338ca',
    accent: '#818cf8',
    headerBg: '#eef2ff',
    headerText: '#3730a3'
  },
  {
    id: 'slate',
    name: 'Grafito Minimalista',
    primary: '#334155',
    secondary: '#1e293b',
    accent: '#64748b',
    headerBg: '#f8fafc',
    headerText: '#1e293b'
  }
];

export const INITIAL_LAB_SETTINGS: LabSettings = {
  // 1. Membrete e Identidad
  headerMode: 'standard_text_logo',
  labName: 'VACLINIC',
  legalName: 'VACLINIC - Laboratorio Clínico',
  slogan: 'Precisión que diagnostica, confianza que cuida',
  taxId: 'NIT: 8492019-4',
  sanitaryLicense: 'Lic. Sanitaria MSPAS-DRACES #8841-2024',
  isoAccreditation: 'Acreditado bajo Sistema de Calidad ISO 15189:2022',
  address: 'Entrada de Pineda Oratorio Santa Rosa km 79.5',
  city: 'Oratorio, Santa Rosa',
  departmentState: 'Guatemala, C.A.',
  phone: '56125563',
  phoneSecondary: '56125563',
  whatsappNumber: '56125563',
  email: 'laboratoriovaclinic@gmail.com',
  website: 'www.vaclinic.laboratorio.gt',
  specialtiesList: 'Hematología • Bioquímica • Inmunología • Microbiología • Hormonas • Urianálisis • Coagulación',

  // Logotipo
  logoType: 'default_vaclinic',
  logoUrl: '',
  logoWidthPx: 64,
  logoPosition: 'left',
  bannerImageUrl: '',
  bannerHeightMm: 36,
  preprintedTopMarginMm: 45,

  // Pie de Página & Banner Inferior
  footerMode: 'standard_info',
  footerBannerUrl: '',
  footerBannerHeightMm: 24,

  // 2. Firmas Digitales y Sellos
  signers: [
    {
      id: 'signer_1_prep',
      enabled: true,
      roleTitle: 'Elaboración de Resultados',
      name: 'Priscila Abigail Ramirez Varela',
      specialty: 'Personal Técnico en Procesamiento',
      licenseNumber: 'Reg. VAC-01',
      secondaryLicense: 'Certificación Control Calidad',
      signatureType: 'crypto_generated',
      signatureImageUrl: '',
      stampImageUrl: '',
      showStamp: false,
      showValidationHash: true,
      validationHash: 'SHA256: 8f4e2b19c83a74d0e6f159a23bc87e912401fc'
    },
    {
      id: 'signer_2_qb',
      enabled: true,
      roleTitle: 'Firma del Químico Biólogo',
      name: 'CRISTIAN JAVIER AREVALO',
      specialty: 'Químico Biólogo Colegiado',
      licenseNumber: 'Col. QB #3189 / Reg. MSPAS-8812',
      secondaryLicense: 'Director Técnico Laboratorial',
      signatureType: 'crypto_generated',
      signatureImageUrl: '',
      stampImageUrl: '',
      showStamp: true,
      showValidationHash: true,
      validationHash: 'SHA256: 3c91d84a7e20b5f1906a48d3bc7e142998a10b'
    },
    {
      id: 'signer_3_tech',
      enabled: true,
      roleTitle: 'Firma del Técnico de Laboratorio',
      name: 'Marlon Varela - Técnico en Laboratorio Clínico',
      specialty: 'Técnico en Laboratorio Clínico',
      licenseNumber: 'Reg. 5612-G / MSPAS',
      signatureType: 'crypto_generated',
      signatureImageUrl: '',
      stampImageUrl: '',
      showStamp: true,
      showValidationHash: true,
      validationHash: 'SHA256: e17b94c023d88a1e945c71b0a5823df94821a3'
    }
  ],
  signaturesLayout: 'horizontal',
  includeQrInSignatures: true,
  cryptoSealText: 'FIRMA DIGITAL ELECTRÓNICA AVANZADA • VALIDACIÓN EN LÍNEA',
  enableDigitalTimestamp: true,
  officialSignatureUrl: '',
  officialSignerName: 'Marlon Varela - Técnico en Laboratorio Clínico',
  officialSignerRole: 'Técnico en Laboratorio Clínico',
  officialSignerLicense: 'Reg. 5612-G / MSPAS',
  officialStampUrl: '',
  showOfficialStamp: true,
  officialStampSizePx: 82,
  officialStampOpacity: 0.88,

  // 3. Márgenes y Formato
  paperSize: 'letter',
  orientation: 'portrait',
  marginTopMm: 6,
  marginBottomMm: 6,
  marginLeftMm: 8,
  marginRightMm: 8,
  tableDensity: 'compact',
  avoidTableSplitting: true,
  showPageNumbers: true,
  showTopBarcode: true,
  showTopQr: true,
  reportTemplateStyle: 'vaclinic',
  companyName: 'PARTICULAR',

  // 4. Colores y Tipografía
  primaryColor: '#0d9488',
  primaryColorPreset: 'teal',
  secondaryColor: '#0f766e',
  accentColor: '#14b8a6',
  tableHeaderStyle: 'tinted',
  tableHeaderBgColor: '#f0fdfa',
  tableHeaderTextColor: '#115e59',
  tableZebraStriping: true,
  criticalValueColor: '#dc2626',
  lowValueColor: '#d97706',
  normalValueColor: '#059669',
  pageBgColor: '#ffffff',
  fontFamily: 'sans',
  baseFontSizePt: 10,
  lineSpacing: 1.35,

  // 5. Seguridad, Marca de Agua y Pie Legal
  watermarkPreset: 'none',
  customWatermarkText: '',
  watermarkOpacity: 0.05,
  watermarkType: 'preset_text',
  watermarkImageUrl: '',
  watermarkPosition: 'diagonal_center',
  watermarkScalePercent: 75,
  qrPosition: 'top_right',
  qrSizePx: 64,
  qrValidationUrl: 'https://vaclinic.laboratorio.gt/valida',
  legalDisclaimer: 'Este informe refleja exclusivamente el estado y autenticidad de la muestra remitida y analizada bajo protocolos de bioseguridad. La interpretación clínica de estos resultados debe ser efectuada de manera correlacionada por el médico tratante.',
  confidentialityNotice: 'Documento médico confidencial amparado por normativas de secreto profesional y confidencialidad de datos en salud.',
  showPrintedTimestamp: true,
  showOperatorId: true,
  operatorIdText: 'OPERADOR: SISTEMA CENTRAL LABVACLINIC',

  // 6. Moneda y Operaciones
  currencySymbol: 'Q',
  currencyCode: 'GTQ (Quetzales Guatemaltecos)',
  whatsappTemplate: 'Estimado/a {PACIENTE}, su orden {ORDEN} de VACLINIC Laboratorio está lista para consulta en línea con su código {CODIGO}. Ver resultados: {LINK}',
  autoPrintTubeBarcodes: true,
  enableIsoWatermark: true
};
