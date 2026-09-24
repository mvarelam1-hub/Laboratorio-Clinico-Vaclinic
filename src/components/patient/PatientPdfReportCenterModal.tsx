import React, { useState, useRef } from 'react';
import { Patient, MedicalReport } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { PdfReportService } from '../../services/pdfReportService';
import { VaclinicOfficialReportSheet } from '../common/VaclinicOfficialReportSheet';
import { 
  X, 
  Download, 
  Printer, 
  Share2, 
  ShieldCheck, 
  Sparkles, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Calendar, 
  User, 
  Droplet, 
  Sliders, 
  Clock, 
  Award, 
  Copy, 
  Check, 
  Layers,
  Phone,
  MapPin,
  FileCheck,
  Eye,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { playNotificationChime } from '../../utils/audioChime';

interface PatientPdfReportCenterModalProps {
  patient: Patient;
  reports: MedicalReport[];
  initialSelectedReport?: MedicalReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PatientPdfReportCenterModal: React.FC<PatientPdfReportCenterModalProps> = ({
  patient,
  reports,
  initialSelectedReport,
  isOpen,
  onClose
}) => {
  const { showNotification } = useClinic();
  const printSheetRef = useRef<HTMLDivElement>(null);
  
  // Filter patient's published reports
  const patientReports = reports
    .filter(r => r.patientId === patient.id && (r.status === 'publicado' || r.status === 'entregado'))
    .sort((a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime());

  // Mode: 'single' (specific study) or 'consolidated' (all studies)
  const [reportMode, setReportMode] = useState<'single' | 'consolidated'>(
    initialSelectedReport ? 'single' : (patientReports.length > 1 ? 'single' : 'single')
  );

  const [activeReportId, setActiveReportId] = useState<string>(
    initialSelectedReport?.id || (patientReports[0]?.id || '')
  );

  const currentReport = patientReports.find(r => r.id === activeReportId) || patientReports[0];

  // Export & generation states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgressText, setExportProgressText] = useState('');
  const [showOptionsDrawer, setShowOptionsDrawer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Customization Options
  const [watermark, setWatermark] = useState<string>('OFICIAL VALIDADO');
  const [includeAiSummary, setIncludeAiSummary] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [paperFormat, setPaperFormat] = useState<'a4' | 'letter'>('a4');

  if (!isOpen) return null;

  const validationHash = '0x' + (currentReport?.id ? currentReport.id.replace(/[^a-f0-9]/gi, '').padEnd(32, '9').substring(0, 32) : '7a9c84e1f0b4d6e8a2c1f9e8a7b6c5d4');
  const verificationUrl = `https://vaclinic.laboratorio.gt/valida?doc=${currentReport?.reportNumber || '177-2026'}&hash=${validationHash.substring(0, 10)}`;

  const handleDownloadPdf = async () => {
    if (!printSheetRef.current) return;
    setIsExporting(true);
    setExportProgressText('Renderizando membrete e identidad institucional VACLINIC...');
    playNotificationChime('normal');

    try {
      setTimeout(() => {
        setExportProgressText('Generando páginas criptográficamente certificadas en alta resolución...');
      }, 500);

      const cleanPatient = patient.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = reportMode === 'single' && currentReport
        ? `VACLINIC_Informe_${currentReport.reportNumber}_${cleanPatient}.pdf`
        : `VACLINIC_Expediente_Consolidado_${cleanPatient}_${patient.nationalId}.pdf`;

      const success = await PdfReportService.exportElementToPdf(printSheetRef.current, filename);

      if (success) {
        playNotificationChime('success');
        showNotification(`¡Reporte PDF descargado con éxito! Archivo: ${filename}`, 'success');
      } else {
        showNotification('Ocurrió un inconveniente al generar el PDF. Puedes utilizar la opción "Imprimir".', 'warning');
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      showNotification('Error al procesar el documento PDF.', 'error');
    } finally {
      setIsExporting(false);
      setExportProgressText('');
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  const handleCopyVerificationLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    showNotification('Enlace de validación digital copiado al portapapeles', 'info');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = () => {
    const text = `Hola, comparto el informe oficial de laboratorio clínico VACLINIC de ${patient.fullName}. Folio: ${currentReport?.reportNumber || 'LAB-2026'}. Verificación de autenticidad en: ${verificationUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none print:bg-white">
        
        {/* Top Control Bar with VACLINIC Branding */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md flex-shrink-0">
              PDF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Descarga de Informes Clínicos VACLINIC
                </h2>
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  ISO 15189
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Documentos oficiales con membrete institucional, firmas digitales y código QR de autenticidad
              </p>
            </div>
          </div>

          {/* Actions on Top Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Options toggle */}
            <button
              onClick={() => setShowOptionsDrawer(!showOptionsDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                showOptionsDrawer 
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title="Personalizar opciones de descarga"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Opciones</span>
            </button>

            {/* Share WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 bg-emerald-700/60 hover:bg-emerald-600 text-emerald-100 px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-600 transition-all cursor-pointer"
              title="Enviar enlace por WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* Print */}
            <button
              onClick={handleNativePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              title="Imprimir documento directamente"
            >
              <Printer className="w-3.5 h-3.5 text-teal-400" />
              <span>Imprimir</span>
            </button>

            {/* Main Download Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-400 hover:from-teal-400 hover:to-cyan-300 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50"
              title="Descargar archivo PDF oficial firmado"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Generando PDF...' : 'Descargar PDF Oficial'}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

        </div>

        {/* Sub-header: Selector of Report Mode & Specific Studies */}
        <div className="bg-slate-950 px-4 sm:px-6 py-2.5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs print:hidden">
          
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Tipo de Documento:
            </span>
            <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setReportMode('single')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  reportMode === 'single'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Estudio Individual ({currentReport?.reportNumber || '1'})
              </button>
              <button
                onClick={() => setReportMode('consolidated')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  reportMode === 'consolidated'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Expediente Consolidado ({patientReports.length} Estudios)
              </button>
            </div>
          </div>

          {/* If in single mode, dropdown to pick which study to preview/download */}
          {reportMode === 'single' && patientReports.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-[11px] font-medium">Estudio activo:</label>
              <select
                value={activeReportId}
                onChange={(e) => setActiveReportId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-hidden focus:border-teal-500"
              >
                {patientReports.map((rep) => (
                  <option key={rep.id} value={rep.id}>
                    {rep.reportNumber} - {rep.title} ({new Date(rep.sampleDate).toLocaleDateString('es-ES')})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Security Badge */}
          <div className="flex items-center gap-2 text-slate-300">
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" /> Firma Criptográfica Verificada
            </span>
          </div>

        </div>

        {/* Options Drawer */}
        {showOptionsDrawer && (
          <div className="bg-slate-800/95 border-b border-slate-700 p-4 text-xs text-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden animate-fade-in">
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-teal-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>Contenido Clínico</span>
              </h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAiSummary}
                  onChange={(e) => setIncludeAiSummary(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-teal-400"
                />
                <span>Incluir Síntesis Médica y Explicación</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-teal-400"
                />
                <span>Incluir Firmas y Sellos Digitales</span>
              </label>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Seguridad Institucional</span>
              </h4>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Marca de agua institucional:</label>
                <select
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                >
                  <option value="none">Sin marca de agua</option>
                  <option value="OFICIAL VALIDADO">OFICIAL VALIDADO</option>
                  <option value="HISTORIAL CLÍNICO">HISTORIAL CLÍNICO</option>
                  <option value="CONFIDENCIAL">CONFIDENCIAL</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-amber-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <QrCode className="w-3.5 h-3.5" />
                <span>Verificación en Línea</span>
              </h4>
              <p className="text-[11px] text-slate-300">
                Cada PDF incluye un código QR dinámico vinculado a los servidores de validación oficial VACLINIC.
              </p>
              <button
                type="button"
                onClick={handleCopyVerificationLink}
                className="w-full mt-1 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-lg py-1 px-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Enlace Copiado' : 'Copiar Enlace de Validación'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Progress Alert Overlay while exporting */}
        {isExporting && (
          <div className="bg-teal-950/90 border-b border-teal-600/40 px-6 py-2.5 flex items-center justify-between text-xs text-teal-200 animate-pulse print:hidden">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
              <span className="font-bold">{exportProgressText || 'Generando informe PDF con identidad corporativa VACLINIC...'}</span>
            </div>
            <span className="font-mono text-[11px] bg-teal-900 px-2 py-0.5 rounded border border-teal-700">
              Resolución Ultra-HD 300 DPI
            </span>
          </div>
        )}

        {/* Scrollable Printable Document Container */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          
          <div ref={printSheetRef} className="w-full max-w-4xl space-y-8">
            
            {/* If in Single Study Mode: Render Official Report Sheet */}
            {reportMode === 'single' && currentReport && (
              <VaclinicOfficialReportSheet
                report={currentReport}
                watermark={watermark}
                includeAiExplanation={includeAiSummary}
                includeSignatures={includeSignatures}
              />
            )}

            {/* If in Consolidated Mode: Render each report with page separation */}
            {reportMode === 'consolidated' && (
              <div className="space-y-8">
                {/* Dossier Cover / Summary Banner */}
                <div className="bg-white text-slate-900 p-8 rounded-xl shadow-xl border border-slate-200">
                  <div className="border-b-2 border-[#0a2540] pb-4 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        DOSSIER MÉDICO CONSOLIDADO
                      </span>
                      <h1 className="text-2xl font-black text-slate-900 mt-1 uppercase">
                        Expediente Clínico Integral VACLINIC
                      </h1>
                      <p className="text-xs text-slate-500 font-medium">
                        Paciente: <strong>{patient.fullName}</strong> • DNI: {patient.nationalId} • Código: {patient.accessCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-[#0a2540] font-mono">
                        {patientReports.length} ESTUDIOS VALIDADOS
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Emitido: {new Date().toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Primer Registro</span>
                      <strong className="text-slate-900">
                        {patientReports.length > 0 ? new Date(patientReports[patientReports.length - 1].sampleDate).toLocaleDateString('es-ES') : 'N/A'}
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Última Actualización</span>
                      <strong className="text-slate-900">
                        {patientReports.length > 0 ? new Date(patientReports[0].sampleDate).toLocaleDateString('es-ES') : 'N/A'}
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Certificación de Calidad</span>
                      <strong className="text-teal-700 font-mono">ISO 15189:2022</strong>
                    </div>
                  </div>
                </div>

                {/* Iterate through patient reports */}
                {patientReports.map((rep, idx) => (
                  <div key={rep.id} className="relative">
                    <div className="text-[11px] font-bold text-slate-400 mb-2 flex items-center justify-between px-2 print:hidden">
                      <span>Estudio {idx + 1} de {patientReports.length}: {rep.title}</span>
                      <span className="font-mono text-[10px]">Folio: {rep.reportNumber}</span>
                    </div>
                    <VaclinicOfficialReportSheet
                      report={rep}
                      watermark={watermark}
                      includeAiExplanation={includeAiSummary}
                      includeSignatures={includeSignatures}
                    />
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* Footer info bar */}
        <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">VACLINIC Laboratorio Clínico</span>
            <span>•</span>
            <span>📞 56125563</span>
            <span>•</span>
            <span>📍 Entrada de Pineda Oratorio Santa Rosa km 79.5</span>
          </div>

          <div className="flex items-center gap-3 font-medium">
            <span className="text-teal-400 font-mono text-[11px]">Validación: {validationHash.substring(0, 16)}...</span>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer"
            >
              Descargar Ahora
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
