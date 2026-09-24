import React, { useMemo, useState, useEffect } from 'react';
import { MedicalReport, ReportParameter } from '../../types';
import { 
  Phone, 
  MapPin, 
  Mail, 
  Clock, 
  FlaskConical, 
  ShieldCheck, 
  Info, 
  Star,
  Cpu,
  HeartHandshake,
  Users,
  Award,
  Layers,
  Dna,
  Droplet,
  Activity,
  Zap,
  Filter,
  Eye,
  Microscope,
  Bug,
  Sparkles,
  CheckCircle2,
  FileText,
  AlertTriangle
} from 'lucide-react';
import QRCode from 'qrcode';
import { groupParametersBySection, ParameterGroupSection } from '../../utils/labSectionOrganizer';
import { OzelleCbcReportView } from '../laboratory/OzelleCbcReportView';
import { useClinic } from '../../context/ClinicContext';
import { LabSettings } from '../../types/labSettings';
import { 
  evaluateParameterDetailed, 
  ParameterDeviationInfo, 
  getAgeGroupDescription, 
  getGenderLabel 
} from '../../utils/referenceRangeEvaluator';
import { ReportAgeSexRangeViewer, DemographicFilterState } from './ReportAgeSexRangeViewer';
import { ParameterDeviationGauge } from './ParameterDeviationGauge';

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
  enableDemographicTool?: boolean;
  initialHighlightOutOfRange?: boolean;
}

export const VaclinicOfficialReportSheet: React.FC<VaclinicOfficialReportSheetProps> = ({
  report,
  watermark = 'none',
  includeAiExplanation = true,
  includeSignatures = true,
  includeConclusions = true,
  includeRecommendations = true,
  scale = 1,
  printMode = false,
  id = 'vaclinic-official-report-sheet',
  templateStyle,
  customSettings,
  fitToSinglePage = true,
  pinFooterToBottom = false,
  hideAnnex = false,
  enableDemographicTool = true,
  initialHighlightOutOfRange = true
}) => {
  const { labSettings: contextLabSettings } = useClinic();
  const labSettings = customSettings || contextLabSettings;

  const [headerQrUrl, setHeaderQrUrl] = useState<string>('');
  const [footerQrUrl, setFooterQrUrl] = useState<string>('');

  // Demographic visual tool state
  const [demographicFilterState, setDemographicFilterState] = useState<DemographicFilterState>({
    highlightEnabled: initialHighlightOutOfRange,
    showGauges: true,
    filterMode: 'all',
    isSimulating: false
  });

  const effectivePatientAge = demographicFilterState.isSimulating && demographicFilterState.simulatedAge !== undefined
    ? demographicFilterState.simulatedAge
    : (report.patientAge !== undefined ? report.patientAge : 35);

  const effectivePatientGender = demographicFilterState.isSimulating && demographicFilterState.simulatedGender
    ? demographicFilterState.simulatedGender
    : (report.patientGender || 'M');

  const parameters = report.parameters || [];

  // Evaluate every parameter dynamically against the patient's age and sex
  const evaluatedParametersMap = useMemo(() => {
    const map = new Map<string, ParameterDeviationInfo>();
    parameters.forEach(p => {
      const evalInfo = evaluateParameterDetailed(
        p.value,
        p.referenceRange,
        p.minVal,
        p.maxVal,
        p.status,
        {
          patientAge: effectivePatientAge,
          patientGender: effectivePatientGender,
          parameterName: p.name
        }
      );
      map.set(p.id, evalInfo);
    });
    return map;
  }, [parameters, effectivePatientAge, effectivePatientGender]);

  // Amber and Red Out-of-Range Metric Counts
  const { normalCount, amberCount, redCount } = useMemo(() => {
    let normal = 0;
    let amber = 0;
    let red = 0;
    evaluatedParametersMap.forEach(info => {
      if (info.alertLevel === 'red') red++;
      else if (info.alertLevel === 'amber') amber++;
      else normal++;
    });
    return { normalCount: normal, amberCount: amber, redCount: red };
  }, [evaluatedParametersMap]);

  const cleanRecommendations = useMemo(() => {
    return (report.recommendations || []).filter(r => typeof r === 'string' && r.trim().length > 0);
  }, [report.recommendations]);

  const shouldShowConclusions = 
    includeConclusions && 
    (report.includeConclusionsInReport !== false) && 
    Boolean(report.doctorConclusions && report.doctorConclusions.trim().length > 0);

  const shouldShowRecommendations = 
    includeRecommendations && 
    (report.includeRecommendationsInReport !== false) && 
    cleanRecommendations.length > 0;

  const shouldShowAiExplanation = 
    includeAiExplanation && 
    (report.includeAiExplanationInReport !== false) && 
    Boolean(report.patientExplanation && report.patientExplanation.trim().length > 0);

  const emissionDateFormatted = new Date(report.emissionDate || Date.now()).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const sampleDateFormatted = new Date(report.sampleDate || Date.now()).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Dynamic patient code e.g. VAC-000030
  const patientCode = report.patientId 
    ? (report.patientId.startsWith('VAC-') ? report.patientId : `VAC-${report.patientId.replace(/[^0-9]/g, '').padStart(6, '0')}`)
    : 'VAC-000030';

  // Access Code PIN for patient portal e.g. DU3HYB
  const accessCode = report.patientNationalId 
    ? report.patientNationalId.substring(0, 6).toUpperCase() 
    : 'DU3HYB';

  // Order Number e.g. 135-2026
  const orderNumber = report.reportNumber || '135-2026';

  // Group parameters by area / analytical type
  const parameterSections = useMemo(() => {
    return groupParametersBySection(parameters, report.category);
  }, [parameters, report.category]);

  // Generate authentic QR code data URLs
  useEffect(() => {
    const verifyUrl = `https://vaclinic.laboratorio.gt/valida?doc=${orderNumber}&pac=${patientCode}`;
    
    QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 140,
      color: {
        dark: '#082133',
        light: '#ffffff'
      }
    }, (err, url) => {
      if (!err && url) {
        setHeaderQrUrl(url);
        setFooterQrUrl(url);
      }
    });
  }, [orderNumber, patientCode]);

  const renderSectionIcon = (iconType: string) => {
    const iconClass = "w-3.5 h-3.5";
    switch (iconType) {
      case 'droplet': return <Droplet className={`${iconClass} text-rose-600`} />;
      case 'shield': return <ShieldCheck className={`${iconClass} text-blue-600`} />;
      case 'layers': return <Layers className={`${iconClass} text-purple-600`} />;
      case 'zap': return <Zap className={`${iconClass} text-amber-600`} />;
      case 'heart': return <Activity className={`${iconClass} text-indigo-600`} />;
      case 'filter': return <Filter className={`${iconClass} text-cyan-600`} />;
      case 'flask': return <FlaskConical className={`${iconClass} text-emerald-600`} />;
      case 'eye': return <Eye className={`${iconClass} text-amber-600`} />;
      case 'microscope': return <Microscope className={`${iconClass} text-cyan-600`} />;
      case 'bug': return <Bug className={`${iconClass} text-emerald-600`} />;
      case 'sparkles': return <Sparkles className={`${iconClass} text-purple-600`} />;
      default: return <FlaskConical className={`${iconClass} text-teal-600`} />;
    }
  };

  // Check if report has <= 25 parameters to enable smart single-page optimization
  const isCompactSinglePage = fitToSinglePage && parameters.length <= 25;

  // Contact info defaults matching user's laboratory
  const labPhone = labSettings.phone || '56125563';
  const labEmail = labSettings.email || 'laboratoriovaclinic@gmail.com';
  const labAddress = labSettings.address || 'Entrada de Pineda Oratorio Santa Rosa km 79.5';

  return (
    <div 
      id={id}
      className={`report-sheet-container bg-white text-slate-900 w-full max-w-[850px] shadow-xl relative font-sans select-text overflow-hidden print:overflow-visible print:p-0 print:shadow-none print:border-none print:w-full print:max-w-none print:min-h-0 print:flex print:flex-col print:justify-between ${
        isCompactSinglePage ? 'text-[11px]' : 'text-xs'
      } ${pinFooterToBottom ? 'h-full flex flex-col justify-between' : ''}`}
      style={{ 
        paddingTop: printMode ? '4mm' : (isCompactSinglePage ? '6mm' : '8mm'),
        paddingBottom: printMode ? '4mm' : (isCompactSinglePage ? '6mm' : '8mm'),
        paddingLeft: printMode ? '6mm' : (isCompactSinglePage ? '8mm' : '10mm'),
        paddingRight: printMode ? '6mm' : (isCompactSinglePage ? '8mm' : '10mm'),
        minHeight: printMode ? 'auto' : 'auto'
      }}
    >
      {/* Security Watermark (if active) */}
      {watermark !== 'none' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10 opacity-[0.035] select-none">
          <span className="text-7xl sm:text-8xl font-black uppercase transform -rotate-45 tracking-widest text-slate-900 border-8 border-slate-900 p-8 rounded-3xl">
            {watermark}
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER: LOGO | QR VERIFICACIÓN | CARD INFORME OFICIAL             */}
      {/* ========================================================================= */}
      <header className="relative z-10 pb-2 mb-1.5 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2">
          
          {/* Left: Official Vector Flask Shield + Brand Name & Slogan */}
          <div className="flex items-center gap-2.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 relative flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
                <defs>
                  <linearGradient id="shieldGradVacSheet" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#082133" />
                    <stop offset="60%" stopColor="#0f3456" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                </defs>

                <circle cx="50" cy="50" r="47" fill="url(#shieldGradVacSheet)" stroke="#0284c7" strokeWidth="2" />
                <circle cx="50" cy="50" r="43" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="3 2" />
                
                {/* Caduceus / Medical Cross in Center */}
                <rect x="46" y="24" width="8" height="52" rx="3" fill="#ffffff" />
                <rect x="28" y="42" width="44" height="8" rx="3" fill="#ffffff" />

                {/* Stylized Chemistry Circles */}
                <circle cx="50" cy="24" r="4.5" fill="#38bdf8" />
                <circle cx="34" cy="46" r="3.5" fill="#38bdf8" />
                <circle cx="66" cy="46" r="3.5" fill="#38bdf8" />
                <circle cx="50" cy="68" r="3.5" fill="#38bdf8" />
              </svg>
            </div>

            {/* Typography */}
            <div>
              <div className="flex items-baseline tracking-tight">
                <span className="text-2xl sm:text-3xl font-black text-[#082133] tracking-tighter uppercase font-sans">
                  VAC
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#0284c7] tracking-tighter uppercase font-sans">
                  CLINIC
                </span>
              </div>
              
              <p className="text-[10px] text-teal-800 font-medium italic -mt-0.5">
                "Precisión que diagnostica, confianza que cuida"
              </p>
              <h2 className="text-[9.5px] sm:text-[10px] font-black text-slate-700 tracking-wider uppercase font-sans mt-0.5">
                INFORME DE RESULTADOS DE LABORATORIO CLÍNICO
              </h2>
            </div>
          </div>

          {/* Center: Real QR Code for Document Verification */}
          <div className="hidden sm:flex flex-col items-center justify-center px-2">
            <div className="w-13 h-13 border border-slate-300 rounded-lg p-0.5 bg-white shadow-2xs">
              {headerQrUrl ? (
                <img 
                  src={headerQrUrl} 
                  alt="QR Verificación" 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] font-mono text-slate-400">
                  QR
                </div>
              )}
            </div>
            <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-500 mt-0.5 text-center leading-tight">
              CÓDIGO DE<br />VERIFICACIÓN
            </span>
          </div>

          {/* Right: Dark Rounded Card with Order, Patient Code & Date */}
          <div className="bg-[#082133] text-white py-2 px-3.5 rounded-2xl shadow-sm border border-slate-700/60 text-right flex-shrink-0 min-w-[200px]">
            <div className="text-[9.5px] font-black text-cyan-300 tracking-wider uppercase border-b border-slate-700/80 pb-1 mb-1">
              INFORME OFICIAL DE RESULTADOS
            </div>
            
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-300 font-medium text-[9.5px]">N.° DE ORDEN:</span>
                <span className="font-mono font-black text-cyan-400 text-[11px]">{orderNumber}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-300 font-medium text-[9.5px]">CÓD. PACIENTE:</span>
                <span className="font-mono font-bold text-cyan-400 text-[11px]">{patientCode}</span>
              </div>

              <div className="flex justify-between items-center gap-2 pt-0.5">
                <span className="text-slate-400 text-[9px]">Fecha de Emisión:</span>
                <span className="font-mono text-slate-200 text-[9.5px]">{emissionDateFormatted}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Contact Info Full-Width Strip */}
        <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-700">
          {/* Phone */}
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[9px] shadow-2xs">
              <Phone className="w-2.5 h-2.5" />
            </span>
            <strong className="font-mono text-slate-900">{labPhone}</strong>
          </div>

          {/* Address */}
          <div className="flex items-center gap-1 text-slate-600">
            <MapPin className="w-3 h-3 text-teal-600 flex-shrink-0" />
            <span className="truncate max-w-[280px]">{labAddress}</span>
          </div>

          {/* Email */}
          <div className="flex items-center gap-1 text-slate-600">
            <Mail className="w-3 h-3 text-teal-600 flex-shrink-0" />
            <span className="font-mono text-[9.5px]">{labEmail}</span>
          </div>

          {/* Sanitary Registration */}
          <div className="flex items-center gap-1 text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            <ShieldCheck className="w-3 h-3 text-teal-600" />
            <span>MSPAS Reg. EN TRAMITE</span>
          </div>
        </div>

        {/* Dark Opening Hours Banner */}
        <div className="mt-1.5 bg-[#082133] text-white py-1 px-3 rounded-lg text-[9px] flex items-center justify-center gap-1.5 shadow-2xs">
          <Clock className="w-3 h-3 text-cyan-400 flex-shrink-0" />
          <span>
            <strong>HORARIO DE ATENCIÓN:</strong> Lunes a Viernes: 7:00 a 16:00 · Sábado: 7:00 a 15:00 · Domingo: 7:00 a 11:00
          </span>
        </div>
      </header>


      {/* ========================================================================= */}
      {/* 2. DATOS DEL PACIENTE (Compact 3-column grid)                             */}
      {/* ========================================================================= */}
      <section className="relative z-10 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wide mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-2xs"></span>
          <span>DATOS DEL PACIENTE</span>
        </div>

        <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/70 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1.5 gap-x-4">
            
            {/* Col 1 */}
            <div className="space-y-1">
              <div>
                <span className="text-[9.5px] font-bold text-slate-500 block uppercase tracking-wider">
                  CÓDIGO DE PACIENTE
                </span>
                <span className="font-mono font-bold text-teal-700 text-xs">
                  {patientCode}
                </span>
              </div>

              <div>
                <span className="text-[9.5px] font-bold text-slate-500 block uppercase tracking-wider">
                  MÉDICO REFERENTE
                </span>
                <span className="font-bold text-slate-800 text-xs uppercase">
                  {report.referringDoctor || 'Particular'}
                </span>
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-1">
              <div>
                <span className="text-[9.5px] font-bold text-slate-500 block uppercase tracking-wider">
                  PACIENTE
                </span>
                <strong className="font-black text-slate-950 uppercase text-xs sm:text-[13px] block truncate">
                  {report.patientName}
                </strong>
              </div>

              <div>
                <span className="text-[9.5px] font-bold text-slate-500 block uppercase tracking-wider">
                  CONTACTO / ID
                </span>
                <span className="font-mono text-slate-800 text-xs">
                  {report.patientPhone || report.patientNationalId || '3632 9134'}
                </span>
              </div>
            </div>

            {/* Col 3 */}
            <div className="space-y-1">
              <div>
                <span className="text-[9.5px] font-bold text-slate-500 block uppercase tracking-wider">
                  EDAD / GÉNERO
                </span>
                <span className="font-bold text-slate-800 text-xs">
                  {report.patientAge ? `${report.patientAge} años` : '81 años'} · {report.patientGender === 'M' ? 'Masculino' : 'Femenino'}
                </span>
              </div>

              <div>
                <span className="text-[9.5px] font-bold text-slate-500 block uppercase tracking-wider">
                  CÓDIGO DE ACCESO (PORTAL)
                </span>
                <span className="font-mono font-black text-slate-900 text-xs bg-slate-200/80 px-1.5 py-0.2 rounded inline-block">
                  {accessCode}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. RESULTADOS DE LOS ANÁLISIS CLÍNICOS TITLE BAR                          */}
      {/* ========================================================================= */}
      <section className="relative z-10 mb-2">
        
        {/* Title Bar with Status Legends */}
        <div className="flex items-center justify-between border-b border-[#082133] pb-1 mb-1.5">
          <div className="flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
            <h3 className="text-xs font-black text-[#082133] tracking-wider uppercase">
              RESULTADOS DE LOS ANÁLISIS CLÍNICOS
            </h3>
          </div>

          <div className="flex items-center gap-3 text-[9.5px] font-bold">
            <span className="flex items-center gap-1 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              NORMAL
            </span>
            <span className="flex items-center gap-1 text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              MODERADO (ÁMBAR)
            </span>
            <span className="flex items-center gap-1 text-rose-800">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              CRÍTICO (ROJO)
            </span>
          </div>
        </div>

        {/* Herramienta Visual de Control Demográfico y Rangos (Edad & Sexo) */}
        {enableDemographicTool && (
          <div className="mb-2 print:hidden">
            <ReportAgeSexRangeViewer
              realPatientName={report.patientName}
              realPatientAge={report.patientAge}
              realPatientGender={report.patientGender}
              totalParametersCount={parameters.length}
              normalCount={normalCount}
              amberCount={amberCount}
              redCount={redCount}
              filterState={demographicFilterState}
              onFilterStateChange={setDemographicFilterState}
              isPrintPreview={printMode}
            />
          </div>
        )}

        {/* ======================================================================= */}
        {/* INDIVIDUAL CARDS FOR EACH PROFILE / SECTION                             */}
        {/* ======================================================================= */}
        <div className="space-y-2">
          {parameterSections.map((section) => {
            const sectionTitle = section.title || report.title || 'EXAMEN DE ORINA COMPLETA';

            // Filter parameters within this section based on active demographic filter
            const filteredSectionParams = section.parameters.filter(param => {
              const evalInfo = evaluatedParametersMap.get(param.id);
              if (!evalInfo) return true;
              if (demographicFilterState.filterMode === 'amber-only') return evalInfo.alertLevel === 'amber';
              if (demographicFilterState.filterMode === 'red-only') return evalInfo.alertLevel === 'red';
              if (demographicFilterState.filterMode === 'out-of-range') return evalInfo.isOutOfRange;
              return true;
            });

            if (filteredSectionParams.length === 0 && demographicFilterState.filterMode !== 'all') {
              return null;
            }
            
            return (
              <div 
                key={section.id} 
                className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs"
              >
                {/* Card Header matching user screenshot */}
                <div className="bg-slate-50/90 px-3 py-1.5 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-amber-500 text-sm">⭐</span>
                    <div>
                      <h4 className="text-xs font-black text-[#082133] uppercase tracking-wide">
                        {sectionTitle}
                      </h4>
                      <p className="text-[9.5px] text-slate-500 font-medium -mt-0.5">
                        Perfil personalizado del laboratorio • Rangos según edad y sexo
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] font-black text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded-full font-mono shadow-2xs flex-shrink-0">
                    {filteredSectionParams.length} PARÁMETROS
                  </span>
                </div>

                {/* Card Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-[#e0f2fe] text-[#0369a1] font-black text-[9.5px] uppercase border-b border-sky-200">
                        <th className="py-1 px-3">EXAMEN / PARÁMETRO</th>
                        <th className="py-1 px-2 text-center">RESULTADO OBTENIDO</th>
                        <th className="py-1 px-2 text-center">VALORES DE REFERENCIA</th>
                        {demographicFilterState.showGauges && (
                          <th className="py-1 px-2 text-center w-28 hidden sm:table-cell print:table-cell">CALIBRADOR</th>
                        )}
                        <th className="py-1 px-3 text-center">ESTADO / ALERTA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {filteredSectionParams.map((param, pIdx) => {
                        const evalInfo = evaluatedParametersMap.get(param.id) || evaluateParameterDetailed(
                          param.value,
                          param.referenceRange,
                          param.minVal,
                          param.maxVal,
                          param.status,
                          {
                            patientAge: effectivePatientAge,
                            patientGender: effectivePatientGender,
                            parameterName: param.name
                          }
                        );

                        const isHighlighted = demographicFilterState.highlightEnabled;
                        const isRed = isHighlighted && evalInfo.alertLevel === 'red';
                        const isAmber = isHighlighted && evalInfo.alertLevel === 'amber';
                        const isNormal = evalInfo.alertLevel === 'normal';
                        const hasValue = param.value !== undefined && param.value !== '';

                        // Row padding calculated so 21 parameters fit on 1 sheet
                        const rowPadding = isCompactSinglePage ? 'py-0.5 px-2.5' : 'py-1 px-2.5';

                        return (
                          <tr 
                            key={param.id || `${section.id}-${pIdx}`}
                            className={`transition-colors ${
                              isRed 
                                ? 'bg-rose-50/85 border-l-4 border-l-rose-600 print:bg-rose-50' 
                                : isAmber 
                                  ? 'bg-amber-50/75 border-l-4 border-l-amber-500 print:bg-amber-50' 
                                  : 'hover:bg-slate-50/80'
                            }`}
                          >
                            {/* Param Name with bullet */}
                            <td className={`${rowPadding} font-medium text-slate-900`}>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] leading-none ${
                                  isRed ? 'text-rose-600 font-bold' : isAmber ? 'text-amber-600 font-bold' : 'text-teal-600'
                                }`}>●</span>
                                <span className={`text-[10.5px] ${
                                  isRed ? 'text-rose-950 font-black' : isAmber ? 'text-amber-950 font-black' : 'text-slate-900 font-bold'
                                }`}>
                                  {param.name}
                                </span>
                              </div>
                              {param.notes && (
                                <p className="text-[9px] text-slate-400 font-normal pl-3">
                                  {param.notes}
                                </p>
                              )}
                            </td>

                            {/* Result Value with Amber / Red Highlights */}
                            <td className={`${rowPadding} text-center font-mono text-[10.5px]`}>
                              <span className={`inline-block px-1.5 py-0.5 rounded ${
                                isRed 
                                  ? 'text-rose-950 font-black bg-rose-100 border border-rose-400 ring-1 ring-rose-300 shadow-2xs' 
                                  : isAmber 
                                    ? 'text-amber-950 font-black bg-amber-100 border border-amber-400 ring-1 ring-amber-300 shadow-2xs' 
                                    : 'text-slate-950 font-bold'
                              }`}>
                                {hasValue ? param.value : 'Pendiente'} {param.unit ? <span className="font-normal text-[9.5px] text-slate-600">{param.unit}</span> : ''}
                              </span>
                            </td>

                            {/* Demographic-Specific Reference Range */}
                            <td className={`${rowPadding} text-center font-mono text-[10px]`}>
                              <div className="flex flex-col items-center justify-center">
                                <span className={`font-semibold ${
                                  isRed ? 'text-rose-900 font-bold' : isAmber ? 'text-amber-900 font-bold' : 'text-slate-700'
                                }`}>
                                  {evalInfo.effectiveRange && evalInfo.effectiveRange !== '-' ? (
                                    <span>{evalInfo.effectiveRange} {param.unit && !evalInfo.effectiveRange.includes(param.unit) ? `(${param.unit})` : ''}</span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </span>
                                {evalInfo.demographicRuleApplied && (
                                  <span className={`text-[7.5px] font-sans font-bold px-1 py-0.1 rounded mt-0.5 tracking-tight ${
                                    isRed ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                    isAmber ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {evalInfo.demographicRuleApplied}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Visual Calibration Gauge */}
                            {demographicFilterState.showGauges && (
                              <td className={`${rowPadding} text-center hidden sm:table-cell print:table-cell`}>
                                <div className="flex justify-center items-center">
                                  <ParameterDeviationGauge
                                    gaugePosition={evalInfo.gaugePosition}
                                    gaugeZone={evalInfo.gaugeZone}
                                    alertLevel={evalInfo.alertLevel}
                                    min={evalInfo.min}
                                    max={evalInfo.max}
                                    value={param.value}
                                    compact={true}
                                  />
                                </div>
                              </td>
                            )}

                            {/* Status Pill Badge (Amber vs Red) */}
                            <td className={`${rowPadding} text-center`}>
                              {hasValue ? (
                                <>
                                  {isRed && (
                                    <span className="inline-flex items-center gap-1 text-[8.5px] font-black text-rose-950 bg-rose-100 border border-rose-400 px-2 py-0.5 rounded-full uppercase tracking-tight shadow-2xs">
                                      <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                      <span>{evalInfo.badgeLabel || 'CRÍTICO'}</span>
                                    </span>
                                  )}
                                  {isAmber && (
                                    <span className="inline-flex items-center gap-1 text-[8.5px] font-black text-amber-950 bg-amber-100 border border-amber-400 px-2 py-0.5 rounded-full uppercase tracking-tight shadow-2xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                      <span>{evalInfo.badgeLabel || 'MODERADO'}</span>
                                    </span>
                                  )}
                                  {isNormal && (
                                    <span className="inline-block text-[8.5px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                                      NORMAL
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-slate-400 text-xs font-mono">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            );
          })}
        </div>

      </section>


      {/* ========================================================================= */}
      {/* 4. BLOQUE UNIFICADO DE CIERRE Y FIRMAS (Anti-Page Break / Sin Firmas Solas)*/}
      {/* ========================================================================= */}
      <div className={`avoid-page-break report-signatures-footer relative z-10 space-y-1.5 print:mt-auto print:pt-1 ${
        pinFooterToBottom ? 'mt-auto pt-2' : 'mt-1.5'
      }`}>
        
        {/* Conclusiones Diagnósticas del Especialista (Solo si está habilitado) */}
        {shouldShowConclusions && (
          <div className="bg-teal-50/70 border border-teal-200/90 rounded-lg p-2 text-teal-950 text-[9px] shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-teal-900 uppercase tracking-wider text-[8.5px] mb-0.5">
              <FileText className="w-3 h-3 text-teal-700 flex-shrink-0" />
              <span>Conclusión Diagnóstica / Interpretación Clínica</span>
            </div>
            <p className="leading-snug text-slate-800 font-medium whitespace-pre-line">
              {report.doctorConclusions}
            </p>
          </div>
        )}

        {/* Indicaciones y Recomendaciones Clínicas (Configurable independientemente de las conclusiones) */}
        {shouldShowRecommendations && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[9px] shadow-2xs">
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase tracking-wider text-[8.5px]">
                <CheckCircle2 className="w-3 h-3 text-teal-600 flex-shrink-0" />
                <span>Indicaciones y Recomendaciones Clínicas</span>
              </div>
              <span className="text-[8px] font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.2 rounded-full">
                {cleanRecommendations.length} {cleanRecommendations.length === 1 ? 'indicación' : 'indicaciones'}
              </span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-[8.5px] text-slate-700">
              {cleanRecommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-1.5 leading-tight">
                  <span className="text-teal-600 font-bold text-[8.5px] flex-shrink-0">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Síntesis Explicativa de IA para el Paciente (Opcional) */}
        {shouldShowAiExplanation && (
          <div className="bg-cyan-50/50 border border-cyan-200/80 rounded-lg p-2 text-[9px] text-cyan-950 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-cyan-900 uppercase tracking-wider text-[8.5px] mb-0.5">
              <Sparkles className="w-3 h-3 text-cyan-600 flex-shrink-0" />
              <span>Síntesis Explicativa para el Paciente</span>
            </div>
            <p className="leading-snug text-slate-700">
              {report.patientExplanation}
            </p>
          </div>
        )}

        {/* Post-table notice & thank you */}
        <div className="space-y-0.5">
          <div className="bg-sky-50 border border-sky-200 rounded-lg py-0.5 px-2.5 text-sky-950 text-[9px] flex items-center gap-1.5 shadow-2xs">
            <Info className="w-3 h-3 text-sky-600 flex-shrink-0" />
            <span>
              <strong>Nota:</strong> Los resultados corresponden únicamente a la muestra analizada. Ante cualquier duda, consulte a su médico tratante.
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg py-0.5 px-2 text-center text-[8.5px] italic text-slate-600">
            Gracias por confiar en nosotros para el cuidado de su salud.
          </div>
        </div>

        {/* 4 COLUMNAS DE FIRMAS Y VERIFICACIÓN */}
        {includeSignatures && (
          <section className="border-t border-slate-200 pt-1.5">
            <div className="signatures-grid grid grid-cols-2 sm:grid-cols-4 gap-2 text-center print:grid-cols-4 print:gap-2">
              
              {/* Column 1: Elaborado Por - Priscila Abigail Ramirez Varela */}
              <div className="flex flex-col items-center">
                <div className="w-full border-b border-slate-300 pb-0.5 mb-1 h-8 flex flex-col items-center justify-end">
                  <span className="text-slate-400 text-sm">👤</span>
                </div>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                  ELABORADO POR
                </span>
                <strong className="text-[9.5px] font-black text-[#082133] block leading-tight">
                  Priscila Abigail Ramirez Varela
                </strong>
                <span className="text-[8px] text-slate-500 italic">
                  Elaboración de Resultados
                </span>
              </div>

              {/* Column 2: Visto Bueno - Cristian Javier Arevalo */}
              <div className="flex flex-col items-center relative">
                <div className="w-full border-b border-slate-300 pb-0.5 mb-1 h-8 flex flex-col items-center justify-end relative">
                  {/* Official Circular Digital Stamp Seal */}
                  <div className="absolute -top-3 right-0 opacity-90 pointer-events-none transform rotate-12 scale-75">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-teal-700 flex items-center justify-center p-0.5 bg-teal-50/40">
                      <div className="w-full h-full rounded-full border border-teal-600 flex flex-col items-center justify-center text-[5.5px] font-black text-teal-900 leading-tight uppercase">
                        <span>VACLINIC</span>
                        <span className="text-[5px] text-teal-700 font-bold">VALIDADO</span>
                        <span>Q.B. COL. 4584</span>
                      </div>
                    </div>
                  </div>

                  <span className="font-serif italic text-teal-950 font-black text-xs tracking-widest relative z-10">
                    Cristian J. Arevalo
                  </span>
                </div>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                  VISTO BUENO
                </span>
                <strong className="text-[9.5px] font-black text-[#082133] block leading-tight">
                  CRISTIAN JAVIER AREVALO
                </strong>
                <span className="text-[8px] text-slate-500 italic">
                  Firma del Químico Biólogo
                </span>
              </div>

              {/* Column 3: Autorizado Por - Marlon Varela */}
              <div className="flex flex-col items-center relative">
                <div className="w-full border-b border-slate-300 pb-0.5 mb-1 h-8 flex flex-col items-center justify-end relative">
                  {/* Stamp Line */}
                  <div className="absolute -top-2 right-1 opacity-70 pointer-events-none transform -rotate-6 scale-75">
                    <span className="text-[6px] font-mono text-cyan-800 bg-cyan-50/60 px-1 border border-cyan-400 rounded">
                      REG. MSPAS #1102
                    </span>
                  </div>
                  
                  <span className="font-serif italic text-[#082133] font-black text-xs tracking-widest relative z-10">
                    Marlon Varela
                  </span>
                </div>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                  AUTORIZADO POR
                </span>
                <strong className="text-[9.5px] font-black text-[#082133] block leading-tight">
                  Marlon Varela - Técnico en Lab
                </strong>
                <span className="text-[8px] text-slate-500 italic">
                  Firma del Técnico de Laboratorio
                </span>
              </div>

              {/* Column 4: Verification Box & Real QR Code */}
              <div className="flex flex-col items-center">
                <div className="w-full border-b border-slate-300 pb-0.5 mb-1 h-8 flex flex-col items-center justify-end">
                  <div className="w-6 h-6">
                    {footerQrUrl ? (
                      <img 
                        src={footerQrUrl} 
                        alt="QR Validación" 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[7px] font-mono text-slate-400">
                        QR
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                  VERIFICACIÓN
                </span>
                <strong className="text-[9px] font-black text-[#082133] block leading-tight">
                  Documento oficial VACLINIC
                </strong>
                <span className="text-[7.5px] text-cyan-800 font-mono">
                  Validado {emissionDateFormatted}
                </span>
              </div>

            </div>

            {/* Bottom Indicators Line */}
            <div className="flex items-center justify-between mt-1 text-[8.5px] text-slate-500 font-semibold border-t border-slate-100 pt-0.5">
              <span>▲ Alto &nbsp;&nbsp; ▼ Bajo &nbsp;&nbsp; * Fuera de rango</span>
              <span className="font-mono font-bold text-slate-700">No. de orden: {orderNumber}</span>
            </div>
          </section>
        )}

        {/* BANNER INFERIOR OFICIAL VACLINIC: 4 PILARES */}
        <footer className="report-footer print:mt-1">
          <div className="bg-[#063943] text-white rounded-xl py-1.5 px-3 shadow-sm">
            <div className="signatures-grid grid grid-cols-2 sm:grid-cols-4 gap-2 text-center print:grid-cols-4">
              
              {/* Pillar 1: Tecnología Avanzada */}
              <div className="flex items-center justify-center gap-1.5">
                <Cpu className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="text-[8.5px] font-black tracking-wider uppercase">
                  TECNOLOGÍA AVANZADA
                </span>
              </div>

              {/* Pillar 2: Resultados Confiables */}
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="text-[8.5px] font-black tracking-wider uppercase">
                  RESULTADOS CONFIABLES
                </span>
              </div>

              {/* Pillar 3: Atención Personalizada */}
              <div className="flex items-center justify-center gap-1.5">
                <Users className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="text-[8.5px] font-black tracking-wider uppercase">
                  ATENCIÓN PERSONALIZADA
                </span>
              </div>

              {/* Pillar 4: Compromiso con tu Salud */}
              <div className="flex items-center justify-center gap-1.5">
                <HeartHandshake className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span className="text-[8.5px] font-black tracking-wider uppercase">
                  COMPROMISO CON TU SALUD
                </span>
              </div>

            </div>
          </div>
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
