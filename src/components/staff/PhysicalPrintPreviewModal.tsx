import React, { useState, useRef, useEffect } from 'react';
import { MedicalReport } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { VaclinicOfficialReportSheet } from '../common/VaclinicOfficialReportSheet';
import { OzelleCbcReportView } from '../laboratory/OzelleCbcReportView';
import { PdfReportService } from '../../services/pdfReportService';
import {
  X,
  Printer,
  Download,
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  Scissors,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  FileText,
  Info,
  Palette,
  LayoutTemplate,
  Bookmark
} from 'lucide-react';

export interface PhysicalPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MedicalReport;
  bioanalystName?: string;
  bioanalystSpecialty?: string;
  bioanalystLicense?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorLicense?: string;
}

export type PaperFilterType = 'bond_laser' | 'satin_color' | 'warm_light' | 'monochrome' | 'none';
export type PaperSizeType = 'letter' | 'a4';

export const PhysicalPrintPreviewModal: React.FC<PhysicalPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  report,
  bioanalystName,
  bioanalystSpecialty,
  bioanalystLicense,
  doctorName,
  doctorSpecialty,
  doctorLicense
}) => {
  const { labSettings } = useClinic();
  const printSheetRef = useRef<HTMLDivElement>(null);

  // Simulation controls state
  const [paperFilter, setPaperFilter] = useState<PaperFilterType>('bond_laser');
  const [paperSize, setPaperSize] = useState<PaperSizeType>('letter');
  const [zoomLevel, setZoomLevel] = useState<number>(85); // 85% default fits nicely on desktop
  const [showPrintMargins, setShowPrintMargins] = useState<boolean>(true);
  const [showPageBreaks, setShowPageBreaks] = useState<boolean>(true);
  const [pinFooterToBottom, setPinFooterToBottom] = useState<boolean>(true);
  const [showPaperClips, setShowPaperClips] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [separateAnnexSheet, setSeparateAnnexSheet] = useState<boolean>(true);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // CSS Filter strings that physically simulate paper stock and ink lighting
  const getFilterStyle = (filter: PaperFilterType): string => {
    switch (filter) {
      case 'bond_laser':
        // Physical white 75g/80g bond paper: slight ink absorption, subtle warm cast, authentic laser toner contrast
        return 'contrast(102.5%) brightness(98.3%) sepia(2.8%) drop-shadow(0 20px 30px rgba(0, 0, 0, 0.45))';
      case 'satin_color':
        // Smooth clinical coated stock: vibrant ink saturation, punchy clinical contrast
        return 'contrast(104%) brightness(99.6%) saturate(103%) sepia(1%) drop-shadow(0 20px 30px rgba(0, 0, 0, 0.45))';
      case 'warm_light':
        // Medical inspection desk lamp (3200K tungsten / warm LED inspection light)
        return 'sepia(9.5%) contrast(99.5%) brightness(97%) saturate(102%) drop-shadow(0 20px 30px rgba(0, 0, 0, 0.45))';
      case 'monochrome':
        // Grayscale office laser printer simulation / toner test
        return 'grayscale(100%) contrast(114%) brightness(95%) drop-shadow(0 20px 30px rgba(0, 0, 0, 0.45))';
      case 'none':
      default:
        return 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.45))';
    }
  };

  // Dimensions for physical paper sheets (pixels at approx 96 DPI screen scale)
  // Letter: 8.5" x 11" = 816px x 1056px
  // A4: 8.27" x 11.69" = 794px x 1123px
  const paperDimensions = paperSize === 'letter' 
    ? { width: '816px', minHeight: '1056px', label: 'Carta (8.5" × 11" / 215.9 × 279.4 mm)' }
    : { width: '794px', minHeight: '1123px', label: 'A4 (210 × 297 mm ISO 216)' };

  const hasAnnex = Boolean(report.attachedAnalyzerReport && report.attachedAnalyzerReport.attachedToOfficialPdf !== false);

  // Trigger system print
  const handlePrint = () => {
    window.print();
  };

  // Trigger PDF download
  const handleDownloadPdf = async () => {
    if (!printSheetRef.current) return;
    setIsExportingPdf(true);
    try {
      const filename = PdfReportService.getReportFilename(report);
      await PdfReportService.exportElementToPdf(printSheetRef.current, filename, {
        paperSize: paperSize
      });
    } catch (err) {
      console.error('Error exporting PDF from preview modal:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      
      {/* Top Action Toolbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-white z-20 shadow-md print:hidden">
        
        {/* Left: Title and Paper Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Previsualización de Impresión Física</span>
              </h2>
              <span className="bg-sky-950 text-sky-300 border border-sky-700/50 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                Simulador de Papel
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Simulación de hoja física, saltos de página y anclaje del pie de página oficial
            </p>
          </div>
        </div>

        {/* Center: Interactive Filters & Settings */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Paper Filter Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-2.5 py-1">
            <Palette className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            <span className="text-[11px] text-slate-300 font-semibold hidden sm:inline">Filtro CSS:</span>
            <select
              value={paperFilter}
              onChange={(e) => setPaperFilter(e.target.value as PaperFilterType)}
              className="bg-slate-900 text-slate-200 border-none text-[11px] font-medium py-0.5 px-1.5 rounded-lg focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="bond_laser">📄 Papel Bond Láser (Blanco Natural)</option>
              <option value="satin_color">✨ Papel Satinado / Alta Fidelidad</option>
              <option value="warm_light">💡 Luz Cálida de Inspección (3200K)</option>
              <option value="monochrome">🖨️ Monocromo (Tóner B&N)</option>
              <option value="none">🖥️ Sin Filtro (Digital Puro)</option>
            </select>
          </div>

          {/* Paper Size Selector */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-xl p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setPaperSize('letter')}
              className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                paperSize === 'letter' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Formato Carta estándar (8.5 x 11 pulgadas)"
            >
              Carta
            </button>
            <button
              type="button"
              onClick={() => setPaperSize('a4')}
              className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                paperSize === 'a4' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Formato internacional A4 (210 x 297 mm)"
            >
              A4
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-xl px-2 py-1 text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
              className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-slate-300 w-9 text-center font-bold">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
              className="text-slate-400 hover:text-white p-0.5 transition-colors cursor-pointer"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(85)}
              className="text-[10px] text-slate-400 hover:text-sky-300 ml-1 border-l border-slate-700 pl-1.5 cursor-pointer"
              title="Ajustar a 85%"
            >
              100%
            </button>
          </div>

          {/* Quick Toggles: Margins & Footer */}
          <div className="flex items-center gap-1.5 hidden md:flex">
            <label 
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                showPrintMargins 
                  ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
              title="Muestra las guías de márgenes de 8mm que respetan los rodillos de las impresoras"
            >
              <input
                type="checkbox"
                checked={showPrintMargins}
                onChange={(e) => setShowPrintMargins(e.target.checked)}
                className="hidden"
              />
              <span>📐 Guías de Margen</span>
            </label>

            <label 
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-colors ${
                pinFooterToBottom 
                  ? 'bg-teal-950/60 border-teal-600/50 text-teal-300' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}
              title="Anclar firmas y banner oficial en la base exacta de la hoja física"
            >
              <input
                type="checkbox"
                checked={pinFooterToBottom}
                onChange={(e) => setPinFooterToBottom(e.target.checked)}
                className="hidden"
              />
              <span>📌 Pie al Fondo</span>
            </label>
          </div>

        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-300 bg-teal-950/80 hover:bg-teal-900 border border-teal-700/60 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Generar y descargar documento PDF vectorial"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isExportingPdf ? 'Generando...' : 'Descargar PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all cursor-pointer shadow-sm shadow-teal-500/20"
            title="Enviar directamente a la impresora física o diálogo de impresión"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            <span>Imprimir Ahora</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
            title="Cerrar previsualización (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </header>

      {/* Sub-bar: Physics and Layout Inspection Notice */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 z-10 print:hidden">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Dimensiones de Hoja: {paperDimensions.label}</span>
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-300">
            {pinFooterToBottom 
              ? 'Pie de página anclado al margen inferior físico (0.31 pulg / 8 mm)' 
              : 'Pie de página en modo flujo continuo'
            }
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hasAnnex && (
            <span className="bg-purple-950/80 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
              <Scissors className="w-3 h-3 text-purple-400" />
              <span>Salto de Página Activo: 2 Hojas Físicas</span>
            </span>
          )}

          <span className="text-[10px] text-slate-400 font-mono">
            {report.reportNumber || 'INFORME OFICIAL'}
          </span>
        </div>
      </div>

      {/* Main Simulation Viewport (Inspection Table Backdrop) */}
      <main 
        className="flex-1 overflow-y-auto overflow-x-auto p-6 sm:p-10 flex flex-col items-center select-text relative print:p-0 print:overflow-visible print:bg-white"
        style={{
          backgroundColor: '#151b23',
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.08) 0%, transparent 70%),
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 20px 20px, 20px 20px'
        }}
      >
        
        {/* Printable Root Container with Scale */}
        <div 
          ref={printSheetRef}
          id="vaclinic-physical-print-stage"
          className="flex flex-col items-center gap-10 transition-transform origin-top duration-150 print:gap-0 print:transform-none"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            marginBottom: `${(zoomLevel / 100) * 80}px`
          }}
        >

          {/* ========================================================================= */}
          {/* HOJA FÍSICA 1: INFORME CLÍNICO OFICIAL DE RESULTADOS                      */}
          {/* ========================================================================= */}
          <section className="flex flex-col items-center print:w-full">
            
            {/* Sheet 1 Physical Badge & Cut Ruler */}
            <div className="w-full flex items-center justify-between mb-2 px-2 text-xs text-slate-400 font-mono print:hidden">
              <div className="flex items-center gap-2">
                <span className="bg-slate-800 text-sky-300 font-bold px-2 py-0.5 rounded-md border border-slate-700 text-[11px]">
                  Hoja Física 1 {hasAnnex ? 'de 2' : 'de 1'}
                </span>
                <span className="text-[11px] text-slate-400 font-sans">
                  Informe de Resultados y Conclusiones Diagnósticas
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-sans">
                Margen seguro: 8 mm • Calibrado para impresión
              </span>
            </div>

            {/* Simulated Physical Paper Sheet Container */}
            <div
              className="relative bg-[#fcfcfa] text-slate-900 rounded-[2px] transition-all print:shadow-none print:border-none print:w-full print:rounded-none"
              style={{
                width: paperDimensions.width,
                minHeight: pinFooterToBottom ? paperDimensions.minHeight : 'auto',
                filter: getFilterStyle(paperFilter),
                border: '1px solid rgba(0, 0, 0, 0.12)',
                boxShadow: `
                  0 1px 3px rgba(0,0,0,0.12),
                  0 8px 24px rgba(0,0,0,0.22),
                  0 20px 48px rgba(0,0,0,0.3)
                `,
                // Subtle tactile paper texture
                backgroundImage: 'radial-gradient(#000000 0.4px, transparent 0.4px)',
                backgroundSize: '12px 12px',
                backgroundBlendMode: 'soft-light'
              }}
            >
              
              {/* Optional Physical Surgical Staple / Clip in top-left */}
              {showPaperClips && (
                <div 
                  className="absolute top-3 left-4 w-7 h-1.5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 border border-slate-500 rounded-xs shadow-xs transform -rotate-45 pointer-events-none z-30 print:hidden"
                  title="Grapa metálica de archivo clínico"
                />
              )}

              {/* Optional 3-Ring Binder Punch Hole Marks (Physical inspection) */}
              <div className="absolute left-1.5 top-1/4 w-2 h-2 rounded-full border border-slate-300/60 bg-slate-200/40 pointer-events-none print:hidden" />
              <div className="absolute left-1.5 top-2/4 w-2 h-2 rounded-full border border-slate-300/60 bg-slate-200/40 pointer-events-none print:hidden" />
              <div className="absolute left-1.5 top-3/4 w-2 h-2 rounded-full border border-slate-300/60 bg-slate-200/40 pointer-events-none print:hidden" />

              {/* Non-Printable Hardware Margin Guide (Dotted Green/Sky boundary) */}
              {showPrintMargins && (
                <div 
                  className="absolute inset-[8mm] border border-dashed border-sky-400/40 pointer-events-none z-20 print:hidden rounded-xs"
                >
                  <div className="absolute top-1 left-1.5 text-[8px] font-mono text-sky-600/70 font-bold uppercase tracking-wider bg-white/80 px-1 rounded">
                    Límite Imprimible (8mm)
                  </div>
                  <div className="absolute bottom-1 right-1.5 text-[8px] font-mono text-sky-600/70 font-bold uppercase tracking-wider bg-white/80 px-1 rounded">
                    Base Imprimible (Rodillo)
                  </div>
                </div>
              )}

              {/* Real Official Report Sheet Component */}
              <div className={`w-full flex flex-col ${pinFooterToBottom ? 'h-full justify-between' : ''}`}>
                <VaclinicOfficialReportSheet
                  report={report}
                  watermark={labSettings.watermarkPreset}
                  includeAiExplanation={report.includeAiExplanationInReport !== false}
                  includeSignatures={true}
                  includeConclusions={report.includeConclusionsInReport !== false}
                  includeRecommendations={report.includeRecommendationsInReport !== false}
                  templateStyle="vaclinic"
                  customSettings={labSettings}
                  fitToSinglePage={true}
                  pinFooterToBottom={pinFooterToBottom}
                  hideAnnex={separateAnnexSheet && hasAnnex}
                  id="vaclinic-sheet-page-1"
                />
              </div>

              {/* Footer Alignment Guide Indicator */}
              {showPrintMargins && pinFooterToBottom && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-teal-900/90 text-teal-200 border border-teal-500/50 text-[9px] font-mono font-bold px-2 py-0.5 rounded shadow-xs pointer-events-none z-20 print:hidden flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-teal-300" />
                  <span>Posición del Pie de Página: Anclado en base de hoja física</span>
                </div>
              )}

            </div>
          </section>


          {/* ========================================================================= */}
          {/* SIMULADOR DE SALTO DE PÁGINA FÍSICO (PAGE BREAK DIVIDER)                 */}
          {/* ========================================================================= */}
          {hasAnnex && separateAnnexSheet && (
            <div className="w-full max-w-[850px] flex flex-col items-center my-2 print:break-before-page print:hidden">
              <div className="w-full flex items-center gap-3">
                <div className="flex-1 border-t-2 border-dashed border-rose-500/70" />
                <div className="bg-rose-950 text-rose-300 border border-rose-700/80 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                  <Scissors className="w-4 h-4 text-rose-400 transform -rotate-90" />
                  <span>SALTO DE PÁGINA FÍSICA (PAGE BREAK)</span>
                  <span className="text-[10px] text-rose-400/90 font-mono">✂️ Corte de Hoja 1 ➔ Expulsión de Papel</span>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-rose-500/70" />
              </div>
              <p className="text-[10.5px] text-slate-400 mt-1 italic text-center">
                La impresora alimenta una nueva hoja física para el anexo gráfico del analizador hematológico.
              </p>
            </div>
          )}


          {/* ========================================================================= */}
          {/* HOJA FÍSICA 2: ANEXO ESPECIALIZADO DEL ANALIZADOR HEMATOLÓGICO            */}
          {/* ========================================================================= */}
          {hasAnnex && separateAnnexSheet && (
            <section className="flex flex-col items-center print:w-full print:break-before-page">
              
              {/* Sheet 2 Badge */}
              <div className="w-full flex items-center justify-between mb-2 px-2 text-xs text-slate-400 font-mono print:hidden">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-900 text-purple-200 font-bold px-2 py-0.5 rounded-md border border-purple-700 text-[11px]">
                    Hoja Física 2 de 2
                  </span>
                  <span className="text-[11px] text-slate-300 font-sans">
                    Anexo Oficial: Registros Morfológicos y Gráficos del Analizador
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-sans">
                  {report.attachedAnalyzerReport?.model || 'Analizador Hematológico'}
                </span>
              </div>

              {/* Simulated Paper Sheet 2 Container */}
              <div
                className="relative bg-[#fcfcfa] text-slate-900 rounded-[2px] transition-all p-6 print:shadow-none print:border-none print:w-full print:rounded-none flex flex-col justify-between"
                style={{
                  width: paperDimensions.width,
                  minHeight: pinFooterToBottom ? paperDimensions.minHeight : 'auto',
                  filter: getFilterStyle(paperFilter),
                  border: '1px solid rgba(0, 0, 0, 0.12)',
                  boxShadow: `
                    0 1px 3px rgba(0,0,0,0.12),
                    0 8px 24px rgba(0,0,0,0.22),
                    0 20px 48px rgba(0,0,0,0.3)
                  `,
                  backgroundImage: 'radial-gradient(#000000 0.4px, transparent 0.4px)',
                  backgroundSize: '12px 12px',
                  backgroundBlendMode: 'soft-light'
                }}
              >
                
                {/* Non-Printable Margin Guide */}
                {showPrintMargins && (
                  <div 
                    className="absolute inset-[8mm] border border-dashed border-purple-400/40 pointer-events-none z-20 print:hidden rounded-xs"
                  />
                )}

                {/* Top of Sheet 2: Official Header for Annex */}
                <div className="border-b border-slate-200 pb-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#082133] text-white flex items-center justify-center font-bold text-xs">
                        VAC
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-[#082133] uppercase">
                          VAC CLINIC LABORATOIRE • ANEXO OFICIAL
                        </h3>
                        <p className="text-[10px] text-slate-500">
                          Documento Complementario • No. de Orden: {report.reportNumber}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-[10px]">
                      <span className="font-bold text-slate-800">Paciente: {report.patientName}</span>
                      <p className="text-slate-500 font-mono">ID: {report.patientNationalId}</p>
                    </div>
                  </div>
                </div>

                {/* Main Body of Sheet 2: Analyzer View */}
                <div className="flex-1">
                  <div className="mb-3 bg-purple-50 p-2.5 rounded-xl text-purple-950 text-xs flex items-center justify-between border border-purple-200 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <span className="font-bold uppercase tracking-wide text-[10.5px]">
                        Gráficas y Morfología Celular Automatizada: {report.attachedAnalyzerReport?.model}
                      </span>
                    </div>
                    <span className="text-[10px] text-purple-700 font-mono font-bold bg-white px-2 py-0.5 rounded border border-purple-200">
                      Muestra: {report.attachedAnalyzerReport?.sampleId}
                    </span>
                  </div>

                  {report.attachedAnalyzerReport && (
                    <OzelleCbcReportView
                      reportData={report.attachedAnalyzerReport}
                      compactMode={false}
                      readOnly={true}
                    />
                  )}
                </div>

                {/* Bottom of Sheet 2: Pinned Annex Footer */}
                <div className="mt-auto pt-4 border-t border-slate-200 text-[9px] text-slate-500 flex items-center justify-between">
                  <span>Validado por sistema automatizado con control de calidad ISO 15189</span>
                  <span className="font-mono font-bold text-slate-700">Página 2 de 2</span>
                </div>

              </div>
            </section>
          )}

        </div>

      </main>

      {/* Bottom Summary & Quick Controls Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 z-20 print:hidden">
        <div className="flex items-center gap-2 text-[11px]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            Simulación calibrada para impresoras láser de escritorio y de alta producción (Brother, HP LaserJet, Epson EcoTank).
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPaperFilter('bond_laser')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              paperFilter === 'bond_laser' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Bond Láser
          </button>

          <button
            type="button"
            onClick={() => setPaperFilter('satin_color')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              paperFilter === 'satin_color' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Satinado
          </button>

          <button
            type="button"
            onClick={() => setPaperFilter('monochrome')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              paperFilter === 'monochrome' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Tóner B&N
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-4 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </footer>

    </div>
  );
};
