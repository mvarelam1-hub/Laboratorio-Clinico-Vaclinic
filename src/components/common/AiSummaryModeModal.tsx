import React, { useState, useEffect } from 'react';
import { MedicalReport } from '../../types';
import { 
  Sparkles, 
  X, 
  Bot, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Share2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Heart, 
  Smile, 
  User, 
  Baby, 
  FileText, 
  ArrowRight,
  Stethoscope,
  ShieldCheck,
  Zap,
  BookmarkPlus
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

interface AiSummaryModeModalProps {
  report: MedicalReport;
  isOpen: boolean;
  onClose: () => void;
  onApplyExplanation?: (newExplanation: string) => void;
}

export type SummaryAudience = 'patient_simple' | 'patient_detailed' | 'elderly' | 'pediatric';

interface AiSummaryResult {
  summaryParagraph: string;
  highlights: string[];
  statusEvaluation: 'excelente' | 'estable' | 'atencion' | 'revision_urgente';
  lifestyleAdvice: string;
  nextStep: string;
}

export const AiSummaryModeModal: React.FC<AiSummaryModeModalProps> = ({
  report,
  isOpen,
  onClose,
  onApplyExplanation
}) => {
  const { updateReport, showNotification } = useClinic();
  const [audience, setAudience] = useState<SummaryAudience>('patient_simple');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<AiSummaryResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch or generate AI Summary
  const generateSummary = async (selectedAudience: SummaryAudience) => {
    setIsLoading(true);
    setErrorMsg(null);
    stopAudio();

    try {
      const response = await fetch('/api/ai/summarize-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report,
          audience: selectedAudience
        })
      });

      if (!response.ok) {
        throw new Error('No se pudo conectar con el servicio de IA');
      }

      const resData = await response.json();
      if (resData.success && resData.data) {
        setSummaryData(resData.data);
      } else {
        throw new Error('Respuesta inválida del modelo');
      }
    } catch (err: any) {
      console.error('Error al generar resumen IA:', err);
      // Fallback local heuristic
      const params = report.parameters || [];
      const abnormal = params.filter(p => p.status === 'high' || p.status === 'low' || p.status === 'critical');
      const hasAbnormal = abnormal.length > 0;

      let fallbackText = `Hola ${report.patientName}. Hemos revisado detenidamente los resultados de tu prueba de ${report.title}. `;
      if (!hasAbnormal) {
        fallbackText += `Todos tus parámetros analizados se encuentran dentro de los rangos saludables y normales. Tus defensas y metabolismo muestran un funcionamiento equilibrado. Sigue manteniendo una alimentación balanceada y actividad física regular.`;
      } else {
        fallbackText += `La gran mayoría de tus valores se encuentran en orden, aunque se identifican pequeñas desviaciones en ${abnormal.map(p => p.name).slice(0, 2).join(' y ')}. Tu médico tratante te orientará de forma personalizada para mantener tus niveles en perfecto equilibrio.`;
      }

      setSummaryData({
        summaryParagraph: report.patientExplanation || fallbackText,
        highlights: [
          hasAbnormal ? 'Valores clave con variaciones leves a comentar con tu médico.' : 'Todos los biomarcadores se ubican en rango óptimo.',
          `Total de parámetros revisados: ${params.length}`,
          'Resultados analizados con trazabilidad de laboratorio.'
        ],
        statusEvaluation: hasAbnormal ? 'estable' : 'excelente',
        lifestyleAdvice: 'Recuerda beber agua suficiente y mantener una rutina de descanso de 7 a 8 horas diarias.',
        nextStep: 'Presenta este resultado en tu próxima consulta de control médico.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && report) {
      generateSummary(audience);
    }
    return () => {
      stopAudio();
    };
  }, [isOpen, report?.id]);

  const handleAudienceChange = (newAudience: SummaryAudience) => {
    setAudience(newAudience);
    generateSummary(newAudience);
  };

  // Text to Speech
  const toggleSpeech = () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    if (!summaryData?.summaryParagraph) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(summaryData.summaryParagraph);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.pitch = 1.0;

      utterance.onend = () => {
        setIsPlayingAudio(false);
      };
      utterance.onerror = () => {
        setIsPlayingAudio(false);
      };

      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    } else {
      if (showNotification) {
        showNotification('Tu navegador no soporta lectura por voz.', 'info');
      }
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const handleCopy = () => {
    if (!summaryData?.summaryParagraph) return;
    navigator.clipboard.writeText(summaryData.summaryParagraph);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (showNotification) {
      showNotification('Párrafo explicativo copiado al portapapeles.', 'success');
    }
  };

  const handleShareWhatsApp = () => {
    if (!summaryData?.summaryParagraph) return;
    const text = `*Resumen de Resultados VACLINIC* 🏥\nPaciente: ${report.patientName}\nEstudio: ${report.title}\nFolio: ${report.reportNumber}\n\n*Explicación Clínica Simplificada:*\n${summaryData.summaryParagraph}\n\n_Revisa tu informe oficial en: https://vaclinic.laboratorio.gt_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSaveToReport = async () => {
    if (!summaryData?.summaryParagraph) return;
    const updated: MedicalReport = {
      ...report,
      patientExplanation: summaryData.summaryParagraph
    };
    // BUG real preexistente encontrado al migrar updateReport a la API real:
    // esta llamada pasaba el objeto MedicalReport completo como si fuera el
    // `id` (firma real: updateReport(id, updates)). Nunca se detectó porque
    // useClinic()/ClinicContextType se resuelve como `any` en este proyecto
    // (falta @types/react + no hay "strict"/"noImplicitAny" en tsconfig.json
    // -ver el hallazgo documentado en los commits de pacientes/órdenes), así
    // que tsc jamás marcó el desajuste de firma. En tiempo de ejecución,
    // `id` terminaba siendo el objeto completo, `r.id === id` nunca
    // encontraba coincidencia, y "Guardar Resumen IA en el Informe" no
    // persistía nada -un no-op silencioso. Se corrige aquí pasando el id.
    await updateReport(updated.id, updated);
    if (onApplyExplanation) {
      onApplyExplanation(summaryData.summaryParagraph);
    }
    if (showNotification) {
      showNotification('Resumen IA guardado y fijado en el informe clínico.', 'success');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Gradient & AI Badge */}
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-cyan-950 text-white p-5 sm:p-6 border-b border-teal-500/20 relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-0.5 shadow-lg flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-teal-300 animate-pulse" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-teal-400/20 text-teal-300 px-2.5 py-0.5 rounded-full border border-teal-400/30 flex items-center gap-1">
                    <Bot className="w-3 h-3 text-cyan-300" />
                    Modo Resumen IA
                  </span>
                  <span className="text-xs text-slate-300 font-mono font-bold">
                    {report.reportNumber}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Explicación Simple para el Paciente
                </h2>
                <p className="text-xs text-slate-300">
                  {report.title} • Paciente: <strong className="text-white">{report.patientName}</strong> ({report.patientAge} años)
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                stopAudio();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Audience / Persona Switcher */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none relative z-10">
            <span className="text-[11px] font-bold text-slate-300 whitespace-nowrap flex items-center gap-1 mr-1">
              <User className="w-3.5 h-3.5 text-teal-400" />
              Estilo de Explicación:
            </span>

            <button
              onClick={() => handleAudienceChange('patient_simple')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                audience === 'patient_simple'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <Smile className="w-3.5 h-3.5 text-amber-300" />
              <span>Sencillo & Cotidiano</span>
            </button>

            <button
              onClick={() => handleAudienceChange('patient_detailed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                audience === 'patient_detailed'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-cyan-300" />
              <span>Detallado con Hábitos</span>
            </button>

            <button
              onClick={() => handleAudienceChange('elderly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                audience === 'elderly'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-300" />
              <span>Adulto Mayor (Fácil)</span>
            </button>

            <button
              onClick={() => handleAudienceChange('pediatric')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                audience === 'pediatric'
                  ? 'bg-teal-500 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <Baby className="w-3.5 h-3.5 text-emerald-300" />
              <span>Pediátrico (Para Padres)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {isLoading ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin"></div>
                <Sparkles className="w-6 h-6 text-teal-500 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Generando Párrafo Explicativo con Gemini AI...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                  Traduciendo los {report.parameters?.length || 0} parámetros de laboratorio a un lenguaje cálido y claro adaptado para el paciente.
                </p>
              </div>
            </div>
          ) : summaryData ? (
            <div className="space-y-5">
              
              {/* Main Explanatory Paragraph Card */}
              <div className="bg-gradient-to-br from-teal-50/90 via-cyan-50/60 to-white dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900 border-2 border-teal-300 dark:border-teal-700/60 rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden group">
                <div className="flex items-center justify-between gap-3 mb-3 border-b border-teal-200/60 dark:border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      IA
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-teal-950 dark:text-teal-300">
                        Resumen Clínico para Ti
                      </h4>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {audience === 'elderly' ? 'Modo Adulto Mayor' : audience === 'pediatric' ? 'Modo Padres de Familia' : audience === 'patient_detailed' ? 'Modo Detallado' : 'Modo Simple & Directo'}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {summaryData.statusEvaluation === 'excelente' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Resultados Óptimos
                      </span>
                    )}
                    {summaryData.statusEvaluation === 'estable' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950 px-3 py-1 rounded-full border border-cyan-300 dark:border-cyan-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                        Resultados Estables
                      </span>
                    )}
                    {summaryData.statusEvaluation === 'atencion' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Ajustes Leves
                      </span>
                    )}
                    {summaryData.statusEvaluation === 'revision_urgente' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 px-3 py-1 rounded-full border border-rose-300 dark:border-rose-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Consultar Médico
                      </span>
                    )}
                  </div>
                </div>

                {/* The Paragraph */}
                <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                  {summaryData.summaryParagraph}
                </p>

                {/* Toolbar for Audio / Copy / Share */}
                <div className="mt-5 pt-4 border-t border-teal-200/50 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSpeech}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isPlayingAudio
                          ? 'bg-rose-600 text-white animate-pulse shadow-md'
                          : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <VolumeX className="w-4 h-4" />
                          <span>Pausar Lectura</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span>Escuchar Resumen</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all cursor-pointer"
                      title="Copiar párrafo"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleShareWhatsApp}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs"
                      title="Compartir por WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  <button
                    onClick={() => generateSummary(audience)}
                    className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-200 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Regenerar con IA</span>
                  </button>
                </div>
              </div>

              {/* 3 Key Takeaways & Highlights */}
              {summaryData.highlights && summaryData.highlights.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Puntos Clave del Examen</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {summaryData.highlights.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 flex items-start gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lifestyle Tip & Next Step */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {summaryData.lifestyleAdvice && (
                  <div className="bg-cyan-50/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-cyan-200 dark:border-cyan-900/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-900 dark:text-cyan-300 mb-1">
                      <Heart className="w-4 h-4 text-cyan-600" />
                      <span>Recomendación de Bienestar:</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {summaryData.lifestyleAdvice}
                    </p>
                  </div>
                )}

                {summaryData.nextStep && (
                  <div className="bg-teal-50/70 dark:bg-slate-800/50 rounded-2xl p-4 border border-teal-200 dark:border-teal-900/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-300 mb-1">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      <span>Siguiente Paso Sugerido:</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {summaryData.nextStep}
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-slate-500">No se pudo cargar el resumen.</p>
              <button
                onClick={() => generateSummary(audience)}
                className="mt-3 bg-teal-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Reintentar
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Explicación generada para fines educativos del paciente. No reemplaza el diagnóstico presencial.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToReport}
              disabled={!summaryData?.summaryParagraph}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Guardar esta explicación en el expediente del paciente"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Guardar en Informe Oficial</span>
            </button>

            <button
              onClick={() => {
                stopAudio();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
