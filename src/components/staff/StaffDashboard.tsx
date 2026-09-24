import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { MedicalReport, ReportStatus, ReportCategory, LabEpisode, LabOrder } from '../../types';
import { VaclinicVisualDashboard } from './VaclinicVisualDashboard';
import { DailyVolumeControlPanel } from './DailyVolumeControlPanel';
import { DashboardWidgetGrid } from './DashboardWidgetGrid';
import { CriticalReagentsDashboardAlert } from './CriticalReagentsDashboardAlert';
import { AnimatedKpiCounter } from '../common/AnimatedKpiCounter';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Printer, 
  Edit3, 
  Trash2, 
  Send, 
  Eye,
  Calendar,
  User,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Layers,
  FlaskConical,
  Cpu,
  Building2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Truck,
  BarChart3,
  ListFilter,
  Zap,
  Sliders,
  ArrowRight,
  Activity,
  Receipt,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { 
    reports, 
    patients, 
    episodes, 
    orders = [],
    transfers, 
    branches, 
    currentBranch, 
    setCurrentBranch, 
    resolveDuplicity, 
    setStaffActiveTab, 
    setActiveReportToEdit, 
    setActiveReportToPrint, 
    publishReport, 
    deleteReport, 
    setRole, 
    setSelectedPatientId, 
    showNotification,
    catalogTests,
    criticalReagents,
    reagentsBelowMinThreshold,
    navigateToInventory
  } = useClinic();

  const [dashboardView, setDashboardView] = useState<'widgets_grid' | 'visual_completo' | 'volumen_barras' | 'informes'>('widgets_grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Active non-archived orders
  const activeOrders = useMemo(() => {
    return (orders || []).filter(o => !o.isArchived);
  }, [orders]);

  // Order status counts and metrics
  const pendingOrders = useMemo(() => activeOrders.filter(o => o.status === 'Pendiente'), [activeOrders]);
  const inProcessOrders = useMemo(() => activeOrders.filter(o => o.status === 'En Proceso'), [activeOrders]);
  const readyOrders = useMemo(() => activeOrders.filter(o => o.status === 'Listo'), [activeOrders]);
  const deliveredOrders = useMemo(() => activeOrders.filter(o => o.status === 'Entregado'), [activeOrders]);
  const urgentOrders = useMemo(() => activeOrders.filter(o => o.priority === 'stat_panico' || o.priority === 'urgente'), [activeOrders]);

  const totalRevenue = useMemo(() => {
    return activeOrders.reduce((sum, o) => {
      const num = parseFloat((o.totalPrice || '').replace(/[^0-9.]/g, '')) || 0;
      return sum + num;
    }, 0);
  }, [activeOrders]);

  const pendingBalanceTotal = useMemo(() => {
    return activeOrders.reduce((sum, o) => sum + (o.pendingBalance || 0), 0);
  }, [activeOrders]);

  // Selected KPI filter state for interactive quick inspection
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<'all' | 'Pendiente' | 'En Proceso' | 'Listo' | 'Entregado' | 'urgente' | null>(null);

  const kpiFilteredOrders = useMemo(() => {
    if (!selectedKpiFilter) return [];
    if (selectedKpiFilter === 'all') return activeOrders;
    if (selectedKpiFilter === 'urgente') return urgentOrders;
    return activeOrders.filter(o => o.status === selectedKpiFilter);
  }, [activeOrders, urgentOrders, selectedKpiFilter]);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch = 
      r.patientName.toLowerCase().includes(search.toLowerCase()) ||
      r.reportNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.patientNationalId.includes(search);
    
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalReports = reports.length;
  const publishedReports = reports.filter(r => r.status === 'publicado').length;
  const inReviewReports = reports.filter(r => r.status === 'revision').length;
  const draftReports = reports.filter(r => r.status === 'borrador').length;
  const totalPatients = patients.length;

  const activeEpisodes = episodes.filter(e => currentBranch === 'central' || e.branchId === currentBranch);
  const duplicityEpisodes = activeEpisodes.filter(e => e.duplicityFlag);

  const handleEditReport = (report: MedicalReport) => {
    setActiveReportToEdit(report);
    setStaffActiveTab('redactor');
  };

  const handleViewAsPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setRole('paciente');
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-7xl mx-auto">

      {/* ============================================================ */}
      {/* RESPONSIVE ORDER STATUS KPI SUMMARY CARDS WITH DYNAMIC COLOR */}
      {/* ============================================================ */}
      <section 
        className="bg-white p-3.5 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3.5 sm:space-y-4 transition-all"
        aria-label="Indicadores Clave de Órdenes"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight uppercase">
                Estado Operativo de Órdenes de Laboratorio
              </h2>
              <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-teal-200 shrink-0">
                En Tiempo Real
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Distribución analítica por etapa • Haz clic en una tarjeta para inspeccionar órdenes filtradas
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {selectedKpiFilter && (
              <button
                type="button"
                onClick={() => setSelectedKpiFilter(null)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Limpiar filtro de selección"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Restablecer Filtro</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setStaffActiveTab('ordenes')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
              title="Abrir Gestor Maestro de Órdenes"
            >
              <span>Gestor de Órdenes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Responsive KPI Cards Grid with Dynamic Count-Up & Entrance Animation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          
          {/* Card 1: Total Activas (Slate / Deep Teal) */}
          <button
            type="button"
            onClick={() => setSelectedKpiFilter(prev => prev === 'all' ? null : 'all')}
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[105px] animate-fade-in ${
              selectedKpiFilter === 'all'
                ? 'ring-2 ring-teal-500 ring-offset-2 scale-[1.02] shadow-md border-teal-400'
                : 'hover:scale-[1.02] hover:shadow-xs border-teal-500/30'
            } bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white`}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0 group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-500/30">
                Total
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white leading-none">
                <AnimatedKpiCounter value={activeOrders.length} duration={700} />
              </div>
              <div className="text-[11px] font-bold text-slate-300 mt-1">
                Órdenes Activas
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700/60 text-[10px] text-teal-300 font-mono font-medium flex items-center justify-between">
              <span><AnimatedKpiCounter value={totalRevenue} prefix="Q" decimals={0} duration={850} /> facturado</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${selectedKpiFilter === 'all' ? 'rotate-180 text-teal-300' : 'text-slate-500'}`} />
            </div>
          </button>

          {/* Card 2: Pendientes (Amber / Orange) */}
          <button
            type="button"
            onClick={() => setSelectedKpiFilter(prev => prev === 'Pendiente' ? null : 'Pendiente')}
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[105px] animate-fade-in ${
              selectedKpiFilter === 'Pendiente'
                ? 'ring-2 ring-amber-500 ring-offset-2 scale-[1.02] shadow-md border-amber-400'
                : 'hover:scale-[1.02] hover:shadow-xs hover:border-amber-400 border-amber-200/90'
            } bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white text-amber-950`}
            style={{ animationDelay: '60ms' }}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0 group-hover:scale-110 transition-transform">
                <Clock className={`w-4 h-4 ${pendingOrders.length > 0 ? 'animate-pulse text-amber-600' : ''}`} />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Pendientes
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-950 leading-none">
                <AnimatedKpiCounter value={pendingOrders.length} duration={750} />
              </div>
              <div className="text-[11px] font-bold text-amber-900 mt-1">
                Por Ingresar / Toma
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-amber-200/60 text-[10px] text-amber-700 font-medium flex items-center justify-between">
              <span className="truncate">{pendingOrders.length > 0 ? `${pendingOrders.length} por procesar` : 'Al día'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${selectedKpiFilter === 'Pendiente' ? 'rotate-180 text-amber-700' : 'text-amber-400'}`} />
            </div>
          </button>

          {/* Card 3: En Proceso (Sky / Cyan) */}
          <button
            type="button"
            onClick={() => setSelectedKpiFilter(prev => prev === 'En Proceso' ? null : 'En Proceso')}
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[105px] animate-fade-in ${
              selectedKpiFilter === 'En Proceso'
                ? 'ring-2 ring-sky-500 ring-offset-2 scale-[1.02] shadow-md border-sky-400'
                : 'hover:scale-[1.02] hover:shadow-xs hover:border-sky-400 border-sky-200/90'
            } bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-white text-sky-950`}
            style={{ animationDelay: '120ms' }}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200 shrink-0 group-hover:scale-110 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                En Proceso
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-sky-950 leading-none">
                <AnimatedKpiCounter value={inProcessOrders.length} duration={800} />
              </div>
              <div className="text-[11px] font-bold text-sky-900 mt-1">
                En Análisis Clínico
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-sky-200/60 text-[10px] text-sky-700 font-medium flex items-center justify-between">
              <span className="truncate">{inProcessOrders.length} en analizadores</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${selectedKpiFilter === 'En Proceso' ? 'rotate-180 text-sky-700' : 'text-sky-400'}`} />
            </div>
          </button>

          {/* Card 4: Listas / Validadas (Emerald / Teal) */}
          <button
            type="button"
            onClick={() => setSelectedKpiFilter(prev => prev === 'Listo' ? null : 'Listo')}
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[105px] animate-fade-in ${
              selectedKpiFilter === 'Listo'
                ? 'ring-2 ring-emerald-500 ring-offset-2 scale-[1.02] shadow-md border-emerald-400'
                : 'hover:scale-[1.02] hover:shadow-xs hover:border-emerald-400 border-emerald-200/90'
            } bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white text-emerald-950`}
            style={{ animationDelay: '180ms' }}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Listas
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-950 leading-none">
                <AnimatedKpiCounter value={readyOrders.length} duration={850} />
              </div>
              <div className="text-[11px] font-bold text-emerald-900 mt-1">
                Listas / Validadas
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-700 font-medium flex items-center justify-between">
              <span className="truncate">Listas para firma</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${selectedKpiFilter === 'Listo' ? 'rotate-180 text-emerald-700' : 'text-emerald-400'}`} />
            </div>
          </button>

          {/* Card 5: Entregadas (Indigo / Purple) */}
          <button
            type="button"
            onClick={() => setSelectedKpiFilter(prev => prev === 'Entregado' ? null : 'Entregado')}
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[105px] animate-fade-in ${
              selectedKpiFilter === 'Entregado'
                ? 'ring-2 ring-indigo-500 ring-offset-2 scale-[1.02] shadow-md border-indigo-400'
                : 'hover:scale-[1.02] hover:shadow-xs hover:border-indigo-400 border-indigo-200/90'
            } bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-white text-indigo-950`}
            style={{ animationDelay: '240ms' }}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200 shrink-0 group-hover:scale-110 transition-transform">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                Entregadas
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-indigo-950 leading-none">
                <AnimatedKpiCounter value={deliveredOrders.length} duration={900} />
              </div>
              <div className="text-[11px] font-bold text-indigo-900 mt-1">
                Despachadas
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-indigo-200/60 text-[10px] text-indigo-700 font-medium flex items-center justify-between">
              <span className="truncate">Entregadas a paciente</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${selectedKpiFilter === 'Entregado' ? 'rotate-180 text-indigo-700' : 'text-indigo-400'}`} />
            </div>
          </button>

          {/* Card 6: STAT / Urgencias (Dynamic Rose / Red) */}
          <button
            type="button"
            onClick={() => setSelectedKpiFilter(prev => prev === 'urgente' ? null : 'urgente')}
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[105px] animate-fade-in ${
              selectedKpiFilter === 'urgente'
                ? 'ring-2 ring-rose-500 ring-offset-2 scale-[1.02] shadow-md border-rose-400'
                : 'hover:scale-[1.02] hover:shadow-xs'
            } ${
              urgentOrders.length > 0
                ? 'bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-white border-rose-300 text-rose-950 shadow-xs shadow-rose-900/5'
                : 'bg-gradient-to-br from-slate-50 to-white border-slate-200 text-slate-700'
            }`}
            style={{ animationDelay: '300ms' }}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 border group-hover:scale-110 transition-transform ${
                urgentOrders.length > 0
                  ? 'bg-rose-100 text-rose-700 border-rose-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <AlertTriangle className={`w-4 h-4 ${urgentOrders.length > 0 ? 'animate-bounce text-rose-600' : ''}`} />
              </div>
              <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                urgentOrders.length > 0
                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {urgentOrders.length > 0 ? '¡STAT Activo!' : 'Normal'}
              </span>
            </div>
            <div>
              <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none ${
                urgentOrders.length > 0 ? 'text-rose-950' : 'text-slate-800'
              }`}>
                <AnimatedKpiCounter value={urgentOrders.length} duration={600} />
              </div>
              <div className={`text-[11px] font-bold mt-1 ${
                urgentOrders.length > 0 ? 'text-rose-900' : 'text-slate-600'
              }`}>
                Prioridad STAT / Urgente
              </div>
            </div>
            <div className={`mt-2 pt-2 border-t text-[10px] font-medium flex items-center justify-between ${
              urgentOrders.length > 0 ? 'border-rose-200 text-rose-700' : 'border-slate-200 text-slate-500'
            }`}>
              <span className="truncate">{urgentOrders.length > 0 ? 'TAT Prioritario < 45m' : 'Sin urgencias críticas'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${selectedKpiFilter === 'urgente' ? 'rotate-180 text-rose-700' : 'text-slate-400'}`} />
            </div>
          </button>

        </div>

        {/* Expandable Quick Order Inspection Drawer */}
        {selectedKpiFilter && (
          <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 space-y-3 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-tight">
                  {selectedKpiFilter === 'all' && `Todas las Órdenes Activas (${kpiFilteredOrders.length})`}
                  {selectedKpiFilter === 'Pendiente' && `Órdenes Pendientes de Ingreso / Toma (${kpiFilteredOrders.length})`}
                  {selectedKpiFilter === 'En Proceso' && `Órdenes en Análisis Clínico (${kpiFilteredOrders.length})`}
                  {selectedKpiFilter === 'Listo' && `Órdenes Listas y Validadas (${kpiFilteredOrders.length})`}
                  {selectedKpiFilter === 'Entregado' && `Órdenes Entregadas (${kpiFilteredOrders.length})`}
                  {selectedKpiFilter === 'urgente' && `Órdenes con Prioridad STAT / Urgente (${kpiFilteredOrders.length})`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStaffActiveTab('ordenes')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-teal-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <span>Abrir en Gestor Maestro</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedKpiFilter(null)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Cerrar vista rápida"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {kpiFilteredOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                No hay órdenes registradas con este criterio de estado en este momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {kpiFilteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-400 shadow-2xs hover:shadow-xs transition-all space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {ord.orderNumber}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            ord.priority === 'stat_panico' ? 'bg-rose-100 text-rose-800' :
                            ord.priority === 'urgente' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {ord.priority.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">
                          {ord.patientName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          DPI: {ord.nationalId}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          ord.status === 'Listo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          ord.status === 'En Proceso' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                          ord.status === 'Entregado' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {ord.status}
                        </span>
                        <div className="font-mono font-black text-xs text-slate-800 mt-1">
                          {ord.totalPrice || 'Q0.00'}
                        </div>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{ord.testsList?.length || ord.testsCount || 0} análisis ({ord.testsList?.slice(0, 2).join(', ')}{(ord.testsList?.length || 0) > 2 ? '...' : ''})</span>
                      <button
                        type="button"
                        onClick={() => setStaffActiveTab('ordenes')}
                        className="text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer"
                      >
                        Ver detalle ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Main Switcher Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setDashboardView('widgets_grid')}
            id="tab-widgets-grid"
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
              dashboardView === 'widgets_grid'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Widgets & Métricas (Drag & Drop)</span>
            <span className="sm:hidden">Widgets</span>
          </button>

          <button
            onClick={() => setDashboardView('visual_completo')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
              dashboardView === 'visual_completo'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">PANEL VACLINIC (Trazabilidad & KPIs)</span>
            <span className="sm:hidden">Panel VACLINIC</span>
          </button>

          <button
            onClick={() => setDashboardView('volumen_barras')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
              dashboardView === 'volumen_barras'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="hidden sm:inline">Volumen Diario (Barras)</span>
            <span className="sm:hidden">Volumen</span>
          </button>

          <button
            onClick={() => setDashboardView('informes')}
            className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
              dashboardView === 'informes'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="hidden sm:inline">Registro de Informes ({reports.length})</span>
            <span className="sm:hidden">Informes ({reports.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {reagentsBelowMinThreshold.length > 0 && (
            <button
              onClick={navigateToInventory}
              id="dashboard-header-reagent-alert-pill"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 transition-all cursor-pointer shadow-xs animate-pulse min-h-[40px]"
              title="Reactivos bajo stock mínimo. Clic para gestionar en inventarios."
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="hidden sm:inline">{reagentsBelowMinThreshold.length} Reactivo(s) Críticos</span>
              <span className="sm:hidden">{reagentsBelowMinThreshold.length} Críticos</span>
            </button>
          )}

          <button
            onClick={() => setStaffActiveTab('catalogo_perfiles')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 border border-slate-300 min-h-[40px]"
          >
            <FlaskConical className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="hidden sm:inline">Catálogo & Perfiles ({catalogTests.length})</span>
            <span className="sm:hidden">Catálogo</span>
          </button>

          <button
            onClick={() => {
              setActiveReportToEdit(null);
              setStaffActiveTab('redactor');
            }}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 min-h-[40px]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Nuevo Informe</span>
          </button>
        </div>
      </div>

      {/* CONTINUOUS MONITORING ALERT: CRITICAL REAGENTS REACHING MINIMUM STOCK */}
      <CriticalReagentsDashboardAlert />

      {/* RENDER MODULAR WIDGET SYSTEM WITH DRAG-AND-DROP & VISIBILITY TOGGLES */}
      {dashboardView === 'widgets_grid' && (
        <DashboardWidgetGrid />
      )}

      {/* RENDER VISUAL DASHBOARD (PANEL VACLINIC WITH RECHARTS) */}
      {dashboardView === 'visual_completo' && (
        <VaclinicVisualDashboard />
      )}

      {/* RENDER DEDICATED DAILY VOLUME CONTROL PANEL */}
      {dashboardView === 'volumen_barras' && (
        <DailyVolumeControlPanel />
      )}

      {/* Duplicity Alerts Banner (if any) */}
      {duplicityEpisodes.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce" />
              <span>Alerta VACLINIC: {duplicityEpisodes.length} Detección de Muestras / Órdenes Duplicadas</span>
            </div>
            <button
              onClick={() => setStaffActiveTab('episodios')}
              className="text-xs font-bold text-amber-900 hover:underline"
            >
              Gestionar en Flujo LABVACLINIC ➔
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {duplicityEpisodes.map((dep) => (
              <div key={dep.id} className="bg-white p-3 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                <div>
                  <span className="font-mono font-bold text-amber-800">{dep.episodeNumber}</span>
                  <div className="font-bold text-slate-900">{dep.patientName}</div>
                  <div className="text-[11px] text-amber-700">{dep.duplicityDetails}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => resolveDuplicity(dep.id, 'keep')}
                    title="Autorizar duplicidad"
                    className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold text-[10px] cursor-pointer"
                  >
                    Autorizar
                  </button>
                  <button
                    onClick={() => resolveDuplicity(dep.id, 'cancel')}
                    title="Cancelar duplicado"
                    className="p-1.5 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 font-bold text-[10px] cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informes y Resultados Médicos Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header & Title */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">
              Informes de Laboratorio y Casos Clínicos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Resultados validados, en revisión por bioquímica y borradores asistidos con IA
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar paciente, folio LAB..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Todos los Estados</option>
              <option value="publicado">Publicados</option>
              <option value="revision">En Revisión</option>
              <option value="borrador">Borradores</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Todas las Categorías</option>
              <option value="hematologia">Hematología</option>
              <option value="bioquimica">Bioquímica / Química</option>
              <option value="laboratorio">Laboratorio General</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[680px]">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Informe / Folio</th>
                <th className="p-3.5">Paciente</th>
                <th className="p-3.5">Examen / Categoría</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5">Fecha Emisión</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {report.reportNumber}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-800 text-sm">{report.patientName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">DNI: {report.patientNationalId}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">{report.title}</div>
                    <span className="inline-block text-[10px] text-cyan-800 bg-cyan-50 px-2 py-0.2 rounded border border-cyan-200 mt-0.5 font-semibold">
                      {report.category}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      report.status === 'publicado'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : report.status === 'revision'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {report.status === 'publicado' ? '✓ Publicado' : report.status === 'revision' ? '⏳ En Revisión' : '📝 Borrador'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 font-mono">
                    {new Date(report.emissionDate || report.sampleDate).toLocaleDateString('es-ES')}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditReport(report)}
                        title="Editar / Redactar con IA"
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setActiveReportToPrint(report)}
                        title="Imprimir o Descargar PDF Oficial VACLINIC"
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {report.status !== 'publicado' && (
                        <button
                          onClick={() => publishReport(report.id)}
                          title="Publicar en Portal del Paciente"
                          className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Publicar</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
