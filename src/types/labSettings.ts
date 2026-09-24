export type HeaderMode = 'standard_text_logo' | 'full_banner_image' | 'preprinted_stationery';

export type LogoType = 'default_vaclinic' | 'caduceus' | 'microscope' | 'cross_shield' | 'dna_helix' | 'custom_image';

export type LogoPosition = 'left' | 'center' | 'right';

export type PaperSize = 'letter' | 'a4' | 'legal';

export type PaperOrientation = 'portrait' | 'landscape';

export type TableDensity = 'compact' | 'standard' | 'spacious';

export type TableHeaderStyle = 'tinted' | 'solid_dark' | 'minimal_border' | 'accent_bar';

export type ReportFontFamily = 'inter' | 'sans' | 'serif' | 'arial' | 'jakarta' | 'mono';

export type WatermarkPreset = 'none' | 'OFICIAL VALIDADO' | 'CONFIDENCIAL' | 'COPIA CERTIFICADA' | 'URGENTE / STAT' | 'MUESTRA DUPLICADA' | 'PERSONALIZADA';

export type WatermarkType = 'preset_text' | 'custom_text' | 'custom_image';

export type WatermarkPosition = 'center' | 'diagonal_center' | 'top' | 'bottom' | 'repeat';

export type FooterMode = 'standard_info' | 'full_banner_image' | 'preprinted_stationery' | 'minimal';

export type ReportTemplateStyle = 'vaclinic' | 'compact';

export type QrPosition = 'top_right' | 'next_to_signatures' | 'footer_bottom' | 'hidden';

export interface LabSignerConfig {
  id: string;
  enabled: boolean;
  roleTitle: string; // e.g. "Bioanalista Responsable", "Director Médico Patólogo", "Microbiólogo Supervisor"
  name: string; // e.g. "Licda. Elena Morales Cruz"
  specialty: string; // e.g. "Lic. en Química Biológica & Bioanálisis"
  licenseNumber: string; // e.g. "Col. QB #4192 / MSPAS-8812"
  secondaryLicense?: string; // e.g. "CMP-649102"
  signatureImageUrl?: string; // Base64 data URL or external URL
  signatureType: 'image' | 'crypto_generated' | 'handwritten_drawn';
  stampImageUrl?: string; // Round official lab stamp
  showStamp: boolean;
  showValidationHash: boolean;
  validationHash?: string;
}

export interface LabSettings {
  // 1. Membrete e Identidad Institucional
  headerMode: HeaderMode;
  labName: string;
  legalName: string;
  slogan: string;
  taxId: string; // NIT / RUC
  sanitaryLicense: string; // Registro Sanitario MSPAS
  isoAccreditation: string; // e.g. "Acreditación ISO 15189:2022"
  address: string;
  city: string;
  departmentState: string;
  phone: string;
  phoneSecondary?: string;
  whatsappNumber: string;
  email: string;
  website: string;
  specialtiesList: string;

  // Logotipo & Imagen de Membrete
  logoType: LogoType;
  logoUrl?: string; // Base64 or URL
  logoWidthPx: number; // e.g. 64px - 140px
  logoPosition: LogoPosition;
  bannerImageUrl?: string; // Base64 or URL for full banner
  bannerHeightMm: number; // e.g. 35mm
  preprintedTopMarginMm: number; // Spacing to leave when using physical preprinted stationery

  // Pie de Página & Banner Inferior
  footerMode?: FooterMode;
  footerBannerUrl?: string; // Base64 or URL for full bottom footer banner
  footerBannerHeightMm?: number; // e.g. 24mm

  // 2. Firmas Digitales y Sellos
  signers: LabSignerConfig[];
  signaturesLayout: 'horizontal' | 'stacked' | 'grid';
  includeQrInSignatures: boolean;
  cryptoSealText: string;
  enableDigitalTimestamp: boolean;
  officialSignatureUrl?: string; // Global or primary uploaded signature image (Base64)
  officialSignerName?: string;
  officialSignerRole?: string;
  officialSignerLicense?: string;
  officialStampUrl?: string; // Global official laboratory round stamp (Base64)
  showOfficialStamp?: boolean;
  officialStampSizePx?: number; // e.g. 64px - 120px
  officialStampOpacity?: number; // 0.40 - 1.0

  // 3. Márgenes y Formato de Hoja
  paperSize: PaperSize;
  orientation: PaperOrientation;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  tableDensity: TableDensity;
  avoidTableSplitting: boolean;
  showPageNumbers: boolean;
  showTopBarcode: boolean;
  showTopQr: boolean;
  reportTemplateStyle: ReportTemplateStyle;
  companyName?: string;

  // 4. Colores de Página y Tipografía
  primaryColor: string; // Hex e.g. #0d9488
  primaryColorPreset: 'teal' | 'blue' | 'navy' | 'emerald' | 'burgundy' | 'indigo' | 'slate' | 'custom';
  secondaryColor: string;
  accentColor: string;
  tableHeaderStyle: TableHeaderStyle;
  tableHeaderBgColor: string;
  tableHeaderTextColor: string;
  tableZebraStriping: boolean;
  criticalValueColor: string;
  lowValueColor: string;
  normalValueColor: string;
  pageBgColor: string; // e.g. #ffffff or #fcfdfd
  fontFamily: ReportFontFamily;
  baseFontSizePt: number; // 9.5 to 12 pt
  lineSpacing: number; // 1.2 to 1.6

  // 5. Seguridad, Marca de Agua y Pie Legal
  watermarkPreset: WatermarkPreset;
  customWatermarkText: string;
  watermarkOpacity: number; // 0.01 to 1.0 (or percentage 1% - 100%)
  watermarkType?: WatermarkType;
  watermarkImageUrl?: string; // Uploaded watermark logo/image (Base64)
  watermarkPosition?: WatermarkPosition; // 'center' | 'diagonal_center' | 'top' | 'bottom' | 'repeat'
  watermarkScalePercent?: number; // e.g. 20% to 100%
  qrPosition: QrPosition;
  qrSizePx: number;
  qrValidationUrl: string;
  legalDisclaimer: string;
  confidentialityNotice: string;
  showPrintedTimestamp: boolean;
  showOperatorId: boolean;
  operatorIdText: string;

  // 6. Moneda y Mensajería Operativa
  currencySymbol: string; // e.g. "Q"
  currencyCode: string; // e.g. "GTQ"
  whatsappTemplate: string;
  autoPrintTubeBarcodes: boolean;
  enableIsoWatermark: boolean;
}
