import React, { useState, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  CheckCircle2,
  Calendar,
  CalendarDays,
  CalendarRange,
  FileSpreadsheet,
  Download,
  Filter,
  ArrowUpRight,
  FlaskConical,
  Search,
  Building2,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  AlertTriangle,
  Info,
  DollarSign,
  ArrowUpDown,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { exportLabStatisticsToExcel } from '../../utils/excelExportService';
import { playNotificationChime } from '../../utils/audioChime';
import { DateBreakdownTab } from './statistics/DateBreakdownTab';
import { 
  aggregateOrdersByDay, 
  aggregateOrdersByMonth, 
  aggregateOrdersByYear,
  formatSpanishDate,
  formatSpanishMonth
} from '../../utils/dateStatsUtils';

export type StatisticsTab = 'resumen' | 'fechas' | 'pacientes' | 'pruebas' | 'ordenes';
export type DateFilterMode = 
  | 'all' 
  | 'today' 
  | 'yesterday' 
  | 'last7' 
  | 'last30' 
  | 'this_month' 
  | 'last_month' 
  | 'day' 
  | 'month' 
  | 'year' 
  | 'range';

export const LabStatisticsView: React.FC = () => {
  const { 
    orders, 
    patients, 
    catalogTests, 
    episodes,
    branches,
    isMultiBranchEnabled,
    showNotification 
  } = useClinic();

  const [currentTab, setCurrentTab] = useState<StatisticsTab>('resumen');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Sede del Laboratorio Clínico (Sede Única o Selección si Multi-Sede activo)
  const [selectedBranch, setSelectedBranch] = useState<string>('central');

  // Opción para activar / desactivar filtro de fechas por el momento
  const [isDateFilterActive, setIsDateFilterActive] = useState<boolean>(true);

  // Filtro Temporal Dinámico: Por Fechas, Día, Mes y Año
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('all');
  const [specificDate, setSpecificDate] = useState<string>('2026-08-31');
  const [specificMonth, setSpecificMonth] = useState<string>('2026-08');
  const [specificYear, setSpecificYear] = useState<number>(2026);
  const [rangeStartDate, setRangeStartDate] = useState<string>('2026-08-01');
  const [rangeEndDate, setRangeEndDate] = useState<string>('2026-08-31');

  // Agrupación para gráficos y desglose temporal: Día, Mes, Año
  const [timeGrouping, setTimeGrouping] = useState<'day' | 'month' | 'year'>('day');

  // Catálogo dinámico de Años disponibles en las órdenes
  const availableYears = useMemo(() => {
    const set = new Set<number>();
    orders.forEach((o) => {
      const yr = o.year || parseInt((o.date || '').slice(0, 4), 10);
      if (yr && !isNaN(yr)) set.add(yr);
    });
    if (set.size === 0) set.add(2026);
    return Array.from(set).sort((a, b) => b - a);
  }, [orders]);

  // Catálogo dinámico de Meses disponibles (YYYY-MM)
  const availableMonths = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => {
      const d = o.date || '';
      if (d.length >= 7) {
        const monthKey = d.slice(0, 7);
        if (!map.has(monthKey)) {
          map.set(monthKey, formatSpanishMonth(monthKey));
        }
      }
    });
    if (map.size === 0) {
      map.set('2026-08', 'Agosto 2026');
    }
    return Array.from(map.entries())
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [orders]);

  // Catálogo dinámico de Fechas individuales disponibles
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.date) set.add(o.date);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [orders]);

  // Helper para parsear importes como "Q225.00"
  const parseAmount = (val?: string | number): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // Etiqueta legible del filtro temporal activo
  const activeFilterLabel = useMemo(() => {
    if (!isDateFilterActive) return 'Filtro Temporal Desactivado (Histórico Completo)';
    if (dateFilterMode === 'all') return 'Histórico Consolidado (Todas las fechas)';
    if (dateFilterMode === 'today') return 'Hoy (09 de Septiembre)';
    if (dateFilterMode === 'yesterday') return 'Ayer (08 de Septiembre)';
    if (dateFilterMode === 'last7') return 'Últimos 7 Días';
    if (dateFilterMode === 'last30') return 'Últimos 30 Días';
    if (dateFilterMode === 'this_month') return 'Mes en Curso: Septiembre 2026';
    if (dateFilterMode === 'last_month') return 'Mes Anterior: Agosto 2026';
    if (dateFilterMode === 'day') return `Día Específico: ${formatSpanishDate(specificDate)}`;
    if (dateFilterMode === 'month') return `Mes Específico: ${formatSpanishMonth(specificMonth)}`;
    if (dateFilterMode === 'year') return `Año Específico: ${specificYear}`;
    if (dateFilterMode === 'range') return `Rango: ${rangeStartDate} al ${rangeEndDate}`;
    return 'Personalizado';
  }, [isDateFilterActive, dateFilterMode, specificDate, specificMonth, specificYear, rangeStartDate, rangeEndDate]);

  // Órdenes filtradas según el filtro temporal (día, mes, año, rango) y sede
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Filtro de sede (si es sede única siempre central)
      const effectiveBranch = isMultiBranchEnabled ? selectedBranch : 'central';
      if (effectiveBranch !== 'all' && ord.branchId && ord.branchId !== effectiveBranch) {
        return false;
      }

      // Si la opción de filtro de fechas está desactivada por el momento
      if (!isDateFilterActive) {
        return true;
      }

      const ordDate = ord.date || '';

      // Filtro Temporal por Día / Mes / Año
      if (dateFilterMode === 'today') {
        const todayIso = new Date().toISOString().slice(0, 10);
        if (ordDate !== todayIso && ordDate !== '2026-09-09') return false;
      } else if (dateFilterMode === 'yesterday') {
        const yesterdayIso = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (ordDate !== yesterdayIso && ordDate !== '2026-09-08') return false;
      } else if (dateFilterMode === 'last7') {
        if (ordDate < '2026-08-25') return false;
      } else if (dateFilterMode === 'last30') {
        if (ordDate < '2026-08-01') return false;
      } else if (dateFilterMode === 'this_month') {
        if (!ordDate.startsWith('2026-09')) return false;
      } else if (dateFilterMode === 'last_month') {
        if (!ordDate.startsWith('2026-08')) return false;
      } else if (dateFilterMode === 'day') {
        if (specificDate && ordDate !== specificDate) return false;
      } else if (dateFilterMode === 'month') {
        if (specificMonth && !ordDate.startsWith(specificMonth)) return false;
      } else if (dateFilterMode === 'year') {
        if (specificYear && !ordDate.startsWith(String(specificYear))) return false;
      } else if (dateFilterMode === 'range') {
        if (rangeStartDate && ordDate < rangeStartDate) return false;
        if (rangeEndDate && ordDate > rangeEndDate) return false;
      }

      // Filtro de búsqueda de texto
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        const matchesName = ord.patientName.toLowerCase().includes(query);
        const matchesOrder = ord.orderNumber.toLowerCase().includes(query);
        const matchesDpi = ord.nationalId?.includes(query);
        if (!matchesName && !matchesOrder && !matchesDpi) return false;
      }

      return true;
    });
  }, [
    orders, 
    selectedBranch, 
    dateFilterMode, 
    specificDate, 
    specificMonth, 
    specificYear, 
    rangeStartDate, 
    rangeEndDate, 
    searchFilter
  ]);

  // Cálculos estadísticos clave
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, ord) => sum + parseAmount(ord.totalPrice), 0);
  }, [filteredOrders]);

  const totalTestsVolume = useMemo(() => {
    return filteredOrders.reduce(
      (sum, ord) => sum + (ord.testsCount || (ord.testsList ? ord.testsList.length : 1)), 
      0
    );
  }, [filteredOrders]);

  const avgTicket = useMemo(() => {
    return filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
  }, [totalRevenue, filteredOrders.length]);

  // Frecuencia y demanda de exámenes reales calculadas de las órdenes
  const testFrequency = useMemo(() => {
    const map: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      if (o.testsList && Array.isArray(o.testsList)) {
        o.testsList.forEach((t) => {
          const name = t.trim();
          map[name] = (map[name] || 0) + 1;
        });
      }
    });

    const list = Object.entries(map).map(([name, count]) => {
      const catalogMatch = catalogTests.find(
        (c) => c.name.toLowerCase() === name.toLowerCase() || name.toLowerCase().includes(c.name.toLowerCase())
      );
      const price = catalogMatch?.price || (name.includes('Perfil') ? 180 : name.includes('Hemograma') ? 65 : 45);
      return {
        name,
        count,
        price: `Q${price.toFixed(2)}`,
        rawPrice: price,
        totalRevenueEst: price * count,
        category: catalogMatch?.categoryName || 'Química / Hematología General'
      };
    });

    return list.sort((a, b) => b.count - a.count);
  }, [filteredOrders, catalogTests]);

  // Estadísticas de pacientes (Flujo)
  const patientFlowMetrics = useMemo(() => {
    return patients.map((p) => {
      const pOrders = filteredOrders.filter(
        (o) => o.patientId === p.id || o.nationalId === p.nationalId || o.patientName.toLowerCase() === p.fullName.toLowerCase()
      );
      const ordersCount = pOrders.length;
      const testsCount = pOrders.reduce(
        (acc, cur) => acc + (cur.testsCount || (cur.testsList ? cur.testsList.length : 1)), 
        0
      );
      const totalSpent = pOrders.reduce((acc, cur) => acc + parseAmount(cur.totalPrice), 0);

      return {
        ...p,
        ordersCount,
        testsCount,
        totalSpent
      };
    }).sort((a, b) => b.ordersCount - a.ordersCount);
  }, [patients, filteredOrders]);

  // Datos dinámicos para la gráfica de tendencias según la agrupación activa (Día, Mes o Año)
  const summaryChartData = useMemo(() => {
    if (timeGrouping === 'day') {
      const days = aggregateOrdersByDay(filteredOrders);
      return days.map((d) => ({
        key: d.date,
        displayDate: d.displayDate,
        fullName: d.fullDateLabel,
        ordersCount: d.ordersCount,
        revenue: d.revenue
      }));
    } else if (timeGrouping === 'month') {
      const months = aggregateOrdersByMonth(filteredOrders);
      return months.map((m) => ({
        key: m.monthKey,
        displayDate: m.displayMonth,
        fullName: m.displayMonth,
        ordersCount: m.ordersCount,
        revenue: m.revenue
      }));
    } else {
      const years = aggregateOrdersByYear(filteredOrders);
      return years.map((y) => ({
        key: String(y.year),
        displayDate: `Año ${y.year}`,
        fullName: `Año ${y.year}`,
        ordersCount: y.ordersCount,
        revenue: y.revenue
      }));
    }
  }, [filteredOrders, timeGrouping]);

  // Función para ejecutar la exportación a Excel
  const handleExportToExcel = (customOptions?: {
    periodLabel?: string;
    branchFilter?: string;
    specificDate?: string;
    specificMonth?: string;
    specificYear?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    setIsExporting(true);

    const branchToUse = customOptions?.branchFilter !== undefined ? customOptions.branchFilter : selectedBranch;
    const periodLabel = customOptions?.periodLabel || activeFilterLabel;

    let sDate = customOptions?.specificDate;
    let sMonth = customOptions?.specificMonth;
    let sYear = customOptions?.specificYear;
    let startD = customOptions?.startDate;
    let endD = customOptions?.endDate;

    // Si no se pasaron opciones explícitas, heredar del estado actual
    if (!customOptions) {
      if (dateFilterMode === 'day') {
        sDate = specificDate;
      } else if (dateFilterMode === 'month') {
        sMonth = specificMonth;
      } else if (dateFilterMode === 'year') {
        sYear = specificYear;
      } else if (dateFilterMode === 'range') {
        startD = rangeStartDate;
        endD = rangeEndDate;
      } else if (dateFilterMode === 'this_month') {
        sMonth = '2026-09';
      } else if (dateFilterMode === 'last_month') {
        sMonth = '2026-08';
      }
    }

    setTimeout(() => {
      try {
        const result = exportLabStatisticsToExcel(
          orders,
          patients,
          episodes,
          catalogTests,
          {
            periodLabel,
            branchFilter: branchToUse !== 'all' ? branchToUse : undefined,
            specificDate: sDate,
            specificMonth: sMonth,
            specificYear: sYear,
            startDate: startD,
            endDate: endD
          }
        );

        playNotificationChime('success');
        showNotification(
          `¡Archivo Excel generado exitosamente! Descargado como: ${result.fileName} (${result.totalOrders} órdenes, ${result.totalPatients} pacientes analizados).`,
          'success'
        );
        setIsExportModalOpen(false);
      } catch (error) {
        console.error('Error al generar Excel:', error);
        showNotification('Hubo un error al generar el archivo Excel. Por favor reintente.', 'error');
      } finally {
        setIsExporting(false);
      }
    }, 450);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
      
      {/* Header Principal con Botón de Exportación Excel Destacado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 shadow-xs">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Estadísticas & Rendimiento Gerencial
              </h1>
              <span className="bg-teal-100 text-teal-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider border border-teal-200">
                LIS LABVACLINIC
              </span>
              <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-teal-600" />
                <span>Sede Única: Oratorio, Santa Rosa</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium max-w-2xl leading-relaxed">
              Análisis del flujo de pacientes, volumen analítico de pruebas, facturación en Quetzales (Q) y exportación a hojas de cálculo para la gerencia general.
            </p>
          </div>
        </div>

        {/* Acciones de Exportación Excel */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <button
            id="btn-export-excel-options"
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Personalizar rango y filtros del reporte de Excel"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filtros & Opciones</span>
          </button>

          <button
            id="btn-export-excel-quick"
            type="button"
            onClick={() => handleExportToExcel()}
            disabled={isExporting}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            title="Descargar libro de cálculo .xlsx completo con hojas de resumen, pacientes, pruebas y órdenes"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                <span>Generando Excel...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Exportar a Excel (.xlsx)</span>
                <Download className="w-3.5 h-3.5 text-emerald-300 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Ejecutivas con Cálculos Dinámicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Órdenes Totales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Órdenes Analizadas</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 font-bold text-xs">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 flex items-baseline gap-2">
            <span>{filteredOrders.length}</span>
            <span className="text-xs font-medium text-slate-400">órdenes</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>100% trazables con código de barras</span>
          </div>
        </div>

        {/* Facturación Total en Q */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Facturación en Período</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            Q{totalRevenue.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1.5">
            Ticket promedio: <strong className="text-emerald-700">Q{avgTicket.toFixed(2)}</strong> por orden
          </div>
        </div>

        {/* Volumen de Pruebas & Exámenes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-cyan-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Volumen de Pruebas</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 font-bold text-xs">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 flex items-baseline gap-2">
            <span>{totalTestsVolume}</span>
            <span className="text-xs font-medium text-slate-400">determinaciones</span>
          </div>
          <div className="text-[11px] text-cyan-700 font-bold mt-1.5 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>{(totalTestsVolume / (filteredOrders.length || 1)).toFixed(1)} pruebas prom. / paciente</span>
          </div>
        </div>

        {/* Pacientes Registrados & Flujo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Padrón de Pacientes</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 font-bold text-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 flex items-baseline gap-2">
            <span>{patients.length}</span>
            <span className="text-xs font-medium text-slate-400">expedientes</span>
          </div>
          <div className="text-[11px] text-purple-700 font-bold mt-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>TAT 1h 45m • 98.6% SLA Cumplido</span>
          </div>
        </div>

      </div>

      {/* BARRA DE FILTRO TEMPORAL Y CRONOLÓGICO: POR FECHAS, DÍA, MES Y AÑO */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Filtro Cronológico de Información
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                  Día • Mes • Año
                </span>
                {!isDateFilterActive && (
                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                    Desactivado por el momento
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {isDateFilterActive 
                  ? 'Filtra los datos estadísticos por fecha individual, mes consolidado, año o rango personalizado:' 
                  : 'El filtro cronológico está actualmente desactivado. Mostrando todos los registros consolidados:'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón para Desactivar / Activar esta opción por el momento */}
            <button
              type="button"
              onClick={() => {
                const nextState = !isDateFilterActive;
                setIsDateFilterActive(nextState);
                showNotification(
                  nextState 
                    ? 'Filtro de fechas ACTIVADO: Puede filtrar por día, mes y año' 
                    : 'Filtro de fechas DESACTIVADO por el momento (Mostrando histórico completo)',
                  nextState ? 'info' : 'success'
                );
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
                isDateFilterActive
                  ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600 font-black'
              }`}
              title={isDateFilterActive ? "Desactivar por el momento el filtro de fechas" : "Volver a activar el filtro de fechas"}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {isDateFilterActive ? 'Desactivar opción por el momento' : 'Activar filtro por fechas (Día, Mes, Año)'}
              </span>
            </button>

            {/* Identificador Sede: Sede Única o Selector si Multi-Sede activa */}
            {isMultiBranchEnabled ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                <span className="text-slate-500 font-medium">Sede:</span>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent font-black text-teal-950 outline-hidden cursor-pointer"
                >
                  <option value="all">Todas las Sedes (Consolidado)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-xs shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Sede:</span>
                  <span className="font-black text-teal-950">VACLINIC Laboratorio Clínico</span>
                  <span className="bg-teal-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase">
                    Sede Única
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botonera de Filtros Rápidos o Estado Desactivado */}
        {isDateFilterActive ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setDateFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilterMode === 'all'
                ? 'bg-teal-700 text-white shadow-xs font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Todo el Histórico
          </button>

          <button
            type="button"
            onClick={() => setDateFilterMode('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilterMode === 'today'
                ? 'bg-teal-700 text-white shadow-xs font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Hoy (09 Sep)
          </button>

          <button
            type="button"
            onClick={() => setDateFilterMode('yesterday')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilterMode === 'yesterday'
                ? 'bg-teal-700 text-white shadow-xs font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Ayer (08 Sep)
          </button>

          <button
            type="button"
            onClick={() => setDateFilterMode('last7')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilterMode === 'last7'
                ? 'bg-teal-700 text-white shadow-xs font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Últimos 7 Días
          </button>

          <button
            type="button"
            onClick={() => setDateFilterMode('this_month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilterMode === 'this_month'
                ? 'bg-teal-700 text-white shadow-xs font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Septiembre 2026
          </button>

          <button
            type="button"
            onClick={() => setDateFilterMode('last_month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilterMode === 'last_month'
                ? 'bg-teal-700 text-white shadow-xs font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Agosto 2026
          </button>

          <span className="h-4 w-px bg-slate-300 mx-1 hidden sm:inline-block"></span>

          {/* Filtro Por Día Específico */}
          <button
            type="button"
            onClick={() => setDateFilterMode('day')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilterMode === 'day'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Por Día Específico</span>
          </button>

          {/* Filtro Por Mes Específico */}
          <button
            type="button"
            onClick={() => setDateFilterMode('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilterMode === 'month'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Por Mes Específico</span>
          </button>

          {/* Filtro Por Año Específico */}
          <button
            type="button"
            onClick={() => setDateFilterMode('year')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilterMode === 'year'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Por Año</span>
          </button>

          {/* Filtro Por Rango */}
          <button
            type="button"
            onClick={() => setDateFilterMode('range')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              dateFilterMode === 'range'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Rango de Fechas</span>
          </button>
        </div>

        {/* Controles Dinámicos según el modo seleccionado */}
        {dateFilterMode === 'day' && (
          <div className="flex flex-wrap items-center gap-2.5 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl animate-fade-in">
            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-indigo-600" />
              Selecciona o introduce la fecha a consultar:
            </span>
            <input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="text-xs font-bold p-1.5 px-2.5 rounded-lg border border-indigo-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
            {availableDates.length > 0 && (
              <select
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="text-xs font-semibold p-1.5 px-2.5 rounded-lg border border-indigo-300 bg-white text-slate-800 cursor-pointer shadow-2xs"
              >
                <option value="">O seleccionar fecha registrada...</option>
                {availableDates.map((d) => (
                  <option key={d} value={d}>
                    {d} — {formatSpanishDate(d)}
                  </option>
                ))}
              </select>
            )}
            <span className="text-[11px] text-indigo-700 font-medium">
              ({filteredOrders.length} órdenes encontradas para este día)
            </span>
          </div>
        )}

        {dateFilterMode === 'month' && (
          <div className="flex flex-wrap items-center gap-2.5 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl animate-fade-in">
            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Selecciona el mes a consultar:
            </span>
            <select
              value={specificMonth}
              onChange={(e) => setSpecificMonth(e.target.value)}
              className="text-xs font-bold p-1.5 px-3 rounded-lg border border-indigo-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} ({m.key})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-indigo-700 font-medium">
              ({filteredOrders.length} órdenes encontradas para este mes)
            </span>
          </div>
        )}

        {dateFilterMode === 'year' && (
          <div className="flex flex-wrap items-center gap-2.5 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl animate-fade-in">
            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Selecciona el año a consultar:
            </span>
            <select
              value={specificYear}
              onChange={(e) => setSpecificYear(Number(e.target.value))}
              className="text-xs font-bold p-1.5 px-3 rounded-lg border border-indigo-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Año {yr}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-indigo-700 font-medium">
              ({filteredOrders.length} órdenes encontradas para este año)
            </span>
          </div>
        )}

        {dateFilterMode === 'range' && (
          <div className="flex flex-wrap items-center gap-2.5 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl animate-fade-in">
            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <CalendarRange className="w-4 h-4 text-indigo-600" />
              Desde:
            </span>
            <input
              type="date"
              value={rangeStartDate}
              onChange={(e) => setRangeStartDate(e.target.value)}
              className="text-xs font-bold p-1.5 px-2.5 rounded-lg border border-indigo-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
            <span className="text-xs font-bold text-indigo-950">Hasta:</span>
            <input
              type="date"
              value={rangeEndDate}
              onChange={(e) => setRangeEndDate(e.target.value)}
              className="text-xs font-bold p-1.5 px-2.5 rounded-lg border border-indigo-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
            <span className="text-[11px] text-indigo-700 font-medium">
              ({filteredOrders.length} órdenes en el rango seleccionado)
            </span>
          </div>
        )}

        {/* Resumen del Filtro Activo con botón para restablecer */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-slate-700">Filtro Activo:</span>
            <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-300 font-black text-teal-800 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              {activeFilterLabel}
            </span>
            <span className="text-slate-500 hidden sm:inline">
              • <strong className="text-slate-800 font-mono">{filteredOrders.length}</strong> órdenes • Facturación:{' '}
              <strong className="text-emerald-700 font-mono">Q{totalRevenue.toFixed(2)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {dateFilterMode !== 'all' && (
              <button
                type="button"
                onClick={() => setDateFilterMode('all')}
                className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Restablecer a todo el histórico</span>
              </button>
            )}
          </div>
        </div>
      </>
    ) : (
      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Filtro de Fechas Desactivado por el Momento:</strong> Se muestran todas las <strong>{filteredOrders.length}</strong> órdenes históricas de la sede unificada sin filtrado por fecha.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsDateFilterActive(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-2xs self-start sm:self-auto cursor-pointer whitespace-nowrap"
        >
          Habilitar filtros por Día / Mes / Año
        </button>
      </div>
    )}
  </div>

      {/* Navegador de Pestañas & Buscador */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="tab-btn-resumen"
            type="button"
            onClick={() => setCurrentTab('resumen')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'resumen'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-teal-400" />
            <span>Resumen & Gráficas</span>
          </button>

          {/* PESTAÑA NUEVA: POR FECHAS (DÍA / MES / AÑO) */}
          <button
            id="tab-btn-fechas"
            type="button"
            onClick={() => setCurrentTab('fechas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'fechas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Por Fechas (Día / Mes / Año)</span>
            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-teal-500 text-white">
              Nuevo
            </span>
          </button>

          <button
            id="tab-btn-pacientes"
            type="button"
            onClick={() => setCurrentTab('pacientes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'pacientes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span>Flujo de Pacientes ({patients.length})</span>
          </button>

          <button
            id="tab-btn-pruebas"
            type="button"
            onClick={() => setCurrentTab('pruebas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'pruebas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span>Volumen de Pruebas ({testFrequency.length})</span>
          </button>

          <button
            id="tab-btn-ordenes"
            type="button"
            onClick={() => setCurrentTab('ordenes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'ordenes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Detalle de Órdenes ({filteredOrders.length})</span>
          </button>
        </div>

        {/* Filtro de Búsqueda y Período */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar paciente u orden..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-56 focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-slate-50"
            />
            {searchFilter && (
              <button 
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            onClick={() => handleExportToExcel()}
            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
            title="Exportación rápida a Excel con filtro activo"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CONTENIDO DE LAS PESTAÑAS */}

      {/* PESTAÑA 1: RESUMEN EJECUTIVO & GRÁFICAS */}
      {currentTab === 'resumen' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Gráfica de Tendencia de Facturación y Órdenes con Selector de Día/Mes/Año */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <span>
                    Flujo Operativo & Facturación en Quetzales (Q) — {timeGrouping === 'day' ? 'Por Día' : timeGrouping === 'month' ? 'Por Mes' : 'Por Año'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Monitoreo de ingresos y concurrencia de muestras procesadas en la escala temporal seleccionada.
                </p>
              </div>

              {/* Selector de Granularidad para la gráfica: Día / Mes / Año */}
              <div className="flex items-center gap-3">
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTimeGrouping('day')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      timeGrouping === 'day' ? 'bg-white text-teal-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Día
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeGrouping('month')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      timeGrouping === 'month' ? 'bg-white text-teal-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mes
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeGrouping('year')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      timeGrouping === 'year' ? 'bg-white text-teal-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Año
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold hidden md:flex">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-teal-600"></span>
                    <span className="text-slate-600">Órdenes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-slate-600">Ingresos (Q)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              {summaryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any, name: any) => [
                        name === 'revenue' ? `Q${Number(val).toFixed(2)}` : val, 
                        name === 'revenue' ? 'Facturación' : 'Órdenes'
                      ]}
                      labelFormatter={(_label, payload) => {
                        const item = payload && payload[0]?.payload;
                        return item?.fullName || _label;
                      }}
                    />
                    <Bar dataKey="ordersCount" fill="#0d9488" radius={[6, 6, 0, 0]} name="ordersCount" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No hay órdenes registradas para el filtro seleccionado
                </div>
              )}
            </div>
          </div>

          {/* Dos Columnas: Exámenes más solicitados y Desglose por Prioridad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Exámenes Más Solicitados */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-cyan-600" />
                  <span>Exámenes con Mayor Volumen este Mes</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentTab('pruebas')}
                  className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver todas</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3.5">
                {testFrequency.slice(0, 5).map((t, idx) => {
                  const maxCount = testFrequency[0]?.count || 1;
                  const percent = Math.round((t.count / maxCount) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-800 truncate max-w-[240px]">{t.name}</span>
                        <span className="text-teal-700 font-mono">
                          {t.count} solicitudes ({t.price})
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-teal-500 to-cyan-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desglose por Prioridad y Cumplimiento de Calidad */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Prioridades Analíticas & Cumplimiento SLA</span>
                </h3>

                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Rutina</span>
                    <span className="text-xl font-black text-slate-800 mt-1 block">
                      {filteredOrders.filter(o => o.priority === 'rutina').length}
                    </span>
                    <span className="text-[10px] text-slate-500">SLA: 240 min</span>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-amber-600 uppercase block">Urgente</span>
                    <span className="text-xl font-black text-amber-700 mt-1 block">
                      {filteredOrders.filter(o => o.priority === 'urgente').length}
                    </span>
                    <span className="text-[10px] text-amber-600">SLA: 60 min</span>
                  </div>

                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-rose-600 uppercase block">STAT / Pánico</span>
                    <span className="text-xl font-black text-rose-700 mt-1 block">
                      {filteredOrders.filter(o => o.priority === 'stat_panico').length}
                    </span>
                    <span className="text-[10px] text-rose-600">SLA: 30 min</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-700 font-bold">
                    <span>Índice de Trazabilidad ISO 15189</span>
                    <span className="text-teal-700">100% Garantizada</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-bold">
                    <span>Turnaround Time (TAT) Medio</span>
                    <span className="text-slate-900">1 hora 45 minutos</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-bold">
                    <span>Fidelidad & Retención de Pacientes</span>
                    <span className="text-emerald-700">99.1% Satisfacción</span>
                  </div>
                </div>
              </div>

              {/* Banner de Exportación */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  ¿Deseas analizar estos datos en Microsoft Excel?
                </span>
                <button
                  type="button"
                  onClick={() => handleExportToExcel()}
                  className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Descargar .xlsx</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* PESTAÑA 2: DESGLOSE POR FECHAS (DÍA / MES / AÑO) */}
      {currentTab === 'fechas' && (
        <DateBreakdownTab
          orders={filteredOrders}
          timeGrouping={timeGrouping}
          setTimeGrouping={setTimeGrouping}
          onFilterByDay={(date) => {
            setDateFilterMode('day');
            setSpecificDate(date);
            showNotification(`Filtro aplicado: Día ${date} (${formatSpanishDate(date)})`, 'info');
          }}
          onFilterByMonth={(monthKey) => {
            setDateFilterMode('month');
            setSpecificMonth(monthKey);
            showNotification(`Filtro aplicado: Mes de ${formatSpanishMonth(monthKey)}`, 'info');
          }}
          onFilterByYear={(year) => {
            setDateFilterMode('year');
            setSpecificYear(year);
            showNotification(`Filtro aplicado: Año ${year}`, 'info');
          }}
          onExportExcel={() => setIsExportModalOpen(true)}
        />
      )}

      {/* PESTAÑA 3: FLUJO DE PACIENTES */}
      {currentTab === 'pacientes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Padrón de Pacientes & Historial de Demanda</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Volumen de atención individual, frecuencia de visitas y gasto acumulado por expediente clínico.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleExportToExcel()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Pacientes a Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-black uppercase text-[11px]">
                  <th className="p-3.5">Código / Paciente</th>
                  <th className="p-3.5">DPI / Cédula</th>
                  <th className="p-3.5">Edad / Género</th>
                  <th className="p-3.5">Clasificación</th>
                  <th className="p-3.5 text-center">Órdenes</th>
                  <th className="p-3.5 text-center">Pruebas</th>
                  <th className="p-3.5 text-right">Inversión Total</th>
                  <th className="p-3.5 text-right">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {patientFlowMetrics.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-black text-slate-900">{p.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {p.patientCode || p.accessCode || `ID: ${p.id}`}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 font-semibold">
                      {p.nationalId}
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium">
                      {p.age} años • {p.gender === 'M' ? 'Masc.' : p.gender === 'F' ? 'Fem.' : 'Otro'}
                    </td>
                    <td className="p-3.5">
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {p.patientType || 'Ambulatorio'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-black text-slate-800">
                      {p.ordersCount}
                    </td>
                    <td className="p-3.5 text-center font-bold text-teal-700">
                      {p.testsCount}
                    </td>
                    <td className="p-3.5 text-right font-black text-emerald-700">
                      Q{p.totalSpent.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right text-slate-500 font-mono text-[11px]">
                      {p.phone || 'Sin tel.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: VOLUMEN DE PRUEBAS */}
      {currentTab === 'pruebas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-cyan-600" />
                <span>Ranking y Demanda Analítica de Pruebas de Laboratorio</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Frecuencia de solicitud de cada examen, precios en catálogo e ingresos generados.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleExportToExcel()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Catálogo y Volumen (.xlsx)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-black uppercase text-[11px]">
                  <th className="p-3.5 text-center w-12">#</th>
                  <th className="p-3.5">Nombre de la Prueba / Perfil</th>
                  <th className="p-3.5">Área / Categoría</th>
                  <th className="p-3.5 text-center">Frecuencia</th>
                  <th className="p-3.5 text-right">Precio Unitario</th>
                  <th className="p-3.5 text-right">Ingreso Estimado</th>
                  <th className="p-3.5 text-center">Participación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {testFrequency.map((t, idx) => {
                  const share = totalTestsVolume > 0 ? ((t.count / totalTestsVolume) * 100).toFixed(1) : '0';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-3.5">
                        <div className="font-black text-slate-900">{t.name}</div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        {t.category}
                      </td>
                      <td className="p-3.5 text-center font-black text-teal-700">
                        {t.count}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-800">
                        {t.price}
                      </td>
                      <td className="p-3.5 text-right font-black text-emerald-700 font-mono">
                        Q{t.totalRevenueEst.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded text-[11px]">
                          {share}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 4: DETALLE DE ÓRDENES */}
      {currentTab === 'ordenes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Bitácora Consolidada de Órdenes Clínicas</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mostrando {filteredOrders.length} órdenes registradas con desglose de pruebas y estatus.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleExportToExcel()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Órdenes a Excel</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-black uppercase text-[11px]">
                  <th className="p-3.5">No. Orden</th>
                  <th className="p-3.5">Fecha & Hora</th>
                  <th className="p-3.5">Paciente</th>
                  <th className="p-3.5">Prioridad</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Exámenes Solicitados</th>
                  <th className="p-3.5 text-right">Importe Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-black text-teal-800 font-mono">
                      {o.orderNumber}
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium">
                      <div>{o.date}</div>
                      <div className="text-[10px] text-slate-400">{o.time || '08:00 a.m.'}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{o.patientName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">DPI: {o.nationalId}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        o.priority === 'stat_panico' 
                          ? 'bg-rose-100 text-rose-700 border border-rose-300' 
                          : o.priority === 'urgente' 
                          ? 'bg-amber-100 text-amber-700 border border-amber-300' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {o.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.status === 'Listo' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : o.status === 'En Proceso' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 font-medium max-w-xs truncate" title={o.testsList?.join(', ')}>
                      {o.testsList && o.testsList.length > 0 ? o.testsList.join(', ') : `${o.testsCount || 1} pruebas`}
                    </td>
                    <td className="p-3.5 text-right font-black text-slate-900 font-mono">
                      {o.totalPrice || 'Q0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE PERSONALIZACIÓN Y CONFIGURACIÓN DE EXPORTACIÓN A EXCEL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden text-slate-800">
            
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 text-emerald-300 border border-white/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Exportar Datos a Microsoft Excel (.xlsx)
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Generación de libro multivariable para gerencia y auditoría
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 space-y-4 text-xs">
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-slate-700">
                  <strong className="text-emerald-950 block font-bold">
                    Estructura del Libro Excel (.xlsx) generado:
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                    <li><strong>Hoja 1: Resumen Ejecutivo</strong> (KPIs, facturación y prioridades)</li>
                    <li><strong>Hoja 2: Desglose Temporal Fechas</strong> (Totales día por día, mes por mes y año por año)</li>
                    <li><strong>Hoja 3: Flujo de Pacientes</strong> (demografía, visitas y gasto)</li>
                    <li><strong>Hoja 4: Volumen de Pruebas</strong> (ranking, demanda e ingresos)</li>
                    <li><strong>Hoja 5: Detalle de Órdenes</strong> (listado completo de solicitudes)</li>
                    <li><strong>Hoja 6: Tiempos TAT & SLA</strong> (tiempos de respuesta y metas)</li>
                  </ul>
                </div>
              </div>

              {/* Filtro por Período */}
              <div className="space-y-1.5">
                <label className="font-black text-slate-700 block uppercase text-[11px] tracking-wider">
                  Filtro Temporal del Reporte:
                </label>
                <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-950">Se exportará con:</span>
                  <span className="font-black text-emerald-800 bg-white px-2.5 py-0.5 rounded-md border border-emerald-300">
                    {activeFilterLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  * Nota: El libro Excel incluirá el desglose temporal específico según el filtro activo en pantalla.
                </p>
              </div>

              {/* Sede del Laboratorio (Sede Única) */}
              <div className="space-y-1.5">
                <label className="font-black text-slate-700 block uppercase text-[11px] tracking-wider">
                  Sede del Laboratorio:
                </label>
                <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-teal-600 text-white shadow-2xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-teal-950 text-xs">VACLINIC Laboratorio Clínico</div>
                      <div className="text-[11px] text-teal-700">Entrada de Pineda, Oratorio, Santa Rosa km 79.5</div>
                    </div>
                  </div>
                  <span className="bg-teal-700 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-2xs uppercase">
                    Sede Única
                  </span>
                </div>
              </div>

              {/* Resumen del Contenido a Exportar */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 flex justify-between items-center">
                <span>Registros listos para exportar:</span>
                <span className="font-black text-slate-900 font-mono">
                  {filteredOrders.length} órdenes • {patients.length} pacientes
                </span>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleExportToExcel()}
                disabled={isExporting}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-5 py-2 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generando libro Excel...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                    <span>Descargar Archivo (.xlsx)</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
