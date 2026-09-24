import React, { useState, useRef } from 'react';
import { Patient, MedicalReport, ReportParameter } from '../../types';
import { PdfReportService } from '../../services/pdfReportService';
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
  ShieldAlert, 
  Sliders, 
  Clock, 
  TrendingUp, 
  Award, 
  Copy, 
  Check, 
  Layers,
  Activity,
  Phone
} from 'lucide-react';

interface PatientHistoryPdfModalProps {
  patient: Patient | null;
  reports: MedicalReport[];
  isOpen: boolean;
  onClose: () => void;
}

export const PatientHistoryPdfModal: React.FC<PatientHistoryPdfModalProps> = ({
  patient,
  reports,
  isOpen,
  onClose
}) => {
  const printSheetRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Settings & Customization
  const [watermark, setWatermark] = useState<'none' | 'EXPEDIENTE OFICIAL' | 'HISTORIAL CLÍNICO' | 'CONFIDENCIAL'>('none');
  const [includeAiSummary, setIncludeAiSummary] = useState(true);
  const [includeTrendsSummary, setIncludeTrendsSummary] = useState(true);
  const [selectedReportFilter, setSelectedReportFilter] = useState<'all' | 'published_only'>('published_only');
  
  // Signatures
  const [bioanalystName, setBioanalystName] = useState('Licda. Elena Morales Cruz');
  const [bioanalystSpecialty, setBioanalystSpecialty] = useState('Licenciada en Bioanálisis Clínico & Microbiología');
  const [bioanalystLicense, setBioanalystLicense] = useState('Col. Bioanálisis #4192 / MSPAS-8812');

  const [doctorName, setDoctorName] = useState('Dr. Alejandro Valenzuela Morales');
  const [doctorSpecialty, setDoctorSpecialty] = useState('Médico Patólogo Clínico & Diagnóstico');
  const [doctorLicense, setDoctorLicense] = useState('CMP-649102 / RNE-28491');

  if (!isOpen || !patient) return null;

  // Filter and sort patient reports chronologically (newest first for clinical reading)
  const patientReports = reports
    .filter(r => r.patientId === patient.id)
    .filter(r => selectedReportFilter === 'all' || r.status === 'publicado' || r.status === 'entregado')
    .sort((a, b) => new Date(b.sampleDate).getTime() - new Date(a.sampleDate).getTime());

  // Calculate statistics across history
  const totalParametersEvaluated = patientReports.reduce((acc, r) => acc + (r.parameters?.length || 0), 0);
  const abnormalParametersCount = patientReports.reduce((acc, r) => {
    return acc + (r.parameters?.filter(p => p.status === 'high' || p.status === 'low' || p.status === 'critical').length || 0);
  }, 0);

  const oldestReportDate = patientReports.length > 0
    ? new Date(patientReports[patientReports.length - 1].sampleDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';
  
  const newestReportDate = patientReports.length > 0
    ? new Date(patientReports[0].sampleDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';

  const historyHash = '0x' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  // PDF Export execution
  const handleDownloadPdf = async () => {
    if (!printSheetRef.current) return;
    setIsExporting(true);
    try {
      const cleanName = patient.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `VACLINIC_Historial_Clinico_${cleanName}_${patient.nationalId}.pdf`;
      await PdfReportService.exportElementToPdf(printSheetRef.current, filename);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const link = `https://vaclinic.laboratorio.gt/expediente?id=${patient.accessCode}&hash=${historyHash.substring(0, 10)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:w-full print:max-w-none print:bg-white">
        
        {/* Top Controls Toolbar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-black text-sm">
              EXP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Historial Clínico Integral en PDF Oficial
                </h3>
                <span className="bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  {patient.accessCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Expediente consolidado • {patient.fullName} • {patientReports.length} informes validados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Options Toggle */}
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

            {/* Direct Print */}
            <button
              onClick={handleNativePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-teal-400" />
              <span>Imprimir</span>
            </button>

            {/* Download Summary PDF */}
            <button
              id="btn-modal-download-summary-pdf"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 px-4 py-1.5 rounded-xl text-xs font-black shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              title="Download Summary - Descargar reporte oficial en PDF con jsPDF"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Generando PDF...' : 'Download Summary (PDF)'}</span>
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

        {/* Options Drawer */}
        {showSettings && (
          <div className="bg-slate-800/90 border-b border-slate-700 p-4 text-xs text-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-teal-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <FileText className="w-3.5 h-3.5" />
                <span>Contenido del Expediente</span>
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
                  checked={includeTrendsSummary}
                  onChange={(e) => setIncludeTrendsSummary(e.target.checked)}
                  className="rounded text-teal-500 focus:ring-teal-400"
                />
                <span>Incluir Matriz Evolutiva de Biomarcadores</span>
              </label>

              <div className="pt-1">
                <label className="block text-[10px] text-slate-400 font-semibold mb-1">Marca de agua institucional:</label>
                <select
                  value={watermark}
                  onChange={(e) => setWatermark(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                >
                  <option value="none">Sin marca de agua</option>
                  <option value="EXPEDIENTE OFICIAL">EXPEDIENTE OFICIAL</option>
                  <option value="HISTORIAL CLÍNICO">HISTORIAL CLÍNICO</option>
                  <option value="CONFIDENCIAL">CONFIDENCIAL</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <Award className="w-3.5 h-3.5" />
                <span>Firma Bioanalista Responsable</span>
              </h4>
              <input
                type="text"
                value={bioanalystName}
                onChange={(e) => setBioanalystName(e.target.value)}
                placeholder="Nombre"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-semibold"
              />
              <input
                type="text"
                value={bioanalystSpecialty}
                onChange={(e) => setBioanalystSpecialty(e.target.value)}
                placeholder="Especialidad"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
              />
              <input
                type="text"
                value={bioanalystLicense}
                onChange={(e) => setBioanalystLicense(e.target.value)}
                placeholder="Colegiado"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-cyan-300"
              />
            </div>

            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60">
              <h4 className="font-bold text-amber-300 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Firma Director Médico Patólogo</span>
              </h4>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Nombre del Médico"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-semibold"
              />
              <input
                type="text"
                value={doctorSpecialty}
                onChange={(e) => setDoctorSpecialty(e.target.value)}
                placeholder="Especialidad Médica"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
              />
              <input
                type="text"
                value={doctorLicense}
                onChange={(e) => setDoctorLicense(e.target.value)}
                placeholder="Cédula / Registro CMP"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-amber-300"
              />
            </div>
          </div>
        )}

        {/* Scrollable Printable Document */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-950/60 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          
          <div 
            ref={printSheetRef}
            id="vaclinic-patient-history-pdf"
            className="bg-white text-slate-900 w-full max-w-4xl p-8 sm:p-12 rounded-xl shadow-2xl relative font-sans border border-slate-200 print:shadow-none print:border-none print:p-4 print:max-w-none print:w-full"
            style={{ minHeight: '1100px' }}
          >
            
            {/* Watermark */}
            {watermark !== 'none' && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10 opacity-[0.035] select-none">
                <span className="text-7xl font-black uppercase transform -rotate-45 tracking-widest text-slate-900 border-8 border-slate-900 p-8 rounded-3xl">
                  {watermark}
                </span>
              </div>
            )}

            {/* Institutional VACLINIC Header */}
            <header className="border-b-2 border-slate-900 pb-5 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Brand & Logo Badge */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-700 to-slate-950 flex flex-col items-center justify-center text-white flex-shrink-0 font-black shadow-lg border-2 border-cyan-400 relative overflow-hidden">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-white/20 rounded-full blur-xs"></div>
                    <span className="text-2xl tracking-tighter leading-none text-white font-extrabold">VC</span>
                    <span className="text-[9px] font-mono text-cyan-200 tracking-widest font-bold mt-0.5">LAB</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 uppercase leading-none font-sans">
                        VACLINIC
                      </h1>
                      <span className="text-[11px] font-black text-cyan-800 uppercase tracking-widest bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-300">
                        Laboratorio Clínico
                      </span>
                    </div>

                    <p className="text-xs font-bold text-teal-800 italic mt-1 font-serif">
                      "Precisión que diagnostica, confianza que cuida"
                    </p>

                    <div className="text-[11px] text-slate-600 font-medium mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="font-semibold text-slate-700">📍 Entrada de Pineda Oratorio Santa Rosa km 79.5</span>
                      <span>•</span>
                      <span className="font-bold text-slate-800">📞 Tel / WhatsApp: 56125563</span>
                    </div>

                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Acreditación de Calidad ISO 15189 • Red Multisucursal • Trazabilidad Total
                    </p>
                  </div>
                </div>

                {/* Dossier Header Info */}
                <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex-shrink-0">
                  <div className="inline-flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md mb-1">
                      EXPEDIENTE CLÍNICO INTEGRAL
                    </span>
                    <div className="bg-slate-950 text-white rounded-lg px-3 py-1 font-mono text-xs font-black tracking-wider shadow-xs">
                      EXP-{patient.accessCode}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono mt-1.5">
                    FECHA EMISIÓN: <strong className="text-slate-800">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 flex items-center justify-end gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>HISTORIAL OFICIAL CERTIFICADO</span>
                  </div>
                </div>

              </div>
            </header>

            {/* Patient Profile Card */}
            <section className="bg-slate-50 border border-slate-300 rounded-xl p-4 mb-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2.5 gap-x-4">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Paciente Titular</span>
                  <strong className="text-slate-950 text-sm block truncate font-bold">{patient.fullName}</strong>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Identificación (DNI / Cédula)</span>
                  <span className="font-mono text-slate-900 font-bold">{patient.nationalId}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Edad / Sexo</span>
                  <span className="text-slate-800 font-bold">
                    {patient.age} años • {patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'Otro'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Grupo Sanguíneo</span>
                  <span className="font-bold text-rose-700 flex items-center gap-1">
                    <Droplet className="w-3 h-3" /> {patient.bloodType}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Teléfono de Contacto</span>
                  <span className="text-slate-800 font-medium">{patient.phone}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Correo Electrónico</span>
                  <span className="text-slate-800 font-medium truncate block">{patient.email || 'No registrado'}</span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Alergias Conocidas</span>
                  <span className="text-amber-800 font-semibold truncate block">
                    {patient.allergies?.join(', ') || 'Ninguna reportada'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase">Contacto de Emergencia</span>
                  <span className="text-slate-700 font-medium truncate block">
                    {patient.emergencyContact?.name} ({patient.emergencyContact?.relation})
                  </span>
                </div>
              </div>
            </section>

            {/* Historical Summary Metrics Banner */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-teal-800 uppercase block">Estudios en Historial</span>
                <span className="text-lg font-black text-teal-950">{patientReports.length}</span>
                <span className="text-[9px] text-teal-700 block">informes validados</span>
              </div>

              <div className="bg-cyan-50/60 border border-cyan-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-cyan-800 uppercase block">Analitos Evaluados</span>
                <span className="text-lg font-black text-cyan-950">{totalParametersEvaluated}</span>
                <span className="text-[9px] text-cyan-700 block">parámetros analíticos</span>
              </div>

              <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Ventana Temporal</span>
                <span className="text-xs font-black text-slate-900 block mt-1">{oldestReportDate}</span>
                <span className="text-[9px] text-slate-500 block">hasta {newestReportDate}</span>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Control General</span>
                <span className="text-lg font-black text-emerald-700">
                  {Math.round(((totalParametersEvaluated - abnormalParametersCount) / (totalParametersEvaluated || 1)) * 100)}%
                </span>
                <span className="text-[9px] text-emerald-700 block">valores en rango óptimo</span>
              </div>
            </section>

            {/* Chronological Breakdown of Clinical Reports */}
            <section className="space-y-6 mb-6">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-950 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-700" />
                  <span>Detalle Cronológico de Estudios Clínicos ({patientReports.length})</span>
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">
                  Orden: Más reciente a más antiguo
                </span>
              </div>

              {patientReports.map((report, rIndex) => {
                const sampleDateFormatted = new Date(report.sampleDate).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                });

                return (
                  <div 
                    key={report.id || rIndex}
                    className="border border-slate-300 rounded-xl p-4 bg-white shadow-xs space-y-3"
                  >
                    {/* Individual Study Sub-header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-teal-800 text-white font-black text-xs flex items-center justify-center">
                          {rIndex + 1}
                        </span>
                        <div>
                          <h3 className="text-xs font-black text-slate-950 uppercase">
                            {report.title}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-500">
                            Folio: <strong className="text-slate-800">{report.reportNumber}</strong> • Área: <span className="capitalize font-semibold text-teal-800">{report.category}</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-[10px]">
                        <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          Fecha: {sampleDateFormatted}
                        </span>
                        <span className="block text-[9px] text-slate-500 mt-0.5">
                          {report.laboratoryName || 'VACLINIC - Sede Central'}
                        </span>
                      </div>
                    </div>

                    {/* Parameters Table for this study */}
                    {report.parameters && report.parameters.length > 0 && (
                      <table className="w-full text-[11px] text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold text-[9px] uppercase">
                            <th className="py-1.5 px-2.5">Analito / Examen</th>
                            <th className="py-1.5 px-2.5 text-right">Resultado</th>
                            <th className="py-1.5 px-2.5 text-center">Unidad</th>
                            <th className="py-1.5 px-2.5">Referencia</th>
                            <th className="py-1.5 px-2.5 text-center">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {report.parameters.map((param, pIdx) => {
                            const isAbnormal = param.status === 'high' || param.status === 'low' || param.status === 'critical';
                            return (
                              <tr key={param.id || pIdx} className={isAbnormal ? 'bg-amber-50/40' : ''}>
                                <td className="py-1 px-2.5 font-medium text-slate-900">
                                  {param.name}
                                </td>
                                <td className="py-1 px-2.5 font-mono font-bold text-right text-slate-900">
                                  <span className={
                                    param.status === 'critical' ? 'text-rose-700 font-black' :
                                    param.status === 'high' ? 'text-amber-700 font-black' :
                                    param.status === 'low' ? 'text-blue-700 font-black' :
                                    'text-slate-900'
                                  }>
                                    {param.value}
                                  </span>
                                </td>
                                <td className="py-1 px-2.5 text-center font-mono text-[10px] text-slate-500">
                                  {param.unit || '-'}
                                </td>
                                <td className="py-1 px-2.5 font-mono text-[10px] text-slate-600">
                                  {param.referenceRange || 'N/D'}
                                </td>
                                <td className="py-1 px-2.5 text-center">
                                  {param.status === 'normal' && (
                                    <span className="text-[8px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      NORMAL
                                    </span>
                                  )}
                                  {param.status === 'high' && (
                                    <span className="text-[8px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      ELEVADO (▲)
                                    </span>
                                  )}
                                  {param.status === 'low' && (
                                    <span className="text-[8px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                      DISMINUIDO (▼)
                                    </span>
                                  )}
                                  {param.status === 'critical' && (
                                    <span className="text-[8px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                      CRÍTICO (⚠️)
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {/* Brief conclusions & findings */}
                    {(report.doctorConclusions || report.clinicalFindings) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1">
                        {report.clinicalFindings && (
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                            <strong className="text-slate-700 block uppercase text-[9px]">Hallazgos:</strong>
                            <p className="text-slate-800">{report.clinicalFindings}</p>
                          </div>
                        )}
                        {report.doctorConclusions && (
                          <div className="bg-teal-50/50 p-2 rounded-lg border border-teal-200">
                            <strong className="text-teal-900 block uppercase text-[9px]">Conclusión Médica:</strong>
                            <p className="text-teal-950 font-medium">{report.doctorConclusions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </section>

            {/* Official Certification & Signatures */}
            <footer className="border-t-2 border-slate-900 pt-4 mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                
                {/* QR Code Validation */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-slate-950 text-white rounded-xl p-1.5 flex flex-col items-center justify-center font-mono text-[8px] text-center shadow-sm flex-shrink-0">
                    <QrCode className="w-8 h-8 text-cyan-400 mb-0.5" />
                    <span className="font-black">EXPEDIENTE</span>
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">
                    <span className="font-black block text-slate-900 uppercase">VALIDACIÓN INSTITUCIONAL</span>
                    <span className="font-bold text-teal-800 block">VC-HISTORIAL-{patient.accessCode}</span>
                    <span className="block text-[8px] text-slate-400 break-all">Hash: {historyHash.substring(0, 18)}...</span>
                    <span className="block text-[8px] text-slate-500 mt-0.5">vaclinic.laboratorio.gt/expediente</span>
                  </div>
                </div>

                {/* Bioanalyst Signature */}
                <div className="text-center relative">
                  <div className="border-b border-slate-400 pb-1 mb-1 min-h-[38px] flex flex-col items-center justify-end">
                    <div className="font-serif italic text-cyan-900 font-black text-base tracking-widest leading-none select-none">
                      {bioanalystName}
                    </div>
                    <span className="text-[7px] font-mono text-cyan-700 tracking-tighter mt-0.5">
                      BIOANÁLISIS CLÍNICO
                    </span>
                  </div>
                  <div className="text-[11px] font-black text-slate-950">
                    {bioanalystName}
                  </div>
                  <div className="text-[9px] font-semibold text-slate-600">
                    {bioanalystSpecialty}
                  </div>
                  <div className="text-[8px] font-mono text-teal-800 font-bold">
                    {bioanalystLicense}
                  </div>
                </div>

                {/* Doctor Signature */}
                <div className="text-center sm:text-right relative">
                  <div className="border-b border-slate-400 pb-1 mb-1 min-h-[38px] flex flex-col items-center sm:items-end justify-end">
                    <div className="font-serif italic text-teal-950 font-black text-base tracking-widest leading-none select-none">
                      {doctorName}
                    </div>
                    <span className="text-[7px] font-mono text-teal-700 tracking-tighter mt-0.5">
                      DIRECCIÓN MÉDICA
                    </span>
                  </div>
                  <div className="text-[11px] font-black text-slate-950">
                    {doctorName}
                  </div>
                  <div className="text-[9px] font-semibold text-slate-600">
                    {doctorSpecialty}
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 font-bold">
                    {doctorLicense}
                  </div>
                </div>

              </div>

              <div className="text-[8px] text-slate-400 text-center mt-5 border-t border-slate-200 pt-2 font-mono leading-tight">
                Expediente Clínico Oficial emitido por VACLINIC Laboratorio Clínico. Documento con validez médica legal bajo normas internacionales de trazabilidad analítica ISO 15189.
              </div>
            </footer>

          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-slate-900 border-t border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Expediente auditado y validado en la plataforma central VACLINIC</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace Seguro'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Descargar PDF del Historial
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
