import React, { useState, useMemo, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { MedicalReport } from '../../types';
import { PdfReportService } from '../../services/pdfReportService';
import { WhatsAppCodeModal } from './WhatsAppCodeModal';
import { isSensitiveClinicalResult } from '../../utils/securityCode';
import { 
  FileText, 
  Download, 
  Eye, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Printer, 
  Maximize2, 
  X,
  Sliders,
  MessageCircle,
  Lock,
  EyeOff,
  ShieldAlert,
  Key,
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface PatientResultsViewProps {
  onOpenReportPreview: (report: MedicalReport) => void;
  onOpenPdfCenter: () => void;
  onOpenHistoryPdfModal: () => void;
}

export const PatientResultsView: React.FC<PatientResultsViewProps> = ({
  onOpenReportPreview,
  onOpenPdfCenter,
  onOpenHistoryPdfModal
}) => {
  const { 
    currentPatient, 
    reports, 
    showNotification,
    isSensitiveResultUnlocked,
    unlockSensitiveResult,
    verifyPatientPinForSensitiveResult
  } = useClinic();

  // Search and filter states matching the reference screenshot
  const [searchQuery, setSearchQuery] = useState('');
  const [studyFilter, setStudyFilter] = useState('todos');
  const [periodFilter, setPeriodFilter] = useState('6_meses');
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [isDownloadingSummary, setIsDownloadingSummary] = useState(false);

  // Full-screen / in-app preview modal
  const [previewingReport, setPreviewingReport] = useState<MedicalReport | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedReportForWhatsApp, setSelectedReportForWhatsApp] = useState<MedicalReport | null>(null);

  // Sensitive Result PIN Unlock Modal States
  const [sensitiveModalReport, setSensitiveModalReport] = useState<MedicalReport | null>(null);
  const [pendingAction, setPendingAction] = useState<'preview' | 'download' | 'unlock_only'>('preview');
  const [pinModalInput, setPinModalInput] = useState('');
  const [showModalPin, setShowModalPin] = useState(false);
  const [pinModalError, setPinModalError] = useState<string | null>(null);
  const [pinModalAttemptsLeft, setPinModalAttemptsLeft] = useState<number | null>(null);
  const [pinModalLockout, setPinModalLockout] = useState<number>(0);
  const [showModalPinHelp, setShowModalPinHelp] = useState(false);

  // Real-time lockout timer for sensitive result modal
  useEffect(() => {
    if (pinModalLockout <= 0) return;
    const timer = setInterval(() => {
      setPinModalLockout((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPinModalError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pinModalLockout]);

  // Filter reports belonging exclusively to the authenticated patient
  const patientReports = useMemo(() => {
    if (!currentPatient) return [];
    return reports
      .filter((r) => r.patientId === currentPatient.id)
      .sort((a, b) => new Date(b.sampleDate || b.emissionDate).getTime() - new Date(a.sampleDate || a.emissionDate).getTime());
  }, [reports, currentPatient]);

  // Unique studies available for the dropdown
  const uniqueStudies = useMemo(() => {
    return Array.from(new Set(patientReports.map((r) => r.title)));
  }, [patientReports]);

  // Filtered reports matching search, study dropdown, and time period
  const filteredReports = useMemo(() => {
    return patientReports.filter((r) => {
      // Study filter dropdown
      if (studyFilter !== 'todos' && r.title !== studyFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchNum = r.reportNumber.toLowerCase().includes(q);
        const matchCategory = (r.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchNum && !matchCategory) return false;
      }

      // Period filter
      if (periodFilter === '30_dias') {
        const date = new Date(r.sampleDate || r.emissionDate);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (date < thirtyDaysAgo) return false;
      } else if (periodFilter === '6_meses') {
        const date = new Date(r.sampleDate || r.emissionDate);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        if (date < sixMonthsAgo) return false;
      } else if (periodFilter === '1_ano') {
        const date = new Date(r.sampleDate || r.emissionDate);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (date < oneYearAgo) return false;
      }

      return true;
    });
  }, [patientReports, studyFilter, searchQuery, periodFilter]);

  // Helper to determine if a report requires PIN unlocking
  const isReportSensitive = (report: MedicalReport) => {
    return isSensitiveClinicalResult(
      report.category, 
      report.title, 
      Boolean(report.parameters?.some(p => p.status === 'critical'))
    );
  };

  const isReportLocked = (report: MedicalReport) => {
    return isReportSensitive(report) && !isSensitiveResultUnlocked(report.id);
  };

  const handleActionOnReport = (report: MedicalReport, action: 'preview' | 'download' | 'unlock_only') => {
    if (isReportLocked(report)) {
      setSensitiveModalReport(report);
      setPendingAction(action === 'unlock_only' ? 'preview' : action);
      setPinModalInput('');
      setPinModalError(null);
      setPinModalAttemptsLeft(null);
      return;
    }

    if (action === 'preview' || action === 'unlock_only') {
      setPreviewingReport(report);
      onOpenReportPreview(report);
    } else {
      handleDownloadPdf(report);
    }
  };

  const handleVerifyModalPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sensitiveModalReport || !currentPatient) return;
    if (!pinModalInput.trim()) {
      setPinModalError('Por favor ingresa tu PIN secreto único de 6 dígitos.');
      return;
    }

    setPinModalError(null);
    const result = verifyPatientPinForSensitiveResult(currentPatient.id, pinModalInput);

    if (!result.success) {
      setPinModalError(result.error || 'PIN incorrecto.');
      if (result.remainingSeconds) {
        setPinModalLockout(result.remainingSeconds);
      }
      if (result.attemptsLeft !== undefined) {
        setPinModalAttemptsLeft(result.attemptsLeft);
      }
    } else {
      // Success! Unlock this report
      unlockSensitiveResult(sensitiveModalReport.id);
      showNotification('Resultado sensible verificado y desbloqueado exitosamente.', 'success');
      
      const targetReport = sensitiveModalReport;
      const targetAction = pendingAction;
      
      setSensitiveModalReport(null);
      setPinModalInput('');
      setPinModalError(null);
      setPinModalAttemptsLeft(null);
      
      if (targetAction === 'preview') {
        setPreviewingReport(targetReport);
        onOpenReportPreview(targetReport);
      } else if (targetAction === 'download') {
        handleDownloadPdf(targetReport);
      }
    }
  };

  // Direct download single report in vector PDF
  const handleDownloadPdf = async (report: MedicalReport) => {
    if (!currentPatient) return;
    try {
      setDownloadingReportId(report.id);
      PdfReportService.generateHistoricalSummaryPdf(currentPatient, [report], {
        watermark: 'VACLINIC • INFORME OFICIAL',
        filename: `VACLINIC_Informe_${report.reportNumber}.pdf`
      });
      showNotification(`Informe ${report.reportNumber} generado y descargado en PDF.`, 'success');
    } catch (err) {
      console.error(err);
      showNotification('Error al generar el PDF del informe.', 'error');
    } finally {
      setDownloadingReportId(null);
    }
  };

  // Download entire consolidated patient history in PDF
  const handleDownloadHistorySummary = async () => {
    if (!currentPatient) return;
    try {
      setIsDownloadingSummary(true);
      const published = patientReports.filter((r) => r.status === 'publicado' || r.status === 'entregado');
      PdfReportService.generateHistoricalSummaryPdf(
        currentPatient, 
        published.length > 0 ? published : patientReports, 
        {
          watermark: 'VACLINIC • EXPEDIENTE HISTÓRICO',
          filename: `VACLINIC_Historial_${currentPatient.nationalId || currentPatient.accessCode}.pdf`
        }
      );
      showNotification('Expediente histórico descargado con éxito.', 'success');
    } catch (err) {
      console.error(err);
      showNotification('Error al generar el resumen histórico.', 'error');
    } finally {
      setIsDownloadingSummary(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Title matching Subpage 1 reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mis resultados
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Consulta y descarga tus informes de laboratorio.
          </p>
        </div>

        {/* Quick actions for all results */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadHistorySummary}
            disabled={isDownloadingSummary || patientReports.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0f2237] hover:bg-[#1a3654] text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Descargar expediente histórico consolidado en PDF"
          >
            <Download className={`w-3.5 h-3.5 ${isDownloadingSummary ? 'animate-bounce' : ''}`} />
            <span>{isDownloadingSummary ? 'Generando...' : 'Descargar expediente (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Bar matching reference screenshot:
             [ Todos los estudios v ] [ Últimos 6 meses v ] [ 🔍 Search button ] */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          
          {/* Dropdown 1: Todos los estudios */}
          <select
            value={studyFilter}
            onChange={(e) => setStudyFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="todos">Todos los estudios</option>
            {uniqueStudies.map((study) => (
              <option key={study} value={study}>
                {study}
              </option>
            ))}
          </select>

          {/* Dropdown 2: Últimos 6 meses */}
          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-cyan-500 cursor-pointer"
          >
            <option value="todos">Cualquier fecha</option>
            <option value="30_dias">Últimos 30 días</option>
            <option value="6_meses">Últimos 6 meses</option>
            <option value="1_ano">Último año</option>
          </select>

        </div>

        {/* Search input with magnifying glass button */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por estudio o código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
          />
        </div>

      </div>

      {/* 3. Results List matching exact card structure from screenshot:
             [ Document Icon ] [ Hemograma completo / Fecha: 12 abr. 2025 ] [ ✓ Disponible ]
             [ 👁 Vista previa ] [ ⬇ Descargar PDF ] */}
      {filteredReports.length > 0 ? (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const isReady = report.status === 'publicado' || report.status === 'entregado';
            const isDownloading = downloadingReportId === report.id;
            const formattedDate = report.sampleDate || report.emissionDate || '12 abr. 2025';

            return (
              <div
                key={report.id}
                className={`rounded-2xl border p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isReportLocked(report)
                    ? 'bg-amber-50/20 border-amber-300/80 shadow-xs'
                    : 'bg-white border-slate-200/90 shadow-2xs hover:shadow-xs'
                }`}
              >
                
                {/* Left: Icon, Study Name, Date, Status */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 ${
                    isReportLocked(report)
                      ? 'bg-amber-100/70 border-amber-300 text-amber-800'
                      : 'bg-[#ebf5fb] border-[#d2e9f7] text-cyan-600'
                  }`}>
                    {isReportLocked(report) ? (
                      <Lock className="w-6 h-6 stroke-[2.2]" />
                    ) : (
                      <FileText className="w-6 h-6 stroke-[2.2]" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        {report.title}
                      </h3>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        #{report.reportNumber}
                      </span>

                      {/* Sensitive Status Badges */}
                      {isReportLocked(report) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                          <Lock className="w-3 h-3 text-amber-700" />
                          <span>Requiere PIN Secreto</span>
                        </span>
                      ) : isReportSensitive(report) ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Sensible Desbloqueado</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span>Fecha de realización: <strong className="text-slate-700">{formattedDate}</strong></span>
                      <span>•</span>
                      <span className="text-slate-500">{report.category?.toUpperCase() || 'LABORATORIO'}</span>
                      {isReportLocked(report) && (
                        <>
                          <span>•</span>
                          <span className="text-amber-800 font-bold flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                            <span>Privacidad diagnóstica activa</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Badge + Action Buttons (Vista previa & Descargar PDF) */}
                <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
                  
                  {/* Status badge: ✓ Disponible */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isReady
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isReady ? 'Disponible' : 'En proceso'}</span>
                  </span>

                  {/* Special unlock button if locked */}
                  {isReportLocked(report) && (
                    <button
                      type="button"
                      onClick={() => handleActionOnReport(report, 'unlock_only')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-xs transition-all cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Desbloquear con PIN</span>
                    </button>
                  )}

                  {/* Vista previa Button */}
                  <button
                    onClick={() => handleActionOnReport(report, 'preview')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition-colors cursor-pointer"
                  >
                    {isReportLocked(report) ? (
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-cyan-600" />
                    )}
                    <span>{isReportLocked(report) ? 'Ver con PIN' : 'Vista previa'}</span>
                  </button>

                  {/* Reenviar por WhatsApp Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedReportForWhatsApp(report);
                      setShowWhatsAppModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                    title="Reenviar informe de resultados por WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Descargar PDF Button */}
                  <button
                    onClick={() => handleActionOnReport(report, 'download')}
                    disabled={isDownloading}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0f2237] hover:bg-[#1a3654] text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                    <span>{isDownloading ? 'Descargando...' : 'Descargar PDF'}</span>
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No se encontraron resultados</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No hay informes con los filtros seleccionados. Prueba seleccionando "Todos los estudios" o "Cualquier fecha".
          </p>
          <button
            onClick={() => {
              setStudyFilter('todos');
              setPeriodFilter('todos');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
          >
            Restablecer filtros
          </button>
        </div>
      )}

      {/* 4. Complete In-App High-Fidelity Viewer Modal when "Vista previa" is opened */}
      {previewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {previewingReport.title}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Folio Oficial: <strong>{previewingReport.reportNumber}</strong> • Fecha: {previewingReport.sampleDate || previewingReport.emissionDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                  title="Imprimir informe"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownloadPdf(previewingReport)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0f2237] text-white text-xs font-bold hover:bg-[#1a3654] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => setPreviewingReport(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: High-Fidelity Parameters Table */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Patient Header Box */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Paciente</span>
                  <span className="font-bold text-slate-900">{currentPatient?.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Identificación</span>
                  <span className="font-mono text-slate-700">{currentPatient?.nationalId || currentPatient?.accessCode}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Edad / Sexo</span>
                  <span className="text-slate-700">{currentPatient?.age} años • {currentPatient?.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado Validación</span>
                  <span className="font-bold text-emerald-700">Certificado Oficial</span>
                </div>
              </div>

              {/* Table of Analytes */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600 border-b border-slate-200">
                      <th className="p-3">Analito / Parámetro</th>
                      <th className="p-3 text-right">Resultado</th>
                      <th className="p-3">Unidad</th>
                      <th className="p-3">Valor de Referencia</th>
                      <th className="p-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(previewingReport.parameters || []).map((param, idx) => {
                      const isAbnormal = param.status === 'high' || param.status === 'low' || param.status === 'critical';
                      return (
                        <tr key={idx} className={isAbnormal ? 'bg-amber-50/40 font-medium' : 'hover:bg-slate-50/50'}>
                          <td className="p-3 font-semibold text-slate-800">{param.name}</td>
                          <td className={`p-3 text-right font-bold ${
                            param.status === 'critical' ? 'text-rose-600' :
                            param.status === 'high' ? 'text-amber-700' :
                            param.status === 'low' ? 'text-blue-700' : 'text-slate-900'
                          }`}>
                            {param.value}
                          </td>
                          <td className="p-3 text-slate-500 font-mono text-[11px]">{param.unit || '-'}</td>
                          <td className="p-3 text-slate-600 font-mono text-[11px]">{param.referenceRange || 'Normal'}</td>
                          <td className="p-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isAbnormal ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {param.status === 'normal' ? 'Normal' : param.status?.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Doctor validation & ISO 15189 footer */}
              <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-700" />
                  <div>
                    <span className="font-bold text-slate-900 block">Laboratorio Clínico VACLINIC</span>
                    <span className="text-slate-600 text-[11px]">Validado y firmado digitalmente según normas ISO 15189.</span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500">
                  Responsable: {previewingReport.signature?.doctorName || 'Lic. Químico Biólogo Colegiado'}
                </span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setPreviewingReport(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Cerrar vista previa
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Sensitive Result PIN Verification Modal */}
      {sensitiveModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-amber-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white p-5 relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-200 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white leading-tight">
                      Resultado Médico Protegido
                    </h3>
                    <p className="text-[11px] text-amber-200/90 font-medium mt-0.5">
                      Requiere PIN Secreto Confidencial
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSensitiveModalReport(null);
                    setPinModalInput('');
                    setPinModalError(null);
                  }}
                  className="p-1.5 rounded-xl text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleVerifyModalPin} className="p-6 space-y-4 text-xs">
              
              {/* Study Info Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Estudio Clínico</span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">#{sensitiveModalReport.reportNumber}</span>
                </div>
                <h4 className="text-sm font-black text-slate-900">{sensitiveModalReport.title}</h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Este examen contiene información clasificada de alta sensibilidad diagnóstica. Para salvaguardar tu privacidad, ingresa el PIN único asignado a tu registro.
                </p>
              </div>

              {/* PIN Input Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-600" />
                    <span>PIN Secreto Único:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowModalPinHelp(!showModalPinHelp)}
                    className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>¿Dónde está?</span>
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showModalPin ? "text" : "password"}
                    maxLength={10}
                    placeholder="PIN de 6 dígitos"
                    value={pinModalInput}
                    onChange={(e) => {
                      setPinModalInput(e.target.value);
                      if (pinModalError) setPinModalError(null);
                    }}
                    disabled={pinModalLockout > 0}
                    autoFocus
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none transition-all placeholder:font-sans placeholder:tracking-normal placeholder:font-normal disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPin(!showModalPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={showModalPin ? "Ocultar PIN" : "Mostrar PIN"}
                  >
                    {showModalPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Helper guide */}
              {showModalPinHelp && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1 animate-fade-in">
                  <strong className="block font-bold">Comprobante o Ticket de Caja:</strong>
                  <span>El PIN secreto de 6 dígitos está impreso en tu comprobante de toma de muestra entregado en recepción.</span>
                </div>
              )}

              {/* Lockout / Error Alerts */}
              {pinModalLockout > 0 && (
                <div className="p-3 bg-rose-50 border-2 border-rose-300 rounded-xl text-xs space-y-1 text-rose-900 animate-fade-in">
                  <div className="font-bold flex items-center gap-1.5 text-rose-700">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Bloqueo Preventivo Anti-Fuerza Bruta</span>
                  </div>
                  <p className="text-[11px]">
                    Has alcanzado el límite de intentos fallidos. Podrás intentar de nuevo en:
                    <strong className="font-mono ml-1 text-sm text-rose-800">{pinModalLockout}s</strong>
                  </p>
                </div>
              )}

              {pinModalError && pinModalLockout === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block">{pinModalError}</span>
                    {pinModalAttemptsLeft !== null && pinModalAttemptsLeft > 0 && (
                      <span className="text-[11px] text-amber-800">
                        Intentos restantes antes del bloqueo: {pinModalAttemptsLeft}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSensitiveModalReport(null);
                    setPinModalInput('');
                    setPinModalError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={pinModalLockout > 0 || !pinModalInput.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 active:scale-98 text-white shadow-md shadow-amber-600/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Desbloquear Resultado</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* WhatsApp Code & Results Re-send Modal */}
      <WhatsAppCodeModal
        isOpen={showWhatsAppModal}
        onClose={() => {
          setShowWhatsAppModal(false);
          setSelectedReportForWhatsApp(null);
        }}
        defaultTopic="envio_resultados"
        initialPatientName={currentPatient?.fullName || ''}
        initialNationalId={currentPatient?.nationalId || ''}
        initialAccessCode={currentPatient?.accessCode || ''}
        initialOrderNumber={selectedReportForWhatsApp?.reportNumber || ''}
        initialStudyName={selectedReportForWhatsApp?.title || ''}
      />

    </div>
  );
};
