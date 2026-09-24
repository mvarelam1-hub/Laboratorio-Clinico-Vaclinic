import React, { useState } from 'react';
import { MedicalReport, ReportParameter } from '../../types';
import { Heart, Droplet, Activity, ShieldCheck, Flame, Zap, ArrowRight, CheckCircle2, AlertTriangle, Sparkles, ChevronRight, Info } from 'lucide-react';

interface BodySystemsMapProps {
  reports: MedicalReport[];
}

interface BodySystem {
  id: string;
  name: string;
  icon: any;
  color: string;
  bgGradient: string;
  biomarkerKeywords: string[];
  roleDescription: string;
  goodAdvice: string[];
}

const BODY_SYSTEMS_CONFIG: BodySystem[] = [
  {
    id: 'cardiovascular',
    name: 'Sistema Cardiovascular & Arterias',
    icon: Heart,
    color: 'text-rose-500',
    bgGradient: 'from-rose-500/10 to-pink-500/10 border-rose-200 dark:border-rose-900/50',
    biomarkerKeywords: ['colesterol', 'hdl', 'ldl', 'vldl', 'triglicéridos', 'aterogénico', 'cardio'],
    roleDescription: 'Bombea y distribuye oxígeno y nutrientes a todos los tejidos a través de arterias y capilares sin acumulación de placa lipídica.',
    goodAdvice: [
      'Priorizar grasas insaturadas (aguacate, aceite de oliva virgen extra)',
      'Realizar 30 minutos de caminata a paso firme 5 días a la semana',
      'Mantener consumo regular de ajo, avena y nueces para elasticidad vascular'
    ]
  },
  {
    id: 'hematologico',
    name: 'Sistema Hematológico & Defensas',
    icon: Droplet,
    color: 'text-red-500',
    bgGradient: 'from-red-500/10 to-rose-500/10 border-red-200 dark:border-red-900/50',
    biomarkerKeywords: ['eritrocitos', 'hemoglobina', 'hematocrito', 'leucocitos', 'linfocitos', 'plaquetas', 'vcm'],
    roleDescription: 'Transporta oxígeno celular mediante hemoglobina y defiende al organismo contra bacterias, virus y agentes extraños.',
    goodAdvice: [
      'Consumir fuentes de hierro hemo y no hemo con cítricos ricos en vitamina C',
      'Dormir 7 a 8 horas diarias para regeneración celular medular',
      'Adecuada hidratación con agua pura a lo largo del día'
    ]
  },
  {
    id: 'metabolico',
    name: 'Metabolismo & Función Hepática',
    icon: Flame,
    color: 'text-amber-500',
    bgGradient: 'from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-900/50',
    biomarkerKeywords: ['glucosa', 'glicosilada', 'hba1c', 'tgo', 'tgp', 'ast', 'alt', 'ácido úrico'],
    roleDescription: 'Procesa carbohidratos, almacena glucógeno, desintoxica fármacos y metaboliza los lípidos corporales.',
    goodAdvice: [
      'Evitar azúcares añadidos, jarabe de maíz y refrescos',
      'Incorporar vegetales amargos y crucíferas (brócoli, alcachofas)',
      'Cenar al menos 2 horas antes de ir a dormir'
    ]
  },
  {
    id: 'renal',
    name: 'Sistema Renal & Vías Urinarias',
    icon: Activity,
    color: 'text-cyan-500',
    bgGradient: 'from-cyan-500/10 to-blue-500/10 border-cyan-200 dark:border-cyan-900/50',
    biomarkerKeywords: ['creatinina', 'urea', 'orina', 'ph urinario', 'densidad', 'sedimento'],
    roleDescription: 'Filtra las toxinas sanguíneas, regula el equilibrio de agua y electrolitos, y controla la presión arterial sistémica.',
    goodAdvice: [
      'Beber al menos 2 litros de agua pura al día',
      'Moderar la sal y alimentos ultraprocesados ricos en sodio',
      'Evitar el uso indiscriminado de analgésicos antiinflamatorios (AINEs)'
    ]
  },
  {
    id: 'endocrino',
    name: 'Sistema Endocrino & Tiroides',
    icon: Zap,
    color: 'text-indigo-500',
    bgGradient: 'from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-900/50',
    biomarkerKeywords: ['tsh', 't4', 't3', 'tiroides', 'hormona'],
    roleDescription: 'Regula la velocidad del metabolismo basal, la temperatura corporal, la energía y el ritmo cardíaco.',
    goodAdvice: [
      'Garantizar consumo de sal yodada y mariscos/pescados',
      'Manejar los niveles de estrés y cortisol con técnicas de respiración',
      'Monitorear cambios súbitos de peso o energía con su médico'
    ]
  }
];

export const BodySystemsMap: React.FC<BodySystemsMapProps> = ({ reports }) => {
  const [selectedSystemId, setSelectedSystemId] = useState<string>('cardiovascular');

  // Collect all parameters from reports
  const allParams = reports.flatMap(r => r.parameters);

  const getSystemAnalysis = (system: BodySystem) => {
    const matchedParams = allParams.filter(p =>
      system.biomarkerKeywords.some(kw => p.name.toLowerCase().includes(kw))
    );

    // Eliminate duplicates if present (keep newest)
    const map = new Map<string, ReportParameter>();
    matchedParams.forEach(p => map.set(p.name, p));
    const uniqueParams: ReportParameter[] = Array.from(map.values());

    const total = uniqueParams.length;
    const alertCount = uniqueParams.filter(p => p.status !== 'normal').length;
    const normalCount = total - alertCount;

    let score = 100;
    if (total > 0) {
      score = Math.round((normalCount / total) * 100);
    }

    let statusText = 'Óptimo';
    let statusColor = 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300';
    if (alertCount > 0 && alertCount < 3) {
      statusText = 'En Observación';
      statusColor = 'text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300';
    } else if (alertCount >= 3) {
      statusText = 'Requiere Atención';
      statusColor = 'text-rose-700 bg-rose-100 dark:bg-rose-950 dark:text-rose-300';
    }

    return {
      uniqueParams,
      total,
      alertCount,
      score,
      statusText,
      statusColor
    };
  };

  const selectedSystem = BODY_SYSTEMS_CONFIG.find(s => s.id === selectedSystemId) || BODY_SYSTEMS_CONFIG[0];
  const activeAnalysis = getSystemAnalysis(selectedSystem);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Explorador de Salud por Sistemas Corporales
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              Vista Fisiológica
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Revisa el estado funcional de tus órganos principales según los biomarcadores de tus análisis clínicos.
          </p>
        </div>
      </div>

      {/* Systems Grid Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {BODY_SYSTEMS_CONFIG.map((system) => {
          const Icon = system.icon;
          const analysis = getSystemAnalysis(system);
          const isSelected = selectedSystemId === system.id;

          return (
            <button
              key={system.id}
              onClick={() => setSelectedSystemId(system.id)}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 text-white border-teal-500 ring-2 ring-teal-500/30 shadow-lg scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-teal-400 hover:shadow'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${isSelected ? 'bg-slate-800 text-teal-400' : 'bg-slate-100 dark:bg-slate-700 ' + system.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? 'bg-teal-900/80 text-teal-300 border border-teal-700' : analysis.statusColor}`}>
                    {analysis.score}%
                  </span>
                </div>
                <h4 className="text-xs font-black tracking-tight line-clamp-1">
                  {system.name.split('&')[0]}
                </h4>
                <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  {analysis.total} parámetros evaluados
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                <span className={isSelected ? 'text-teal-300 font-bold' : 'text-slate-500'}>
                  {analysis.statusText}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-400' : 'text-slate-400'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected System Deep Dive Card */}
      <div className={`rounded-2xl p-6 border shadow-sm bg-gradient-to-br ${selectedSystem.bgGradient} bg-white dark:bg-slate-900`}>
        
        {/* Deep Dive Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-md ${selectedSystem.color}`}>
              {React.createElement(selectedSystem.icon, { className: 'w-7 h-7' })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedSystem.name}
                </h3>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${activeAnalysis.statusColor}`}>
                  {activeAnalysis.statusText}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                {selectedSystem.roleDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-white dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Índice de Salud
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {activeAnalysis.score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </span>
            </div>
            <div className="w-10 h-10 rounded-full border-4 border-teal-500 flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400">
              {activeAnalysis.score}%
            </div>
          </div>
        </div>

        {/* Parameters in this system */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Biomarkers List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              Biomarcadores Analizados en este Sistema
            </h4>

            {activeAnalysis.uniqueParams.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-white/60 dark:bg-slate-800/60 p-4 rounded-xl">
                No hay análisis recientes registrados para este sistema específico en tu historial actual.
              </p>
            ) : (
              <div className="space-y-2">
                {activeAnalysis.uniqueParams.map((param, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {param.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Ref: {param.referenceRange}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {param.value}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          {param.unit}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        param.status === 'normal'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {param.status === 'normal' ? 'Óptimo' : 'Atención'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations & Tips for this system */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Recomendaciones Clínicas Personalizadas
            </h4>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              {selectedSystem.goodAdvice.map((advice, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span>{advice}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-[11px] text-teal-900 dark:text-teal-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <span>
                Los resultados corresponden a los análisis emitidos y verificados con firma digital. Si experimentas síntomas agudos, contacta a tu centro de salud.
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
