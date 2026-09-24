import React, { useState } from 'react';
import { ReportParameter, ParameterStatus } from '../../types';
import { Info, AlertCircle, CheckCircle2, AlertTriangle, HelpCircle, X, ArrowUpRight, ArrowDownRight, Activity, Sparkles, Filter, Search, SlidersHorizontal } from 'lucide-react';

interface BiomarkerVisualizerProps {
  parameters: ReportParameter[];
  category?: string;
  onOpenAiSummary?: () => void;
}

interface EducationalDetail {
  title: string;
  description: string;
  causes: string[];
  tips: string[];
  idealRangeText: string;
}

const BIOMARKER_KNOWLEDGE: Record<string, EducationalDetail> = {
  'colesterol total': {
    title: 'Colesterol Total',
    description: 'Suma de todos los tipos de colesterol en tu torrente sanguíneo. Es esencial para la producción de membranas celulares y hormonas, pero en exceso se deposita en las arterias.',
    causes: ['Dieta rica en grasas saturadas o trans', 'Sedentarismo', 'Predisposición genética', 'Estrés crónico'],
    tips: ['Consumir avena, nueces, aguacate y aceite de oliva', 'Realizar al menos 150 min semanales de ejercicio aeróbico', 'Reducir embutidos y bollería'],
    idealRangeText: 'Menor a 200 mg/dL'
  },
  'colesterol ldl': {
    title: 'Colesterol LDL ("Malo")',
    description: 'Lipoproteína de baja densidad que transporta colesterol a los tejidos. Su exceso favorece la formación de placas ateroscleróticas en las arterias.',
    causes: ['Consumo de grasas animales y frituras', 'Falta de actividad física', 'Sobrepeso o tabaquismo'],
    tips: ['Priorizar fibra vegetal soluble', 'Consumir pescado azul rico en Omega-3 (salmón, sardinas)', 'Evitar azúcares refinados'],
    idealRangeText: 'Óptimo menor a 100 mg/dL'
  },
  'colesterol hdl': {
    title: 'Colesterol HDL ("Bueno")',
    description: 'Lipoproteína de alta densidad que recoge el exceso de colesterol de las arterias y lo transporta al hígado para su eliminación.',
    causes: ['Niveles bajos suelen relacionarse con sedentarismo, tabaco y dietas ricas en carbohidratos refinados'],
    tips: ['El ejercicio regular eleva el HDL de manera comprobada', 'Consumir grasas monoinsaturadas (aceite de oliva)', 'Dejar de fumar'],
    idealRangeText: 'Mayor a 40 mg/dL (hombres) o > 50 mg/dL (mujeres)'
  },
  'triglicéridos': {
    title: 'Triglicéridos',
    description: 'Principal tipo de grasa almacenada por el cuerpo como reserva de energía. Se eleva rápidamente con el consumo de harinas refinadas, dulces y alcohol.',
    causes: ['Exceso de azúcares, refrescos y pan dulce', 'Consumo frecuente de alcohol', 'Resistencia a la insulina'],
    tips: ['Eliminar bebidas azucaradas y jugos procesados', 'Sustituir harinas blancas por granos integrales', 'Pérdida de 5-10% del peso corporal'],
    idealRangeText: 'Menor a 150 mg/dL'
  },
  'glucosa': {
    title: 'Glucosa en Ayunas',
    description: 'Nivel de azúcar disponible en sangre tras al menos 8 horas de ayuno. Fuente primaria de combustible para el cerebro y células.',
    causes: ['Resistencia a la insulina', 'Prediabetes o Diabetes', 'Estrés agudo', 'Dieta alta en carbohidratos simples'],
    tips: ['Distribuir comidas con bajo índice glucémico', 'Caminar 10-15 minutos después de comer', 'Mantener hidratación constante'],
    idealRangeText: '70 - 99 mg/dL'
  },
  'hemoglobina': {
    title: 'Hemoglobina',
    description: 'Proteína dentro de los glóbulos rojos encargada de transportar oxígeno desde los pulmones a todos los órganos del cuerpo.',
    causes: ['Baja: deficiencia de hierro, anemia, pérdidas sanguíneas', 'Alta: deshidratación, vivir a gran altitud, tabaquismo'],
    tips: ['Consumir alimentos ricos en hierro (lentejas, espinacas, carnes magras) con vitamina C para fijación', 'Buena hidratación'],
    idealRangeText: '13.0 - 17.0 g/dL (Hombres) / 12.0 - 15.5 g/dL (Mujeres)'
  },
  'tsh': {
    title: 'TSH (Hormona Tiroestimulante)',
    description: 'Producida por la hipófisis para indicarle a la tiroides cuánta hormona tiroidea fabricar. Refleja el ritmo metabólico general.',
    causes: ['Alta: Hipotiroidismo (tiroides lenta)', 'Baja: Hipertiroidismo (tiroides hiperactiva)'],
    tips: ['Garantizar ingesta adecuada de selenio y zinc en la dieta', 'Consultar con especialista en caso de fatiga o cambios térmicos'],
    idealRangeText: '0.40 - 4.20 µUI/mL'
  },
  'plaquetas': {
    title: 'Plaquetas (Trombocitos)',
    description: 'Fragmentos celulares esenciales para la coagulación y cicatrización de vasos sanguíneos.',
    causes: ['Bajas: infecciones virales, autoinmunidad', 'Altas: inflamación reactiva, recuperación postinfecciosa'],
    tips: ['Mantener controles regulares', 'Informar si nota moretones espontáneos o sangrado de encías'],
    idealRangeText: '150,000 - 450,000 /mm³'
  }
};

export const BiomarkerVisualizer: React.FC<BiomarkerVisualizerProps> = ({ parameters, onOpenAiSummary }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'alert' | 'normal'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBio, setSelectedBio] = useState<{ param: ReportParameter; detail: EducationalDetail } | null>(null);
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');

  const filteredParams = parameters.filter((param) => {
    const matchesSearch = param.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          param.referenceRange.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterStatus === 'alert') return param.status === 'high' || param.status === 'low' || param.status === 'critical';
    if (filterStatus === 'normal') return param.status === 'normal';
    return true;
  });

  const getStatusBadge = (status: ParameterStatus) => {
    switch (status) {
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Normal
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Elevado
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <ArrowDownRight className="w-3.5 h-3.5" />
            Bajo
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-400 dark:border-rose-700 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            Crítico
          </span>
        );
    }
  };

  const getKnowledgeForParam = (param: ReportParameter): EducationalDetail => {
    const key = Object.keys(BIOMARKER_KNOWLEDGE).find(k => param.name.toLowerCase().includes(k));
    if (key) return BIOMARKER_KNOWLEDGE[key];

    return {
      title: param.name,
      description: `Parámetro de laboratorio clínico evaluado con un valor de ${param.value} ${param.unit}. El rango de referencia estándar para este análisis es ${param.referenceRange}.`,
      causes: ['Variaciones biológicas individuales', 'Factores metabólicos o nutricionales', 'Respuesta inmunitaria o adaptativa'],
      tips: ['Consulte con su médico tratante para contextualizar este resultado dentro de su cuadro clínico integral', 'Mantenga un estilo de vida saludable'],
      idealRangeText: param.referenceRange
    };
  };

  // Calculate percentage on gauge bar
  const calculateGaugePercent = (param: ReportParameter): number => {
    const numVal = typeof param.value === 'number' ? param.value : parseFloat(param.value);
    if (isNaN(numVal)) return 50;

    if (param.status === 'normal') return 50;
    if (param.status === 'low') return 20;
    if (param.status === 'high') return 80;
    if (param.status === 'critical') return 95;
    return 50;
  };

  return (
    <div className="space-y-4">
      {/* Controls: Search, Filter & Layout toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar biomarcador (ej. Colesterol, Glucosa, Leucocitos)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Todos ({parameters.length})
          </button>
          <button
            onClick={() => setFilterStatus('alert')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === 'alert'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Fuera de Rango ({parameters.filter(p => p.status !== 'normal').length})
          </button>
          <button
            onClick={() => setFilterStatus('normal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              filterStatus === 'normal'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            Óptimos ({parameters.filter(p => p.status === 'normal').length})
          </button>
        </div>

        {/* Layout toggle & AI Summary Button */}
        <div className="flex items-center gap-2">
          {onOpenAiSummary && (
            <button
              onClick={onOpenAiSummary}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 hover:from-teal-500/30 hover:to-cyan-500/30 text-teal-700 dark:text-teal-300 border border-teal-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              title="Abrir Modo Resumen IA para explicar los biomarcadores"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
              <span>Modo Resumen IA</span>
            </button>
          )}

          <div className="hidden md:flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewLayout('cards')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${viewLayout === 'cards' ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Tarjetas
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${viewLayout === 'table' ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Tabla
            </button>
          </div>
        </div>

      </div>

      {/* Cards View */}
      {viewLayout === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredParams.map((param) => {
            const gaugePercent = calculateGaugePercent(param);
            const isAlert = param.status !== 'normal';

            return (
              <div
                key={param.id || param.name}
                onClick={() => setSelectedBio({ param, detail: getKnowledgeForParam(param) })}
                className={`relative group bg-white dark:bg-slate-800/90 rounded-xl p-4 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                  isAlert
                    ? 'border-amber-300/80 dark:border-amber-500/40 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-400'
                    : 'border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                      {param.name}
                    </h5>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Ref: {param.referenceRange}
                    </p>
                  </div>
                  {getStatusBadge(param.status)}
                </div>

                {/* Main Value Display */}
                <div className="my-3 flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black tracking-tight ${
                    param.status === 'normal'
                      ? 'text-slate-900 dark:text-white'
                      : param.status === 'high'
                      ? 'text-amber-600 dark:text-amber-400'
                      : param.status === 'critical'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {param.value}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {param.unit}
                  </span>
                </div>

                {/* Range Gauge Slider */}
                <div className="space-y-1">
                  <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-700/80 rounded-full overflow-hidden flex">
                    <div className="w-1/4 bg-blue-300 dark:bg-blue-700" title="Bajo" />
                    <div className="w-2/4 bg-emerald-400 dark:bg-emerald-600" title="Óptimo" />
                    <div className="w-1/4 bg-amber-400 dark:bg-amber-600" title="Elevado" />
                  </div>
                  {/* Needle Marker */}
                  <div className="relative w-full h-2">
                    <div
                      className="absolute -top-3 -translate-x-1/2 flex flex-col items-center transition-all duration-500"
                      style={{ left: `${Math.min(96, Math.max(4, gaugePercent))}%` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white shadow-md ring-2 ring-teal-400" />
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Action */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400 group-hover:underline">
                    <Info className="w-3 h-3" />
                    Ver qué significa
                  </span>
                  {param.notes && (
                    <span className="truncate max-w-[120px] text-[10px] text-slate-400 italic">
                      {param.notes}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewLayout === 'table' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Biomarcador</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3">Rango de Referencia</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Guía</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredParams.map((param) => (
                <tr
                  key={param.id || param.name}
                  onClick={() => setSelectedBio({ param, detail: getKnowledgeForParam(param) })}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-750 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                    {param.name}
                  </td>
                  <td className="px-4 py-3 font-black text-sm text-slate-900 dark:text-white">
                    {param.value}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {param.unit}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {param.referenceRange}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(param.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-teal-600 dark:text-teal-400 font-semibold hover:underline inline-flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      Info
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Interactive Biomarker Modal */}
      {selectedBio && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedBio(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-600" />
                Guía Médica del Paciente
              </span>
              {getStatusBadge(selectedBio.param.status)}
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {selectedBio.detail.title}
            </h3>

            {/* Value Callout */}
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Tu Resultado Registrado</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {selectedBio.param.value} <span className="text-sm font-normal text-slate-500">{selectedBio.param.unit}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Rango Clínico Ideal</span>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedBio.detail.idealRangeText}
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="mt-4 space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div>
                <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5 text-teal-600" />
                  ¿Qué mide este parámetro en tu cuerpo?
                </h5>
                <p className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  {selectedBio.detail.description}
                </p>
              </div>

              {selectedBio.detail.causes && selectedBio.detail.causes.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    Factores comunes que influyen en este valor:
                  </h5>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600 dark:text-slate-400">
                    {selectedBio.detail.causes.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedBio.detail.tips && selectedBio.detail.tips.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Recomendaciones para mantenerlo en rango óptimo:
                  </h5>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-emerald-800 dark:text-emerald-300">
                    {selectedBio.detail.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedBio(null)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs shadow transition-colors cursor-pointer"
              >
                Entendido, cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
