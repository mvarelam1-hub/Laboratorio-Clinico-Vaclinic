import React, { useMemo } from 'react';
import { LabOrder } from '../../../types';
import { 
  Calendar, 
  CalendarDays, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Users, 
  FlaskConical, 
  Filter, 
  FileSpreadsheet,
  Award,
  ArrowRight,
  Building2
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
import { 
  DayStats, 
  MonthStats, 
  YearStats, 
  aggregateOrdersByDay, 
  aggregateOrdersByMonth, 
  aggregateOrdersByYear 
} from '../../../utils/dateStatsUtils';

interface DateBreakdownTabProps {
  orders: LabOrder[];
  timeGrouping: 'day' | 'month' | 'year';
  setTimeGrouping: (val: 'day' | 'month' | 'year') => void;
  onFilterByDay: (date: string) => void;
  onFilterByMonth: (monthKey: string) => void;
  onFilterByYear: (year: number) => void;
  onExportExcel: () => void;
  onExportPdf?: () => void;
}

export const DateBreakdownTab: React.FC<DateBreakdownTabProps> = ({
  orders,
  timeGrouping,
  setTimeGrouping,
  onFilterByDay,
  onFilterByMonth,
  onFilterByYear,
  onExportExcel,
  onExportPdf
}) => {
  // Aggregate data
  const daysData = useMemo(() => aggregateOrdersByDay(orders), [orders]);
  const monthsData = useMemo(() => aggregateOrdersByMonth(orders), [orders]);
  const yearsData = useMemo(() => aggregateOrdersByYear(orders), [orders]);

  // Calculations for current grouping
  const summaryMetrics = useMemo(() => {
    if (timeGrouping === 'day') {
      const totalDays = daysData.length;
      const totalOrders = daysData.reduce((s, d) => s + d.ordersCount, 0);
      const totalRevenue = daysData.reduce((s, d) => s + d.revenue, 0);
      const avgOrdersPerDay = totalDays > 0 ? (totalOrders / totalDays).toFixed(1) : '0';
      const avgRevenuePerDay = totalDays > 0 ? totalRevenue / totalDays : 0;
      const peakDay = daysData.reduce((prev, curr) => (curr.revenue > (prev?.revenue || 0) ? curr : prev), daysData[0]);

      return {
        unitLabel: 'Días con Actividad',
        unitCount: totalDays,
        avgOrders: avgOrdersPerDay,
        avgRevenue: avgRevenuePerDay,
        peakLabel: peakDay ? `${peakDay.displayDate} (${peakDay.dayOfWeek})` : 'N/A',
        peakValue: peakDay ? `Q${peakDay.revenue.toFixed(2)} (${peakDay.ordersCount} órd.)` : 'N/A'
      };
    } else if (timeGrouping === 'month') {
      const totalMonths = monthsData.length;
      const totalOrders = monthsData.reduce((s, m) => s + m.ordersCount, 0);
      const totalRevenue = monthsData.reduce((s, m) => s + m.revenue, 0);
      const avgOrdersPerMonth = totalMonths > 0 ? (totalOrders / totalMonths).toFixed(1) : '0';
      const avgRevenuePerMonth = totalMonths > 0 ? totalRevenue / totalMonths : 0;
      const peakMonth = monthsData.reduce((prev, curr) => (curr.revenue > (prev?.revenue || 0) ? curr : prev), monthsData[0]);

      return {
        unitLabel: 'Meses con Actividad',
        unitCount: totalMonths,
        avgOrders: avgOrdersPerMonth,
        avgRevenue: avgRevenuePerMonth,
        peakLabel: peakMonth ? peakMonth.displayMonth : 'N/A',
        peakValue: peakMonth ? `Q${peakMonth.revenue.toFixed(2)} (${peakMonth.ordersCount} órd.)` : 'N/A'
      };
    } else {
      const totalYears = yearsData.length;
      const totalOrders = yearsData.reduce((s, y) => s + y.ordersCount, 0);
      const totalRevenue = yearsData.reduce((s, y) => s + y.revenue, 0);
      const avgOrdersPerYear = totalYears > 0 ? (totalOrders / totalYears).toFixed(1) : '0';
      const avgRevenuePerYear = totalYears > 0 ? totalRevenue / totalYears : 0;
      const peakYear = yearsData.reduce((prev, curr) => (curr.revenue > (prev?.revenue || 0) ? curr : prev), yearsData[0]);

      return {
        unitLabel: 'Años Registrados',
        unitCount: totalYears,
        avgOrders: avgOrdersPerYear,
        avgRevenue: avgRevenuePerYear,
        peakLabel: peakYear ? `Año ${peakYear.year}` : 'N/A',
        peakValue: peakYear ? `Q${peakYear.revenue.toFixed(2)} (${peakYear.ordersCount} órd.)` : 'N/A'
      };
    }
  }, [timeGrouping, daysData, monthsData, yearsData]);

  // Chart data according to selected grouping
  const chartData = useMemo(() => {
    if (timeGrouping === 'day') {
      return daysData.map((d) => ({
        key: d.date,
        name: d.displayDate,
        fullName: d.fullDateLabel,
        ordersCount: d.ordersCount,
        revenue: d.revenue,
        testsCount: d.testsCount
      }));
    } else if (timeGrouping === 'month') {
      return monthsData.map((m) => ({
        key: m.monthKey,
        name: m.displayMonth,
        fullName: m.displayMonth,
        ordersCount: m.ordersCount,
        revenue: m.revenue,
        testsCount: m.testsCount
      }));
    } else {
      return yearsData.map((y) => ({
        key: String(y.year),
        name: String(y.year),
        fullName: `Año ${y.year}`,
        ordersCount: y.ordersCount,
        revenue: y.revenue,
        testsCount: y.testsCount
      }));
    }
  }, [timeGrouping, daysData, monthsData, yearsData]);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">

      {/* Control de Agrupación Temporal: Día / Mes / Año */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Análisis Cronológico y Estadístico por Fechas
            </h2>
            <span className="bg-teal-50 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-teal-600" />
              <span>Sede Única: VACLINIC</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Desglose cronológico diario, consolidado mensual y anual para la sede de VACLINIC Laboratorio Clínico.
          </p>
        </div>

        {/* Botones de Selección Día / Mes / Año */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              id="btn-group-day"
              onClick={() => setTimeGrouping('day')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeGrouping === 'day'
                  ? 'bg-white text-teal-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
              <span>Por Día</span>
            </button>

            <button
              type="button"
              id="btn-group-month"
              onClick={() => setTimeGrouping('month')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeGrouping === 'month'
                  ? 'bg-white text-teal-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Por Mes</span>
            </button>

            <button
              type="button"
              id="btn-group-year"
              onClick={() => setTimeGrouping('year')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeGrouping === 'year'
                  ? 'bg-white text-teal-800 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              <span>Por Año</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
            title="Exportar análisis por fechas a Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar Fechas</span>
          </button>
        </div>
      </div>

      {/* KPI Cards de Resumen Temporal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>{summaryMetrics.unitLabel}</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {summaryMetrics.unitCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {timeGrouping === 'day' ? 'Jornadas registradas' : timeGrouping === 'month' ? 'Meses con solicitudes' : 'Años en base de datos'}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Promedio de Órdenes</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {summaryMetrics.avgOrders}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Órdenes / {timeGrouping === 'day' ? 'día' : timeGrouping === 'month' ? 'mes' : 'año'}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Promedio de Ingresos</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            Q{summaryMetrics.avgRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Facturación promedio por {timeGrouping === 'day' ? 'jornada' : timeGrouping === 'month' ? 'mes' : 'año'}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Pico Máximo</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-black text-slate-900 mt-1 truncate" title={summaryMetrics.peakLabel}>
            {summaryMetrics.peakLabel}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-0.5 font-mono">
            {summaryMetrics.peakValue}
          </div>
        </div>

      </div>

      {/* Gráfica Temporal Dinámica */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>
                Comportamiento Temporal ({timeGrouping === 'day' ? 'Día por Día' : timeGrouping === 'month' ? 'Mes a Mes' : 'Año a Año'})
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Tendencia de solicitudes y facturación según la escala de tiempo seleccionada.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-600"></span>
              <span className="text-slate-600">Órdenes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">Facturación (Q)</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '12px', 
                    color: '#fff', 
                    fontSize: '12px' 
                  }}
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
              No hay datos para mostrar en este rango
            </div>
          )}
        </div>
      </div>

      {/* TABLA DE DETALLE: POR DÍA */}
      {timeGrouping === 'day' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4.5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-teal-600" />
                <span>Desglose Diario (Jornada por Jornada)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mostrando {daysData.length} días con registro de muestras y facturación.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-black uppercase text-[11px]">
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Día de Semana</th>
                  <th className="p-3.5 text-center">Órdenes</th>
                  <th className="p-3.5 text-center">Pacientes</th>
                  <th className="p-3.5 text-center">Pruebas</th>
                  <th className="p-3.5 text-right">Facturación (Q)</th>
                  <th className="p-3.5 text-right">Ticket Prom.</th>
                  <th className="p-3.5">Prioridades</th>
                  <th className="p-3.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {daysData.map((day) => (
                  <tr key={day.date} className="hover:bg-teal-50/40 transition-colors">
                    <td className="p-3.5 font-mono font-black text-slate-900">
                      {day.date}
                    </td>
                    <td className="p-3.5 text-slate-700 font-semibold">
                      <span className="capitalize">{day.dayOfWeek}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">{day.fullDateLabel}</span>
                    </td>
                    <td className="p-3.5 text-center font-black text-teal-800">
                      <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-bold">
                        {day.ordersCount}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      {day.uniquePatientsCount}
                    </td>
                    <td className="p-3.5 text-center font-bold text-cyan-700">
                      {day.testsCount}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-700">
                      Q{day.revenue.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-medium text-slate-600">
                      Q{day.avgTicket.toFixed(2)}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        {day.priorityCounts.rutina > 0 && (
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {day.priorityCounts.rutina} Rut.
                          </span>
                        )}
                        {day.priorityCounts.urgente > 0 && (
                          <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            {day.priorityCounts.urgente} Urg.
                          </span>
                        )}
                        {day.priorityCounts.stat_panico > 0 && (
                          <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                            {day.priorityCounts.stat_panico} STAT
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onFilterByDay(day.date)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold transition-colors cursor-pointer border border-teal-200"
                        title={`Filtrar todas las estadísticas para ver solo el día ${day.date}`}
                      >
                        <Filter className="w-3 h-3" />
                        <span>Filtrar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLA DE DETALLE: POR MES */}
      {timeGrouping === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4.5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Desglose Mensual (Mes a Mes)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consolidado mensual con promedios diarios y facturación acumulada.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-black uppercase text-[11px]">
                  <th className="p-3.5">Mes & Año</th>
                  <th className="p-3.5 text-center">Días con Muestras</th>
                  <th className="p-3.5 text-center">Total Órdenes</th>
                  <th className="p-3.5 text-center">Pacientes Únicos</th>
                  <th className="p-3.5 text-center">Total Pruebas</th>
                  <th className="p-3.5 text-right">Facturación Mensual (Q)</th>
                  <th className="p-3.5 text-right">Prom. Diario (Q)</th>
                  <th className="p-3.5 text-right">Ticket Prom.</th>
                  <th className="p-3.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {monthsData.map((month) => (
                  <tr key={month.monthKey} className="hover:bg-teal-50/40 transition-colors">
                    <td className="p-3.5 font-black text-slate-900">
                      <div className="text-sm">{month.displayMonth}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{month.monthKey}</div>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {month.activeDaysCount} días
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-black text-teal-800">
                      <span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md font-bold">
                        {month.ordersCount}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      {month.uniquePatientsCount}
                    </td>
                    <td className="p-3.5 text-center font-bold text-cyan-700">
                      {month.testsCount}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-700 text-sm">
                      Q{month.revenue.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                      Q{month.dailyAvgRevenue.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-medium text-slate-600">
                      Q{month.avgTicket.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onFilterByMonth(month.monthKey)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold transition-colors cursor-pointer border border-teal-200"
                        title={`Filtrar estadísticas para ver solo el mes de ${month.displayMonth}`}
                      >
                        <Filter className="w-3 h-3" />
                        <span>Filtrar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLA DE DETALLE: POR AÑO */}
      {timeGrouping === 'year' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4.5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span>Desglose Anual (Año tras Año)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparativa interanual de volumen y facturación acumulada.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-black uppercase text-[11px]">
                  <th className="p-3.5">Año</th>
                  <th className="p-3.5 text-center">Meses con Actividad</th>
                  <th className="p-3.5 text-center">Total Órdenes</th>
                  <th className="p-3.5 text-center">Pacientes Únicos</th>
                  <th className="p-3.5 text-center">Total Pruebas</th>
                  <th className="p-3.5 text-right">Facturación Anual (Q)</th>
                  <th className="p-3.5 text-right">Prom. Mensual (Q)</th>
                  <th className="p-3.5 text-right">Ticket Prom.</th>
                  <th className="p-3.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {yearsData.map((yr) => (
                  <tr key={yr.year} className="hover:bg-teal-50/40 transition-colors">
                    <td className="p-3.5 font-black text-slate-900 text-sm font-mono">
                      Año {yr.year}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {yr.activeMonthsCount} meses
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-black text-teal-800">
                      <span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md font-bold">
                        {yr.ordersCount}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-700">
                      {yr.uniquePatientsCount}
                    </td>
                    <td className="p-3.5 text-center font-bold text-cyan-700">
                      {yr.testsCount}
                    </td>
                    <td className="p-3.5 text-right font-mono font-black text-emerald-700 text-base">
                      Q{yr.revenue.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-700">
                      Q{yr.monthlyAvgRevenue.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-medium text-slate-600">
                      Q{yr.avgTicket.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => onFilterByYear(yr.year)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold transition-colors cursor-pointer border border-teal-200"
                        title={`Filtrar estadísticas para ver solo el año ${yr.year}`}
                      >
                        <Filter className="w-3 h-3" />
                        <span>Filtrar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
