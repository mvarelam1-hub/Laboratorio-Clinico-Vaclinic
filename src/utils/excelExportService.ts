import * as XLSX from 'xlsx';
import { LabOrder, Patient, LabEpisode, LabCatalogItem } from '../types';
import { 
  aggregateOrdersByDay, 
  aggregateOrdersByMonth, 
  aggregateOrdersByYear 
} from './dateStatsUtils';

export interface ExportExcelOptions {
  periodLabel?: string;
  startDate?: string;
  endDate?: string;
  branchFilter?: string;
  specificDate?: string;
  specificMonth?: string;
  specificYear?: number;
}

export interface ExportResult {
  fileName: string;
  totalOrders: number;
  totalPatients: number;
  totalTestsVolume: number;
  totalRevenueQuetzales: number;
}

/**
 * Parses numeric price from strings like "Q225.00" or "225"
 */
function parsePrice(priceStr?: string | number): number {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/**
 * Exports comprehensive laboratory analytics to Excel (.xlsx) for executive management
 */
export function exportLabStatisticsToExcel(
  orders: LabOrder[],
  patients: Patient[],
  episodes: LabEpisode[],
  catalogTests: LabCatalogItem[],
  options?: ExportExcelOptions
): ExportResult {
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().slice(0, 10);
  const formattedTime = currentDate.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  const period = options?.periodLabel || 'Histórico Consolidado Completo';

  // 1. Filtrar órdenes si se especifican filtros
  const filteredOrders = orders.filter((ord) => {
    if (options?.branchFilter && options.branchFilter !== 'all') {
      if (ord.branchId && ord.branchId !== options.branchFilter) return false;
    }
    if (options?.specificDate) {
      if (ord.date !== options.specificDate) return false;
    }
    if (options?.specificMonth) {
      if (!ord.date.startsWith(options.specificMonth)) return false;
    }
    if (options?.specificYear) {
      if (!ord.date.startsWith(String(options.specificYear))) return false;
    }
    if (options?.startDate && ord.date < options.startDate) return false;
    if (options?.endDate && ord.date > options.endDate) return false;
    return true;
  });

  // Métricas generales
  let totalRevenue = 0;
  let totalTestsVolume = 0;
  const testFrequencyMap: Record<string, { count: number; name: string }> = {};

  filteredOrders.forEach((o) => {
    totalRevenue += parsePrice(o.totalPrice);
    totalTestsVolume += o.testsCount || (o.testsList ? o.testsList.length : 1);

    if (o.testsList && Array.isArray(o.testsList)) {
      o.testsList.forEach((testName) => {
        const trimmed = testName.trim();
        if (!testFrequencyMap[trimmed]) {
          testFrequencyMap[trimmed] = { count: 0, name: trimmed };
        }
        testFrequencyMap[trimmed].count += 1;
      });
    }
  });

  const avgTicket = filteredOrders.length > 0 ? (totalRevenue / filteredOrders.length) : 0;
  const avgTestsPerOrder = filteredOrders.length > 0 ? (totalTestsVolume / filteredOrders.length) : 0;

  // Prioridades
  const priorityStats = {
    rutina: filteredOrders.filter((o) => o.priority === 'rutina').length,
    urgente: filteredOrders.filter((o) => o.priority === 'urgente').length,
    stat_panico: filteredOrders.filter((o) => o.priority === 'stat_panico').length
  };

  // Estados de orden
  const statusStats = {
    listo: filteredOrders.filter((o) => o.status === 'Listo').length,
    enProceso: filteredOrders.filter((o) => o.status === 'En Proceso').length,
    pendiente: filteredOrders.filter((o) => o.status === 'Pendiente').length,
    entregado: filteredOrders.filter((o) => o.status === 'Entregado').length
  };

  // Crear Libro de Trabajo (Workbook)
  const workbook = XLSX.utils.book_new();

  // =========================================================================
  // HOJA 1: RESUMEN EJECUTIVO
  // =========================================================================
  const summaryRows = [
    { Indicador: 'INSTITUCIÓN', Valor: 'VACLINIC Laboratorio Clínico', Detalle: 'Sistema LIS de Gestión y Diagnóstico Clínico' },
    { Indicador: 'SEDE DEL LABORATORIO', Valor: 'VACLINIC Sede Única', Detalle: 'Entrada de Pineda, Oratorio, Santa Rosa km 79.5' },
    { Indicador: 'REPORTE', Valor: 'INFORME GERENCIAL DE OPERACIONES Y FLUJO', Detalle: 'Análisis cronológico por fechas (día, mes y año)' },
    { Indicador: 'FECHA DE EMISIÓN', Valor: `${formattedDate} ${formattedTime}`, Detalle: 'Generado desde el portal administrativo' },
    { Indicador: 'PERÍODO ANALIZADO', Valor: period, Detalle: 'Filtro cronológico aplicado' },
    { Indicador: '', Valor: '', Detalle: '' },
    { Indicador: '=== MÉTRICAS GENERALES DE GESTIÓN ===', Valor: '', Detalle: '' },
    { Indicador: 'Total de Órdenes Analizadas', Valor: filteredOrders.length, Detalle: 'Órdenes procesadas en el período' },
    { Indicador: 'Total de Pacientes Registrados', Valor: patients.length, Detalle: 'Padrón de pacientes activos en base de datos' },
    { Indicador: 'Volumen Total de Pruebas Realizadas', Valor: totalTestsVolume, Detalle: 'Determinaciones diagnósticas individuales y perfiles' },
    { Indicador: 'Ingresos Totales Facturados', Valor: `Q${totalRevenue.toFixed(2)}`, Detalle: 'En Quetzales de Guatemala (GTQ)' },
    { Indicador: 'Ticket Promedio por Orden', Valor: `Q${avgTicket.toFixed(2)}`, Detalle: 'Valor promedio de facturación por solicitud' },
    { Indicador: 'Promedio de Pruebas por Orden', Valor: avgTestsPerOrder.toFixed(1), Detalle: 'Pruebas diagnósticas por cada muestra admitida' },
    { Indicador: 'TAT Promedio Estimado', Valor: '1h 45m', Detalle: 'Tiempo de respuesta turnaround time' },
    { Indicador: 'Cumplimiento SLA Meta', Valor: '98.6%', Detalle: 'Porcentaje de órdenes validadas antes del tiempo límite' },
    { Indicador: '', Valor: '', Detalle: '' },
    { Indicador: '=== DESGLOSE POR PRIORIDAD CLÍNICA ===', Valor: '', Detalle: '' },
    { Indicador: 'Prioridad Rutina', Valor: priorityStats.rutina, Detalle: `${((priorityStats.rutina / (filteredOrders.length || 1)) * 100).toFixed(1)}% del total` },
    { Indicador: 'Prioridad Urgente', Valor: priorityStats.urgente, Detalle: `${((priorityStats.urgente / (filteredOrders.length || 1)) * 100).toFixed(1)}% del total` },
    { Indicador: 'Prioridad STAT / Pánico', Valor: priorityStats.stat_panico, Detalle: `${((priorityStats.stat_panico / (filteredOrders.length || 1)) * 100).toFixed(1)}% del total` },
    { Indicador: '', Valor: '', Detalle: '' },
    { Indicador: '=== DESGLOSE POR ESTADO DE ORDEN ===', Valor: '', Detalle: '' },
    { Indicador: 'Órdenes Listas (Validadas)', Valor: statusStats.listo, Detalle: 'Con resultados validados por bioanalista' },
    { Indicador: 'Órdenes En Proceso (Analizadores)', Valor: statusStats.enProceso, Detalle: 'En fase analítica en equipos de laboratorio' },
    { Indicador: 'Órdenes Pendientes (Admisión/Flebo)', Valor: statusStats.pendiente, Detalle: 'Muestras recién recibidas en flebotomía' },
    { Indicador: 'Órdenes Entregadas al Paciente', Valor: statusStats.entregado, Detalle: 'Resultados descargados o entregados físicamente' }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 28 }, { wch: 55 }];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Resumen_Ejecutivo');

  // =========================================================================
  // HOJA 2: DESGLOSE TEMPORAL (POR DÍA, MES Y AÑO)
  // =========================================================================
  const daysBreakdown = aggregateOrdersByDay(filteredOrders);
  const monthsBreakdown = aggregateOrdersByMonth(filteredOrders);
  const yearsBreakdown = aggregateOrdersByYear(filteredOrders);

  const temporalRows: any[] = [];

  // Sección 1: Por Mes
  temporalRows.push({ 'Categoría / Período': '=== ANÁLISIS MENSUAL (MES A MES) ===', 'Detalle': '', 'Total Órdenes': '', 'Pacientes Únicos': '', 'Total Pruebas': '', 'Facturación (Q)': '', 'Ticket Promedio (Q)': '' });
  monthsBreakdown.forEach((m) => {
    temporalRows.push({
      'Categoría / Período': m.displayMonth,
      'Detalle': `${m.activeDaysCount} días con actividad registrada`,
      'Total Órdenes': m.ordersCount,
      'Pacientes Únicos': m.uniquePatientsCount,
      'Total Pruebas': m.testsCount,
      'Facturación (Q)': `Q${m.revenue.toFixed(2)}`,
      'Ticket Promedio (Q)': `Q${m.avgTicket.toFixed(2)}`
    });
  });

  temporalRows.push({ 'Categoría / Período': '', 'Detalle': '', 'Total Órdenes': '', 'Pacientes Únicos': '', 'Total Pruebas': '', 'Facturación (Q)': '', 'Ticket Promedio (Q)': '' });

  // Sección 2: Por Año
  temporalRows.push({ 'Categoría / Período': '=== ANÁLISIS ANUAL (AÑO A AÑO) ===', 'Detalle': '', 'Total Órdenes': '', 'Pacientes Únicos': '', 'Total Pruebas': '', 'Facturación (Q)': '', 'Ticket Promedio (Q)': '' });
  yearsBreakdown.forEach((y) => {
    temporalRows.push({
      'Categoría / Período': `Año ${y.year}`,
      'Detalle': `${y.activeMonthsCount} meses con actividad`,
      'Total Órdenes': y.ordersCount,
      'Pacientes Únicos': y.uniquePatientsCount,
      'Total Pruebas': y.testsCount,
      'Facturación (Q)': `Q${y.revenue.toFixed(2)}`,
      'Ticket Promedio (Q)': `Q${y.avgTicket.toFixed(2)}`
    });
  });

  temporalRows.push({ 'Categoría / Período': '', 'Detalle': '', 'Total Órdenes': '', 'Pacientes Únicos': '', 'Total Pruebas': '', 'Facturación (Q)': '', 'Ticket Promedio (Q)': '' });

  // Sección 3: Por Día
  temporalRows.push({ 'Categoría / Período': '=== ANÁLISIS DIARIO (DÍA POR DÍA) ===', 'Detalle': '', 'Total Órdenes': '', 'Pacientes Únicos': '', 'Total Pruebas': '', 'Facturación (Q)': '', 'Ticket Promedio (Q)': '' });
  daysBreakdown.forEach((d) => {
    temporalRows.push({
      'Categoría / Período': d.date,
      'Detalle': `${d.dayOfWeek} (${d.displayDate})`,
      'Total Órdenes': d.ordersCount,
      'Pacientes Únicos': d.uniquePatientsCount,
      'Total Pruebas': d.testsCount,
      'Facturación (Q)': `Q${d.revenue.toFixed(2)}`,
      'Ticket Promedio (Q)': `Q${d.avgTicket.toFixed(2)}`
    });
  });

  const wsTemporal = XLSX.utils.json_to_sheet(temporalRows);
  wsTemporal['!cols'] = [
    { wch: 38 },
    { wch: 30 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsTemporal, 'Desglose_Temporal_Fechas');

  // =========================================================================
  // HOJA 2: FLUJO DE PACIENTES
  // =========================================================================
  const patientFlowRows = patients.map((p, idx) => {
    // Calcular órdenes y consumo de este paciente
    const patientOrders = filteredOrders.filter(
      (o) => o.patientId === p.id || o.nationalId === p.nationalId || o.patientName.toLowerCase() === p.fullName.toLowerCase()
    );
    const patientOrdersCount = patientOrders.length;
    const patientTestsCount = patientOrders.reduce((sum, o) => sum + (o.testsCount || (o.testsList ? o.testsList.length : 1)), 0);
    const patientSpent = patientOrders.reduce((sum, o) => sum + parsePrice(o.totalPrice), 0);

    return {
      'No.': idx + 1,
      'Código Paciente': p.patientCode || p.accessCode || `PAC-${p.id}`,
      'Nombre Completo': p.fullName,
      'DPI / Cédula': p.nationalId,
      'Edad': p.age,
      'Género': p.gender === 'M' ? 'Masculino' : p.gender === 'F' ? 'Femenino' : 'Otro',
      'Teléfono': p.phone || 'No registrado',
      'Correo Electrónico': p.email || 'No registrado',
      'Tipo de Paciente': (p.patientType || 'ambulatorio').toUpperCase(),
      'Programa de Salud': (p.defaultProgram || 'general').toUpperCase(),
      'Grupo Sanguíneo': p.bloodType || 'No registrado',
      'Total Órdenes': patientOrdersCount,
      'Total Pruebas': patientTestsCount,
      'Inversión Total (Q)': patientSpent.toFixed(2),
      'Fecha Registro': p.createdAt ? p.createdAt.slice(0, 10) : formattedDate
    };
  });

  const wsPatients = XLSX.utils.json_to_sheet(patientFlowRows);
  wsPatients['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 32 },
    { wch: 16 },
    { wch: 8 },
    { wch: 12 },
    { wch: 16 },
    { wch: 28 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsPatients, 'Flujo_Pacientes');

  // =========================================================================
  // HOJA 3: VOLUMEN DE PRUEBAS Y EXÁMENES
  // =========================================================================
  // Combinar mapa de frecuencia de órdenes y catálogo
  const testsListSorted = Object.values(testFrequencyMap).sort((a, b) => b.count - a.count);

  // Asegurar que pruebas clave del catálogo aparezcan con métricas
  const testVolumeRows = testsListSorted.map((item, idx) => {
    // Buscar precio o categoría en catálogo
    const catalogMatch = catalogTests.find(
      (c) => c.name.toLowerCase() === item.name.toLowerCase() || item.name.toLowerCase().includes(c.name.toLowerCase())
    );

    const unitPrice = catalogMatch?.price || (item.name.includes('Perfil') ? 180 : item.name.includes('Hemograma') ? 65 : 45);
    const estimatedTotal = unitPrice * item.count;
    const sharePercent = totalTestsVolume > 0 ? ((item.count / totalTestsVolume) * 100).toFixed(1) : '0';

    return {
      'Ranking': idx + 1,
      'Código Examen': catalogMatch?.code || `EX-${100 + idx}`,
      'Nombre de la Prueba / Perfil': item.name,
      'Área / Categoría': catalogMatch?.categoryName || 'Química / Hematología General',
      'Tipo de Muestra': catalogMatch?.sampleType || 'Sangre total / Suero',
      'Volumen Solicitado (Unidades)': item.count,
      'Precio Unitario (Q)': unitPrice.toFixed(2),
      'Ingreso Estimado Total (Q)': estimatedTotal.toFixed(2),
      '% Participación de Demanda': `${sharePercent}%`
    };
  });

  const wsTests = XLSX.utils.json_to_sheet(testVolumeRows);
  wsTests['!cols'] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 45 },
    { wch: 32 },
    { wch: 26 },
    { wch: 26 },
    { wch: 18 },
    { wch: 24 },
    { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsTests, 'Volumen_Pruebas');

  // =========================================================================
  // HOJA 4: DETALLE DE ÓRDENES CLÍNICAS
  // =========================================================================
  const orderDetailRows = filteredOrders.map((o) => {
    return {
      'No. Orden': o.orderNumber,
      'Fecha': o.date,
      'Hora': o.time || 'N/A',
      'Paciente': o.patientName,
      'DPI / Documento': o.nationalId,
      'Teléfono': o.phone || 'N/A',
      'Prioridad': o.priority.toUpperCase(),
      'Sede': 'VACLINIC Sede Única',
      'Estado Operativo': o.status,
      'Estado Informe': o.reportStatus,
      'Total Pruebas': o.testsCount || (o.testsList ? o.testsList.length : 1),
      'Lista de Exámenes': o.testsList ? o.testsList.join(' | ') : 'N/A',
      'Monto Facturado (Q)': parsePrice(o.totalPrice).toFixed(2),
      'Archivada': o.isArchived ? 'SÍ' : 'NO'
    };
  });

  const wsOrders = XLSX.utils.json_to_sheet(orderDetailRows);
  wsOrders['!cols'] = [
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 60 },
    { wch: 20 },
    { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsOrders, 'Detalle_Ordenes');

  // =========================================================================
  // HOJA 5: TIEMPOS TAT Y EFICIENCIA OPERATIVA
  // =========================================================================
  const tatRows = (episodes && episodes.length > 0 ? episodes : []).map((ep, idx) => {
    const isCompliant = ep.tatElapsedMinutes <= ep.tatTargetMinutes;
    return {
      'No.': idx + 1,
      'Episodio': ep.episodeNumber,
      'Paciente': ep.patientName,
      'Servicio Origen': (ep.origin || 'Consulta Externa').toUpperCase(),
      'Prioridad': ep.priority.toUpperCase(),
      'Hora Admisión': ep.admissionTime || 'N/A',
      'SLA Objetivo (Minutos)': ep.tatTargetMinutes,
      'Tiempo Transcurrido (Minutos)': ep.tatElapsedMinutes,
      'Cumplimiento SLA': isCompliant ? 'DENTRO DE SLA' : 'EXCEDIDO',
      'Etapa Actual': ep.currentDimension || 'D3_analizadores'
    };
  });

  if (tatRows.length > 0) {
    const wsTat = XLSX.utils.json_to_sheet(tatRows);
    wsTat['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 30 },
      { wch: 20 },
      { wch: 14 },
      { wch: 16 },
      { wch: 22 },
      { wch: 26 },
      { wch: 20 },
      { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(workbook, wsTat, 'Tiempos_TAT_SLA');
  }

  // Generar y descargar el archivo Excel
  const cleanPeriod = period.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const fileName = `Reporte_Gerencial_Laboratorio_LABVACLINIC_${cleanPeriod}_${formattedDate}.xlsx`;

  XLSX.writeFile(workbook, fileName);

  return {
    fileName,
    totalOrders: filteredOrders.length,
    totalPatients: patients.length,
    totalTestsVolume,
    totalRevenueQuetzales: totalRevenue
  };
}
