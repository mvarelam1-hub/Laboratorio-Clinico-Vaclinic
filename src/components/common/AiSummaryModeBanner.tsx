import React, { useState } from 'react';
import { MedicalReport } from '../../types';
import { 
  Sparkles, 
  Bot, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Share2, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Heart,
  SlidersHorizontal
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';

interface AiSummaryModeBannerProps {
  report: MedicalReport;
  onOpenModal?: () => void;
  defaultExpanded?: boolean;
}

export const AiSummaryModeBanner: React.FC<AiSummaryModeBannerProps> = ({
  report,
  onOpenModal,
  defaultExpanded = true
}) => {
  const { showNotification } = useClinic();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [customExplanation, setCustomExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const displayText = customExplanation || report.patientExplanation || '';

  // Text to Speech
  const toggleSpeech = () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }

    if (!displayText) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(displayText);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95;

      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

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
    if (!displayText) return;
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    if (showNotification) {
      showNotification('Párrafo explicativo copiado.', 'success');
    }
  };

  const handleRegenerate = async () => {
    setIsLoading(true);
    stopAudio();
    try {
      const response = await fetch('/api/ai/summarize-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, audience: 'patient_simple' })
      });
      const data = await response.json();
      if (data.success && data.data?.summaryParagraph) {
        setCustomExplanation(data.data.summaryParagraph);
        if (showNotification) {
          showNotification('Resumen IA regenerado exitosamente.', 'success');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-slate-500/5 dark:from-teal-950/40 dark:via-slate-900 dark:to-cyan-950/30 rounded-3xl border-2 border-teal-500/30 dark:border-teal-500/40 p-5 shadow-sm space-y-4 relative overflow-hidden">
      
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 text-slate-950 flex items-center justify-center shadow-md flex-shrink-0">
            <Sparkles className="w-5 h-5 text-slate-950 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
                Gemini 3.7 Flash
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Traducción Clínica Automática
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Modo de Resumen IA: Explicación Simple del Estudio</span>
            </h3>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenModal && (
            <button
              onClick={onOpenModal}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Abrir visor completo de Resumen IA interactivo con audio y estilos"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Personalizar & Escuchar</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-teal-500/10 transition-colors cursor-pointer"
            title={isExpanded ? 'Contraer resumen' : 'Expandir resumen'}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="space-y-4 pt-1 border-t border-teal-500/20 relative z-10">
          {isLoading ? (
            <div className="py-6 flex items-center justify-center gap-3 text-teal-600 dark:text-teal-400 text-xs font-bold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Redactando párrafo explicativo con IA...</span>
            </div>
          ) : displayText ? (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-teal-500/20 space-y-3">
              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
                {displayText}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSpeech}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isPlayingAudio
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-teal-50 dark:bg-slate-700 text-teal-800 dark:text-teal-300 hover:bg-teal-100'
                    }`}
                  >
                    {isPlayingAudio ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Escuchar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-1 text-teal-700 dark:text-teal-400 hover:underline font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerar Párrafo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/60 dark:bg-slate-800/60 rounded-2xl p-4 text-center space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Aún no se ha generado la explicación en lenguaje simple para este estudio.
              </p>
              <button
                onClick={handleRegenerate}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generar Resumen IA Ahora</span>
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
