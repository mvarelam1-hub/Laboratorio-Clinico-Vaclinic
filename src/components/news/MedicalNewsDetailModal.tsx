import React, { useState } from 'react';
import { MedicalNewsItem } from '../../data/medicalNews';
import { 
  X, 
  Calendar, 
  Clock, 
  Share2, 
  Printer, 
  FlaskConical, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  Bookmark, 
  Stethoscope, 
  ChevronRight,
  HelpCircle,
  Activity,
  Bot
} from 'lucide-react';

interface MedicalNewsDetailModalProps {
  news: MedicalNewsItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTest?: (testName: string) => void;
}

export const MedicalNewsDetailModal: React.FC<MedicalNewsDetailModalProps> = ({
  news,
  isOpen,
  onClose,
  onSelectTest
}) => {
  const [copied, setCopied] = useState(false);
  const [showAiExplainer, setShowAiExplainer] = useState(false);

  if (!isOpen || !news) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${news.badgeColor}`}>
              {news.categoryLabel}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
              Boletín Médico VACLINIC
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              title="Compartir noticia"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
              title="Imprimir resumen médico"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* Main Title & Metadata */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                {news.date}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {news.readTime}
              </span>
              <span>&bull;</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Fuente: {news.source}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {news.title}
            </h1>

            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-3 border-teal-500 pl-3">
              {news.subtitle}
            </p>
          </div>

          {/* Quick AI Explainer Toggle */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 p-4 rounded-2xl border border-teal-200 dark:border-teal-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-950 dark:text-teal-200">
                <Bot className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>¿Qué significa esta noticia para mi salud cotidiana?</span>
              </div>
              <button
                onClick={() => setShowAiExplainer(!showAiExplainer)}
                className="text-xs font-black text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
              >
                {showAiExplainer ? 'Ocultar resumen' : 'Ver explicación fácil'}
              </button>
            </div>

            {showAiExplainer && (
              <div className="pt-2 text-xs text-teal-900 dark:text-teal-300 leading-relaxed border-t border-teal-200 dark:border-teal-800 animate-fade-in space-y-1.5">
                <p>
                  <strong>En resumen para el paciente:</strong> Esta actualización médica demuestra que no es necesario esperar a sentirte mal para revisar tu salud. Los nuevos métodos de laboratorio en VACLINIC permiten detectar desbalances en etapas tempranas cuando aún son completamente tratables y prevenibles.
                </p>
                <p className="text-[11px] text-teal-800 dark:text-teal-400">
                  Si presentas síntomas relacionados o tienes antecedentes en tu familia, un chequeo preventivo con las pruebas indicadas abajo te brindará certeza diagnóstica inmediata.
                </p>
              </div>
            )}
          </div>

          {/* Clinical Impact Callout */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <Activity className="w-4 h-4 text-rose-500" />
              <span>Impacto en el Diagnóstico Clínico:</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {news.clinicalImpact}
            </p>
          </div>

          {/* Full Article Text Content */}
          <div className="space-y-3.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {news.fullArticle.map((para, idx) => (
              <p key={idx} className="leading-relaxed">
                {para}
              </p>
            ))}
          </div>

          {/* Warning Signs (if applicable) */}
          {news.warningSigns && news.warningSigns.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Signos de Alarma y Cuándo Consultar al Médico:</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-900 dark:text-amber-200">
                {news.warningSigns.map((sign, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Associated Laboratory Diagnostic Tests in VACLINIC */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Pruebas Diagnósticas Disponibles en VACLINIC</span>
              </h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Alta Tecnología
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {news.diagnosticTests.map((t, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-cyan-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded font-bold text-slate-700 dark:text-slate-300">
                        {t.code}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {t.purpose}
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/50256125563?text=${encodeURIComponent(`Hola VACLINIC, deseo información y cotización sobre la prueba: ${t.name} (${t.code})`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900/80 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-teal-200 dark:border-teal-800"
                  >
                    <span>Cotizar Prueba</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Key Recommendations */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recomendaciones del Comité Científico VACLINIC:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-emerald-900 dark:text-emerald-300">
              {news.keyRecommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0">✓</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
              Temas:
            </span>
            {news.tags.map((tg, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full"
              >
                #{tg}
              </span>
            ))}
          </div>

        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Información elaborada con fines educativos y de orientación diagnóstica.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <a
              href="https://wa.me/50256125563?text=Hola%20VACLINIC,%20quisiera%20agendar%20un%20chequeo%20de%20laboratorio"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Agendar Chequeo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
