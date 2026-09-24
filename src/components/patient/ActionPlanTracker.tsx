import React, { useState } from 'react';
import { MedicalReport } from '../../types';
import confetti from 'canvas-confetti';
import { CheckCircle2, Circle, Trophy, Share2, CalendarPlus, Sparkles, Flame, Heart, ArrowRight, Activity, Smile } from 'lucide-react';

interface ActionPlanTrackerProps {
  report: MedicalReport;
}

export const ActionPlanTracker: React.FC<ActionPlanTrackerProps> = ({ report }) => {
  const defaultItems = report.recommendations.map((rec, index) => ({
    id: `rec-${index}`,
    text: rec,
    completed: false
  }));

  const [checklist, setChecklist] = useState(defaultItems);
  const [targetLdl, setTargetLdl] = useState<number>(100);
  const [exerciseMinutes, setExerciseMinutes] = useState<number>(30);
  const [waterGlasses, setWaterGlasses] = useState<number>(8);

  const completedCount = checklist.filter(item => item.completed).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  const handleToggle = (id: string) => {
    const updated = checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);

    const nowCompleted = updated.filter(i => i.completed).length;
    if (nowCompleted === checklist.length && checklist.length > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `📋 *Mi Plan de Salud & Recomendaciones Médicas - ${report.laboratoryName}*\n` +
      `Estudio: ${report.title}\n\n` +
      `Indicaciones del médico:\n` +
      checklist.map((c, i) => `${i + 1}. ${c.text}`).join('\n') +
      `\n\n_Seguimiento personal mediante VACLINIC Laboratorio Clínico Portal_`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleAddToCalendar = () => {
    const title = encodeURIComponent(`Control Médico: ${report.title}`);
    const details = encodeURIComponent(`Revisión de recomendaciones:\n${checklist.map(c => c.text).join('\n')}`);
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=20260915T090000Z/20260915T100000Z`;
    window.open(gCalUrl, '_blank');
  };

  // Simulated Score Projection
  const baseScore = 78;
  const bonus = (targetLdl < 120 ? 10 : 0) + (exerciseMinutes >= 30 ? 8 : 4) + (waterGlasses >= 6 ? 4 : 0);
  const projectedScore = Math.min(100, baseScore + bonus);

  return (
    <div className="space-y-6">
      
      {/* Daily Progress Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-500/40 border border-teal-300/30 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-300" />
                Hábitos y Cuidado Diario
              </span>
            </div>
            <h3 className="text-xl font-black">
              Plan de Acción Clínico
            </h3>
            <p className="text-xs text-teal-100 mt-1 max-w-md">
              Cumple con las pautas indicadas por el {report.signature?.doctorName || 'especialista'} para optimizar tus biomarcadores.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 flex items-center gap-4 self-start md:self-auto">
            <div className="text-right">
              <span className="text-xs text-teal-200 font-bold block">Progreso de Hoy</span>
              <span className="text-2xl font-black">{completedCount} de {checklist.length}</span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-amber-400 flex items-center justify-center font-black text-sm text-white">
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-teal-900/60 rounded-full h-2 mt-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-300 to-emerald-400 h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Interactive Checklist & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Checklist */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              Recomendaciones Médicas Activas
            </h4>
            <span className="text-xs text-slate-400">
              Haz clic para marcar como cumplido
            </span>
          </div>

          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                  item.completed
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                }`}
              >
                <div className="mt-0.5 text-teal-600 dark:text-teal-400 flex-shrink-0">
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 hover:text-teal-500" />
                  )}
                </div>

                <div className="flex-1">
                  <p className={`text-xs font-medium leading-relaxed ${
                    item.completed
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Share Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-3">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Compartir en WhatsApp
            </button>
            <button
              onClick={handleAddToCalendar}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Agendar en Google Calendar
            </button>
          </div>
        </div>

        {/* Right Col: Goal Simulator */}
        <div className="bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-teal-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
              Simulador de Metas de Salud
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Ajusta tus objetivos para calcular la proyección estimada de tu puntaje cardiovascular y metabólico.
          </p>

          {/* Sliders */}
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Meta Colesterol LDL</span>
                <span className="font-bold text-teal-600">{targetLdl} mg/dL</span>
              </div>
              <input
                type="range"
                min="70"
                max="160"
                step="5"
                value={targetLdl}
                onChange={(e) => setTargetLdl(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <span className="text-[10px] text-slate-400">Meta ideal médica: &lt; 100 mg/dL</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Minutos de Ejercicio al Día</span>
                <span className="font-bold text-teal-600">{exerciseMinutes} min</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={exerciseMinutes}
                onChange={(e) => setExerciseMinutes(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <span className="text-[10px] text-slate-400">Recomendado: 30 - 45 min diarios</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Vasos de Agua al Día</span>
                <span className="font-bold text-teal-600">{waterGlasses} vasos</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={waterGlasses}
                onChange={(e) => setWaterGlasses(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <span className="text-[10px] text-slate-400">Recomendado: 8 vasos (2 Litros)</span>
            </div>
          </div>

          {/* Projected Score Result */}
          <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Puntaje Proyectado
              </span>
              <span className="text-xl font-black text-teal-600 dark:text-teal-400">
                {projectedScore} / 100
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {projectedScore >= 90 ? 'Excelente' : 'Muy Bueno'}
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
