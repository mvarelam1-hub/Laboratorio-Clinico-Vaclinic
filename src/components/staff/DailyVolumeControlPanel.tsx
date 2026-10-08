import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  Building2, 
  FlaskConical, 
  Calendar, 
  Filter, 
  TrendingUp, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Download, 
  Sparkles,
  RefreshCw,
  Eye,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { BranchSiteId } from '../../types';

// Color definitions for Study Types
export const STUDY_TYPE_COLORS = {
  hematologia: { name: 'Hematología', color: '#0284c7', bg: 'bg-sky-500' },
  quimica: { name: 'Química Sanguínea', color: '#0d9488', bg: 'bg-teal-600' },
  parasitos: { name: 'Parásitos (Coprología)', color: '#8b5cf6', bg: 'bg-purple-500' },
  cristales: { name: 'Cristales (Uroanálisis)', color: '#06b6d4', bg: 'bg-cyan-500' },
  inmunologia: { name: 'Inmunología & Hormonas', color: '#f59e0b', bg: 'bg-amber-500' },
  microbiologia: { name: 'Microbiología & Cultivos', color: '#ec4899', bg: 'bg-pink-500' },
};

// Color definitions for Branches
export const BRANCH_COLORS: Record<string, { name: string; color: string; short: string }> = {
  central: { name: 'Sede Central (San Rafael)', color: '#0f766e', short: 'Central' },
  norte: { name: 'Sucursal Norte', color: '#2563eb', short: 'Norte' },
  este: { name: 'Sucursal Este', color: '#d97706', short: 'Este' },
  hospital_uci: { name: 'Sede Hospital UCI', color: '#dc2626', short: 'Hospital UCI' },
};

export const DailyVolumeControlPanel: React.FC = () => {
  const { branches, currentBranch, setCurrentBranch, isMultiBranchEnabled } = useClinic();

  // Control states
  const [timeRange, setTimeRange] = useState<'7dias' | '14dias' | 'mes'>('7dias');
  const [groupingMode, setGroupingMode] = useState<'study_type' | 'branch'>('study_type');
  const [barStyle, setBarStyle] = useState<'stacked' | 'grouped'>('stacked');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [selectedStudyFilter, setSelectedStudyFilter] = useState<string>('all');
  const [highlightedDay, setHighlightedDay] = useState<string | null>(null);

  // Daily multi-branch & multi-study data generation (realistic and dynamic based on selections)
  const rawDailyData = useMemo(() => [
    {
      dateKey: '2026-08-23',
      dayLabel: 'Dom 23 Ago',
      shortDay: 'Dom 23',
      // By Study Type
      hematologia: 38,
      quimica: 29,
      parasitos: 14,
      cristales: 18,
      inmunologia: 11,
      microbiologia: 8,
      // By Branch
      central: 58,
      norte: 26,
      este: 14,
      hospital_uci: 20,
      total: 118,
      slaRate: 99.4,
    },
    {
      dateKey: '2026-08-24',
      dayLabel: 'Lun 24 Ago',
      shortDay: 'Lun 24',
      hematologia: 84,
      quimica: 76,
      parasitos: 32,
      cristales: 46,
      inmunologia: 28,
      microbiologia: 18,
      central: 142,
      norte: 54,
      este: 38,
      hospital_uci: 50,
      total: 284,
      slaRate: 98.6,
    },
    {
      dateKey: '2026-08-25',
      dayLabel: 'Mar 25 Ago',
      shortDay: 'Mar 25',
      hematologia: 92,
      quimica: 82,
      parasitos: 36,
      cristales: 48,
      inmunologia: 31,
      microbiologia: 21,
      central: 156,
      norte: 62,
      este: 42,
      hospital_uci: 50,
      total: 310,
      slaRate: 98.9,
    },
    {
      dateKey: '2026-08-26',
      dayLabel: 'Mié 26 Ago',
      shortDay: 'Mié 26',
      hematologia: 96,
      quimica: 88,
      parasitos: 40,
      cristales: 52,
      inmunologia: 34,
      microbiologia: 22,
      central: 168,
      norte: 68,
      este: 44,
      hospital_uci: 52,
      total: 332,
      slaRate: 99.1,
    },
    {
      dateKey: '2026-08-27',
      dayLabel: 'Jue 27 Ago',
      shortDay: 'Jue 27',
      hematologia: 88,
      quimica: 79,
      parasitos: 34,
      cristales: 44,
      inmunologia: 29,
      microbiologia: 19,
      central: 148,
      norte: 58,
      este: 36,
      hospital_uci: 51,
      total: 293,
      slaRate: 99.0,
    },
    {
      dateKey: '2026-08-28',
      dayLabel: 'Vie 28 Ago',
      shortDay: 'Vie 28',
      hematologia: 94,
      quimica: 85,
      parasitos: 38,
      cristales: 50,
      inmunologia: 32,
      microbiologia: 20,
      central: 160,
      norte: 65,
      este: 40,
      hospital_uci: 54,
      total: 319,
      slaRate: 98.8,
    },
    {
      dateKey: '2026-08-29',
      dayLabel: 'Sáb 29 Ago (Hoy)',
      shortDay: 'Sáb 29',
      hematologia: 68,
      quimica: 56,
      parasitos: 28,
      cristales: 34,
      inmunologia: 22,
      microbiologia: 14,
      central: 112,
      norte: 46,
      este: 28,
      hospital_uci: 36,
      total: 222,
      slaRate: 99.5,
    },
  ], []);

  // Filter dataset by branch or timeframe if selected
  const chartData = useMemo(() => {
    return rawDailyData.map(item => {
      if (selectedBranchFilter === 'all') {
        return item;
      }
      
      // Calculate proportional study volume for a single branch
      const branchRatio = selectedBranchFilter === 'central' ? 0.50 :
                           selectedBranchFilter === 'norte' ? 0.22 :
                           selectedBranchFilter === 'este' ? 0.13 : 0.15;

      return {
        ...item,
        hematologia: Math.round(item.hematologia * branchRatio * (1 / 0.35)),
        quimica: Math.round(item.quimica * branchRatio * (1 / 0.35)),
        parasitos: Math.round(item.parasitos * branchRatio * (1 / 0.35)),
        cristales: Math.round(item.cristales * branchRatio * (1 / 0.35)),
        inmunologia: Math.round(item.inmunologia * branchRatio * (1 / 0.35)),
        microbiologia: Math.round(item.microbiologia * branchRatio * (1 / 0.35)),
        total: item[selectedBranchFilter as keyof typeof item] as number || Math.round(item.total * branchRatio)
      };
    });
  }, [rawDailyData, selectedBranchFilter]);

  // Aggregate Calculations for KPIs
  const totalVolumePeriod = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.total, 0);
  }, [chartData]);

  const dailyAverage = useMemo(() => {
    return Math.round(totalVolumePeriod / (chartData.length || 1));
  }, [totalVolumePeriod, chartData.length]);

  const peakDay = useMemo(() => {
    return [...chartData].sort((a, b) => b.total - a.total)[0] || chartData[0];
  }, [chartData]);

  // Branch Totals
  const branchTotals = useMemo(() => {
    const totals = { central: 0, norte: 0, este: 0, hospital_uci: 0 };
    rawDailyData.forEach(d => {
      totals.central += d.central;
      totals.norte += d.norte;
      totals.este += d.este;
      totals.hospital_uci += d.hospital_uci;
    });
    return totals;
  }, [rawDailyData]);

  // Study Totals
  const studyTotals = useMemo(() => {
    const totals = {
      hematologia: 0,
      quimica: 0,
      parasitos: 0,
      cristales: 0,
      inmunologia: 0,
      microbiologia: 0
    };
    chartData.forEach(d => {
      totals.hematologia += d.hematologia;
      totals.quimica += d.quimica;
      totals.parasitos += d.parasitos;
      totals.cristales += d.cristales;
      totals.inmunologia += d.inmunologia;
      totals.microbiologia += d.microbiologia;
    });
    return totals;
  }, [chartData]);

  // Custom Tooltip for Daily Chart
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentDayData = chartData.find(d => d.shortDay === label || d.dayLabel === label);
      const totalDay = currentDayData ? currentDayData.total : payload.reduce((sum: number, p: any) => sum + (Number(p.value) || 0), 0);

      return (
        <div className="bg-slate-950/95 text-white p-3.5 rounded-2xl border border-cyan-500/30 shadow-2xl text-xs backdrop-blur-md min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="font-black text-cyan-300">{label}</span>
            <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono font-bold text-[10px]">
              Total: {totalDay} muestras
            </span>
          </div>

          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={`tip-${index}`} className="flex items-center justify-between gap-4 py-0.5">
                <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[150px]">
                  <span 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.color || entry.fill }} 
                  />
                  <span>{entry.name}:</span>
                </span>
                <span className="font-mono font-bold text-white">
                  {entry.value} <span className="text-[10px] text-slate-400 font-normal">({Math.round((entry.value / (totalDay || 1)) * 100)}%)</span>
                </span>
              </div>
            ))}
          </div>

          {currentDayData && (
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-emerald-400 font-semibold">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Cumplimiento SLA:
              </span>
              <span>{currentDayData.slaRate}%</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-5 sm:p-6">
      
      {/* SECTION HEADER & CONTROL TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-sm shadow-teal-500/20">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                  Panel de Control: Volumen Diario de Muestras
                </h3>
                <span className="bg-teal-50 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-teal-200">
                  En Vivo • Gráficos de Barras
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Clasificación analítica diaria por disciplina diagnóstica y distribución operativa por sucursales VACLINIC.
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Classification View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setGroupingMode('study_type')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                groupingMode === 'study_type' 
                  ? 'bg-white text-slate-900 shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5 text-cyan-600" />
              <span>Por Tipo de Estudio</span>
            </button>
            {isMultiBranchEnabled && (
              <button
                onClick={() => setGroupingMode('branch')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  groupingMode === 'branch' 
                    ? 'bg-white text-slate-900 shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>Por Sucursal</span>
              </button>
            )}
          </div>

          {/* Bar Style Switcher (Stacked vs Grouped) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setBarStyle('stacked')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                barStyle === 'stacked' 
                  ? 'bg-teal-600 text-white font-bold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Barras Apiladas (Muestra el volumen total diario)"
            >
              Apilado
            </button>
            <button
              onClick={() => setBarStyle('grouped')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                barStyle === 'grouped' 
                  ? 'bg-teal-600 text-white font-bold shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Barras Agrupadas (Comparativa directa)"
            >
              Agrupado
            </button>
          </div>

          {/* Branch Filter Dropdown / Single Branch Badge */}
          {isMultiBranchEnabled ? (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">Todas las Sucursales (Consolidado)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 rounded-xl px-2.5 py-1.5 text-xs text-teal-800 font-bold">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Sede Única: VACLINIC</span>
            </div>
          )}

          {/* Timeframe Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="7dias">Últimos 7 Días</option>
              <option value="14dias">Últimos 14 Días</option>
              <option value="mes">Mes en Curso</option>
            </select>
          </div>

        </div>
      </div>

      {/* 4 HIGH IMPACT METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Metric 1: Total Volume */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Volumen Semanal</span>
            <FlaskConical className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950 mt-1.5">
            {totalVolumePeriod.toLocaleString()} <span className="text-xs font-normal text-slate-500">tubos</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+16.4% vs semana previa</span>
          </div>
        </div>

        {/* Metric 2: Daily Average */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Promedio Diario</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-800 mt-1.5">
            {dailyAverage} <span className="text-xs font-normal text-slate-500">muestras/día</span>
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-medium">
            Capacidad operativa al <strong className="text-slate-800">82%</strong>
          </div>
        </div>

        {/* Metric 3: Peak Day */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pico Máximo Semanal</span>
            <ArrowUpRight className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-900 mt-1.5">
            {peakDay.total} <span className="text-xs font-normal text-slate-500">muestras</span>
          </div>
          <div className="text-[11px] text-purple-800 mt-1 font-bold">
            {peakDay.dayLabel} (Mayor demanda)
          </div>
        </div>

        {/* Metric 4: Top Branch / Discipline */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {groupingMode === 'study_type' ? 'Estudio Líder' : 'Sucursal Líder'}
            </span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-950 mt-2 truncate">
            {groupingMode === 'study_type' ? 'Hematología' : 'Sede Central (52%)'}
          </div>
          <div className="text-[11px] text-slate-600 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>99.2% Cumplimiento SLA</span>
          </div>
        </div>

      </div>

      {/* MAIN BAR CHART DISPLAY */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        
        {/* Header inside Chart container */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                {groupingMode === 'study_type' 
                  ? 'Volumen Diario por Tipo de Estudio Clínico (Hematología, Química, Parásitos, Cristales)'
                  : 'Volumen Diario por Sucursal (Central, Norte, Este, Hospital UCI)'
                }
              </h4>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {barStyle === 'stacked' ? 'Visualización apilada con total diario acumulado' : 'Visualización agrupada para comparación directa'}
              {selectedBranchFilter !== 'all' ? ` • Filtrado para: ${branches.find(b => b.id === selectedBranchFilter)?.name}` : ' • Todas las sucursales'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-800">
              Total periodo: {totalVolumePeriod} muestras
            </span>
          </div>
        </div>

        {/* Recharts BarChart */}
        <div className="h-80 sm:h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
              
              <XAxis 
                dataKey="shortDay" 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
              />
              
              <YAxis 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
              />
              
              <Tooltip content={<CustomBarTooltip />} />
              
              <Legend 
                verticalAlign="top" 
                height={40} 
                wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '12px' }} 
              />

              {/* RENDER BY STUDY TYPE */}
              {groupingMode === 'study_type' && (
                <>
                  <Bar 
                    dataKey="hematologia" 
                    name={STUDY_TYPE_COLORS.hematologia.name} 
                    stackId={barStyle === 'stacked' ? 'a' : undefined} 
                    fill={STUDY_TYPE_COLORS.hematologia.color} 
                    radius={barStyle === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="quimica" 
                    name={STUDY_TYPE_COLORS.quimica.name} 
                    stackId={barStyle === 'stacked' ? 'a' : undefined} 
                    fill={STUDY_TYPE_COLORS.quimica.color} 
                    radius={barStyle === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="parasitos" 
                    name={STUDY_TYPE_COLORS.parasitos.name} 
                    stackId={barStyle === 'stacked' ? 'a' : undefined} 
                    fill={STUDY_TYPE_COLORS.parasitos.color} 
                    radius={barStyle === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="cristales" 
                    name={STUDY_TYPE_COLORS.cristales.name} 
                    stackId={barStyle === 'stacked' ? 'a' : undefined} 
                    fill={STUDY_TYPE_COLORS.cristales.color} 
                    radius={barStyle === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="inmunologia" 
                    name={STUDY_TYPE_COLORS.inmunologia.name} 
                    stackId={barStyle === 'stacked' ? 'a' : undefined} 
                    fill={STUDY_TYPE_COLORS.inmunologia.color} 
                    radius={barStyle === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="microbiologia" 
                    name={STUDY_TYPE_COLORS.microbiologia.name} 
                    stackId={barStyle === 'stacked' ? 'a' : undefined} 
                    fill={STUDY_TYPE_COLORS.microbiologia.color} 
                    radius={barStyle === 'stacked' ? [4, 4, 0, 0] : [4, 4, 0, 0]} 
                  />
                </>
              )}

              {/* RENDER BY BRANCH */}
              {groupingMode === 'branch' && (
                <>
                  <Bar 
                    dataKey="central" 
                    name={BRANCH_COLORS.central.name} 
                    stackId={barStyle === 'stacked' ? 'b' : undefined} 
                    fill={BRANCH_COLORS.central.color} 
                    radius={barStyle === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="norte" 
                    name={BRANCH_COLORS.norte.name} 
                    stackId={barStyle === 'stacked' ? 'b' : undefined} 
                    fill={BRANCH_COLORS.norte.color} 
                    radius={barStyle === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="este" 
                    name={BRANCH_COLORS.este.name} 
                    stackId={barStyle === 'stacked' ? 'b' : undefined} 
                    fill={BRANCH_COLORS.este.color} 
                    radius={barStyle === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="hospital_uci" 
                    name={BRANCH_COLORS.hospital_uci.name} 
                    stackId={barStyle === 'stacked' ? 'b' : undefined} 
                    fill={BRANCH_COLORS.hospital_uci.color} 
                    radius={barStyle === 'stacked' ? [4, 4, 0, 0] : [4, 4, 0, 0]} 
                  />
                </>
              )}

            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Legend Pills with Volume Totals */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {groupingMode === 'study_type' ? (
            Object.entries(STUDY_TYPE_COLORS).map(([key, config]) => {
              const val = studyTotals[key as keyof typeof studyTotals] || 0;
              const percent = Math.round((val / (totalVolumePeriod || 1)) * 100);
              return (
                <div key={key} className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className="text-slate-400 font-semibold truncate text-[11px]">{config.name}</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-black text-white font-mono">{val}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{percent}%</span>
                  </div>
                </div>
              );
            })
          ) : (
            Object.entries(BRANCH_COLORS).map(([key, config]) => {
              const val = branchTotals[key as keyof typeof branchTotals] || 0;
              const percent = Math.round((val / (totalVolumePeriod || 1)) * 100);
              return (
                <div key={key} className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className="text-slate-400 font-semibold truncate text-[11px]">{config.short}</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-black text-white font-mono">{val}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{percent}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* CROSS-TABULATION MATRIX & BRANCH BREAKDOWN TABLE */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white text-xs">
        
        <div className="bg-slate-50 p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-black text-slate-900 uppercase">
              Matriz Detallada de Procesamiento Diario (Estudios × Sucursales)
            </h4>
            <p className="text-slate-500 text-[11px]">
              Registro numérico por jornada para auditoría y trazabilidad ISO 15189
            </p>
          </div>

          <span className="text-[11px] font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            Últimos 7 días activos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100/70 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Fecha / Jornada</th>
                <th className="p-3 text-right">Hematología</th>
                <th className="p-3 text-right">Química</th>
                <th className="p-3 text-right">Parásitos</th>
                <th className="p-3 text-right">Cristales</th>
                <th className="p-3 text-right">Inmuno</th>
                <th className="p-3 text-right">Microbiol.</th>
                <th className="p-3 text-right bg-slate-200/50 font-black">Total Día</th>
                <th className="p-3 text-center">Cumplimiento SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {rawDailyData.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`hover:bg-slate-50/80 transition-colors ${row.shortDay.includes('Hoy') ? 'bg-cyan-50/40 font-semibold' : ''}`}
                >
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                    <span>{row.dayLabel}</span>
                  </td>
                  <td className="p-3 text-right font-mono text-slate-700">{row.hematologia}</td>
                  <td className="p-3 text-right font-mono text-slate-700">{row.quimica}</td>
                  <td className="p-3 text-right font-mono text-slate-700">{row.parasitos}</td>
                  <td className="p-3 text-right font-mono text-slate-700">{row.cristales}</td>
                  <td className="p-3 text-right font-mono text-slate-700">{row.inmunologia}</td>
                  <td className="p-3 text-right font-mono text-slate-700">{row.microbiologia}</td>
                  <td className="p-3 text-right font-mono font-black text-slate-950 bg-slate-50/80">
                    {row.total}
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {row.slaRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
              <tr>
                <td className="p-3 text-slate-900 uppercase">Totales del Periodo</td>
                <td className="p-3 text-right font-mono">{studyTotals.hematologia}</td>
                <td className="p-3 text-right font-mono">{studyTotals.quimica}</td>
                <td className="p-3 text-right font-mono">{studyTotals.parasitos}</td>
                <td className="p-3 text-right font-mono">{studyTotals.cristales}</td>
                <td className="p-3 text-right font-mono">{studyTotals.inmunologia}</td>
                <td className="p-3 text-right font-mono">{studyTotals.microbiologia}</td>
                <td className="p-3 text-right font-mono text-teal-900 font-black bg-teal-50">
                  {totalVolumePeriod}
                </td>
                <td className="p-3 text-center font-mono text-emerald-800">
                  99.1% Promedio
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

    </div>
  );
};
