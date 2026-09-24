import React, { useState, useMemo } from 'react';
import { ReportTemplate, TemplateAiAuditResult, MedicalReport } from '../../types';
import { useClinic } from '../../context/ClinicContext';
import { TubeBadge } from '../common/TubeBadge';
import { analyzeTubesForParameters, LAB_TUBE_REGISTRY } from '../../utils/sampleTubeRegistry';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Layers, 
  ArrowRight, 
  Award, 
  Activity, 
  Zap, 
  Copy, 
  Check, 
  RotateCw, 
  Save, 
  Info,
  ChevronRight,
  Sliders,
  HelpCircle,
  FlaskConical,
  Clock,
  BellRing,
  Droplet,
  ListOrdered
} from 'lucide-react';

interface TemplateAiAuditModalProps {
  template: ReportTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  auditResult: TemplateAiAuditResult | null;
  isLoading: boolean;
  onReaudit: (focusStandard: string) => void;
  selectedFocusStandard: string;
  setSelectedFocusStandard: (focus: string) => void;
}

export const TemplateAiAuditModal: React.FC<TemplateAiAuditModalProps> = ({
  template,
  isOpen,
  onClose,
  auditResult,
  isLoading,
  onReaudit,
  selectedFocusStandard,
  setSelectedFocusStandard
}) => {
  const { setActiveReportToEdit, setStaffActiveTab, patients, addTemplate, updateTemplate } = useClinic();
  const [activeTab, setActiveTab] = useState<'gaps' | 'tubes' | 'params' | 'structure' | 'optimized'>('gaps');
  const [copied, setCopied] = useState(false);
  const [savedAsNew, setSavedAsNew] = useState(false);

  // Compute or format complete CLSI tube breakdown by test parameter
  const tubeAuditSummary = useMemo(() => {
    if (!template) {
      return {
        parametersMap: [],
        tubesGrouped: [],
        totalTubesRequired: 0,
        requiresMultipleTubes: false,
        orderOfDrawList: [],
        estimatedBloodVolumeMl: 0,
        preanalyticalWarning: ''
      };
    }

    const paramsToEval = auditResult?.optimizedTemplate?.parameters?.length
      ? auditResult.optimizedTemplate.parameters
      : template.defaultParameters || [];

    return analyzeTubesForParameters(
      paramsToEval.map((p) => ({
        name: p.name,
        category: (p as any).category || template.category,
        sampleType: p.sampleType || auditResult?.sampleTypeSuggested || template.sampleType,
        tubeType: (p as any).tubeType
      })),
      template.category
    );
  }, [auditResult, template]);

  if (!isOpen || !template) return null;

  const handleApplyToRedactor = () => {
    if (!auditResult) return;
    const opt = auditResult.optimizedTemplate;

    const reportParams = opt.parameters.map((p, idx) => ({
      ...p,
      id: `param-ai-${Date.now()}-${idx}`,
      sampleType: p.sampleType || auditResult.sampleTypeSuggested || template.sampleType || 'Suero sanguíneo'
    }));

    const preNotes = opt.preanalyticalNotes 
      ? `[PREANALÍTICA ISO 15189]: ${opt.preanalyticalNotes}\n[ALERTA DE PÁNICO]: ${opt.panicAlertRule || auditResult.panicAlertNote || 'Comunicación inmediata'}`
      : '';

    const newReport: MedicalReport = {
      id: '',
      reportNumber: '',
      patientId: patients[0]?.id || '',
      patientName: patients[0]?.fullName || 'Paciente de Prueba',
      patientNationalId: patients[0]?.nationalId || '00000000',
      patientAge: patients[0]?.age || 35,
      patientGender: patients[0]?.gender || 'M',
      category: opt.category || template.category,
      title: opt.name || template.name,
      sampleDate: new Date().toISOString(),
      emissionDate: new Date().toISOString(),
      laboratoryName: 'VACLINIC - Laboratorio Clínico',
      status: 'borrador',
      sampleType: auditResult.sampleTypeSuggested || template.sampleType || 'Suero sanguíneo',
      parameters: reportParams,
      clinicalFindings: '',
      doctorConclusions: '',
      patientExplanation: '',
      recommendations: opt.recommendations || template.defaultRecommendations || [],
      notesToStaff: preNotes,
      qrVerificationCode: ''
    };

    setActiveReportToEdit(newReport);
    setStaffActiveTab('redactor');
    onClose();
  };

  const handleSaveOptimizedTemplate = () => {
    if (!auditResult) return;
    const opt = auditResult.optimizedTemplate;

    const upgraded: ReportTemplate = {
      id: `${template.id}-iso-${Date.now().toString().slice(-4)}`,
      name: opt.name || `${template.name} (Alineado ISO/CLSI)`,
      category: opt.category || template.category,
      description: opt.description || template.description,
      defaultParameters: opt.parameters,
      defaultRecommendations: opt.recommendations,
      sampleType: auditResult.sampleTypeSuggested,
      preanalyticalNotes: opt.preanalyticalNotes,
      panicAlertRule: auditResult.panicAlertNote,
      complianceStandard: 'ISO 15189:2022 & CLSI',
      complianceScore: auditResult.complianceScore,
      lastAuditedAt: new Date().toISOString()
    };

    addTemplate(upgraded);
    // Also update existing template with last audited score
    updateTemplate(template.id, {
      complianceScore: auditResult.complianceScore,
      lastAuditedAt: new Date().toISOString()
    });

    setSavedAsNew(true);
    setTimeout(() => setSavedAsNew(false), 3000);
  };

  const handleCopySummary = () => {
    if (!auditResult) return;
    const text = `AUDITORÍA DE ESTÁNDARES INTERNACIONALES (ISO 15189 / CLSI / CAP)
Plantilla: ${template.name}
Puntaje de Conformidad: ${auditResult.complianceScore}% (${auditResult.rating})

RESUMEN EJECUTIVO:
${auditResult.executiveSummary}

BRECHAS DETECTADAS:
${auditResult.structuralGaps.map(g => `• [${g.standard}] (${g.severity.toUpperCase()}): ${g.title} - ${g.suggestedFix}`).join('\n')}

PARÁMETROS SUGERIDOS:
${auditResult.missingOrEnhancedParameters.map(p => `• ${p.name} (${p.unit}): ${p.referenceRange} | Metodología: ${p.methodology || 'N/A'}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Color for score badge
  const score = auditResult?.complianceScore || 0;
  const scoreBadgeColor = 
    score >= 85 ? 'text-emerald-700 bg-emerald-50 border-emerald-300' :
    score >= 70 ? 'text-amber-700 bg-amber-50 border-amber-300' :
    'text-rose-700 bg-rose-50 border-rose-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="template-ai-audit-modal"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-5 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-inner">
              <Sparkles className="w-5 h-5 text-teal-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-500/30">
                  Auditoría IA de Estándares Internacionales
                </span>
                <span className="text-[11px] text-slate-300">
                  ISO 15189:2022 • CLSI • CAP • IFCC
                </span>
              </div>
              <h2 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                <span>{template.name}</span>
                <span className="text-xs font-normal text-slate-400">({template.category})</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
            title="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Focus Standard Selector Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Sliders className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-bold text-slate-700">Norma de referencia prioritaria:</span>
            <select
              value={selectedFocusStandard}
              onChange={(e) => {
                setSelectedFocusStandard(e.target.value);
                onReaudit(e.target.value);
              }}
              disabled={isLoading}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">Todas las Normas (Multi-Norma Global)</option>
              <option value="iso15189">ISO 15189:2022 (Gestión de Calidad & Preanalítica)</option>
              <option value="clsi">CLSI EP28 / GP33-A (Intervalos Biológicos & Legibilidad)</option>
              <option value="cap">CAP Laboratory Accreditation (Valores de Pánico & Métodos)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onReaudit(selectedFocusStandard)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-teal-50 text-teal-800 font-bold border border-teal-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
              <span>{isLoading ? 'Auditando...' : 'Re-auditar'}</span>
            </button>
            <button
              onClick={handleCopySummary}
              disabled={!auditResult}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copiado' : 'Copiar Informe'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-teal-100 border-t-teal-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-teal-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Auditando estructura clínica con IA...
                </h3>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  Comparando analitos, unidades de medida, condiciones preanalíticas e intervalos biológicos contra ISO 15189:2022, CLSI EP28 y directrices CAP.
                </p>
              </div>
            </div>
          ) : !auditResult ? (
            <div className="py-12 text-center text-slate-500">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No se pudo cargar el análisis</p>
              <button
                onClick={() => onReaudit(selectedFocusStandard)}
                className="mt-3 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold"
              >
                Reintentar Auditoría
              </button>
            </div>
          ) : (
            <>
              {/* Score & Executive Summary Card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  
                  {/* Score pill */}
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 ${scoreBadgeColor}`}>
                      <div className="text-center">
                        <span className="text-2xl font-black font-mono tracking-tight leading-none block">
                          {auditResult.complianceScore}%
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider block mt-0.5">
                          Conformidad
                        </span>
                      </div>
                      <div className="h-8 w-px bg-current opacity-20" />
                      <div>
                        <span className="text-xs font-black block">
                          {auditResult.rating}
                        </span>
                        <span className="text-[10px] opacity-80 block">
                          ISO 15189 & CLSI Gap Analysis
                        </span>
                      </div>
                    </div>

                    {/* Preanalytical Highlights */}
                    <div className="hidden lg:flex flex-col gap-1.5 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                        <span>Espécimen: <strong className="text-slate-800">{auditResult.sampleTypeSuggested || 'Suero estandarizado'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ayuno: <strong className="text-slate-800">{auditResult.fastingRequired || '8 a 12 horas'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Droplet className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="text-slate-500">Tubos ({tubeAuditSummary.totalTubesRequired}):</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {tubeAuditSummary.tubesGrouped.slice(0, 2).map((g, idx) => (
                            <TubeBadge key={idx} tube={g.tube} size="xs" />
                          ))}
                          {tubeAuditSummary.tubesGrouped.length > 2 && (
                            <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1 py-0.5 rounded">
                              +{tubeAuditSummary.tubesGrouped.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Standards Checklist Badges */}
                  <div className="flex flex-wrap gap-2">
                    {auditResult.standardsEvaluated.map((std, idx) => (
                      <div 
                        key={idx}
                        className={`text-[11px] px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 font-medium ${
                          std.status === 'cumple' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          std.status === 'parcial' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                          'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                        title={std.findings}
                      >
                        {std.status === 'cumple' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> :
                         std.status === 'parcial' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> :
                         <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                        <span className="font-bold">{std.code}</span>
                        <span className="font-mono text-[10px] opacity-75">({std.score}%)</span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Executive Summary paragraph */}
                <div className="pt-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Dictamen Ejecutivo de Calidad:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {auditResult.executiveSummary}
                  </p>
                </div>

                {/* Panic Alert Rule Banner if present */}
                {auditResult.panicAlertNote && (
                  <div className="mt-3 bg-red-50/80 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-900">
                    <BellRing className="w-4 h-4 text-red-600 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <strong className="font-bold text-red-950 block">Requisito de Alerta Crítica (Valores de Pánico - CAP / ISO):</strong>
                      <span className="text-[11px] text-red-800 leading-snug">{auditResult.panicAlertNote}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 gap-1 sm:gap-2 overflow-x-auto pb-px">
                <button
                  onClick={() => setActiveTab('gaps')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'gaps'
                      ? 'border-teal-600 text-teal-900 bg-teal-50/50 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Brechas & Estándares ({auditResult.structuralGaps.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('tubes')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'tubes'
                      ? 'border-teal-600 text-teal-900 bg-teal-50/50 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Droplet className="w-3.5 h-3.5 text-rose-500" />
                  <span>Tubos & Preanalítica CLSI ({tubeAuditSummary.totalTubesRequired})</span>
                  {tubeAuditSummary.requiresMultipleTubes && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Requiere múltiples contenedores" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('params')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'params'
                      ? 'border-teal-600 text-teal-900 bg-teal-50/50 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Parámetros & Unidades SI ({auditResult.missingOrEnhancedParameters.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('structure')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'structure'
                      ? 'border-teal-600 text-teal-900 bg-teal-50/50 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Estructura Recomendada</span>
                </button>

                <button
                  onClick={() => setActiveTab('optimized')}
                  className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'optimized'
                      ? 'border-teal-600 text-teal-900 bg-teal-50/50 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Plantilla Optimizada ISO</span>
                </button>
              </div>

              {/* Tab 1: Structural Gaps */}
              {activeTab === 'gaps' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Hallazgos clasificados por severidad y cláusula de acreditación:</span>
                    <span className="font-semibold text-slate-700">
                      {auditResult.structuralGaps.filter(g => g.severity === 'alta').length} críticas •{' '}
                      {auditResult.structuralGaps.filter(g => g.severity === 'media').length} moderadas
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {auditResult.structuralGaps.map((gap, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          gap.severity === 'alta' ? 'bg-rose-50/60 border-rose-200' :
                          gap.severity === 'media' ? 'bg-amber-50/60 border-amber-200' :
                          'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md ${
                              gap.severity === 'alta' ? 'bg-rose-600 text-white' :
                              gap.severity === 'media' ? 'bg-amber-600 text-white' :
                              'bg-slate-600 text-white'
                            }`}>
                              Severidad {gap.severity}
                            </span>
                            <span className="text-xs font-bold font-mono text-slate-600">
                              {gap.standard}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-xs font-black text-slate-900 mb-1">
                          {gap.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">
                          {gap.description}
                        </p>

                        <div className="bg-white/90 rounded-lg p-2.5 border border-slate-200/80 flex items-start gap-2 text-xs">
                          <Zap className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span className="text-slate-800">
                            <strong>Acción Correctiva Sugerida:</strong> {gap.suggestedFix}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Strengths Section */}
                  {auditResult.strengths?.length > 0 && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Fortalezas encontradas en la plantilla actual:
                      </span>
                      <ul className="space-y-1 text-xs text-emerald-900">
                        {auditResult.strengths.map((str, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: CLSI Tube Differentiation by Test */}
              {activeTab === 'tubes' && (
                <div className="space-y-4">
                  {/* Diagnostic Banner */}
                  <div className="bg-gradient-to-r from-teal-50 via-sky-50 to-indigo-50 border border-teal-200 rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-white rounded-xl shadow-2xs border border-teal-200 text-teal-700 shrink-0">
                          <Droplet className="w-5 h-5 text-rose-500 fill-rose-100" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 flex-wrap">
                            <span>Diferenciación de Tubos por Parámetro Analítico</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-200">
                              CLSI H3-A6 & ISO 15189 §7.4
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Asignación estandarizada de tubos de vacío, aditivo anticoagulante, volumen de flebotomía y secuencia de llenado.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="bg-white/90 border border-teal-200 px-3 py-1.5 rounded-xl text-center shadow-2xs">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Tubos</span>
                          <span className="text-xs font-black text-teal-900">
                            {tubeAuditSummary.totalTubesRequired} {tubeAuditSummary.totalTubesRequired === 1 ? 'Contenedor' : 'Contenedores'}
                          </span>
                        </div>
                        <div className="bg-white/90 border border-sky-200 px-3 py-1.5 rounded-xl text-center shadow-2xs">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Vol. Sangre</span>
                          <span className="text-xs font-black text-sky-900">~{tubeAuditSummary.estimatedBloodVolumeMl} mL</span>
                        </div>
                      </div>
                    </div>

                    {/* Preanalytical Multitube Safety Warning */}
                    {tubeAuditSummary.requiresMultipleTubes ? (
                      <div className="mt-3 bg-amber-50/90 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block text-amber-900">Alerta de Seguridad Preanalítica (Plantilla Multitubo):</strong>
                          <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                            {tubeAuditSummary.preanalyticalWarning || 'Esta plantilla agrupa pruebas que no pueden procesarse en un único tubo. Se requiere extraer múltiples tubos en estricto orden de llenado CLSI para evitar contaminación cruzada de aditivos químicos.'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 bg-emerald-50/90 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[11px]">
                          <strong>Plantilla Monotubo Homogénea:</strong> Todas las pruebas coinciden en la misma matriz biológica y aditivo, lo que minimiza el volumen de extracción del paciente.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Grouped Tubes Cards */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-slate-700">Contenedores Requeridos y Pruebas Asignadas:</span>
                      <span className="text-[11px]">Ordenados según protocolo de flebotomía CLSI</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tubeAuditSummary.tubesGrouped.map((group, idx) => (
                        <div 
                          key={idx}
                          className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <TubeBadge tube={group.tube} size="md" />
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-mono">
                                {group.drawOrderIndex}° Extracción
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-600 mt-2 mb-3">
                              <div className="flex items-center justify-between text-[11px] border-b border-slate-100 pb-1">
                                <span className="text-slate-400">Aditivo / Anticoagulante:</span>
                                <span className="font-medium text-slate-800 text-right truncate max-w-[200px]" title={group.tube.additive}>
                                  {group.tube.additive}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] border-b border-slate-100 pb-1">
                                <span className="text-slate-400">Espécimen Biológico:</span>
                                <span className="font-medium text-slate-800">{group.tube.sampleMatrix}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] border-b border-slate-100 pb-1">
                                <span className="text-slate-400">Inversiones requeridas:</span>
                                <span className="font-bold text-teal-700">{group.tube.inversions}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">Volumen recomendado:</span>
                                <span className="font-mono text-slate-700 font-semibold">{group.tube.recommendedVolume}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                              Pruebas asignadas a este tubo ({group.parameters.length}):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {group.parameters.map((paramName, pIdx) => (
                                <span 
                                  key={pIdx}
                                  className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-medium border border-slate-200/80"
                                >
                                  {paramName}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Complete Parameter-to-Tube Mapping Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs mt-4">
                    <div className="bg-slate-100 px-4 py-2.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider grid grid-cols-12 gap-2">
                      <div className="col-span-4">Parámetro / Analito</div>
                      <div className="col-span-3">Tubo Recomendado</div>
                      <div className="col-span-3">Aditivo & Espécimen</div>
                      <div className="col-span-2 text-right">Orden Flebotomía</div>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                      {tubeAuditSummary.parametersMap.map((item, idx) => (
                        <div key={idx} className="px-4 py-2 text-xs grid grid-cols-12 gap-2 hover:bg-slate-50 items-center">
                          <div className="col-span-4 font-bold text-slate-900">
                            {item.parameterName}
                          </div>
                          <div className="col-span-3">
                            <TubeBadge tube={item.tube} size="sm" />
                          </div>
                          <div className="col-span-3 text-[11px] text-slate-600 truncate" title={`${item.tube.additive} - ${item.tube.sampleMatrix}`}>
                            {item.tube.additive}
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md">
                              {item.drawOrderText}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order of Draw Sequential Guide (CLSI H3-A6) */}
                  {tubeAuditSummary.requiresMultipleTubes && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700">
                      <div className="flex items-center gap-2 mb-2 font-bold text-slate-900">
                        <ListOrdered className="w-4 h-4 text-teal-600" />
                        <span>Secuencia Estandarizada de Llenado (Orden de Extracción CLSI):</span>
                      </div>
                      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {tubeAuditSummary.orderOfDrawList.map((step, idx) => (
                          <li key={idx} className="bg-white border border-slate-200 rounded-xl p-2 text-[11px] flex items-center gap-2 shadow-2xs">
                            <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="truncate font-medium text-slate-800">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Missing or Enhanced Parameters */}
              {activeTab === 'params' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    Parámetros analíticos con unidades del Sistema Internacional (SI), intervalos estratificados y valores de pánico:
                  </div>

                  <div className="space-y-2.5">
                    {auditResult.missingOrEnhancedParameters.map((param, idx) => (
                      <div 
                        key={idx}
                        className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-teal-300 transition-colors shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              param.action === 'agregar' 
                                ? 'bg-teal-100 text-teal-800 border border-teal-200' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {param.action === 'agregar' ? '+ Agregar a Plantilla' : '⚙ Modificar Rango/Unidad'}
                            </span>
                            <h4 className="text-xs font-black text-slate-900">{param.name}</h4>
                          </div>

                          <div className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {param.unit}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs my-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              Intervalo Biológico Refinado (CLSI EP28):
                            </span>
                            <span className="font-semibold text-slate-800">{param.referenceRange}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">
                              Metodología Trazable:
                            </span>
                            <span className="font-semibold text-slate-800">{param.methodology || 'Ensayo estandarizado'}</span>
                          </div>
                        </div>

                        {param.panicRange && param.panicRange !== 'N/A' && (
                          <div className="text-[11px] text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md mb-2 flex items-center gap-1.5 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span><strong>Límite Crítico / Pánico (CAP):</strong> {param.panicRange}</span>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-500 leading-snug">
                          <strong>Justificación clínica:</strong> {param.clinicalReason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Recommended Structure */}
              {activeTab === 'structure' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-500">
                    Secciones formales que debe contener el informe final para cumplir la cláusula 7.4 de ISO 15189:2022:
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {auditResult.suggestedSections.map((sec, idx) => (
                      <div 
                        key={idx}
                        className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </div>
                            <h4 className="text-xs font-black text-slate-900">{sec.sectionName}</h4>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {sec.standardRef}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 pl-8">
                          {sec.recommendation}
                        </p>
                        <div className="pl-8 pt-1">
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                            Requisito: {sec.importance}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Clinical Recommendations from standards */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Recomendaciones Médicas Basadas en Guías de Práctica Clínica:
                    </span>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {auditResult.improvedRecommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 4: Optimized Template Preview */}
              {activeTab === 'optimized' && (
                <div className="space-y-4">
                  <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-black text-teal-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>{auditResult.optimizedTemplate.name}</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white px-2 py-0.5 rounded-md">
                        Estructura Acreditada
                      </span>
                    </div>
                    <p className="text-xs text-teal-800 leading-relaxed mb-3">
                      {auditResult.optimizedTemplate.description}
                    </p>

                    {auditResult.optimizedTemplate.preanalyticalNotes && (
                      <div className="text-[11px] text-teal-900 bg-white/80 p-2.5 rounded-xl border border-teal-200/70 mb-2">
                        <strong>Condición Preanalítica:</strong> {auditResult.optimizedTemplate.preanalyticalNotes}
                      </div>
                    )}
                  </div>

                  {/* Parameters Table */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-100 px-4 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider grid grid-cols-12 gap-2">
                      <div className="col-span-5">Parámetro y Tubo CLSI</div>
                      <div className="col-span-2">Unidad SI</div>
                      <div className="col-span-2">Rango Referencia</div>
                      <div className="col-span-3">Metodología</div>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {auditResult.optimizedTemplate.parameters.map((p, idx) => (
                        <div key={idx} className="px-4 py-2.5 text-xs grid grid-cols-12 gap-2 hover:bg-slate-50 items-center">
                          <div className="col-span-5 flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900">{p.name}</span>
                            <TubeBadge 
                              testName={p.name} 
                              category={auditResult.optimizedTemplate.category} 
                              sampleType={p.sampleType || auditResult.sampleTypeSuggested} 
                              size="xs" 
                            />
                          </div>
                          <div className="col-span-2 font-mono text-slate-600">{p.unit}</div>
                          <div className="col-span-2 text-slate-700 font-medium text-[11px]">{p.referenceRange}</div>
                          <div className="col-span-3 text-[11px] text-slate-500 truncate">{p.methodology || 'Estandarizado'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            {savedAsNew ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                ¡Plantilla optimizada guardada en la biblioteca local!
              </span>
            ) : (
              <span>Las mejoras aplican requisitos de ISO 15189:2022 y CLSI EP28-A3c</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSaveOptimizedTemplate}
              disabled={!auditResult || isLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              title="Guardar plantilla con mejoras en la biblioteca permanente"
            >
              <Save className="w-3.5 h-3.5 text-slate-600" />
              <span>Guardar en Biblioteca</span>
            </button>

            <button
              onClick={handleApplyToRedactor}
              disabled={!auditResult || isLoading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Aplicar y Abrir en Redactor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
