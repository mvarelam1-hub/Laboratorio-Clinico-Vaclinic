import React, { useState } from 'react';
import { MedicalReport } from '../../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Activity,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  Droplet,
  HeartPulse,
  Flame,
  LineChart as LineChartIcon,
  ChevronRight
} from 'lucide-react';

interface HealthTrendsChartProps {
  reports: MedicalReport[];
  defaultMetric?: string;
  embedded?: boolean;
}

interface MetricConfig {
  key: string;
  name: string;
  shortName: string;
  category: string;
  unit: string;
  idealMin?: number;
  idealMax?: number;
  idealThreshold: number;
  thresholdLabel: string;
  betterWhenLower: boolean;
  color: string;
  gradientId: string;
  clinicalMeaning: string;
  lifestyleTips: string;
}

const AVAILABLE_METRICS: MetricConfig[] = [
  {
    key: 'glucosa',
    name: 'Glucosa en Ayunas',
    shortName: 'Glucosa',
    category: 'Metabolismo',
    unit: 'mg/dL',
    idealMin: 70,
    idealMax: 100,
    idealThreshold: 100,
    thresholdLabel: 'Límite Normal Óptimo (70 - 100 mg/dL)',
    betterWhenLower: true,
    color: '#0284c7', // sky-600
    gradientId: 'colorGlu',
    clinicalMeaning: 'Mide la concentración de azúcar en sangre tras 8-12 horas de ayuno. Crucial para detectar resistencia a la insulina y prediabetes.',
    lifestyleTips: 'Mantén una dieta rica en fibra vegetal, minimiza azúcares simples y harinas refinadas, y realiza caminatas postprandiales.'
  },
  {
    key: 'colesterol total',
    name: 'Colesterol Total',
    shortName: 'Colesterol Total',
    category: 'Perfil Lipídico',
    unit: 'mg/dL',
    idealMin: 120,
    idealMax: 200,
    idealThreshold: 200,
    thresholdLabel: 'Límite Deseable (< 200 mg/dL)',
    betterWhenLower: true,
    color: '#0d9488', // teal-600
    gradientId: 'colorColesterol',
    clinicalMeaning: 'Suma de todas las fracciones lipídicas en sangre. Niveles elevados incrementan el riesgo de aterosclerosis y placa en arterias coronarias.',
    lifestyleTips: 'Reduce el consumo de grasas saturadas de origen animal, sustitúyelas por aceite de oliva, frutos secos y pescados grasos.'
  },
  {
    key: 'colesterol ldl',
    name: 'Colesterol LDL ("Malo")',
    shortName: 'LDL Aterogénico',
    category: 'Perfil Lipídico',
    unit: 'mg/dL',
    idealMin: 50,
    idealMax: 100,
    idealThreshold: 100,
    thresholdLabel: 'Meta Cardiovascular Óptima (< 100 mg/dL)',
    betterWhenLower: true,
    color: '#f59e0b', // amber-500
    gradientId: 'colorLdl',
    clinicalMeaning: 'Fracción lipoproteica que transporta colesterol hacia los tejidos y arterias. Es el principal objetivo terapéutico cardiovascular.',
    lifestyleTips: 'Prioriza fibra soluble (avena, chía, legumbres) que secuestra sales biliares e impide la absorción intestinal del colesterol.'
  },
  {
    key: 'colesterol hdl',
    name: 'Colesterol HDL ("Bueno")',
    shortName: 'HDL Protector',
    category: 'Perfil Lipídico',
    unit: 'mg/dL',
    idealMin: 40,
    idealMax: 80,
    idealThreshold: 40,
    thresholdLabel: 'Mínimo Protector Saludable (> 40 mg/dL)',
    betterWhenLower: false,
    color: '#10b981', // emerald-500
    gradientId: 'colorHdl',
    clinicalMeaning: 'Transporte reverso del colesterol: retira excedentes de grasa de las arterias para llevarlos al hígado y eliminarlos.',
    lifestyleTips: 'El ejercicio físico aeróbico regular (150 min/semana) es la herramienta no farmacológica más eficaz para elevar el HDL.'
  },
  {
    key: 'triglicéridos',
    name: 'Triglicéridos',
    shortName: 'Triglicéridos',
    category: 'Perfil Lipídico',
    unit: 'mg/dL',
    idealMin: 50,
    idealMax: 150,
    idealThreshold: 150,
    thresholdLabel: 'Límite Deseable (< 150 mg/dL)',
    betterWhenLower: true,
    color: '#ef4444', // rose-500
    gradientId: 'colorTrig',
    clinicalMeaning: 'Grasas circulantes derivadas de la ingesta calórica excedente. Fuertemente influenciados por carbohidratos, azúcar y alcohol.',
    lifestyleTips: 'Evita gaseosas, jugos procesados, repostería y reduce el consumo de alcohol; baja peso graso corporal de forma gradual.'
  },
  {
    key: 'hemoglobina',
    name: 'Hemoglobina',
    shortName: 'Hemoglobina',
    category: 'Hematología',
    unit: 'g/dL',
    idealMin: 13.0,
    idealMax: 17.0,
    idealThreshold: 13.0,
    thresholdLabel: 'Rango Saludable (> 13.0 g/dL)',
    betterWhenLower: false,
    color: '#8b5cf6', // purple-500
    gradientId: 'colorHb',
    clinicalMeaning: 'Proteína eritrocitaria encargada del transporte vital de oxígeno a todos los órganos vitales y músculos.',
    lifestyleTips: 'Asegura aporte de hierro biodisponible (carnes magras, legumbres combinadas con vitamina C) y vitamina B12.'
  },
  {
    key: 'tsh',
    name: 'TSH (Tiroestimulante)',
    shortName: 'TSH Tiroides',
    category: 'Endocrinología',
    unit: 'µUI/mL',
    idealMin: 0.4,
    idealMax: 4.2,
    idealThreshold: 4.2,
    thresholdLabel: 'Rango Eutiroideo (0.4 - 4.2 µUI/mL)',
    betterWhenLower: true,
    color: '#ec4899', // pink-500
    gradientId: 'colorTsh',
    clinicalMeaning: 'Hormona hipofisaria reguladora del metabolismo global. Permite pesquisar hipotiroidismo o hipertiroidismo subclínico.',
    lifestyleTips: 'Mantén un ritmo circadiano regular de sueño y un consumo adecuado de sal yodada y selenio.'
  },
  {
    key: 'creatinina',
    name: 'Creatinina Sérica',
    shortName: 'Creatinina Renal',
    category: 'Función Renal',
    unit: 'mg/dL',
    idealMin: 0.6,
    idealMax: 1.2,
    idealThreshold: 1.2,
    thresholdLabel: 'Filtración Renal Normal (< 1.20 mg/dL)',
    betterWhenLower: true,
    color: '#06b6d4', // cyan-500
    gradientId: 'colorCrea',
    clinicalMeaning: 'Marcador directo de la tasa de filtración glomerular en los riñones. Detecta sobrecarga o daño renal incipiente.',
    lifestyleTips: 'Hidrátate con agua pura de forma continua (mínimo 2 litros diarios) y evita el uso abusivo de antiinflamatorios (AINES).'
  }
];

export const HealthTrendsChart: React.FC<HealthTrendsChartProps> = ({
  reports,
  defaultMetric,
  embedded = false
}) => {
  const [selectedMetricKey, setSelectedMetricKey] = useState<string>(
    defaultMetric || 'colesterol total'
  );

  // Filter published reports and sort chronologically (oldest to newest)
  const sortedReports = [...reports]
    .filter(r => r.status === 'publicado' || r.status === 'entregado')
    .sort((a, b) => new Date(a.sampleDate).getTime() - new Date(b.sampleDate).getTime());

  const currentMetric =
    AVAILABLE_METRICS.find(m => m.key === selectedMetricKey) || AVAILABLE_METRICS[0];

  // Helper function to find matching parameter in a report
  const findParamForMetric = (report: MedicalReport, metricKey: string) => {
    return report.parameters.find(p => {
      const name = p.name.toLowerCase();
      if (metricKey === 'glucosa') {
        return name.includes('glucosa') || name.includes('glicemia') || name.includes('glucemia');
      }
      if (metricKey === 'colesterol total') {
        return name.includes('colesterol total') || (name.includes('colesterol') && !name.includes('ldl') && !name.includes('hdl') && !name.includes('vldl'));
      }
      if (metricKey === 'colesterol ldl') {
        return name.includes('ldl');
      }
      if (metricKey === 'colesterol hdl') {
        return name.includes('hdl');
      }
      if (metricKey === 'triglicéridos') {
        return name.includes('trigli');
      }
      if (metricKey === 'hemoglobina') {
        return name.includes('hemoglobina') && !name.includes('glicosilada') && !name.includes('hba1c');
      }
      if (metricKey === 'tsh') {
        return name.includes('tsh');
      }
      if (metricKey === 'creatinina') {
        return name.includes('creatinina');
      }
      return name.includes(metricKey);
    });
  };

  // Check which metrics actually have historical points for this patient
  const metricsWithDataCount = AVAILABLE_METRICS.map(m => {
    const count = sortedReports.filter(rep => {
      const param = findParamForMetric(rep, m.key);
      if (!param) return false;
      const num = typeof param.value === 'number' ? param.value : parseFloat(String(param.value));
      return !isNaN(num);
    }).length;
    return { key: m.key, count };
  });

  // Extract chart data points for the currently selected metric
  const chartData = sortedReports
    .map(report => {
      const param = findParamForMetric(report, currentMetric.key);
      if (!param) return null;

      const numValue = typeof param.value === 'number' ? param.value : parseFloat(String(param.value));
      if (isNaN(numValue)) return null;

      const dateObj = new Date(report.sampleDate);
      const formattedDate = dateObj.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

      // Determine if point is within healthy target
      let inTarget = true;
      if (currentMetric.betterWhenLower) {
        inTarget = numValue <= currentMetric.idealThreshold;
      } else {
        inTarget = numValue >= currentMetric.idealThreshold;
      }

      return {
        date: formattedDate,
        fullDate: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
        value: numValue,
        unit: param.unit,
        reportNumber: report.reportNumber,
        title: report.title,
        status: param.status,
        inTarget
      };
    })
    .filter(Boolean) as Array<{
      date: string;
      fullDate: string;
      value: number;
      unit: string;
      reportNumber: string;
      title: string;
      status: string;
      inTarget: boolean;
    }>;

  // Compute trend statistics
  const latestPoint = chartData[chartData.length - 1];
  const previousPoint = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const oldestPoint = chartData.length > 1 ? chartData[0] : null;

  let deltaChange = 0;
  let percentChange = 0;
  let isImproving = true;

  if (latestPoint && previousPoint) {
    deltaChange = latestPoint.value - previousPoint.value;
    percentChange = (deltaChange / previousPoint.value) * 100;

    if (currentMetric.betterWhenLower) {
      isImproving = deltaChange <= 0;
    } else {
      isImproving = deltaChange >= 0;
    }
  }

  // Calculate min & max for smart chart scaling
  const values = chartData.map(d => d.value);
  if (currentMetric.idealThreshold) values.push(currentMetric.idealThreshold);
  const minVal = values.length > 0 ? Math.floor(Math.min(...values) * 0.85) : 0;
  const maxVal = values.length > 0 ? Math.ceil(Math.max(...values) * 1.15) : 100;

  return (
    <div className={`space-y-6 ${embedded ? 'pt-2' : ''}`}>
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 text-white p-6 rounded-3xl border border-teal-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-teal-400/20 text-teal-300 font-mono font-bold px-2.5 py-0.5 rounded-full border border-teal-400/40">
              Monitoreo Longitudinal Recharts
            </span>
            <span className="text-xs text-slate-300">Curvas Diagnósticas VACLINIC</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <LineChartIcon className="w-6 h-6 text-teal-400" />
            <span>Tendencias de Exámenes Históricos</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Sigue visualmente la evolución de tus exámenes clave (glucosa, colesterol total, LDL, HDL, triglicéridos) a través de cada toma de muestra.
          </p>
        </div>

        {/* Quick stat summary pill */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 self-start md:self-auto">
          <div className="w-10 h-10 rounded-xl bg-teal-500/30 text-teal-300 flex items-center justify-center font-black">
            <HeartPulse className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
              Biomarcadores Históricos
            </span>
            <span className="text-sm font-black text-white">
              {metricsWithDataCount.filter(m => m.count > 0).length} Evaluados ({chartData.length} tomas en {currentMetric.shortName})
            </span>
          </div>
        </div>
      </div>

      {/* Metric Selector Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-600" />
            Selecciona el Examen o Parámetro a Graficar
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-600" />
            Interactivo
          </span>
        </div>

        {/* Metric Selector Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {AVAILABLE_METRICS.map(metric => {
            const isSelected = selectedMetricKey === metric.key;
            const dataCount = metricsWithDataCount.find(m => m.key === metric.key)?.count || 0;

            return (
              <button
                key={metric.key}
                onClick={() => setSelectedMetricKey(metric.key)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-md border-teal-500 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{metric.name}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-teal-700 text-teal-100'
                      : dataCount > 0
                      ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {dataCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Latest Value Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Último Resultado
              </span>
              {latestPoint && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    latestPoint.inTarget
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                  }`}
                >
                  {latestPoint.inTarget ? 'En Meta Saludable' : 'Fuera de Rango'}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {latestPoint ? latestPoint.value : '—'}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {currentMetric.unit}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>{latestPoint?.fullDate || 'Sin registros'}</span>
          </p>
        </div>

        {/* Previous Value Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Resultado Anterior
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-700 dark:text-slate-300 tracking-tight">
                {previousPoint ? previousPoint.value : '—'}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {currentMetric.unit}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{previousPoint?.fullDate || 'Sin registro previo'}</span>
          </p>
        </div>

        {/* Trend Indicator */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Evolución Temporal
            </span>

            {previousPoint && latestPoint ? (
              <div className="flex items-center gap-3 mt-2">
                <div
                  className={`p-2.5 rounded-2xl ${
                    isImproving
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {isImproving ? (
                    <TrendingDown className="w-6 h-6" />
                  ) : (
                    <TrendingUp className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <span
                    className={`text-base font-black block leading-tight ${
                      isImproving
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {deltaChange > 0 ? '+' : ''}
                    {deltaChange.toFixed(1)} {currentMetric.unit} ({percentChange > 0 ? '+' : ''}
                    {percentChange.toFixed(1)}%)
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 mt-0.5 block">
                    {isImproving ? 'Evolución Favorable' : 'Requiere Monitoreo'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                <Minus className="w-4 h-4" />
                <span>Primer registro disponible</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 mt-3 border-t border-slate-100 dark:border-slate-800 pt-2.5">
            {oldestPoint && chartData.length > 2 ? (
              <span>
                Cambio neto acumulado: {(latestPoint.value - oldestPoint.value).toFixed(1)} {currentMetric.unit}
              </span>
            ) : (
              <span>Historial activo en VACLINIC</span>
            )}
          </div>
        </div>

      </div>

      {/* Main Chart Canvas */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                {currentMetric.category}
              </span>
              <span className="text-xs text-slate-400">
                {chartData.length} estudios registrados
              </span>
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              Curva Histórica de {currentMetric.name} ({currentMetric.unit})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Línea discontinua verde marca el umbral saludable de referencia institucional.
            </p>
          </div>

          <div className="self-start sm:self-auto flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{currentMetric.thresholdLabel}</span>
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-6">
            <Activity className="w-10 h-10 mb-2 opacity-40 text-teal-500" />
            <p className="font-bold text-slate-700 dark:text-slate-300">
              No hay puntos históricos registrados para {currentMetric.name}
            </p>
            <p className="text-[11px] text-slate-400 max-w-sm mt-1">
              A medida que te realices nuevos exámenes de laboratorio en VACLINIC, esta gráfica trazará automáticamente tu curva evolutiva.
            </p>
          </div>
        ) : (
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id={currentMetric.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={[minVal, maxVal]}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit={` ${currentMetric.unit.split('/')[0]}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 text-white p-3.5 rounded-2xl shadow-2xl text-xs border border-slate-700 space-y-1.5 min-w-[200px]">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                            <span className="font-bold text-teal-400">{data.fullDate}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                data.inTarget
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                  : 'bg-amber-950 text-amber-300 border border-amber-700'
                              }`}
                            >
                              {data.inTarget ? 'En Meta' : 'Fuera Rango'}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] truncate">
                            {data.title}
                          </p>
                          <p className="text-slate-400 text-[10px] font-mono">
                            Expediente: {data.reportNumber}
                          </p>
                          <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-slate-400">Resultado:</span>
                            <span className="font-black text-sm text-white">
                              {data.value} {data.unit}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={currentMetric.idealThreshold}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: `Meta: ${currentMetric.idealThreshold} ${currentMetric.unit}`,
                    fill: '#10b981',
                    fontSize: 10,
                    position: 'top'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={currentMetric.color}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={`url(#${currentMetric.gradientId})`}
                  dot={{
                    r: 5,
                    fill: currentMetric.color,
                    strokeWidth: 2,
                    stroke: '#fff'
                  }}
                  activeDot={{
                    r: 7,
                    stroke: currentMetric.color,
                    strokeWidth: 3
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Timeline dots / dates bar */}
        {chartData.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Hitos Registrados ({chartData.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Orden cronológico ascendente
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {chartData.map((pt, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>#{idx + 1}</span>
                    <span>{pt.date}</span>
                  </div>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {pt.value} <span className="text-[10px] font-normal text-slate-400">{pt.unit}</span>
                  </span>
                  <span
                    className={`text-[9px] font-bold mt-1 inline-block ${
                      pt.inTarget ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {pt.inTarget ? '✓ En Meta' : '⚠ Elevado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Clinical Meaning & Lifestyle Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card: Interpretación Médica */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                ¿Qué Significa {currentMetric.name}?
              </h5>
              <span className="text-[10px] text-slate-400">Interpretación Clínica Preventiva</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            {currentMetric.clinicalMeaning}
          </p>
        </div>

        {/* Card: Hábitos Recomendados */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Pautas para Optimizar este Valor
              </h5>
              <span className="text-[10px] text-slate-400">Recomendaciones No Farmacológicas</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            {currentMetric.lifestyleTips}
          </p>
        </div>

      </div>

    </div>
  );
};
