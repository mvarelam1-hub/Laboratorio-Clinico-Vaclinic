import { firmantesPorDefecto } from '../../utils/firmantes';
import React, { useState, useRef } from 'react';
import { MedicalReport } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { PdfReportService } from '../../services/pdfReportService';
import { VaclinicOfficialReportSheet } from '../common/VaclinicOfficialReportSheet';
import { VistaPdfOficial } from '../common/VistaPdfOficial';
import { buildVerificationUrl, formatVerificationCode } from '../../services/verificacionInforme';
import { descargarInformePdfOficial, InformesApiError } from '../../services/informesApiService';
import { tienePdfOficial, descargarPdfOficial, abrirPdfOficial } from '../../services/pdfOficial';
import { LabSettings } from '../../types/labSettings';
import { 
  X, 
  Download, 
  Printer, 
  ShieldCheck, 
  Check, 
  Copy,
  Sliders,
  FileText,
  Award,
  SlidersHorizontal,
  Save,
  Layers,
  Sparkles
} from 'lucide-react';

interface PdfExportModalProps {
  report: MedicalReport | null;
  isOpen: boolean;
  onClose: () => void;
  defaultBioanalyst?: {
    name: string;
    specialty: string;
    license: string;
  };
  defaultDoctor?: {
    name: string;
    specialty: string;
    license: string;
  };
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  report,
  isOpen,
  onClose,
  defaultBioanalyst,
  defaultDoctor
}) => {
  const { labSettings, updateLabSettings, showNotification, currentStaffUser, orders } = useClinic();
  const firmantesIniciales = firmantesPorDefecto(labSettings, currentStaffUser);
  const bioInicial = defaultBioanalyst ?? firmantesIniciales.bioanalista;
  const medicoInicial = defaultDoctor ?? firmantesIniciales.medico;
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Export & customization settings
  const [templateStyle, setTemplateStyle] = useState<'vaclinic' | 'compact'>('vaclinic');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [falloPdfOficial, setFalloPdfOficial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'margins' | 'content'>('margins');

  // Dynamic Margins & Layout Settings (Live in Modal) - Optimized to keep signatures from orphan breaks
  const [marginTopMm, setMarginTopMm] = useState<number>(labSettings.marginTopMm ?? 6);
  const [marginBottomMm, setMarginBottomMm] = useState<number>(labSettings.marginBottomMm ?? 6);
  const [marginLeftMm, setMarginLeftMm] = useState<number>(labSettings.marginLeftMm ?? 8);
  const [marginRightMm, setMarginRightMm] = useState<number>(labSettings.marginRightMm ?? 8);
  const [tableDensity, setTableDensity] = useState<'compact' | 'standard' | 'spacious'>(labSettings.tableDensity || 'compact');
  const [paperFormat, setPaperFormat] = useState<'a4' | 'letter' | 'legal'>(labSettings.paperSize || 'letter');
  const [avoidOrphans, setAvoidOrphans] = useState(true);
  const [savedSettingsFeedback, setSavedSettingsFeedback] = useState(false);

  // Content options
  const [includeAiExplanation, setIncludeAiExplanation] = useState(
    report?.includeAiExplanationInReport ?? false
  );
  const [includeConclusions, setIncludeConclusions] = useState<boolean>(
    report?.includeConclusionsInReport ?? Boolean(report?.doctorConclusions)
  );
  const [includeRecommendations, setIncludeRecommendations] = useState<boolean>(
    report?.includeRecommendationsInReport ?? Boolean(report?.recommendations?.length)
  );
  const [includeBioanalystSign, setIncludeBioanalystSign] = useState(true);
  const [includeDoctorSign, setIncludeDoctorSign] = useState(true);
  const [includeAttachedAnalyzer, setIncludeAttachedAnalyzer] = useState(true);
  const [watermark, setWatermark] = useState<'none' | 'OFICIAL VALIDADO' | 'CONFIDENCIAL' | 'URGENTE'>('none');
  
  // Signatures data
  const [bioanalystName, setBioanalystName] = useState(bioInicial.name);
  const [bioanalystSpecialty, setBioanalystSpecialty] = useState(bioInicial.specialty);
  const [bioanalystLicense, setBioanalystLicense] = useState(bioInicial.license);

  const [doctorName, setDoctorName] = useState(report?.signature?.doctorName || medicoInicial.name);
  const [doctorSpecialty, setDoctorSpecialty] = useState(report?.signature?.doctorSpecialty || medicoInicial.specialty);
  const [doctorLicense, setDoctorLicense] = useState(report?.signature?.doctorLicense || medicoInicial.license);

  const [copiedLink, setCopiedLink] = useState(false);
  const [isOfficialPdfLoading, setIsOfficialPdfLoading] = useState(false);

  if (!isOpen || !report) return null;

  // Sello del SERVIDOR (migración 0019). Sin sello no hay enlace verificable y
  // tampoco se inventa un hash: el informe sigue imprimible, solo que sin QR.
  const verificationUrl = buildVerificationUrl(report);
  const validationHash = report.verificationHash || report.signature?.validationHash || '';

  // Quick margin preset handler
  const applyPreset = (preset: 'estrecho' | 'estandar' | 'oficial') => {
    if (preset === 'estrecho') {
      setMarginTopMm(8);
      setMarginBottomMm(8);
      setMarginLeftMm(8);
      setMarginRightMm(8);
      setTableDensity('compact');
    } else if (preset === 'estandar') {
      setMarginTopMm(12);
      setMarginBottomMm(12);
      setMarginLeftMm(12);
      setMarginRightMm(12);
      setTableDensity('standard');
    } else if (preset === 'oficial') {
      setMarginTopMm(16);
      setMarginBottomMm(16);
      setMarginLeftMm(15);
      setMarginRightMm(15);
      setTableDensity('spacious');
    }
  };

  // Save current modal margins as permanent lab default
  const handleSaveAsLabDefault = () => {
    updateLabSettings({
      marginTopMm,
      marginBottomMm,
      marginLeftMm,
      marginRightMm,
      tableDensity,
      paperSize: paperFormat,
      reportTemplateStyle: templateStyle
    });
    setSavedSettingsFeedback(true);
    setTimeout(() => setSavedSettingsFeedback(false), 2500);
  };

  // Trigger PDF file download via html2canvas and jsPDF
  const numeroOrden = report.orderId ? orders.find((o) => o.id === report.orderId)?.orderNumber : undefined;

  // UN solo formato: si el informe está en el servidor, se descarga e imprime el PDF oficial.
  // Un informe que todavía no está en el servidor no tiene PDF oficial: se avisa en lugar de imprimir la copia local sin decir nada.
  const avisoCopiaLocal = () =>
    showNotification('Este informe aún no está en el servidor: se usa la copia local, que no es el PDF oficial. Publícalo o sincroniza para obtener el oficial.', 'warning');

  const conPdfOficial = async (accion: () => Promise<void>) => {
    setIsGeneratingPdf(true);
    try {
      await accion();
    } catch (err) {
      showNotification(
        err instanceof InformesApiError ? err.message : 'No se pudo obtener el PDF oficial. Revisa tu conexión e inténtalo de nuevo.',
        'warning'
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (tienePdfOficial(report)) {
      await conPdfOficial(() => descargarPdfOficial(report, numeroOrden));
      return;
    }
    avisoCopiaLocal();
    if (!printAreaRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const filename = PdfReportService.getReportFilename(report);
      await PdfReportService.exportElementToPdf(printAreaRef.current, filename, {
        paperSize: paperFormat,
        avoidOrphanPages: avoidOrphans
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Trigger browser print
  const handleNativePrint = () => {
    if (tienePdfOficial(report)) {
      void conPdfOficial(() => abrirPdfOficial(report, numeroOrden));
      return;
    }
    avisoCopiaLocal();
    window.print();
  };

  // PDF oficial del SERVIDOR (migración 0019): vectorial, con firmantes reales
  // y QR verificable. Es el documento que debe entregarse; la vista de arriba
  // es la maqueta de impresión del navegador.
  const handleOfficialPdf = async () => {
    if (!report.remoteId) return;
    setIsOfficialPdfLoading(true);
    try {
      const blob = await descargarInformePdfOficial(report.remoteId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe-${report.reportNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      showNotification(
        err instanceof InformesApiError ? err.message : 'No se pudo generar el PDF oficial. Revisa tu conexión.',
        'warning'
      );
    } finally {
      setIsOfficialPdfLoading(false);
    }
  };

  // Copy verification link
  const handleCopyLink = () => {
    if (!verificationUrl) return;
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Computed lab settings with current interactive margin overrides
  const activeLabSettings: LabSettings = {
    ...labSettings,
    marginTopMm,
    marginBottomMm,
    marginLeftMm,
    marginRightMm,
    tableDensity,
    paperSize: paperFormat,
    reportTemplateStyle: templateStyle
  };

  // Prepare custom report copy if doctor/bioanalyst changed in settings
  const customizedReport: MedicalReport = {
    ...report,
    attachedAnalyzerReport: (includeAttachedAnalyzer && report.attachedAnalyzerReport) ? report.attachedAnalyzerReport : undefined,
    signature: {
      ...report.signature,
      doctorName: doctorName || report.signature?.doctorName || medicoInicial.name,
      doctorSpecialty: doctorSpecialty || report.signature?.doctorSpecialty || medicoInicial.specialty,
      doctorLicense: doctorLicense || report.signature?.doctorLicense || medicoInicial.license,
      validationHash: validationHash
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none print:bg-white">
        
        {/* Top Controls Toolbar (Hidden during browser print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-black">
              PDF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Exportar Informe Médico Oficial con Membrete
                </h3>
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  {report.reportNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Membrete Oficial VACLINIC • Firma digitalizada • Código QR y validación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Customization Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showSettings 
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Personalizar firmas, sellos y contenido del PDF"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Opciones y Firmas</span>
            </button>

            {/* Direct Vector Print Button */}
            <button
              onClick={handleNativePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="Impresión vectorial del navegador"
            >
              <Printer className="w-3.5 h-3.5 text-teal-400" />
              <span>Imprimir</span>
            </button>

            {/* Direct PDF Download Button */}
            {report.remoteId && (
              <button
                onClick={handleOfficialPdf}
                disabled={isOfficialPdfLoading}
                title="PDF generado por el servidor con firmantes reales y código QR verificable"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isOfficialPdfLoading ? 'Generando…' : 'PDF oficial (servidor)'}
              </button>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar Archivo PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Customization Drawer / Settings Box */}
        {showSettings && (
          <div className="bg-slate-800/95 border-b border-slate-700 p-4 text-xs text-slate-200 print:hidden animate-fadeIn">
            {/* Drawer Sub-tabs */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-700 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDrawerTab('margins')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    drawerTab === 'margins'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 border border-transparent'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Márgenes, Densidad & Paginación</span>
                </button>

                <button
                  onClick={() => setDrawerTab('content')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    drawerTab === 'content'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 border border-transparent'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Estructura, Contenido & Firmas</span>
                </button>
              </div>

              {/* Lab Default Quick Save */}
              <button
                onClick={handleSaveAsLabDefault}
                className="flex items-center gap-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer"
                title="Guardar los márgenes y densidad actuales como predeterminados del laboratorio"
              >
                {savedSettingsFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">¡Guardado para todo el laboratorio!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Guardar como Predeterminado</span>
                  </>
                )}
              </button>
            </div>

            {drawerTab === 'margins' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Col 1: Presets & Paper */}
                <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
                  <h4 className="font-bold text-teal-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Presets de Márgenes Rápidos</span>
                  </h4>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => applyPreset('estrecho')}
                      className="p-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-left transition-all cursor-pointer"
                    >
                      <span className="block font-bold text-teal-300 text-xs">Estrecho</span>
                      <span className="block text-[10px] text-slate-400 font-mono">8 mm</span>
                      <span className="block text-[9px] text-slate-500 mt-0.5">Evita 3ª página</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('estandar')}
                      className="p-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-left transition-all cursor-pointer"
                    >
                      <span className="block font-bold text-cyan-300 text-xs">Estándar</span>
                      <span className="block text-[10px] text-slate-400 font-mono">12 mm</span>
                      <span className="block text-[9px] text-slate-500 mt-0.5">ISO 15189</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('oficial')}
                      className="p-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-left transition-all cursor-pointer"
                    >
                      <span className="block font-bold text-purple-300 text-xs">Amplio</span>
                      <span className="block text-[10px] text-slate-400 font-mono">16 mm</span>
                      <span className="block text-[9px] text-slate-500 mt-0.5">Membrete alto</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                      Tamaño de Hoja de Papel:
                    </label>
                    <select
                      value={paperFormat}
                      onChange={(e) => setPaperFormat(e.target.value as 'a4' | 'letter' | 'legal')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold"
                    >
                      <option value="a4">A4 (210 x 297 mm)</option>
                      <option value="letter">Carta / Letter (216 x 279 mm)</option>
                      <option value="legal">Oficio / Legal (216 x 356 mm)</option>
                    </select>
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer bg-teal-950/20 p-2 rounded-lg border border-teal-800/40">
                    <input
                      type="checkbox"
                      checked={avoidOrphans}
                      onChange={(e) => setAvoidOrphans(e.target.checked)}
                      className="mt-0.5 rounded text-teal-500 focus:ring-teal-400"
                    />
                    <div>
                      <span className="text-teal-200 font-bold text-[11px] block">
                        Anti-páginas huérfanas
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Si sobra un margen residual menor a 2.5cm, lo ajusta para no crear una 3ª hoja casi vacía.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Col 2: Millimeter Sliders */}
                <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
                  <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Ajuste Milimétrico de Márgenes</span>
                  </h4>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Margen Superior (Top):</span>
                        <span className="font-mono font-bold text-cyan-300">{marginTopMm} mm</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="40"
                        step="1"
                        value={marginTopMm}
                        onChange={(e) => setMarginTopMm(Number(e.target.value))}
                        className="w-full accent-cyan-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Margen Inferior (Bottom):</span>
                        <span className="font-mono font-bold text-cyan-300">{marginBottomMm} mm</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="35"
                        step="1"
                        value={marginBottomMm}
                        onChange={(e) => setMarginBottomMm(Number(e.target.value))}
                        className="w-full accent-cyan-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Margen Lateral Izquierdo:</span>
                        <span className="font-mono font-bold text-cyan-300">{marginLeftMm} mm</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="30"
                        step="1"
                        value={marginLeftMm}
                        onChange={(e) => setMarginLeftMm(Number(e.target.value))}
                        className="w-full accent-cyan-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Margen Lateral Derecho:</span>
                        <span className="font-mono font-bold text-cyan-300">{marginRightMm} mm</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="30"
                        step="1"
                        value={marginRightMm}
                        onChange={(e) => setMarginRightMm(Number(e.target.value))}
                        className="w-full accent-cyan-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Col 3: Table Density & Template Style */}
                <div className="space-y-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
                  <h4 className="font-bold text-amber-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Densidad de Pruebas & Formato</span>
                  </h4>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1">
                      Espaciado / Densidad de Filas:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTableDensity('compact')}
                        className={`py-2 px-1.5 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                          tableDensity === 'compact'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        Compacta
                      </button>
                      <button
                        type="button"
                        onClick={() => setTableDensity('standard')}
                        className={`py-2 px-1.5 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                          tableDensity === 'standard'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        Estándar
                      </button>
                      <button
                        type="button"
                        onClick={() => setTableDensity('spacious')}
                        className={`py-2 px-1.5 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                          tableDensity === 'spacious'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        Espaciosa
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {tableDensity === 'compact' 
                        ? 'Permite albergar hasta 25-30 parámetros sin saltos de página innecesarios.'
                        : tableDensity === 'standard'
                        ? 'Equilibrio estético tradicional para exámenes con 10-18 parámetros.'
                        : 'Máxima separación para informes breves de 1 a 6 parámetros.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <label className="block text-[10px] text-cyan-300 font-bold mb-1 uppercase tracking-wider">
                      Diseño de Plantilla:
                    </label>
                    <select
                      value={templateStyle}
                      onChange={(e) => setTemplateStyle(e.target.value as 'vaclinic' | 'compact')}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold"
                    >
                      <option value="vaclinic">Formato Oficial VACLINIC (Diseño Oficial)</option>
                      <option value="compact">Formato Compacto VACLINIC</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1: Elements to Include */}
                <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <h4 className="font-bold text-teal-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Estructura del Documento</span>
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
                    <span>Incluir Resumen Explicativo de IA</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBioanalystSign}
                      onChange={(e) => setIncludeBioanalystSign(e.target.checked)}
                      className="rounded text-teal-500 focus:ring-teal-400"
                    />
                    <span>Firma de Bioanalista Responsable</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDoctorSign}
                      onChange={(e) => setIncludeDoctorSign(e.target.checked)}
                      className="rounded text-teal-500 focus:ring-teal-400"
                    />
                    <span>Firma de Médico / Director Técnico</span>
                  </label>

                  {report.attachedAnalyzerReport && (
                    <label className="flex items-center gap-2 cursor-pointer bg-violet-950/40 p-2 rounded-lg border border-violet-700/50 mt-1">
                      <input
                        type="checkbox"
                        checked={includeAttachedAnalyzer}
                        onChange={(e) => setIncludeAttachedAnalyzer(e.target.checked)}
                        className="rounded text-violet-500 focus:ring-violet-400"
                      />
                      <span className="text-violet-200 font-bold text-[11px]">
                        Incluir Anexo Ozelle (Histogramas + Morfología)
                      </span>
                    </label>
                  )}

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
                      <option value="URGENTE">VALOR DE ALERTA</option>
                    </select>
                  </div>
                </div>

                {/* Column 2: Bioanalyst Signature Customization */}
                <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <Award className="w-3.5 h-3.5" />
                    <span>Bioanalista Clínico</span>
                  </h4>

                  <div>
                    <label className="block text-[10px] text-slate-400">Nombre del Bioanalista:</label>
                    <input
                      type="text"
                      value={bioanalystName}
                      onChange={(e) => setBioanalystName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400">Título / Especialidad:</label>
                    <input
                      type="text"
                      value={bioanalystSpecialty}
                      onChange={(e) => setBioanalystSpecialty(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400">Colegiado / Matrícula Sanitaria:</label>
                    <input
                      type="text"
                      value={bioanalystLicense}
                      onChange={(e) => setBioanalystLicense(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-cyan-300"
                    />
                  </div>
                </div>

                {/* Column 3: Doctor Signature Customization */}
                <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
                  <h4 className="font-bold text-amber-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Director Médico / Patólogo</span>
                  </h4>

                  <div>
                    <label className="block text-[10px] text-slate-400">Médico Patólogo:</label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400">Especialidad:</label>
                    <input
                      type="text"
                      value={doctorSpecialty}
                      onChange={(e) => setDoctorSpecialty(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400">Cédula / Registro CMP:</label>
                    <input
                      type="text"
                      value={doctorLicense}
                      onChange={(e) => setDoctorLicense(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-amber-300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Printable Document Area */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          <div 
            ref={printAreaRef}
            id="vaclinic-official-pdf-sheet"
            className="w-full max-w-4xl flex justify-center print:w-full print:max-w-none"
          >
            {tienePdfOficial(report) && !falloPdfOficial ? (
              <VistaPdfOficial
                key={report.remoteId}
                idInforme={report.remoteId as number}
                alFallar={() => setFalloPdfOficial(true)}
              />
            ) : (
            <VaclinicOfficialReportSheet 
              report={customizedReport}
              watermark={watermark}
              includeAiExplanation={includeAiExplanation}
              includeSignatures={includeBioanalystSign || includeDoctorSign}
              includeConclusions={includeConclusions}
              includeRecommendations={includeRecommendations}
              templateStyle={templateStyle}
              customSettings={activeLabSettings}
            />
            )}
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-slate-900 border-t border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              {verificationUrl
                ? `Sellado por el servidor · Código ${formatVerificationCode(report.verificationCode)}`
                : 'Sin sello de verificación del servidor (se emite al publicar el informe)'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              disabled={!verificationUrl}
              title={verificationUrl ? undefined : 'Este informe aún no tiene sello de verificación del servidor.'}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace de Verificación'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Descargar PDF
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
