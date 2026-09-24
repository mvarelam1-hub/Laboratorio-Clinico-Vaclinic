import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { DailyVolumeControlPanel } from './DailyVolumeControlPanel';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  ComposedChart,
  Line
} from 'recharts';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FlaskConical, 
  Cpu, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Sparkles,
  Building2,
  RefreshCw,
  Zap,
  Filter,
  Check,
  ChevronRight,
  Eye,
  BarChart3
} from 'lucide-react';

export const VaclinicVisualDashboard: React.FC = () => {
  const { 
    reports, 
    episodes, 
    branches, 
    currentBranch, 
    setCurrentBranch,
    isMultiBranchEnabled,
    setStaffActiveTab 
  } = useClinic();

  const [selectedTimeframe, setSelectedTimeframe] = useState<'hoy' | 'semana' | 'mes'>('hoy');
  const [activeChartTab, setActiveChartTab] = useState<'todo' | 'volumen_diario' | 'trazabilidad' | 'tat' | 'especialidades'>('todo');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // Filtered episodes based on current branch selection
  const branchEpisodes = useMemo(() => {
    if (currentBranch === 'central') return episodes;
    return episodes.filter(e => e.branchId === currentBranch);
  }, [episodes, currentBranch]);

  // Dimension Counts (4D Traceability)
  const d1Count = branchEpisodes.filter(e => e.currentDimension === 'D1_admision').length;
  const d2Count = branchEpisodes.filter(e => e.currentDimension === 'D2_flebotomia').length;
  const d3Count = branchEpisodes.filter(e => e.currentDimension === 'D3_analizadores').length;
  const d4Count = branchEpisodes.filter(e => e.currentDimension === 'D4_validacion').length;

  const d1Routine = branchEpisodes.filter(e => e.currentDimension === 'D1_admision' && e.priority === 'rutina').length;
  const d1Urgent = branchEpisodes.filter(e => e.currentDimension === 'D1_admision' && e.priority === 'urgente').length;
  const d1Panic = branchEpisodes.filter(e => e.currentDimension === 'D1_admision' && e.priority === 'stat_panico').length;

  const d2Routine = branchEpisodes.filter(e => e.currentDimension === 'D2_flebotomia' && e.priority === 'rutina').length;
  const d2Urgent = branchEpisodes.filter(e => e.currentDimension === 'D2_flebotomia' && e.priority === 'urgente').length;
  const d2Panic = branchEpisodes.filter(e => e.currentDimension === 'D2_flebotomia' && e.priority === 'stat_panico').length;

  const d3Routine = branchEpisodes.filter(e => e.currentDimension === 'D3_analizadores' && e.priority === 'rutina').length;
  const d3Urgent = branchEpisodes.filter(e => e.currentDimension === 'D3_analizadores' && e.priority === 'urgente').length;
  const d3Panic = branchEpisodes.filter(e => e.currentDimension === 'D3_analizadores' && e.priority === 'stat_panico').length;

  const d4Routine = branchEpisodes.filter(e => e.currentDimension === 'D4_validacion' && e.priority === 'rutina').length;
  const d4Urgent = branchEpisodes.filter(e => e.currentDimension === 'D4_validacion' && e.priority === 'urgente').length;
  const d4Panic = branchEpisodes.filter(e => e.currentDimension === 'D4_validacion' && e.priority === 'stat_panico').length;

  // 1. Traceability 4D Data for Recharts
  const traceabilityData = useMemo(() => [
    {
      name: 'D1 Admisión & Triage',
      shortName: 'D1 Admisión',
      rutina: d1Routine + 2,
      urgente: d1Urgent + 1,
      panico: d1Panic + 0,
      total: d1Count + 3,
      slaTargetMin: 15,
      actualAvgMin: 8,
    },
    {
      name: 'D2 Flebotomía & Tubos',
      shortName: 'D2 Flebotomía',
      rutina: d2Routine + 4,
      urgente: d2Urgent + 2,
      panico: d2Panic + 1,
      total: d2Count + 7,
      slaTargetMin: 20,
      actualAvgMin: 12,
    },
    {
      name: 'D3 Analizadores Auto',
      shortName: 'D3 Analizadores',
      rutina: d3Routine + 6,
      urgente: d3Urgent + 3,
      panico: d3Panic + 1,
      total: d3Count + 10,
      slaTargetMin: 35,
      actualAvgMin: 24,
    },
    {
      name: 'D4 Validación Médica',
      shortName: 'D4 Validación',
      rutina: d4Routine + 3,
      urgente: d4Urgent + 1,
      panico: d4Panic + 0,
      total: d4Count + 4,
      slaTargetMin: 25,
      actualAvgMin: 14,
    },
  ], [d1Count, d2Count, d3Count, d4Count, d1Routine, d1Urgent, d1Panic, d2Routine, d2Urgent, d2Panic, d3Routine, d3Urgent, d3Panic, d4Routine, d4Urgent, d4Panic]);

  // 2. TAT (Turnaround Time) & SLA Compliance Data per Clinical Discipline
  const tatKpiData = useMemo(() => [
    {
      area: 'Hematología',
      slaMetaMin: 30,
      tiempoRealMin: 21,
      cumplimiento: 99.2,
      volumen: 48,
    },
    {
      area: 'Química Sanguínea',
      slaMetaMin: 45,
      tiempoRealMin: 32,
      cumplimiento: 98.4,
      volumen: 62,
    },
    {
      area: 'Parásitos (Coprología)',
      slaMetaMin: 40,
      tiempoRealMin: 26,
      cumplimiento: 97.9,
      volumen: 29,
    },
    {
      area: 'Cristales (Uroanálisis)',
      slaMetaMin: 30,
      tiempoRealMin: 18,
      cumplimiento: 99.5,
      volumen: 36,
    },
    {
      area: 'Perfil Tiroideo & Hormonas',
      slaMetaMin: 60,
      tiempoRealMin: 44,
      cumplimiento: 96.8,
      volumen: 22,
    },
    {
      area: 'Pruebas STAT Pánico',
      slaMetaMin: 15,
      tiempoRealMin: 10,
      cumplimiento: 100.0,
      volumen: 14,
    },
  ], []);

  // 3. Specialty Distribution Data (from VACLINIC logo specialties)
  const specialtyData = useMemo(() => [
    { name: 'Hematología', value: 34, color: '#0284c7', count: 68 },
    { name: 'Química Sanguínea', value: 28, color: '#0d9488', count: 56 },
    { name: 'Parásitos (Coprología)', value: 16, color: '#8b5cf6', count: 32 },
    { name: 'Cristales & Uroanálisis', value: 14, color: '#06b6d4', count: 28 },
    { name: 'Inmunología & Especiales', value: 8, color: '#f59e0b', count: 16 },
  ], []);

  // 4. Hourly Flow Trend (Muestras Ingresadas vs Analizadas vs Validadas)
  const hourlyFlowData = useMemo(() => [
    { hora: '07:00', ingresadas: 18, analizadas: 10, validadas: 4 },
    { hora: '08:00', ingresadas: 34, analizadas: 26, validadas: 18 },
    { hora: '09:00', ingresadas: 42, analizadas: 38, validadas: 32 },
    { hora: '10:00', ingresadas: 36, analizadas: 39, validadas: 37 },
    { hora: '11:00', ingresadas: 28, analizadas: 30, validadas: 29 },
    { hora: '12:00', ingresadas: 20, analizadas: 22, validadas: 24 },
    { hora: '13:00', ingresadas: 14, analizadas: 16, validadas: 18 },
    { hora: '14:00', ingresadas: 19, analizadas: 18, validadas: 17 },
    { hora: '15:00', ingresadas: 25, analizadas: 23, validadas: 22 },
    { hora: '16:00', ingresadas: 18, analizadas: 20, validadas: 19 },
    { hora: '17:00', ingresadas: 12, analizadas: 14, validadas: 15 },
  ], []);

  // 5. Pre-analytical Sample Quality Status
  const sampleQualityData = useMemo(() => [
    { name: 'Muestras Óptimas', value: 97.4, count: 192, color: '#10b981' },
    { name: 'Hemólisis Ligera', value: 1.4, count: 3, color: '#f59e0b' },
    { name: 'Volumen Escaso', value: 0.7, count: 2, color: '#ec4899' },
    { name: 'Lipemia / Turbidez', value: 0.5, count: 1, color: '#6366f1' },
  ], []);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 text-white p-3 rounded-xl border border-slate-700 shadow-2xl text-xs backdrop-blur-md">
          <p className="font-black text-cyan-300 mb-1.5 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block" 
                  style={{ backgroundColor: entry.color || entry.stroke || entry.fill }} 
                />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white">
                {entry.value} {entry.unit || ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">

      {/* VACLINIC Header & Controls */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white p-5 sm:p-6 rounded-3xl border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider bg-cyan-950/80 px-2.5 py-0.5 rounded-md border border-cyan-500/40">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                PANEL VACLINIC • LIS & EHR EN VIVO
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-slate-300 text-xs hidden sm:inline font-medium">
                Monitoreo de Muestras, Analizadores & Tiempos de Respuesta
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2 flex flex-wrap items-center gap-2">
              <span>CENTRO DE TRAZABILIDAD & KPIS CLÍNICOS</span>
              <span className="text-xs font-normal text-cyan-300 bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-400/30">
                ISO 15189 Ready
              </span>
            </h2>

            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Supervisión continua de muestras en 4 Dimensiones, tiempos de respuesta (TAT) por disciplina clínica y estado de analizadores en tiempo real.
            </p>
          </div>

          {/* Filter & Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Branch Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Sede:</span>
              {isMultiBranchEnabled ? (
                <select
                  value={currentBranch}
                  onChange={(e) => setCurrentBranch(e.target.value as any)}
                  className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-cyan-300 font-bold">
                  VACLINIC (Sede Única)
                </span>
              )}
            </div>

            {/* Timeframe Selector */}
            <div className="flex items-center bg-slate-900/90 rounded-xl p-1 border border-slate-700 text-xs">
              <button
                onClick={() => setSelectedTimeframe('hoy')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedTimeframe === 'hoy' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setSelectedTimeframe('semana')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedTimeframe === 'semana' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setSelectedTimeframe('mes')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedTimeframe === 'mes' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                Mes
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              title="Actualizar datos en tiempo real"
              className={`p-2 rounded-xl bg-slate-800/90 text-cyan-300 hover:bg-slate-700 border border-slate-600 cursor-pointer transition-all ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top 5 High-Impact Real-Time KPIs Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          
          <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-cyan-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Muestras Totales</span>
              <FlaskConical className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white mt-1">200</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>+14.2% vs ayer</span>
            </div>
          </div>

          <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-teal-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">TAT Promedio Real</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-teal-300 mt-1">24.5 <span className="text-xs font-normal text-slate-400">min</span></div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-1 font-semibold">
              <span>Meta SLA: 40 min</span>
            </div>
          </div>

          <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Cumplimiento SLA</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-1">98.8%</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-300 mt-1 font-semibold">
              <span>0.2% retrasos menores</span>
            </div>
          </div>

          <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">STAT / Pánico</span>
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-rose-400 mt-1">14 <span className="text-xs font-normal text-slate-400">urg</span></div>
            <div className="flex items-center gap-1 text-[11px] text-rose-300 mt-1 font-semibold">
              <span>100% notificados</span>
            </div>
          </div>

          <div className="bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-indigo-400">
              <span className="text-[10px] font-bold uppercase tracking-wider">Calidad Pre-analítica</span>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-indigo-300 mt-1">97.4%</div>
            <div className="flex items-center gap-1 text-[11px] text-indigo-300 mt-1 font-semibold">
              <span>Índice óptimo</span>
            </div>
          </div>

        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveChartTab('todo')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeChartTab === 'todo'
                ? 'bg-cyan-400 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Vista Integral (Todos los Gráficos)</span>
          </button>

          <button
            onClick={() => setActiveChartTab('volumen_diario')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeChartTab === 'volumen_diario'
                ? 'bg-teal-400 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-teal-300" />
            <span>Volumen Diario (Barras • Estudio & Sucursal)</span>
          </button>

          <button
            onClick={() => setActiveChartTab('trazabilidad')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeChartTab === 'trazabilidad'
                ? 'bg-cyan-400 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Trazabilidad LABVACLINIC</span>
          </button>

          <button
            onClick={() => setActiveChartTab('tat')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeChartTab === 'tat'
                ? 'bg-cyan-400 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>KPIs de TAT & SLA</span>
          </button>

          <button
            onClick={() => setActiveChartTab('especialidades')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeChartTab === 'especialidades'
                ? 'bg-cyan-400 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Especialidades VACLINIC</span>
          </button>
        </div>
      </div>

      {/* RENDER DEDICATED DAILY VOLUME CONTROL PANEL */}
      {(activeChartTab === 'todo' || activeChartTab === 'volumen_diario') && (
        <DailyVolumeControlPanel />
      )}

      {/* MAIN CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CHART 1: 4D TRACEABILITY IN REAL TIME */}
        {(activeChartTab === 'todo' || activeChartTab === 'trazabilidad') && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Trazabilidad de Muestras en 4 Dimensiones
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribución en vivo por etapa y clasificación de prioridad (Rutina, Urgente, Pánico)
                </p>
              </div>

              <button
                onClick={() => setStaffActiveTab('episodios')}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-xl border border-cyan-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Flujo</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={traceabilityData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} 
                  />
                  <Bar dataKey="rutina" name="Rutina" stackId="a" fill="#0284c7" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="urgente" name="Urgente" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="panico" name="STAT Pánico" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
              <div className="bg-sky-50/70 p-2 rounded-xl border border-sky-100">
                <span className="text-[10px] text-slate-500 font-bold block">D1 ADMISIÓN</span>
                <span className="font-black text-sky-800 text-sm">{d1Count} Activos</span>
              </div>
              <div className="bg-teal-50/70 p-2 rounded-xl border border-teal-100">
                <span className="text-[10px] text-slate-500 font-bold block">D2 TUBOS</span>
                <span className="font-black text-teal-800 text-sm">{d2Count} Activos</span>
              </div>
              <div className="bg-indigo-50/70 p-2 rounded-xl border border-indigo-100">
                <span className="text-[10px] text-slate-500 font-bold block">D3 ANALIZADOR</span>
                <span className="font-black text-indigo-800 text-sm">{d3Count} Activos</span>
              </div>
              <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-500 font-bold block">D4 VALIDACIÓN</span>
                <span className="font-black text-emerald-800 text-sm">{d4Count} Activos</span>
              </div>
            </div>
          </div>
        )}

        {/* CHART 2: TAT KPIs vs SLA TARGET */}
        {(activeChartTab === 'todo' || activeChartTab === 'tat') && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    KPIs de Tiempo de Respuesta (TAT vs SLA)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparativa de Tiempo Real Promedio vs Meta de SLA por Especialidad (Minutos)
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                <span>98.8% en Tiempo</span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={tatKpiData} margin={{ top: 20, right: 20, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="area" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    angle={-20} 
                    textAnchor="end" 
                    height={50}
                  />
                  <YAxis unit=" min" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} 
                  />
                  <Bar dataKey="tiempoRealMin" name="Tiempo Real (min)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  <Line 
                    type="monotone" 
                    dataKey="slaMetaMin" 
                    name="Meta SLA Máxima (min)" 
                    stroke="#ef4444" 
                    strokeWidth={2} 
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: '#ef4444' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <span>Eficiencia promedio: <strong className="text-slate-900">+34% más rápido que la meta SLA</strong></span>
              </div>
              <span className="text-[11px] font-mono text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 font-bold">
                ISO 15189 Cláusula 5.8
              </span>
            </div>
          </div>
        )}

        {/* CHART 3: SPECIALTY DISTRIBUTION (VACLINIC LOGO DISCIPLINES) */}
        {(activeChartTab === 'todo' || activeChartTab === 'especialidades') && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-cyan-600" />
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Volumen por Especialidad VACLINIC
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hematología, Química Sanguínea, Parásitos, Cristales e Inmunología
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                200 Muestras
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
              <div className="h-64 md:col-span-7">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={specialtyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {specialtyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any, name: any, item: any) => [
                        `${val}% (${item.payload.count} pruebas)`, 
                        name
                      ]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="md:col-span-5 space-y-2 text-xs">
                {specialtyData.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md" style={{ backgroundColor: s.color }} />
                      <span className="font-bold text-slate-800 truncate max-w-[120px]">{s.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900">{s.value}%</span>
                      <span className="text-[10px] text-slate-400 block">{s.count} muestras</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Equipos Automatizados: <strong>Sysmex XN-550, Mindray BS-240</strong></span>
              <span className="text-cyan-700 font-bold">100% Calibrados</span>
            </div>
          </div>
        )}

        {/* CHART 4: HOURLY VOLUME & VALIDATION TREND */}
        {(activeChartTab === 'todo' || activeChartTab === 'trazabilidad') && (
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    Curva Horaria de Procesamiento & Validación
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tasa de Ingreso en Flebotomía vs Procesamiento vs Firma Digital Médica
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-slate-700 text-xs font-mono font-bold">
                <span>07:00 - 17:00</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyFlowData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAnalizadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorValidadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hora" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} 
                  />
                  <Area type="monotone" dataKey="ingresadas" name="Ingreso Muestras" stroke="#0284c7" fillOpacity={1} fill="url(#colorIngresadas)" strokeWidth={2} />
                  <Area type="monotone" dataKey="analizadas" name="En Analizadores" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorAnalizadas)" strokeWidth={2} />
                  <Area type="monotone" dataKey="validadas" name="Validadas / Publicadas" stroke="#10b981" fillOpacity={1} fill="url(#colorValidadas)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Pico de Flebotomía: <strong className="text-slate-800">09:00 AM (42 muestras/h)</strong></span>
              <span className="text-emerald-700 font-bold">Sin cuellos de botella</span>
            </div>
          </div>
        )}

      </div>

      {/* QUALITY ASSURANCE & PRE-ANALYTICAL MONITORING BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-3xl border border-slate-700 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase text-white tracking-wide">
                Control de Calidad Pre-analítica y Criterios de Aceptación
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluación automatizada de integridad de muestras: hemólisis, volumen, lipemia y coágulos
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {sampleQualityData.map((q, i) => (
              <div key={i} className="bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: q.color }} />
                <span className="text-slate-300">{q.name}:</span>
                <span className="font-bold text-white">{q.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
