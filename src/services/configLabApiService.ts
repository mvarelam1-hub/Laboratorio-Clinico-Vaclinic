/**
 * Cliente HTTP para configuración del laboratorio real (server/routes/configLab.ts,
 * migración 0015) — el branding, identidad, márgenes, colores, firmas digitales,
 * watermark, y configuración de página (LabSettings interface).
 *
 * Mismo patrón que el resto de servicios: columnas reales para lo
 * consultable (nombre, email, tamaño_papel, familia_tipografia, colores principales)
 * + `datos_adicionales` para el resto de LabSettings, que el backend guarda en
 * `datos_json` de la tabla `configuracion_laboratorio`.
 */

import { getStaffSessionToken } from './staffSessionToken';
import type { LabSettings, LabSignerConfig } from '../types/labSettings';
import { INITIAL_LAB_SETTINGS } from '../data/initialLabSettings';

export class ConfigLabError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ConfigLabError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getStaffSessionToken();
  if (!token) {
    throw new ConfigLabError('No hay una sesión de personal activa para llamar a la API.');
  }
  return fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  });
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error) return body.error;
  } catch {
    /* sin cuerpo JSON */
  }
  return `El servidor respondió ${res.status}.`;
}

export interface ConfigLabRow {
  id_configuracion: number;
  id_laboratorio: number;
  nombre_laboratorio: string;
  nombre_legal?: string;
  email: string;
  [key: string]: unknown;
}

/**
 * Convierte LabSettings (frontend) a body que entiende server/routes/configLab.ts:
 * separa los campos con columna propia de los que van en datos_adicionales.
 *
 * Columnas reales: nombre_laboratorio, email, phone, paperSize, fontFamily,
 * colores (primario, secundario, acentos), margins, etc.
 *
 * datos_adicionales: watermark, signatures, footer, QR specifics, legalDisclaimer,
 * currencySymbol, etc.
 */
function aBodyApi(settings: Partial<LabSettings>): Record<string, unknown> {
  const body: Record<string, unknown> = {
    nombre_laboratorio: settings.labName,
    nombre_legal: settings.legalName,
    eslogan: settings.slogan,
    nit_ruc: settings.taxId,
    registro_sanitario: settings.sanitaryLicense,
    acreditacion_iso: settings.isoAccreditation,
    direccion: settings.address,
    ciudad: settings.city,
    departamento_estado: settings.departmentState,
    telefono: settings.phone,
    telefono_secundario: settings.phoneSecondary,
    whatsapp_numero: settings.whatsappNumber,
    email: settings.email,
    website: settings.website,
    lista_especialidades: settings.specialtiesList,
    tamaño_papel: settings.paperSize,
    orientacion: settings.orientation,
    familia_tipografia: settings.fontFamily,
    tamaño_fuente_base_pt: settings.baseFontSizePt,
    color_primario: settings.primaryColor,
    preset_color_primario: settings.primaryColorPreset,
    color_secundario: settings.secondaryColor,
    color_acento: settings.accentColor,
    color_encabezado_tabla: settings.tableHeaderBgColor,
    color_texto_encabezado: settings.tableHeaderTextColor,
    color_valor_critico: settings.criticalValueColor,
    color_valor_bajo: settings.lowValueColor,
    color_valor_normal: settings.normalValueColor,
    color_fondo_pagina: settings.pageBgColor,

    // Resto va a datos_adicionales (todo lo que NO tiene columna propia)
    headerMode: settings.headerMode,
    logoType: settings.logoType,
    logoUrl: settings.logoUrl,
    logoPosition: settings.logoPosition,
    logoWidthPx: settings.logoWidthPx,
    bannerImageUrl: settings.bannerImageUrl,
    bannerHeightMm: settings.bannerHeightMm,
    preprintedTopMarginMm: settings.preprintedTopMarginMm,
    footerMode: settings.footerMode,
    footerBannerUrl: settings.footerBannerUrl,
    footerBannerHeightMm: settings.footerBannerHeightMm,
    signers: settings.signers,
    signaturesLayout: settings.signaturesLayout,
    includeQrInSignatures: settings.includeQrInSignatures,
    cryptoSealText: settings.cryptoSealText,
    enableDigitalTimestamp: settings.enableDigitalTimestamp,
    officialSignatureUrl: settings.officialSignatureUrl,
    officialSignerName: settings.officialSignerName,
    officialSignerRole: settings.officialSignerRole,
    officialSignerLicense: settings.officialSignerLicense,
    officialStampUrl: settings.officialStampUrl,
    showOfficialStamp: settings.showOfficialStamp,
    officialStampSizePx: settings.officialStampSizePx,
    officialStampOpacity: settings.officialStampOpacity,
    marginTopMm: settings.marginTopMm,
    marginBottomMm: settings.marginBottomMm,
    marginLeftMm: settings.marginLeftMm,
    marginRightMm: settings.marginRightMm,
    tableDensity: settings.tableDensity,
    avoidTableSplitting: settings.avoidTableSplitting,
    showPageNumbers: settings.showPageNumbers,
    showTopBarcode: settings.showTopBarcode,
    showTopQr: settings.showTopQr,
    reportTemplateStyle: settings.reportTemplateStyle,
    companyName: settings.companyName,
    tableHeaderStyle: settings.tableHeaderStyle,
    tableZebraStriping: settings.tableZebraStriping,
    lineSpacing: settings.lineSpacing,
    watermarkPreset: settings.watermarkPreset,
    customWatermarkText: settings.customWatermarkText,
    watermarkOpacity: settings.watermarkOpacity,
    watermarkType: settings.watermarkType,
    watermarkImageUrl: settings.watermarkImageUrl,
    watermarkPosition: settings.watermarkPosition,
    watermarkScalePercent: settings.watermarkScalePercent,
    qrPosition: settings.qrPosition,
    qrSizePx: settings.qrSizePx,
    qrValidationUrl: settings.qrValidationUrl,
    legalDisclaimer: settings.legalDisclaimer,
    confidentialityNotice: settings.confidentialityNotice,
    showPrintedTimestamp: settings.showPrintedTimestamp,
    showOperatorId: settings.showOperatorId,
    operatorIdText: settings.operatorIdText,
    currencySymbol: settings.currencySymbol,
    currencyCode: settings.currencyCode,
    whatsappTemplate: settings.whatsappTemplate,
    autoPrintTubeBarcodes: settings.autoPrintTubeBarcodes,
    enableIsoWatermark: settings.enableIsoWatermark
  };

  // Remover undefined values para que solo se actualicen los campos provided
  return Object.fromEntries(
    Object.entries(body).filter(([, v]) => v !== undefined)
  );
}

/**
 * Garantiza que existan siempre los tres firmantes del informe
 * (Elaborado por, Visto bueno y Autorizado por). Si la configuración guardada
 * en el servidor no los trae (o trae solo algunos), se completan con los
 * valores iniciales para que las ranuras de firma y sello siempre aparezcan
 * en Ajustes. Los firmantes ya guardados no se tocan.
 */
export function completarFirmantes(guardados: unknown): LabSignerConfig[] {
  const lista: LabSignerConfig[] = Array.isArray(guardados) ? (guardados as LabSignerConfig[]) : [];
  const faltantes = INITIAL_LAB_SETTINGS.signers.filter(
    (base) => !lista.some((s) => s && s.id === base.id)
  );
  return [...lista, ...faltantes.map((f) => ({ ...f }))];
}

/**
 * Convierte ConfigLabRow (backend) a LabSettings (frontend).
 * Reconstruye datos_adicionales desde JSONB.
 */
function fromDbRow(rowInput: ConfigLabRow): LabSettings {
  // El resto de columnas reales de configuracion_laboratorio (nit_ruc,
  // registro_sanitario, colores, tamaño_papel, etc.) no están declaradas
  // una a una en ConfigLabRow -solo las 5 que el propio servicio ya
  // necesita tipadas arriba-, así que llegan por el índice `[key: string]:
  // unknown` de esa interfaz. Se castea una sola vez aquí (en vez de un
  // `as any` por cada campo abajo) porque esta función SOLO lee: son
  // valores crudos de fila de Postgres, no hay nada que el tipado de
  // escritura deba proteger en este sentido.
  const row = rowInput as any;
  const datosAdicionales = row.datos_adicionales || {};

  return {
    // Columnas reales
    labName: row.nombre_laboratorio || '',
    legalName: row.nombre_legal,
    slogan: datosAdicionales.eslogan || '',
    taxId: row.nit_ruc || '',
    sanitaryLicense: row.registro_sanitario || '',
    isoAccreditation: row.acreditacion_iso || '',
    address: row.direccion || '',
    city: row.ciudad || '',
    departmentState: row.departamento_estado || '',
    phone: row.telefono || '',
    phoneSecondary: row.telefono_secundario,
    whatsappNumber: row.whatsapp_numero || '',
    email: row.email || '',
    website: row.website || '',
    specialtiesList: row.lista_especialidades || '',

    headerMode: datosAdicionales.headerMode || 'standard_text_logo',
    logoType: datosAdicionales.logoType || 'default_vaclinic',
    logoUrl: datosAdicionales.logoUrl,
    logoWidthPx: datosAdicionales.logoWidthPx || 80,
    logoPosition: datosAdicionales.logoPosition || 'left',
    bannerImageUrl: datosAdicionales.bannerImageUrl,
    bannerHeightMm: datosAdicionales.bannerHeightMm || 35,
    preprintedTopMarginMm: datosAdicionales.preprintedTopMarginMm || 0,

    footerMode: datosAdicionales.footerMode || 'standard_info',
    footerBannerUrl: datosAdicionales.footerBannerUrl,
    footerBannerHeightMm: datosAdicionales.footerBannerHeightMm,

    signers: completarFirmantes(datosAdicionales.signers),
    signaturesLayout: datosAdicionales.signaturesLayout || 'horizontal',
    includeQrInSignatures: datosAdicionales.includeQrInSignatures !== false,
    cryptoSealText: datosAdicionales.cryptoSealText || '',
    enableDigitalTimestamp: datosAdicionales.enableDigitalTimestamp !== false,
    officialSignatureUrl: datosAdicionales.officialSignatureUrl,
    officialSignerName: datosAdicionales.officialSignerName,
    officialSignerRole: datosAdicionales.officialSignerRole,
    officialSignerLicense: datosAdicionales.officialSignerLicense,
    officialStampUrl: datosAdicionales.officialStampUrl,
    showOfficialStamp: datosAdicionales.showOfficialStamp !== false,
    officialStampSizePx: datosAdicionales.officialStampSizePx || 80,
    officialStampOpacity: datosAdicionales.officialStampOpacity || 0.8,

    paperSize: (row.tamaño_papel as any) || 'letter',
    orientation: (row.orientacion as any) || 'portrait',
    marginTopMm: datosAdicionales.marginTopMm || 20,
    marginBottomMm: datosAdicionales.marginBottomMm || 20,
    marginLeftMm: datosAdicionales.marginLeftMm || 20,
    marginRightMm: datosAdicionales.marginRightMm || 20,
    tableDensity: datosAdicionales.tableDensity || 'standard',
    avoidTableSplitting: datosAdicionales.avoidTableSplitting !== false,
    showPageNumbers: datosAdicionales.showPageNumbers !== false,
    showTopBarcode: datosAdicionales.showTopBarcode !== false,
    showTopQr: datosAdicionales.showTopQr !== false,
    reportTemplateStyle: datosAdicionales.reportTemplateStyle || 'vaclinic',
    companyName: datosAdicionales.companyName,

    primaryColor: row.color_primario || '#0d9488',
    primaryColorPreset: (row.preset_color_primario as any) || 'teal',
    secondaryColor: row.color_secundario,
    accentColor: row.color_acento,
    tableHeaderStyle: datosAdicionales.tableHeaderStyle || 'tinted',
    tableHeaderBgColor: row.color_encabezado_tabla,
    tableHeaderTextColor: row.color_texto_encabezado,
    tableZebraStriping: datosAdicionales.tableZebraStriping !== false,
    criticalValueColor: row.color_valor_critico,
    lowValueColor: row.color_valor_bajo,
    normalValueColor: row.color_valor_normal,
    pageBgColor: row.color_fondo_pagina,
    fontFamily: (row.familia_tipografia as any) || 'sans',
    baseFontSizePt: Number(row.tamaño_fuente_base_pt) || 11,
    lineSpacing: datosAdicionales.lineSpacing || 1.4,

    watermarkPreset: datosAdicionales.watermarkPreset || 'none',
    customWatermarkText: datosAdicionales.customWatermarkText || '',
    watermarkOpacity: datosAdicionales.watermarkOpacity !== undefined ? datosAdicionales.watermarkOpacity : 0.3,
    watermarkType: datosAdicionales.watermarkType,
    watermarkImageUrl: datosAdicionales.watermarkImageUrl,
    watermarkPosition: datosAdicionales.watermarkPosition,
    watermarkScalePercent: datosAdicionales.watermarkScalePercent || 30,
    qrPosition: datosAdicionales.qrPosition || 'top_right',
    qrSizePx: datosAdicionales.qrSizePx || 80,
    qrValidationUrl: datosAdicionales.qrValidationUrl || 'https://vaclinic.verifyqa.com',
    legalDisclaimer: datosAdicionales.legalDisclaimer || '',
    confidentialityNotice: datosAdicionales.confidentialityNotice || '',
    showPrintedTimestamp: datosAdicionales.showPrintedTimestamp !== false,
    showOperatorId: datosAdicionales.showOperatorId !== false,
    operatorIdText: datosAdicionales.operatorIdText || '',

    currencySymbol: datosAdicionales.currencySymbol || 'Q',
    currencyCode: datosAdicionales.currencyCode || 'GTQ',
    whatsappTemplate: datosAdicionales.whatsappTemplate || '',
    autoPrintTubeBarcodes: datosAdicionales.autoPrintTubeBarcodes !== false,
    enableIsoWatermark: datosAdicionales.enableIsoWatermark !== false
  };
}

export async function fetchConfigLab(): Promise<LabSettings> {
  const res = await authFetch('/api/config-lab', { method: 'GET' });
  if (!res.ok) throw new ConfigLabError(await parseErrorBody(res), res.status);
  const row = await res.json();
  return fromDbRow(row);
}

export async function updateConfigLab(settings: Partial<LabSettings>): Promise<LabSettings> {
  const res = await authFetch('/api/config-lab', {
    method: 'PATCH',
    body: JSON.stringify(aBodyApi(settings))
  });
  if (!res.ok) throw new ConfigLabError(await parseErrorBody(res), res.status);
  const row = await res.json();
  return fromDbRow(row);
}
