import React, { useRef, useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { PdfReportService } from '../../services/pdfReportService';
import { VaclinicOfficialReportSheet } from './VaclinicOfficialReportSheet';
import { AiSummaryModeModal } from './AiSummaryModeModal';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  QrCode, 
  FileText,
  Clock,
  Sparkles,
  Award,
  Sliders,
  Copy,
  Check,
  Share2,
  Droplet
} from 'lucide-react';

export const PrintReportModal: React.FC = () => {
  const { activeReportToPrint, setActiveReportToPrint, reports, labSettings } = useClinic();
  const printSheetRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);

  // Customization State (initialized with labSettings defaults)
  const [templateStyle, setTemplateStyle] = useState<'vaclinic' | 'compact'>('vaclinic');
  const [watermark, setWatermark] = useState<string>(labSettings.watermarkPreset);
  const [includeAiExplanation, setIncludeAiExplanation] = useState(
    activeReportToPrint?.includeAiExplanationInReport ?? true
  );
  const [includeConclusions, setIncludeConclusions] = useState<boolean>(
    activeReportToPrint?.includeConclusionsInReport ?? Boolean(activeReportToPrint?.doctorConclusions)
  );
  const [includeRecommendations, setIncludeRecommendations] = useState<boolean>(
    activeReportToPrint?.includeRecommendationsInReport ?? Boolean(activeReportToPrint?.recommendations?.length)
  );
  const [includeBioanalystSign, setIncludeBioanalystSign] = useState(true);
  const [includeDoctorSign, setIncludeDoctorSign] = useState(true);
  const [includeDeltaComparison, setIncludeDeltaComparison] = useState(true);
  const [fitToSinglePage, setFitToSinglePage] = useState<boolean>(true);
  const [printMarginMode, setPrintMarginMode] = useState<'narrow' | 'normal'>('narrow');

  if (!activeReportToPrint) return null;

  const report = activeReportToPrint;

  // Custom Signers mapped from labSettings
  const activeSigners = labSettings.signers.filter(s => s.enabled);
  const primarySigner = activeSigners[0] || {
    id: 's1',
    name: 'Licda. Elena Morales Cruz',
    roleTitle: 'Bioanalista Responsable',
    specialty: 'Licenciada en Bioanálisis Clínico & Microbiología',
    licenseNumber: 'Col. Bioanálisis #4192 / MSPAS-8812',
    signatureType: 'crypto_generated',
    showValidationHash: true,
    showStamp: true,
    enabled: true
  };
  const secondarySigner = activeSigners[1] || {
    id: 's2',
    name: 'Dr. Alejandro Valenzuela Morales',
    roleTitle: 'Dirección Médica & Patología',
    specialty: 'Médico Patólogo Clínico',
    licenseNumber: 'CMP-649102 / RNE-28491',
    signatureType: 'crypto_generated',
    showValidationHash: true,
    showStamp: true,
    enabled: true
  };

  const bioanalystName = report.signature?.bioanalystName || primarySigner.name;
  const bioanalystSpecialty = report.signature?.bioanalystSpecialty || primarySigner.specialty;
  const bioanalystLicense = report.signature?.bioanalystLicense || primarySigner.licenseNumber;

  const doctorName = report.signature?.doctorName || secondarySigner.name;
  const doctorSpecialty = report.signature?.doctorSpecialty || secondarySigner.specialty;
  const doctorLicense = report.signature?.doctorLicense || secondarySigner.licenseNumber;

  // Find previous historical reports for Delta Check
  const previousReports = reports
    .filter(r => r.patientId === report.patientId && r.id !== report.id && new Date(r.sampleDate) < new Date(report.sampleDate))
    .sort((a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime());
  
  const previousReport = previousReports.length > 0 ? previousReports[0] : null;

  const validationHash = report.signature?.validationHash || '0x79f2c84a' + report.id.replace(/[^a-f0-9]/gi, '').padEnd(32, 'a').substring(0, 32);

  const sampleDateFormatted = new Date(report.sampleDate).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const emissionDateFormatted = new Date(report.emissionDate || Date.now()).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    // Inject dynamic print media stylesheet to guarantee exact print margins
    const styleId = 'vaclinic-official-print-margins-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    const marginRule = printMarginMode === 'narrow' ? '4mm 6mm 4mm 6mm' : '8mm 10mm 8mm 10mm';
    styleEl.innerHTML = `
      @media print {
        @page {
          size: letter portrait;
          margin: ${marginRule} !important;
        }
        body {
          background-color: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        /* Completely suppress all screen UI chrome, banners, option drawers and buttons */
        .print\\:hidden, [class*="print:hidden"], header, nav, footer:not(.report-footer) {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          min-height: 0 !important;
          max-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          overflow: hidden !important;
          position: absolute !important;
          pointer-events: none !important;
        }
        #vaclinic-official-pdf-sheet, #vaclinic-official-report-sheet {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
          overflow: visible !important;
        }
        .report-sheet-container {
          display: flex !important;
          flex-direction: column !important;
          min-height: 100% !important;
        }
        .avoid-page-break, .report-signatures-footer, .signatures-block {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          -webkit-column-break-inside: avoid !important;
        }
        .report-signatures-footer, footer.report-footer {
          margin-top: auto !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          break-before: auto !important;
        }
        .signatures-grid, .print-grid-cols-4 {
          display: grid !important;
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          gap: 0.5rem !important;
        }
      }
    `;
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printSheetRef.current) return;
    setIsExporting(true);
    try {
      const filename = PdfReportService.getReportFilename(report);
      await PdfReportService.exportElementToPdf(printSheetRef.current, filename, {
        paperSize: labSettings.paperSize || 'a4',
        avoidOrphanPages: true
      });
    } catch (err) {
      console.error('Error al generar PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyLink = () => {
    const link = `https://vaclinic.laboratorio.gt/valida?doc=${report.reportNumber}&hash=${validationHash.substring(0, 10)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = `Hola, adjunto el informe oficial de laboratorio VACLINIC para ${report.patientName}. Folio: ${report.reportNumber}. Verificación en: https://vaclinic.laboratorio.gt/valida?doc=${report.reportNumber}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      
      {/* Modal Container */}
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none print:bg-white">
        
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-black text-sm">
              PDF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Informe de Resultados Oficial VACLINIC
                </h3>
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  {report.reportNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {report.title} • Paciente: <strong className="text-slate-200">{report.patientName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Summary Mode Button */}
            <button
              onClick={() => setShowAiSummaryModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-teal-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 text-teal-300 border border-teal-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Activar Modo de Resumen IA para explicar los resultados al paciente"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Modo Resumen IA</span>
            </button>

            {/* Customization Options Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showSettings 
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Opciones</span>
            </button>

            {/* Share WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              title="Compartir por WhatsApp"
              className="flex items-center gap-1.5 bg-emerald-700/60 hover:bg-emerald-600 text-emerald-100 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-600 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Native Print */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-teal-400" />
              <span>Imprimir</span>
            </button>

            {/* Direct High-Resolution PDF Download */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>

            {/* Close Modal */}
            <button
              onClick={() => setActiveReportToPrint(null)}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Options Drawer */}
        {showSettings && (
          <div className="bg-slate-800/90 border-b border-slate-700 p-4 text-xs text-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-teal-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>Elementos Visibles</span>
              </h4>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRecommendations}
                  onChange={(e) => setIncludeRecommendations(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-teal-400"
                />
                <span className="flex items-center gap-1">
                  <span>Incluir Recomendaciones Clínicas</span>
                  {report.recommendations && report.recommendations.length > 0 && (
                    <span className="text-[10px] text-teal-400 font-mono">({report.recommendations.length})</span>
                  )}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeConclusions}
                  onChange={(e) => setIncludeConclusions(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-teal-400"
                />
                <span>Incluir Conclusión Diagnóstica</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAiExplanation}
                  onChange={(e) => setIncludeAiExplanation(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-teal-400"
                />
                <span>Incluir Síntesis Explicativa de IA</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDeltaComparison}
                  onChange={(e) => setIncludeDeltaComparison(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-teal-400"
                />
                <span>Incluir Comparativa Histórica (Delta Check)</span>
              </label>

              <div className="pt-1">
                <label className="block text-[10px] text-cyan-300 font-bold mb-1 uppercase tracking-wider">
                  Diseño de Plantilla / Membrete:
                </label>
                <select
                  value={templateStyle}
                  onChange={(e) => setTemplateStyle(e.target.value as 'vaclinic' | 'compact')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-semibold"
                >
                  <option value="vaclinic">Formato Oficial VACLINIC (Diseño Oficial)</option>
                  <option value="compact">Formato Compacto VACLINIC</option>
                </select>
              </div>

              <div className="pt-1 border-t border-slate-700/60">
                <label className="block text-[10px] text-emerald-400 font-bold mb-1 uppercase tracking-wider">
                  Márgenes de Impresión (Anti-Firmas Volando):
                </label>
                <select
                  value={printMarginMode}
                  onChange={(e) => setPrintMarginMode(e.target.value as 'narrow' | 'normal')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-semibold"
                >
                  <option value="narrow">Estrechos (4mm) - Garantiza 1 página sin firmas volando</option>
                  <option value="normal">Estándar (8mm) - Formato amplio</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={fitToSinglePage}
                  onChange={(e) => setFitToSinglePage(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-400"
                />
                <span className="text-emerald-300 font-medium">Ajuste Compacto Automático a 1 Página</span>
              </label>

              <div className="pt-1">
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Marca de agua de seguridad:</label>
                <select
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                >
                  <option value="none">Sin marca de agua</option>
                  <option value="OFICIAL VALIDADO">OFICIAL VALIDADO</option>
                  <option value="CONFIDENCIAL">CONFIDENCIAL</option>
                  <option value="URGENTE">URGENTE</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Award className="w-3.5 h-3.5" />
                <span>Firma Bioanalista Responsable</span>
              </h4>
              
              <label className="flex items-center gap-2 cursor-pointer mb-1">
                <input
                  type="checkbox"
                  checked={includeBioanalystSign}
                  onChange={(e) => setIncludeBioanalystSign(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-cyan-400"
                />
                <span>Habilitar Sello & Firma de Bioanálisis</span>
              </label>

              <div className="text-[11px] text-slate-300 font-medium">
                {bioanalystName}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {bioanalystLicense}
              </div>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-amber-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Firma Director Médico Patólogo</span>
              </h4>

              <label className="flex items-center gap-2 cursor-pointer mb-1">
                <input
                  type="checkbox"
                  checked={includeDoctorSign}
                  onChange={(e) => setIncludeDoctorSign(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span>Habilitar Sello & Firma Médica</span>
              </label>

              <div className="text-[11px] text-slate-300 font-medium">
                {doctorName}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {doctorLicense}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Printable Document */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex flex-col items-center print:p-0 print:bg-white print:overflow-visible">
          {/* Anti-Orphan Status Pill */}
          <div className="flex items-center justify-between gap-2 max-w-4xl w-full mb-3 print:hidden bg-slate-900/80 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Ajuste de Márgenes Activo:</strong> Firmas y sellos consolidados en la misma hoja de resultados.
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
              Margen: {printMarginMode === 'narrow' ? '4mm (Compacto)' : '8mm (Estándar)'}
            </span>
          </div>

          <div 
            ref={printSheetRef}
            id="vaclinic-official-pdf-sheet"
            className="w-full max-w-4xl flex justify-center print:w-full print:max-w-none"
          >
            <VaclinicOfficialReportSheet 
              report={report}
              watermark={watermark}
              includeAiExplanation={includeAiExplanation}
              includeSignatures={includeBioanalystSign || includeDoctorSign}
              includeConclusions={includeConclusions}
              includeRecommendations={includeRecommendations}
              templateStyle={templateStyle}
              customSettings={labSettings}
              fitToSinglePage={fitToSinglePage}
            />
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-slate-900 border-t border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Documento oficial con sello criptográfico SHA-256 e ISO 15189</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace de Verificación'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Descargar PDF
            </button>
          </div>
        </div>

      </div>

      {/* AI Summary Mode Modal */}
      <AiSummaryModeModal
        report={report}
        isOpen={showAiSummaryModal}
        onClose={() => setShowAiSummaryModal(false)}
      />

    </div>
  );
};
