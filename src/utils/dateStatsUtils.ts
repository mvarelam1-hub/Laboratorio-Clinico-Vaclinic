import { LabOrder } from '../types';

export const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const SPANISH_MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export const SPANISH_DAYS = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export interface DayStats {
  date: string; // YYYY-MM-DD
  displayDate: string; // DD/MM
  fullDateLabel: string; // "Lunes 31 de Agosto, 2026"
  dayOfWeek: string;
  ordersCount: number;
  uniquePatientsCount: number;
  testsCount: number;
  revenue: number;
  avgTicket: number;
  priorityCounts: {
    rutina: number;
    urgente: number;
    stat_panico: number;
  };
  statusCounts: {
    listo: number;
    enProceso: number;
    pendiente: number;
  };
}

export interface MonthStats {
  monthKey: string; // YYYY-MM
  year: number;
  monthIndex: number; // 1-12
  monthName: string; // "Agosto"
  displayMonth: string; // "Agosto 2026"
  ordersCount: number;
  uniquePatientsCount: number;
  testsCount: number;
  revenue: number;
  avgTicket: number;
  activeDaysCount: number;
  dailyAvgRevenue: number;
}

export interface YearStats {
  year: number;
  displayYear: string; // "2026"
  ordersCount: number;
  uniquePatientsCount: number;
  testsCount: number;
  revenue: number;
  avgTicket: number;
  monthlyAvgRevenue: number;
  activeMonthsCount: number;
}

/**
 * Parses numeric price from string like "Q225.00" or number
 */
export function parsePrice(val?: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * Returns formatted full date in Spanish: "Lunes 31 de Agosto de 2026"
 */
export function formatSpanishDate(dateStr: string): string {
  if (!dateStr) return 'Fecha no especificada';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  // Create date in local timezone
  const d = new Date(year, month - 1, day);
  const dayOfWeek = SPANISH_DAYS[d.getDay()] || '';
  const monthName = SPANISH_MONTHS[month - 1] || '';
  
  return `${dayOfWeek} ${day} de ${monthName} de ${year}`;
}

/**
 * Returns formatted month in Spanish: "Agosto 2026"
 */
export function formatSpanishMonth(monthKey: string): string {
  const parts = monthKey.split('-');
  if (parts.length < 2) return monthKey;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = SPANISH_MONTHS[monthIdx] || parts[1];
  return `${monthName} ${year}`;
}

/**
 * Aggregates orders by day (YYYY-MM-DD)
 */
export function aggregateOrdersByDay(orders: LabOrder[]): DayStats[] {
  const map: Record<string, {
    orders: LabOrder[];
    patients: Set<string>;
    revenue: number;
    tests: number;
    rutina: number;
    urgente: number;
    stat_panico: number;
    listo: number;
    enProceso: number;
    pendiente: number;
  }> = {};

  orders.forEach((ord) => {
    const d = ord.date || '2026-08-31';
    if (!map[d]) {
      map[d] = {
        orders: [],
        patients: new Set<string>(),
        revenue: 0,
        tests: 0,
        rutina: 0,
        urgente: 0,
        stat_panico: 0,
        listo: 0,
        enProceso: 0,
        pendiente: 0
      };
    }
    const item = map[d];
    item.orders.push(ord);
    item.patients.add(ord.nationalId || ord.patientName);
    item.revenue += parsePrice(ord.totalPrice);
    item.tests += ord.testsCount || (ord.testsList ? ord.testsList.length : 1);

    if (ord.priority === 'stat_panico') item.stat_panico += 1;
    else if (ord.priority === 'urgente') item.urgente += 1;
    else item.rutina += 1;

    if (ord.status === 'Listo') item.listo += 1;
    else if (ord.status === 'En Proceso') item.enProceso += 1;
    else item.pendiente += 1;
  });

  const result: DayStats[] = Object.entries(map).map(([date, data]) => {
    const parts = date.split('-');
    const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month - 1, day);
    const dayOfWeek = SPANISH_DAYS[d.getDay()] || '';

    return {
      date,
      displayDate,
      fullDateLabel: formatSpanishDate(date),
      dayOfWeek,
      ordersCount: data.orders.length,
      uniquePatientsCount: data.patients.size,
      testsCount: data.tests,
      revenue: data.revenue,
      avgTicket: data.orders.length > 0 ? data.revenue / data.orders.length : 0,
      priorityCounts: {
        rutina: data.rutina,
        urgente: data.urgente,
        stat_panico: data.stat_panico
      },
      statusCounts: {
        listo: data.listo,
        enProceso: data.enProceso,
        pendiente: data.pendiente
      }
    };
  });

  // Sort by date ascending
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Aggregates orders by month (YYYY-MM)
 */
export function aggregateOrdersByMonth(orders: LabOrder[]): MonthStats[] {
  const map: Record<string, {
    orders: LabOrder[];
    patients: Set<string>;
    dates: Set<string>;
    revenue: number;
    tests: number;
  }> = {};

  orders.forEach((ord) => {
    const d = ord.date || '2026-08-31';
    const monthKey = d.slice(0, 7); // YYYY-MM
    if (!map[monthKey]) {
      map[monthKey] = {
        orders: [],
        patients: new Set<string>(),
        dates: new Set<string>(),
        revenue: 0,
        tests: 0
      };
    }
    const item = map[monthKey];
    item.orders.push(ord);
    item.patients.add(ord.nationalId || ord.patientName);
    item.dates.add(d);
    item.revenue += parsePrice(ord.totalPrice);
    item.tests += ord.testsCount || (ord.testsList ? ord.testsList.length : 1);
  });

  const result: MonthStats[] = Object.entries(map).map(([monthKey, data]) => {
    const parts = monthKey.split('-');
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10);
    const monthName = SPANISH_MONTHS[monthIndex - 1] || parts[1];
    const displayMonth = `${monthName} ${year}`;
    const activeDays = data.dates.size || 1;

    return {
      monthKey,
      year,
      monthIndex,
      monthName,
      displayMonth,
      ordersCount: data.orders.length,
      uniquePatientsCount: data.patients.size,
      testsCount: data.tests,
      revenue: data.revenue,
      avgTicket: data.orders.length > 0 ? data.revenue / data.orders.length : 0,
      activeDaysCount: activeDays,
      dailyAvgRevenue: data.revenue / activeDays
    };
  });

  // Sort chronologically ascending
  return result.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

/**
 * Aggregates orders by year (YYYY)
 */
export function aggregateOrdersByYear(orders: LabOrder[]): YearStats[] {
  const map: Record<number, {
    orders: LabOrder[];
    patients: Set<string>;
    months: Set<string>;
    revenue: number;
    tests: number;
  }> = {};

  orders.forEach((ord) => {
    const d = ord.date || '2026-08-31';
    const year = parseInt(d.slice(0, 4), 10) || 2026;
    const monthKey = d.slice(0, 7);
    if (!map[year]) {
      map[year] = {
        orders: [],
        patients: new Set<string>(),
        months: new Set<string>(),
        revenue: 0,
        tests: 0
      };
    }
    const item = map[year];
    item.orders.push(ord);
    item.patients.add(ord.nationalId || ord.patientName);
    item.months.add(monthKey);
    item.revenue += parsePrice(ord.totalPrice);
    item.tests += ord.testsCount || (ord.testsList ? ord.testsList.length : 1);
  });

  const result: YearStats[] = Object.entries(map).map(([yearStr, data]) => {
    const year = parseInt(yearStr, 10);
    const activeMonths = data.months.size || 1;

    return {
      year,
      displayYear: String(year),
      ordersCount: data.orders.length,
      uniquePatientsCount: data.patients.size,
      testsCount: data.tests,
      revenue: data.revenue,
      avgTicket: data.orders.length > 0 ? data.revenue / data.orders.length : 0,
      monthlyAvgRevenue: data.revenue / activeMonths,
      activeMonthsCount: activeMonths
    };
  });

  return result.sort((a, b) => a.year - b.year);
}
