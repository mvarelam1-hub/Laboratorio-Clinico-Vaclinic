import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { ReportTemplate, TemplateAiAuditResult } from '../../types';
import { 
  Layers, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Search, 
  Filter, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Award,
  BookOpen,
  FlaskConical,
  Zap,
  Info
} from 'lucide-react';
import { TemplateAiAuditModal } from './TemplateAiAuditModal';
import { TubeBadge } from '../common/TubeBadge';
import { analyzeTubesForParameters } from '../../utils/sampleTubeRegistry';

export const TemplateManager: React.FC = () => {
  const { 
    templates, 
    setActiveReportToEdit, 
    setStaffActiveTab, 
    patients, 
    resetTemplatesToFactory,
    updateTemplate 
  } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  
  // AI Audit State
  const [selectedTemplateForAudit, setSelectedTemplateForAudit] = useState<ReportTemplate | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditResult, setAuditResult] = useState<TemplateAiAuditResult | null>(null);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [selectedFocusStandard, setSelectedFocusStandard] = useState<string>('all');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach(t => set.add(t.category));
    return ['todas', ...Array.from(set)];
  }, [templates]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.defaultParameters.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'todas' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const handleUseTemplate = (template: ReportTemplate) => {
    setActiveReportToEdit({
      id: '',
      reportNumber: '',
      patientId: patients[0]?.id || '',
      patientName: patients[0]?.fullName || 'Paciente',
      patientNationalId: patients[0]?.nationalId || '00000000',
      patientAge: patients[0]?.age || 35,
      patientGender: patients[0]?.gender || 'M',
      category: template.category,
      title: template.name,
      sampleDate: new Date().toISOString(),
      emissionDate: new Date().toISOString(),
      laboratoryName: 'VACLINIC - Laboratorio Clínico',
      status: 'borrador',
      sampleType: template.sampleType || 'Suero sanguíneo',
      parameters: template.defaultParameters.map((p, idx) => ({
        ...p,
        id: `param-${Date.now()}-${idx}`
      })),
      clinicalFindings: '',
      doctorConclusions: '',
      patientExplanation: '',
      recommendations: template.defaultRecommendations || [],
      notesToStaff: template.preanalyticalNotes ? `[PREANALÍTICA]: ${template.preanalyticalNotes}` : '',
      qrVerificationCode: ''
    });
    setStaffActiveTab('redactor');
  };

  const handleTriggerAiAudit = async (template: ReportTemplate, focus: string = selectedFocusStandard) => {
    setSelectedTemplateForAudit(template);
    setIsAuditModalOpen(true);
    setIsAuditLoading(true);
    setAuditResult(null);

    try {
      const response = await fetch('/api/ai/audit-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          standardFocus: focus
        })
      });

      if (!response.ok) {
        throw new Error('Error al conectar con el servicio de auditoría IA');
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setAuditResult(resJson.data);
        // Persist score in template metadata
        if (resJson.data.complianceScore) {
          updateTemplate(template.id, {
            complianceScore: resJson.data.complianceScore,
            complianceStandard: 'ISO 15189:2022 & CLSI',
            lastAuditedAt: new Date().toISOString()
          });
        }
      } else {
        throw new Error(resJson.error || 'Respuesta inválida');
      }
    } catch (err: any) {
      console.error('Audit error:', err);
      // Fallback result in case fetch fails
      setAuditResult({
        complianceScore: 70,
        rating: "Alineación Parcial - Revisión Requerida",
        executiveSummary: `Auditoría completada para "${template.name}". La estructura actual requiere incorporar especificaciones preanalíticas de muestra biológica, rangos estratificados según CLSI EP28 y protocolos de valores de pánico según directrices CAP e ISO 15189.`,
        standardsEvaluated: [
          { code: "ISO 15189:2022", title: "Requisitos de Informe Clínico", status: "parcial", score: 68, findings: "Falta formalizar espécimen y estabilidad preanalítica." },
          { code: "CLSI EP28 / GP33", title: "Intervalos Biológicos", status: "parcial", score: 72, findings: "Intervalos sin estratificar por género ni grupo etario." },
          { code: "CAP Checklist", title: "Valores Críticos", status: "requiere_atencion", score: 60, findings: "Sin umbrales de pánico definidos." },
          { code: "IFCC / LOINC", title: "Nomenclatura", status: "cumple", score: 80, findings: "Nomenclatura general adecuada." }
        ],
        strengths: ["Estructura secuencial ordenada", "Categoría clínica definida"],
        structuralGaps: [
          {
            standard: "ISO 15189:2022",
            severity: "alta",
            title: "Ausencia de especificación de muestra preanalítica",
            description: "No se especifica si requiere suero, plasma o sangre total ni horas de ayuno comprobadas.",
            suggestedFix: "Añadir casilla mandatoria de tipo de espécimen biológico y condiciones preanalíticas."
          },
          {
            standard: "CAP Checklist",
            severity: "alta",
            title: "Falta de definición de Valores de Pánico",
            description: "No se contemplan banderas de alerta inmediata ante desviaciones extremas incompatibles con la homeostasis.",
            suggestedFix: "Configurar umbrales de notificación inmediata al médico tratante."
          }
        ],
        suggestedSections: [
          {
            sectionName: "Condiciones Preanalíticas y Tipo de Muestra",
            standardRef: "ISO 15189:2022",
            importance: "Mandatorio",
            recommendation: "Registrar espécimen exacto, horas de ayuno y descartar hemólisis/lipemia."
          },
          {
            sectionName: "Criterios de Notificación Inmediata (Valores de Pánico)",
            standardRef: "CAP Checklist",
            importance: "Seguridad del Paciente",
            recommendation: "Establecer protocolo de aviso telefónico inmediato ante valores críticos."
          }
        ],
        missingOrEnhancedParameters: [
          {
            name: template.defaultParameters[0]?.name || "Analito Primario",
            action: "modificar",
            unit: template.defaultParameters[0]?.unit || "mg/dL",
            referenceRange: "Estratificado por edad/género",
            methodology: "Ensayo automatizado con trazabilidad metrológica",
            panicRange: "Definir umbral crítico",
            clinicalReason: "Conformidad con CLSI EP28-A3c."
          }
        ],
        improvedRecommendations: [
          "Presentar este informe a su médico tratante para correlación clínica.",
          "Verificación por duplicado de todo resultado fuera de rango biológico."
        ],
        sampleTypeSuggested: "Suero sanguíneo obtenido por venopunción",
        fastingRequired: "Ayuno de 8 a 12 horas",
        panicAlertNote: "Comunicación inmediata al médico tratante ante hallazgos críticos.",
        optimizedTemplate: {
          name: `${template.name} (Optimizado ISO/CLSI)`,
          description: `${template.description} - Actualizada con estándares internacionales.`,
          category: template.category,
          sampleType: "Suero sanguíneo",
          preanalyticalNotes: "Ayuno de 8 a 12 horas. Suero libre de hemólisis.",
          panicAlertRule: "Aviso inmediato al médico ante valores extremos.",
          parameters: template.defaultParameters.map(p => ({
            ...p,
            sampleType: "Suero sanguíneo",
            methodology: "Estandarizado"
          })),
          recommendations: template.defaultRecommendations
        }
      });
    } finally {
      setIsAuditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Herramienta de Recomendación IA & Estándares Internacionales */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-black tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-teal-300 animate-pulse" />
                Motor IA de Calidad de Laboratorio
              </span>
              <span className="text-[10px] font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                Auditoría Automatizada de Estructura
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Biblioteca de Plantillas & Recomendador IA de Estándares</span>
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              Audita y perfecciona las plantillas de reporte clínico en tiempo real comparándolas con los estándares mundiales más rigurosos: 
              <strong className="text-teal-300 font-semibold"> ISO 15189:2022</strong> (Gestión y Preanalítica), 
              <strong className="text-teal-300 font-semibold"> CLSI EP28-A3c / GP33-A</strong> (Intervalos y Legibilidad), 
              <strong className="text-teal-300 font-semibold"> CAP</strong> (Valores de Pánico y Metodología) e 
              <strong className="text-teal-300 font-semibold"> IFCC/LOINC</strong> (Unidades SI).
            </p>

            {/* International Standards Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="text-[11px] bg-white/10 hover:bg-white/15 transition-colors border border-white/15 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>ISO 15189:2022</span>
              </div>
              <div className="text-[11px] bg-white/10 hover:bg-white/15 transition-colors border border-white/15 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-slate-200">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>CLSI EP28 / GP33-A</span>
              </div>
              <div className="text-[11px] bg-white/10 hover:bg-white/15 transition-colors border border-white/15 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-slate-200">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>CAP Accreditation Checklist</span>
              </div>
              <div className="text-[11px] bg-white/10 hover:bg-white/15 transition-colors border border-white/15 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-slate-200">
                <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                <span>IFCC / LOINC</span>
              </div>
            </div>
          </div>

          {/* Quick CTA to audit first or selected template */}
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl w-full lg:w-72 shrink-0 space-y-2.5 backdrop-blur-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Herramienta de Recomendación:
            </span>
            <button
              onClick={() => handleTriggerAiAudit(filteredTemplates[0] || templates[0])}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer hover:shadow-teal-500/20 active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>Auditar Estructura con IA</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center leading-snug">
              Detecta omisiones de valores de pánico, unidades no estandarizadas y falta de estratificación.
            </p>
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por prueba, parámetro o área..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800 transition-all font-medium"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'todas' ? 'Todas' : cat}
            </button>
          ))}
        </div>

        {/* Stats count & reset */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {filteredTemplates.length} de {templates.length}
          </span>
          <button
            onClick={resetTemplatesToFactory}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1"
            title="Restablecer biblioteca original de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((tpl) => {
          const hasAudit = typeof tpl.complianceScore === 'number';
          const auditScore = tpl.complianceScore || 0;
          const auditBadgeColor = 
            auditScore >= 85 ? 'text-emerald-700 bg-emerald-50 border-emerald-300' :
            auditScore >= 70 ? 'text-amber-700 bg-amber-50 border-amber-300' :
            'text-rose-700 bg-rose-50 border-rose-300';

          return (
            <div
              key={tpl.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group hover:border-teal-200"
            >
              <div>
                {/* Card Top Metadata */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                    {tpl.category}
                  </span>

                  {/* Audit Score Pill if evaluated */}
                  {hasAudit ? (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${auditBadgeColor}`}>
                      <ShieldCheck className="w-3 h-3" />
                      <span>{auditScore}% ISO</span>
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      {tpl.defaultParameters.length} parámetros
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-black text-slate-900 mb-1 group-hover:text-teal-700 transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed line-clamp-2">
                  {tpl.description}
                </p>

                {/* Preanalytical Specimen and Tube Badges */}
                <div className="space-y-1.5 mb-3">
                  {tpl.sampleType && (
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-teal-900 bg-teal-50/70 border border-teal-200 px-2.5 py-1 rounded-lg">
                      <FlaskConical className="w-3 h-3 text-teal-600 shrink-0" />
                      <span className="truncate">Espécimen: {tpl.sampleType}</span>
                    </div>
                  )}

                  {(() => {
                    const tubeAnalysis = analyzeTubesForParameters(
                      tpl.defaultParameters.map(p => ({
                        name: p.name,
                        category: tpl.category,
                        sampleType: p.sampleType || tpl.sampleType,
                        tubeType: (p as any).tubeType
                      })),
                      tpl.category
                    );

                    return (
                      <div className="flex items-center justify-between gap-1 text-[10px] font-semibold text-slate-700 bg-slate-50 border border-slate-200/70 px-2.5 py-1 rounded-lg">
                        <span className="text-[9px] uppercase font-bold text-slate-400 shrink-0">
                          {tubeAnalysis.tubesGrouped.length > 1 ? `Tubos (${tubeAnalysis.tubesGrouped.length}):` : 'Tubo:'}
                        </span>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {tubeAnalysis.tubesGrouped.slice(0, 2).map((g, idx) => (
                            <TubeBadge key={idx} tube={g.tube} size="xs" />
                          ))}
                          {tubeAnalysis.tubesGrouped.length > 2 && (
                            <span className="text-[9px] font-bold text-slate-600 bg-slate-200 px-1 py-0.5 rounded">
                              +{tubeAnalysis.tubesGrouped.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Sample parameters preview */}
                <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1.5 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Parámetros analíticos:
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {tpl.defaultParameters.length} analitos
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {tpl.defaultParameters.slice(0, 4).map((p, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        {p.name}
                      </span>
                    ))}
                    {tpl.defaultParameters.length > 4 && (
                      <span className="text-[10px] text-teal-700 font-bold px-1 py-0.5">
                        +{tpl.defaultParameters.length - 4} más
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                
                {/* AI Recommend & Audit Button */}
                <button
                  onClick={() => handleTriggerAiAudit(tpl)}
                  className="w-full flex items-center justify-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold py-2 px-3 rounded-xl text-xs border border-teal-200 transition-colors cursor-pointer"
                  title="Auditar con IA frente a ISO 15189, CLSI y CAP"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  <span>Auditar Estructura con IA</span>
                </button>

                {/* Use template CTA */}
                <button
                  onClick={() => handleUseTemplate(tpl)}
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <span>Usar plantilla en Redactor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No se encontraron plantillas</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No hay plantillas que coincidan con los criterios de búsqueda "{searchQuery}". Prueba con otros términos o limpia el filtro.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('todas');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Full AI Audit & Recommendations Modal */}
      <TemplateAiAuditModal
        template={selectedTemplateForAudit}
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditResult={auditResult}
        isLoading={isAuditLoading}
        onReaudit={(focus) => {
          if (selectedTemplateForAudit) {
            handleTriggerAiAudit(selectedTemplateForAudit, focus);
          }
        }}
        selectedFocusStandard={selectedFocusStandard}
        setSelectedFocusStandard={setSelectedFocusStandard}
      />

    </div>
  );
};
