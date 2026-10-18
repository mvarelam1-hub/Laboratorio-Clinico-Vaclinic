import React, { useMemo, useState, useEffect } from 'react';
import { MedicalReport } from '../../types';
import QRCode from 'qrcode';
import { buildVerificationUrl, formatVerificationCode } from '../../services/verificacionInforme';
import { groupParametersBySection } from '../../utils/labSectionOrganizer';
import { OzelleCbcReportView } from '../laboratory/OzelleCbcReportView';
import { useClinic } from '../../context/ClinicContext';
import { LabSettings } from '../../types/labSettings';
import {
  evaluateParameterDetailed,
  ParameterDeviationInfo,
  nombreTieneNormaDemografica
} from '../../utils/referenceRangeEvaluator';

export interface VaclinicOfficialReportSheetProps {
  report: MedicalReport;
  watermark?: string;
  includeAiExplanation?: boolean;
  includeSignatures?: boolean;
  includeConclusions?: boolean;
  includeRecommendations?: boolean;
  scale?: number;
  printMode?: boolean;
  id?: string;
  templateStyle?: 'vaclinic' | 'compact';
  customSettings?: LabSettings;
  fitToSinglePage?: boolean;
  pinFooterToBottom?: boolean;
  hideAnnex?: boolean;
  /** Se conserva por compatibilidad: el informe ya no incluye herramientas de simulación. */
  enableDemographicTool?: boolean;
  initialHighlightOutOfRange?: boolean;
}

const INK = '#111827';      // texto
const MUTED = '#4b5563';    // texto secundario
const RULE = '#d1d5db';     // líneas finas
const NAVY = '#0f1f33';     // cuadro oscuro del encabezado
const MINT = '#5eead4';     // acento claro sobre fondo oscuro
const OK_BG = '#d1fae5';
const OK_TXT = '#047857';
const ALTO_BG = '#fee2e2';
const ALTO_TXT = '#b91c1c';
const BAJO_BG = '#fef3c7';
const BAJO_TXT = '#b45309';

/** Horario que se imprime en el encabezado si en Ajustes no se ha configurado otro (businessHours). */
const HORARIO_PREDETERMINADO = 'Lunes a Viernes: 7:00 a 16:00 · Sábado: 7:00 a 15:00 · Domingo: 7:00 a 11:00';

/** Orden y rótulo de las firmas en el pie del informe: Elaborado por → Visto bueno → Autorizado por. */
const FIRMA_REPORTE: Record<string, { orden: number; etiqueta: string }> = {
  signer_1_prep: { orden: 1, etiqueta: 'Elaborado por' },
  signer_2_qb: { orden: 2, etiqueta: 'Visto bueno' },
  signer_3_tech: { orden: 3, etiqueta: 'Autorizado por' }
};

const PILARES: { a: string; b: string; icono: React.ReactNode }[] = [
  { a: 'Tecnología', b: 'Avanzada', icono: <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" /></> },
  { a: 'Resultados', b: 'Confiables', icono: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></> },
  { a: 'Atención', b: 'Personalizada', icono: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20a6 6 0 0 1 12 0M15 20a5 5 0 0 1 6 0" /></> },
  { a: 'Compromiso', b: 'Con tu salud', icono: <><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.500-7 10-7 10z" /></> }
];

/** Icono redondo con trazo fino (SVG en línea; sin dependencias ni sombras). */
const Icono: React.FC<{ color: string; bg: string; size: number; children: React.ReactNode }> = ({ color, bg, size, children }) => (
  <span className="inline-flex items-center justify-center rounded-full flex-shrink-0" style={{ width: size, height: size, background: bg }}>
    <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  </span>
);

const Pastilla: React.FC<{ fondo: string; color: string; children: React.ReactNode }> = ({ fondo, color, children }) => (
  <span className="inline-block rounded-full px-3 py-0.5 font-black uppercase tracking-wide" style={{ background: fondo, color }}>
    {children}
  </span>
);

const Campo: React.FC<{ etiqueta: string; visible?: boolean; children: React.ReactNode }> = ({ etiqueta, visible = true, children }) =>
  visible ? (
    <div>
      <span className="block text-[8px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>{etiqueta}</span>
      {children}
    </div>
  ) : null;

/**
 * Hoja oficial del informe. Diseño: blanco y negro + UN solo color de acento
 * (el color principal de Ajustes). Sin sombras, degradados ni elementos de
 * simulación: lo que se ve aquí es exactamente lo que se imprime o se exporta.
 */
export const VaclinicOfficialReportSheet: React.FC<VaclinicOfficialReportSheetProps> = ({
  report,
  watermark = 'none',
  includeAiExplanation = false,
  includeSignatures = true,
  includeConclusions = true,
  includeRecommendations = true,
  printMode = false,
  id = 'vaclinic-official-report-sheet',
  customSettings,
  fitToSinglePage = true,
  pinFooterToBottom = false,
  hideAnnex = false
}) => {
  const { labSettings: contextLabSettings, orders } = useClinic();
  const labSettings = customSettings || contextLabSettings;
  const accent = labSettings.primaryColor || '#0f766e';
  // Logo del encabezado: respeta el tamaño (40–130 px) y la posición elegidos en Ajustes → Membrete.
  const alturaLogo = Math.min(130, Math.max(40, Number(labSettings.logoWidthPx) || 64));
  const posicionLogo = labSettings.logoPosition || 'left';

  const [qrUrl, setQrUrl] = useState<string>('');

  const edad = report.patientAge && report.patientAge > 0 ? report.patientAge : undefined;
  const generoConocido = /^(m|f)/i.test(report.patientGender || '');
  const genero = generoConocido ? report.patientGender : undefined;
  const parameters = report.parameters || [];

  // Solo los analitos con norma propia por edad/sexo usan el estándar demográfico
  // (y solo si edad y sexo son conocidos); el resto, el rango que trae el examen.
  const evaluados = useMemo(() => {
    const map = new Map<string, ParameterDeviationInfo>();
    parameters.forEach((p) => {
      const usaNorma = nombreTieneNormaDemografica(p.name) && edad !== undefined && genero !== undefined;
      map.set(
        p.id,
        evaluateParameterDetailed(p.value, p.referenceRange, p.minVal, p.maxVal, p.status, {
          patientAge: usaNorma ? edad : undefined,
          patientGender: usaNorma ? genero : undefined,
          parameterName: usaNorma ? p.name : ''
        })
      );
    });
    return map;
  }, [parameters, edad, genero]);

  const cleanRecommendations = useMemo(
    () => (report.recommendations || []).filter((r) => typeof r === 'string' && r.trim().length > 0),
    [report.recommendations]
  );

  const shouldShowConclusions =
    includeConclusions &&
    report.includeConclusionsInReport !== false &&
    Boolean(report.doctorConclusions && report.doctorConclusions.trim().length > 0);
  const shouldShowRecommendations =
    includeRecommendations && report.includeRecommendationsInReport !== false && cleanRecommendations.length > 0;
  const shouldShowAiExplanation =
    includeAiExplanation &&
    report.includeAiExplanationInReport === true &&
    Boolean(report.patientExplanation && report.patientExplanation.trim().length > 0);

  const formatoFecha = (v?: string) =>
    v ? new Date(v).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const fechaEmision = formatoFecha(report.emissionDate) || formatoFecha(new Date().toISOString());
  const fechaMuestra = formatoFecha(report.sampleDate);

  // Datos reales de la orden (número y código de consulta del portal), si existen.
  const orden = report.orderId ? orders.find((o) => o.id === report.orderId) : undefined;
  const numeroOrden = orden?.orderNumber || '';
  const codigoConsulta = orden?.codigoConsulta || '';

  const parameterSections = useMemo(() => groupParametersBySection(parameters, report.category), [parameters, report.category]);

  useEffect(() => {
    // Solo un informe sellado por el SERVIDOR tiene QR (apunta a /verificar/<código>).
    const verifyUrl = buildVerificationUrl(report);
    if (!verifyUrl) {
      setQrUrl('');
      return;
    }
    QRCode.toDataURL(verifyUrl, { margin: 1, width: 140, color: { dark: '#000000', light: '#ffffff' } }, (err, url) => {
      if (!err && url) setQrUrl(url);
    });
  }, [report.verificationCode, report.verificationHash]);

  const isCompactSinglePage = fitToSinglePage && parameters.length <= 25;
  const firmantes = (labSettings.signers || []).filter((s) => s.enabled && s.name && s.name.trim());
  const sinPaciente = (v: string | undefined, vacio = '—') => (v && v.trim() ? v : vacio);

  const firmantesOrdenados = [...firmantes].sort(
    (a, b) => (FIRMA_REPORTE[a.id]?.orden ?? 9) - (FIRMA_REPORTE[b.id]?.orden ?? 9)
  );
  const horario = (labSettings.businessHours ?? HORARIO_PREDETERMINADO).trim();
  const tint = (a: number) => (/^#[0-9a-f]{6}$/i.test(accent) ? `${accent}${a.toString(16).padStart(2, '0')}` : '#e6f4f1');
  const sloganTexto = labSettings.slogan || '';
  const codigoPaciente = orden?.patientCode || '';
  const mostrarQrCabecera = Boolean(qrUrl);

  return (
    <div
      id={id}
      className={`report-sheet-container bg-white w-full max-w-[850px] relative font-sans select-text overflow-hidden print:overflow-visible print:p-0 print:w-full print:max-w-none print:min-h-0 print:flex print:flex-col ${
        isCompactSinglePage ? 'text-[11px]' : 'text-xs'
      } ${pinFooterToBottom ? 'h-full flex flex-col justify-between' : ''}`}
      style={{
        color: INK,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        paddingTop: printMode ? '4mm' : isCompactSinglePage ? '6mm' : '8mm',
        paddingBottom: printMode ? '4mm' : isCompactSinglePage ? '6mm' : '8mm',
        paddingLeft: printMode ? '6mm' : isCompactSinglePage ? '8mm' : '10mm',
        paddingRight: printMode ? '6mm' : isCompactSinglePage ? '8mm' : '10mm'
      }}
    >
      {labSettings.logoUrl && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 select-none" aria-hidden="true">
          <img src={labSettings.logoUrl} alt="" className="w-[60%] object-contain" style={{ opacity: 0.05 }} />
        </div>
      )}
      {watermark !== 'none' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10 opacity-[0.05] select-none">
          <span className="text-7xl font-black uppercase -rotate-45 tracking-widest" style={{ color: INK }}>
            {watermark}
          </span>
        </div>
      )}

      {/* ENCABEZADO */}
      <header className="relative z-10 mb-2">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex gap-3 min-w-0 ${
              posicionLogo === 'center' ? 'flex-col items-center text-center' : posicionLogo === 'right' ? 'flex-row-reverse items-center' : 'items-center'
            }`}
          >
            {labSettings.logoUrl ? (
              <img
                src={labSettings.logoUrl}
                alt="Logo"
                className="w-auto object-contain flex-shrink-0 rounded-xl"
                style={{ height: `${alturaLogo}px`, maxWidth: '40%' }}
              />
            ) : (
              <svg viewBox="0 0 100 100" className="flex-shrink-0" style={{ width: `${alturaLogo}px`, height: `${alturaLogo}px` }} aria-hidden="true">
                <circle cx="50" cy="50" r="46" fill="none" stroke={accent} strokeWidth="5" />
                <rect x="45" y="22" width="10" height="56" rx="2" fill={accent} />
                <rect x="22" y="45" width="56" height="10" rx="2" fill={accent} />
              </svg>
            )}
            <div className="min-w-0">
              <div className="text-[28px] font-black tracking-tight uppercase leading-none" style={{ color: INK }}>
                {labSettings.labName || 'Laboratorio Clínico'}
              </div>
              {sloganTexto && (
                <p className="text-[10.5px] font-semibold mt-1 leading-tight" style={{ color: accent }}>
                  {sloganTexto}
                </p>
              )}
              <h2 className="text-[9.5px] font-bold uppercase tracking-wide mt-0.5" style={{ color: INK }}>
                Informe de resultados de laboratorio clínico
              </h2>
            </div>
          </div>

          {mostrarQrCabecera && (
            <div className="text-center flex-shrink-0 self-center">
              <img src={qrUrl} alt="QR de verificación" className="w-[60px] h-[60px] object-contain" referrerPolicy="no-referrer" />
              <span className="block text-[6.5px] font-bold uppercase tracking-wider leading-tight mt-0.5" style={{ color: MUTED }}>
                Código de<br />verificación
              </span>
            </div>
          )}

          <div className="rounded-xl px-4 py-2.5 text-right min-w-0 max-w-[48%]" style={{ background: NAVY, color: '#ffffff' }}>
            <span
              className="inline-block rounded-full px-3 py-0.5 text-[8px] font-black uppercase tracking-wider"
              style={{ border: `1px solid ${MINT}`, color: MINT }}
            >
              Informe oficial de resultados
            </span>
            <div className="mt-1.5 text-[11px] font-black leading-snug break-words">
              N.° DE ORDEN: <span style={{ color: MINT }}>{numeroOrden || report.reportNumber}</span>
            </div>
            {codigoPaciente && (
              <div className="text-[12px] font-black leading-snug">
                CÓD. PACIENTE: <span style={{ color: MINT }}>{codigoPaciente}</span>
              </div>
            )}
            {numeroOrden && report.reportNumber && (
              <div className="text-[8.5px] leading-snug" style={{ color: '#cbd5e1' }}>N.° de informe {report.reportNumber}</div>
            )}
            {fechaMuestra && (
              <div className="text-[8.5px] leading-snug" style={{ color: '#cbd5e1' }}>Fecha de muestra: {fechaMuestra}</div>
            )}
            <div className="text-[8.5px] leading-snug" style={{ color: '#cbd5e1' }}>Fecha de emisión: {fechaEmision}</div>
          </div>
        </div>

        <div className="mt-2 flex items-center flex-wrap gap-x-5 gap-y-0.5 text-[9.5px]" style={{ color: MUTED }}>
          {labSettings.phone && (
            <span className="flex items-center gap-1.5">
              <Icono color={accent} bg={tint(0x1f)} size={16}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></Icono>
              <strong style={{ color: INK }}>{labSettings.phone}</strong>
            </span>
          )}
          {labSettings.address && (
            <span className="flex items-center gap-1.5">
              <Icono color={accent} bg={tint(0x1f)} size={16}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></Icono>
              {labSettings.address}
            </span>
          )}
          {labSettings.email && (
            <span className="flex items-center gap-1.5">
              <Icono color={accent} bg={tint(0x1f)} size={16}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></Icono>
              {labSettings.email}
            </span>
          )}
        </div>

        {horario && (
          <div className="mt-2 rounded-lg px-3 py-1.5 flex items-center gap-2 text-[9.5px]" style={{ background: NAVY, color: '#ffffff' }}>
            <Icono color={MINT} bg="transparent" size={14}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icono>
            <span className="font-black uppercase tracking-wider" style={{ color: '#cbd5e1' }}>Horario de atención:</span>
            <span className="font-semibold">{horario}</span>
          </div>
        )}
      </header>

      {/* DATOS DEL PACIENTE */}
      <section className="relative z-10 mb-2 rounded-xl px-4 py-2.5" style={{ border: `1px solid ${RULE}`, background: '#f8fafc' }}>
        <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide mb-1.5" style={{ color: INK }}>
          <Icono color={accent} bg={tint(0x26)} size={18}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Icono>
          Datos del paciente
        </h3>
        <div className="grid grid-cols-3 gap-x-5 gap-y-2">
          <Campo etiqueta="Código de paciente" visible={Boolean(codigoPaciente)}>
            <strong className="text-[12px] font-black" style={{ color: accent }}>{codigoPaciente}</strong>
          </Campo>
          <Campo etiqueta="Paciente">
            <strong className="text-[12px] font-black uppercase">{report.patientName}</strong>
          </Campo>
          <Campo etiqueta="Edad / género">
            <span className="text-[11px] font-semibold">
              {edad !== undefined ? `${edad} años` : '—'} · {generoConocido ? (/^m/i.test(report.patientGender) ? 'Masculino' : 'Femenino') : '—'}
            </span>
          </Campo>
          <Campo etiqueta="Médico referente">
            <span className="text-[11px] font-semibold">{sinPaciente(report.referringDoctor, 'Particular')}</span>
          </Campo>
          <Campo etiqueta="Contacto / ID">
            <span className="text-[11px] font-semibold">{sinPaciente(/^0+$/.test(report.patientNationalId || '') ? '' : report.patientNationalId)}</span>
          </Campo>
          <Campo etiqueta="Código de acceso (portal)" visible={Boolean(codigoConsulta)}>
            <span className="text-[11px] font-black font-mono">{codigoConsulta}</span>
          </Campo>
        </div>
      </section>

      {/* RESULTADOS */}
      <section className="relative z-10 mb-2">
        <div className="flex items-center justify-between gap-3 pb-1 mb-2" style={{ borderBottom: `1.5px solid ${accent}` }}>
          <h3 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-wide" style={{ color: accent }}>
            <Icono color={accent} bg={tint(0x26)} size={18}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" /></Icono>
            Resultados de los análisis clínicos
          </h3>
          <div className="flex items-center gap-3 text-[8.5px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: OK_TXT }} />Normal</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: ALTO_TXT }} />Alto ↑</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background: BAJO_TXT }} />Bajo ↓</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {parameterSections.map((section) => {
            const sectionTitle = section.title || report.title;
            const subtitulo = [section.sampleType, section.methodology].filter(Boolean).join(' · ');
            const n = section.parameters.length;
            return (
              <div key={section.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${RULE}`, background: '#ffffff' }}>
                <div className="avoid-page-break-after flex items-center justify-between gap-3 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icono color={accent} bg={tint(0x26)} size={22}><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" /></Icono>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-black uppercase tracking-wide leading-tight">{sectionTitle}</h4>
                      {subtitulo && <p className="text-[8.5px] leading-tight" style={{ color: MUTED }}>{subtitulo}</p>}
                    </div>
                  </div>
                  <span className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider" style={{ border: `1px solid ${RULE}`, color: INK }}>
                    {n} {n === 1 ? 'parámetro' : 'parámetros'}
                  </span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead style={{ display: 'table-header-group' }}>
                    <tr className="text-[8px] uppercase tracking-wider" style={{ color: MUTED, background: '#f8fafc', borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
                      <th className="py-1 pl-3 pr-2 font-bold">Examen / parámetro</th>
                      <th className="py-1 px-2 font-bold w-[22%]">Resultado obtenido</th>
                      <th className="py-1 px-2 font-bold w-[26%]">Valores de referencia</th>
                      <th className="py-1 pl-2 pr-3 font-bold text-center w-[14%]">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.parameters.map((param, pIdx) => {
                      const info = evaluados.get(param.id);
                      const hasValue = param.value !== undefined && param.value !== '';
                      const fuera = !!info && info.isOutOfRange && hasValue;
                      const critico = !!info && info.isCritical && hasValue;
                      const esBajo = info?.status === 'low';
                      const rango = info?.effectiveRange && info.effectiveRange !== '-' && info.effectiveRange !== '—' ? info.effectiveRange : '';
                      const rowPad = isCompactSinglePage ? 'py-[3px]' : 'py-1';
                      const colorValor = !fuera ? INK : esBajo ? BAJO_TXT : ALTO_TXT;
                      return (
                        <tr key={param.id || `${section.id}-${pIdx}`} style={{ breakInside: 'avoid', pageBreakInside: 'avoid', ...(pIdx > 0 ? { borderTop: `1px solid ${RULE}` } : {}) }}>
                          <td className={`${rowPad} pl-3 pr-2 text-[10.5px] ${fuera ? 'font-bold' : 'font-semibold'}`}>
                            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: accent }} />
                            {param.name}
                            {param.notes && <span className="block text-[8px] font-normal ml-3" style={{ color: MUTED }}>{param.notes}</span>}
                          </td>
                          <td className={`${rowPad} px-2 text-[10.5px]`} style={{ color: colorValor }}>
                            {hasValue ? <strong className="text-[13px] font-black">{param.value}</strong> : <span style={{ color: MUTED }}>Pendiente</span>}
                            {hasValue && param.unit ? <span className="font-normal text-[9px] ml-1" style={{ color: MUTED }}>{param.unit}</span> : null}
                          </td>
                          <td className={`${rowPad} px-2 text-[10px]`} style={{ color: MUTED }}>
                            {rango ? (
                              <span>{rango}{param.unit && /\d/.test(rango) && !/[a-zA-Zµ%/]/.test(rango) ? ` ${param.unit}` : ''}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className={`${rowPad} pl-2 pr-3 text-center text-[8.5px]`}>
                            {!hasValue ? (
                              ''
                            ) : critico ? (
                              <Pastilla fondo="#7f1d1d" color="#ffffff">{esBajo ? '▼ Crítico' : '▲ Crítico'}</Pastilla>
                            ) : fuera ? (
                              info?.status === 'high' ? (
                                <Pastilla fondo={ALTO_BG} color={ALTO_TXT}>▲ Alto</Pastilla>
                              ) : esBajo ? (
                                <Pastilla fondo={BAJO_BG} color={BAJO_TXT}>▼ Bajo</Pastilla>
                              ) : (
                                <Pastilla fondo={ALTO_BG} color={ALTO_TXT}>Anormal</Pastilla>
                              )
                            ) : (
                              <Pastilla fondo={OK_BG} color={OK_TXT}>Normal</Pastilla>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </section>

      {/* CIERRE, NOTAS Y FIRMAS */}
      <div
        className={`avoid-page-break report-signatures-footer relative z-10 space-y-2 ${
          pinFooterToBottom ? 'mt-auto pt-2' : 'mt-2'
        }`}
      >
        {shouldShowConclusions && (
          <div className="rounded-xl p-2.5 text-[10px]" style={{ border: `1px solid ${INK}` }}>
            <div className="font-black uppercase tracking-wider text-[9px] mb-0.5" style={{ color: accent }}>
              Conclusión / interpretación del profesional
            </div>
            <p className="leading-snug whitespace-pre-line">{report.doctorConclusions}</p>
          </div>
        )}

        {shouldShowRecommendations && (
          <div className="rounded-xl p-2.5 text-[10px]" style={{ border: `1px solid ${RULE}` }}>
            <div className="font-black uppercase tracking-wider text-[9px] mb-0.5" style={{ color: accent }}>
              Indicaciones y recomendaciones
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9.5px]">
              {cleanRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-tight">
                  <span style={{ color: accent }}>•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {shouldShowAiExplanation && (
          <div className="rounded-xl p-2.5 text-[10px]" style={{ border: `1px solid ${RULE}` }}>
            <div className="font-bold uppercase tracking-wider text-[9px] mb-0.5">
              <span>Texto de apoyo para el paciente</span>
              <span className="font-normal normal-case tracking-normal"> — generado con IA y revisado por el laboratorio; no es un diagnóstico</span>
            </div>
            <p className="leading-snug">{report.patientExplanation}</p>
          </div>
        )}

        <div className="rounded-xl px-3 py-2 flex items-center gap-2 text-[9.5px]" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a5f' }}>
          <Icono color="#2563eb" bg="#dbeafe" size={16}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Icono>
          <span><strong>Nota:</strong> Los resultados corresponden únicamente a la muestra analizada. Ante cualquier duda, consulte a su médico tratante.</span>
        </div>

        <div className="rounded-xl px-3 py-2 text-center text-[9.5px] italic" style={{ border: `1px solid ${RULE}`, color: MUTED }}>
          Gracias por confiar en nosotros para el cuidado de su salud.
        </div>

        {includeSignatures && (firmantesOrdenados.length > 0 || report.verificationCode) && (
          <section className="pt-2" style={{ borderTop: `1px solid ${RULE}` }}>
            <div className="signatures-grid grid gap-4 text-center items-start" style={{ gridTemplateColumns: `repeat(${Math.min(firmantesOrdenados.slice(0, 3).length + (report.verificationCode ? 1 : 0), 4)}, minmax(0, 1fr))` }}>
              {firmantesOrdenados.slice(0, 3).map((f) => (
                <div key={f.id} className="flex flex-col items-center">
                  <Icono color={accent} bg={tint(0x26)} size={22}>
                    {f.id === 'signer_2_qb' ? (
                      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" />
                    ) : f.id === 'signer_3_tech' ? (
                      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
                    ) : (
                      <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>
                    )}
                  </Icono>
                  <div className="w-full h-14 mt-1 flex items-end justify-center pb-0.5" style={{ borderBottom: `1px solid ${INK}` }}>
                    {f.signatureImageUrl ? <img src={f.signatureImageUrl} alt="" className="max-h-14 max-w-full object-contain" /> : null}
                  </div>
                  {FIRMA_REPORTE[f.id] && (
                    <span className="text-[7.5px] font-bold uppercase tracking-wider mt-1" style={{ color: MUTED }}>{FIRMA_REPORTE[f.id].etiqueta}</span>
                  )}
                  <strong className="text-[10px] font-black leading-tight">{f.name}</strong>
                  {f.roleTitle && <span className="text-[8px]" style={{ color: MUTED }}>{f.roleTitle}</span>}
                  {f.specialty && <span className="text-[8px]" style={{ color: MUTED }}>{f.specialty}</span>}
                </div>
              ))}
              {report.verificationCode && (
                <div className="rounded-xl px-2 py-2 flex flex-col items-center" style={{ border: `1px solid ${RULE}`, background: '#f8fafc' }}>
                  <Icono color={accent} bg={tint(0x26)} size={20}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></Icono>
                  {qrUrl && <img src={qrUrl} alt="" className="h-14 w-14 object-contain mt-1" />}
                  <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">Verificación</span>
                  <span className="text-[7.5px]" style={{ color: MUTED }}>Documento oficial de {labSettings.labName || 'laboratorio'}</span>
                  <span className="text-[7.5px] font-bold" style={{ color: accent }}>Validado {fechaEmision}</span>
                  <span className="text-[7px] font-mono" style={{ color: MUTED }}>{formatVerificationCode(report.verificationCode)}</span>
                </div>
              )}
            </div>
            {numeroOrden && (
              <div className="text-right text-[8.5px] mt-1" style={{ color: MUTED }}>
                N.° de orden: <strong style={{ color: accent }}>{numeroOrden}</strong>
              </div>
            )}
          </section>
        )}

        <footer className="report-footer rounded-2xl px-4 py-2.5 grid grid-cols-4 gap-2" style={{ background: accent, color: '#ffffff' }}>
          {PILARES.map((p) => (
            <div key={p.a} className="flex items-center gap-1.5 min-w-0">
              <Icono color="#ffffff" bg="rgba(255,255,255,0.18)" size={20}>{p.icono}</Icono>
              <div className="leading-tight min-w-0">
                <span className="block text-[6.5px] uppercase tracking-wider opacity-80">{p.a}</span>
                <span className="block text-[8px] font-black uppercase tracking-wide">{p.b}</span>
              </div>
            </div>
          ))}
        </footer>
      </div>

      {/* Official Hematology Analyzer Annex Page (if attached) */}
      {!hideAnnex && report.attachedAnalyzerReport && report.attachedAnalyzerReport.attachedToOfficialPdf !== false && (
        <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-300 print:break-before-page">
          <div className="mb-3 bg-slate-100 p-2 rounded-lg text-slate-700 text-xs flex items-center justify-between border border-slate-200">
            <span className="font-bold uppercase tracking-wide text-slate-800 text-[10px]">
              Anexo Oficial: Registros Gráficos y Morfológicos del Analizador {report.attachedAnalyzerReport.model}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Muestra: {report.attachedAnalyzerReport.sampleId} • Validador Automatizado
            </span>
          </div>

          <OzelleCbcReportView
            reportData={report.attachedAnalyzerReport}
            compactMode={true}
            readOnly={true}
          />
        </div>
      )}

    </div>
  );
};
