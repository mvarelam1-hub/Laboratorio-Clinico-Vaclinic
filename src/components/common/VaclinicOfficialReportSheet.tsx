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

  return (
    <div
      id={id}
      className={`report-sheet-container bg-white w-full max-w-[850px] relative font-sans select-text overflow-hidden print:overflow-visible print:p-0 print:w-full print:max-w-none print:min-h-0 print:flex print:flex-col print:justify-between ${
        isCompactSinglePage ? 'text-[11px]' : 'text-xs'
      } ${pinFooterToBottom ? 'h-full flex flex-col justify-between' : ''}`}
      style={{
        color: INK,
        paddingTop: printMode ? '4mm' : isCompactSinglePage ? '6mm' : '8mm',
        paddingBottom: printMode ? '4mm' : isCompactSinglePage ? '6mm' : '8mm',
        paddingLeft: printMode ? '6mm' : isCompactSinglePage ? '8mm' : '10mm',
        paddingRight: printMode ? '6mm' : isCompactSinglePage ? '8mm' : '10mm'
      }}
    >
      {watermark !== 'none' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10 opacity-[0.05] select-none">
          <span className="text-7xl font-black uppercase -rotate-45 tracking-widest" style={{ color: INK }}>
            {watermark}
          </span>
        </div>
      )}

      {/* ENCABEZADO */}
      <header className="relative z-10 pb-2 mb-2" style={{ borderBottom: `2px solid ${accent}` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {labSettings.logoUrl ? (
              <img src={labSettings.logoUrl} alt="Logo" className="h-14 w-auto object-contain flex-shrink-0" />
            ) : (
              <svg viewBox="0 0 100 100" className="w-14 h-14 flex-shrink-0" aria-hidden="true">
                <circle cx="50" cy="50" r="46" fill="none" stroke={accent} strokeWidth="5" />
                <rect x="45" y="22" width="10" height="56" rx="2" fill={accent} />
                <rect x="22" y="45" width="56" height="10" rx="2" fill={accent} />
              </svg>
            )}
            <div className="min-w-0">
              <div className="text-2xl font-black tracking-tight uppercase leading-none" style={{ color: INK }}>
                {labSettings.labName || 'Laboratorio Clínico'}
              </div>
              {labSettings.slogan && (
                <p className="text-[10px] italic mt-0.5" style={{ color: MUTED }}>
                  {labSettings.slogan}
                </p>
              )}
              <h2 className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: accent }}>
                Informe de resultados de laboratorio clínico
              </h2>
            </div>
          </div>

          <div className="flex items-start gap-3 flex-shrink-0">
            {qrUrl && (
              <div className="text-center">
                <img src={qrUrl} alt="QR de verificación" className="w-14 h-14 object-contain" referrerPolicy="no-referrer" />
                <span className="block text-[7px] font-bold uppercase tracking-wider leading-tight" style={{ color: MUTED }}>
                  Verificar informe
                </span>
              </div>
            )}
            <div className="text-[10px] leading-snug min-w-[170px] pl-3" style={{ borderLeft: `1px solid ${RULE}` }}>
              <div className="flex justify-between gap-3">
                <span style={{ color: MUTED }}>N.° de informe</span>
                <span className="font-mono font-bold">{report.reportNumber}</span>
              </div>
              {numeroOrden && (
                <div className="flex justify-between gap-3">
                  <span style={{ color: MUTED }}>N.° de orden</span>
                  <span className="font-mono font-bold">{numeroOrden}</span>
                </div>
              )}
              {fechaMuestra && (
                <div className="flex justify-between gap-3">
                  <span style={{ color: MUTED }}>Fecha de muestra</span>
                  <span className="font-mono">{fechaMuestra}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span style={{ color: MUTED }}>Fecha de emisión</span>
                <span className="font-mono">{fechaEmision}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center flex-wrap gap-x-4 gap-y-0.5 text-[9.5px]" style={{ color: MUTED }}>
          {labSettings.phone && <span>Tel. <strong style={{ color: INK }}>{labSettings.phone}</strong></span>}
          {labSettings.address && <span>{labSettings.address}</span>}
          {labSettings.email && <span>{labSettings.email}</span>}
        </div>
      </header>

      {/* DATOS DEL PACIENTE */}
      <section className="relative z-10 mb-2">
        <h3 className="text-[10.5px] font-black uppercase tracking-wider mb-1" style={{ color: accent }}>
          Datos del paciente
        </h3>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 py-1.5" style={{ borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
          <div>
            <span className="block text-[8.5px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Paciente</span>
            <strong className="text-[12px] uppercase">{report.patientName}</strong>
          </div>
          <div>
            <span className="block text-[8.5px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Edad / sexo</span>
            <span className="font-semibold">
              {edad !== undefined ? `${edad} años` : '—'} · {generoConocido ? (/^m/i.test(report.patientGender) ? 'Masculino' : 'Femenino') : '—'}
            </span>
          </div>
          <div>
            <span className="block text-[8.5px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Documento de identidad</span>
            <span className="font-mono">{sinPaciente(report.patientNationalId)}</span>
          </div>
          <div>
            <span className="block text-[8.5px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Médico referente</span>
            <span className="font-semibold uppercase">{sinPaciente(report.referringDoctor, 'Particular')}</span>
          </div>
          {codigoConsulta && (
            <div>
              <span className="block text-[8.5px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Código de consulta en línea</span>
              <span className="font-mono font-bold">{codigoConsulta}</span>
            </div>
          )}
        </div>
      </section>

      {/* RESULTADOS */}
      <section className="relative z-10 mb-2">
        <h3 className="text-[10.5px] font-black uppercase tracking-wider mb-1" style={{ color: accent }}>
          Resultados de los análisis clínicos
        </h3>

        <div className="space-y-2.5">
          {parameterSections.map((section) => {
            const sectionTitle = section.title || report.title;
            return (
              <div key={section.id} className="avoid-page-break">
                <div className="flex items-baseline justify-between pb-0.5" style={{ borderBottom: `1.5px solid ${INK}` }}>
                  <h4 className="text-[11px] font-black uppercase tracking-wide">{sectionTitle}</h4>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[8.5px] uppercase tracking-wider" style={{ color: MUTED }}>
                      <th className="py-1 pr-2 font-bold">Examen / parámetro</th>
                      <th className="py-1 px-2 font-bold text-right w-[22%]">Resultado</th>
                      <th className="py-1 px-2 font-bold text-center w-[26%]">Valores de referencia</th>
                      <th className="py-1 pl-2 font-bold text-center w-[14%]">Indicador</th>
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
                      return (
                        <tr key={param.id || `${section.id}-${pIdx}`} style={{ borderTop: `1px solid ${RULE}` }}>
                          <td className={`${rowPad} pr-2 text-[10.5px] ${fuera ? 'font-bold' : 'font-medium'}`}>
                            {param.name}
                            {param.notes && <span className="block text-[8.5px] font-normal" style={{ color: MUTED }}>{param.notes}</span>}
                          </td>
                          <td className={`${rowPad} px-2 text-right font-mono text-[10.5px] ${fuera ? 'font-black' : 'font-semibold'}`} style={fuera ? { color: accent } : undefined}>
                            {hasValue ? param.value : <span style={{ color: MUTED }}>Pendiente</span>}
                            {hasValue && param.unit ? <span className="font-normal text-[9px] ml-1" style={{ color: MUTED }}>{param.unit}</span> : null}
                          </td>
                          <td className={`${rowPad} px-2 text-center font-mono text-[10px]`} style={{ color: MUTED }}>
                            {rango ? (
                              <span>{rango}{param.unit && /\d/.test(rango) && !/[a-zA-Zµ%/]/.test(rango) ? ` ${param.unit}` : ''}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className={`${rowPad} pl-2 text-center text-[9.5px]`}>
                            {!hasValue ? (
                              ''
                            ) : critico ? (
                              <span className="inline-block px-1.5 font-black uppercase text-white" style={{ background: INK }}>
                                {esBajo ? '▼ Crítico' : '▲ Crítico'}
                              </span>
                            ) : fuera ? (
                              <span className="font-black" style={{ color: accent }}>
                                {info?.status === 'high' ? '▲ Alto' : esBajo ? '▼ Bajo' : 'Anormal'}
                              </span>
                            ) : (
                              <span style={{ color: MUTED }}>Normal</span>
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
        className={`avoid-page-break report-signatures-footer relative z-10 space-y-2 print:mt-auto print:pt-1 ${
          pinFooterToBottom ? 'mt-auto pt-2' : 'mt-2'
        }`}
      >
        {shouldShowConclusions && (
          <div className="p-2 text-[10px]" style={{ border: `1px solid ${INK}` }}>
            <div className="font-black uppercase tracking-wider text-[9px] mb-0.5" style={{ color: accent }}>
              Conclusión / interpretación del profesional
            </div>
            <p className="leading-snug whitespace-pre-line">{report.doctorConclusions}</p>
          </div>
        )}

        {shouldShowRecommendations && (
          <div className="p-2 text-[10px]" style={{ border: `1px solid ${RULE}` }}>
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
          <div className="p-2 text-[10px]" style={{ border: `1px solid ${RULE}` }}>
            <div className="font-bold uppercase tracking-wider text-[9px] mb-0.5">
              <span>Texto de apoyo para el paciente</span>
              <span className="font-normal normal-case tracking-normal"> — generado con IA y revisado por el laboratorio; no es un diagnóstico</span>
            </div>
            <p className="leading-snug">{report.patientExplanation}</p>
          </div>
        )}

        <p className="text-[9px]" style={{ color: MUTED }}>
          Los resultados corresponden únicamente a la muestra analizada. Ante cualquier duda, consulte a su médico tratante.
          &nbsp;&nbsp;▲ Alto &nbsp; ▼ Bajo
        </p>

        {includeSignatures && (firmantes.length > 0 || report.verificationCode) && (
          <section className="pt-2" style={{ borderTop: `1px solid ${RULE}` }}>
            <div className="signatures-grid grid gap-4 text-center" style={{ gridTemplateColumns: `repeat(${Math.min(firmantes.length + (report.verificationCode ? 1 : 0), 4)}, minmax(0, 1fr))` }}>
              {firmantes.slice(0, 3).map((f) => (
                <div key={f.id} className="flex flex-col items-center">
                  <div className="w-full h-9 flex items-end justify-center pb-0.5" style={{ borderBottom: `1px solid ${INK}` }}>
                    {f.signatureImageUrl ? <img src={f.signatureImageUrl} alt="" className="max-h-9 object-contain" /> : null}
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-wider mt-1" style={{ color: MUTED }}>{f.roleTitle}</span>
                  <strong className="text-[9.5px] font-black leading-tight">{f.name}</strong>
                  {f.specialty && <span className="text-[8px]" style={{ color: MUTED }}>{f.specialty}</span>}
                </div>
              ))}
              {report.verificationCode && (
                <div className="flex flex-col items-center">
                  <div className="w-full h-9 flex items-end justify-center pb-0.5" style={{ borderBottom: `1px solid ${INK}` }}>
                    {qrUrl && <img src={qrUrl} alt="" className="h-8 w-8 object-contain" />}
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-wider mt-1" style={{ color: MUTED }}>Verificación</span>
                  <span className="text-[8px] font-mono">{formatVerificationCode(report.verificationCode)}</span>
                </div>
              )}
            </div>
          </section>
        )}

        <footer className="report-footer pt-1 text-center text-[8.5px]" style={{ color: MUTED, borderTop: `1px solid ${RULE}` }}>
          {[labSettings.labName, labSettings.phone, labSettings.address].filter(Boolean).join(' · ')}
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
