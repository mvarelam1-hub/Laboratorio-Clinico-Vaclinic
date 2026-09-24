import React, { useState, useMemo, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { LabOrder, OrderFolder, MedicalReport, ReportParameter } from '../../types';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Layers, 
  ArrowRight,
  ExternalLink,
  Barcode,
  Eye,
  Archive,
  Download,
  Folder,
  FolderPlus,
  FolderOpen,
  FolderCheck,
  Calendar,
  CheckSquare,
  Square,
  Trash2,
  Tag,
  ChevronRight,
  ChevronDown,
  X,
  Sparkles,
  Building2,
  Stethoscope,
  HeartPulse,
  Inbox,
  ArrowUpDown,
  RotateCcw,
  Check,
  Share2,
  FileSpreadsheet,
  QrCode,
  Droplet,
  FlaskConical,
  Edit3,
  User,
  Phone,
  CreditCard,
  Receipt,
  FileCheck,
  Fingerprint,
  Banknote,
  Coins,
  ArrowLeft
} from 'lucide-react';
import { BiometricAuthModal } from './BiometricAuthModal';
import { BiometricAuthResult } from '../../services/biometricService';
import { generateDemographicParametersForTests } from '../../utils/referenceRangeEvaluator';

interface OrdersMasterManagerProps {
  mode: 'active' | 'archived';
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string; hover: string; ring: string }> = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-600 text-white', hover: 'hover:bg-teal-100/70', ring: 'ring-teal-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-600 text-white', hover: 'hover:bg-blue-100/70', ring: 'ring-blue-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-600 text-white', hover: 'hover:bg-emerald-100/70', ring: 'ring-emerald-500' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-600 text-white', hover: 'hover:bg-amber-100/70', ring: 'ring-amber-500' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-600 text-white', hover: 'hover:bg-rose-100/70', ring: 'ring-rose-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-600 text-white', hover: 'hover:bg-purple-100/70', ring: 'ring-purple-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-600 text-white', hover: 'hover:bg-indigo-100/70', ring: 'ring-indigo-500' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', badge: 'bg-slate-700 text-white', hover: 'hover:bg-slate-200/70', ring: 'ring-slate-500' }
};

const MONTH_NAMES = [
  { num: 1, name: 'Enero', short: 'Ene' },
  { num: 2, name: 'Febrero', short: 'Feb' },
  { num: 3, name: 'Marzo', short: 'Mar' },
  { num: 4, name: 'Abril', short: 'Abr' },
  { num: 5, name: 'Mayo', short: 'May' },
  { num: 6, name: 'Junio', short: 'Jun' },
  { num: 7, name: 'Julio', short: 'Jul' },
  { num: 8, name: 'Agosto', short: 'Ago' },
  { num: 9, name: 'Septiembre', short: 'Sep' },
  { num: 10, name: 'Octubre', short: 'Oct' },
  { num: 11, name: 'Noviembre', short: 'Nov' },
  { num: 12, name: 'Diciembre', short: 'Dic' }
];

// Helper to determine sample tube & details based on test name
const getTestDetails = (testName: string) => {
  const lower = testName.toLowerCase();
  if (lower.includes('hema') || lower.includes('sangre') || lower.includes('plaquet') || lower.includes('coagul')) {
    return {
      tube: 'Tubo Lila (EDTA K2/K3)',
      tubeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      sampleType: 'Sangre Total Anticoagulada',
      methodology: 'Citometría de Flujo e Impedancia',
      category: 'Hematología',
      code: 'HEM-01',
      price: 'Q60.00'
    };
  }
  if (lower.includes('gluc') || lower.includes('azuc') || lower.includes('glic')) {
    return {
      tube: 'Tubo Rojo / Amarillo (Suero)',
      tubeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      sampleType: 'Suero Sanguíneo',
      methodology: 'Hexoquinasa / Espectrofotometría',
      category: 'Química Sanguínea',
      code: 'GLU-01',
      price: 'Q40.00'
    };
  }
  if (lower.includes('lipid') || lower.includes('colest') || lower.includes('triglic')) {
    return {
      tube: 'Tubo Rojo / Amarillo (Suero)',
      tubeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      sampleType: 'Suero Sanguíneo',
      methodology: 'Enzimático Colorimétrico (CHOD-PAP / GPO-PAP)',
      category: 'Química Sanguínea',
      code: 'LIP-01',
      price: 'Q120.00'
    };
  }
  if (lower.includes('hepa') || lower.includes('tgo') || lower.includes('tgp') || lower.includes('bilirrub')) {
    return {
      tube: 'Tubo Rojo / Amarillo (Suero)',
      tubeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      sampleType: 'Suero Sanguíneo',
      methodology: 'Cinético UV IFCC',
      category: 'Química Sanguínea',
      code: 'HEP-01',
      price: 'Q150.00'
    };
  }
  if (lower.includes('renal') || lower.includes('creat') || lower.includes('urea') || lower.includes('urico')) {
    return {
      tube: 'Tubo Rojo / Amarillo (Suero)',
      tubeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      sampleType: 'Suero Sanguíneo',
      methodology: 'Jaffé Compensado / Uricasa Enzimática',
      category: 'Química Sanguínea',
      code: 'REN-01',
      price: 'Q80.00'
    };
  }
  if (lower.includes('orin') || lower.includes('ego')) {
    return {
      tube: 'Frasco Estéril de Orina',
      tubeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      sampleType: 'Orina Espontánea (Chorro Medio)',
      methodology: 'Tira Reactiva Multimarca + Sedimento Microscópico',
      category: 'Uroanálisis',
      code: 'EGO-01',
      price: 'Q40.00'
    };
  }
  if (lower.includes('heces') || lower.includes('copro') || lower.includes('parasit')) {
    return {
      tube: 'Frasco Estéril de Coprología',
      tubeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      sampleType: 'Materia Fecal Fresca',
      methodology: 'Examen Físico, Químico y Microscopía Directa (Lugol/Solución)',
      category: 'Coprología',
      code: 'COP-01',
      price: 'Q45.00'
    };
  }
  if (lower.includes('tiroid') || lower.includes('tsh') || lower.includes('t3') || lower.includes('t4')) {
    return {
      tube: 'Tubo Rojo / Amarillo (Suero)',
      tubeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      sampleType: 'Suero Sanguíneo',
      methodology: 'Quimioluminiscencia de Alta Sensibilidad (CLIA)',
      category: 'Hormonas & Fertilidad',
      code: 'TIR-01',
      price: 'Q220.00'
    };
  }
  return {
    tube: 'Tubo Rojo (Suero con Gel Separador)',
    tubeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    sampleType: 'Suero / Plasma Clínico',
    methodology: 'Quimioluminiscencia / Espectrofotometría',
    category: 'Pruebas Especiales',
    code: 'LAB-01',
    price: 'Q75.00'
  };
};

export const OrdersMasterManager: React.FC<OrdersMasterManagerProps> = ({ mode }) => {
  const { 
    orders, 
    orderFolders, 
    archiveOrder, 
    restoreOrder, 
    updateOrder,
    bulkArchiveOrders, 
    bulkRestoreOrders, 
    deleteOrder, 
    bulkDeleteOrders, 
    moveOrderToFolder, 
    bulkMoveOrdersToFolder, 
    createOrderFolder, 
    deleteOrderFolder,
    setStaffActiveTab, 
    showNotification,
    setActiveReportToPrint,
    setActiveReportToEdit,
    reports,
    patients,
    catalogTests,
    labSettings
  } = useClinic();

  // View state: 'list' (table) or 'folders' (grid)
  const [viewMode, setViewMode] = useState<'list' | 'folders'>('list');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pendiente' | 'En Proceso' | 'Listo'>('all');
  const [activeFolderFilter, setActiveFolderFilter] = useState<string>('all');

  // Selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Folder Move Modal state
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [targetOrderIdsToMove, setTargetOrderIdsToMove] = useState<string[]>([]);
  const [selectedTargetFolderId, setSelectedTargetFolderId] = useState<string>('');

  // Create Folder Modal state
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('teal');
  const [newFolderDescription, setNewFolderDescription] = useState('');

  // Details Modal state
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<LabOrder | null>(null);

  // Print Order Receipt / Ticket Modal State
  const [orderTicketToPrint, setOrderTicketToPrint] = useState<LabOrder | null>(null);

  // Biometric Auth Modal State
  const [orderForBiometricAuth, setOrderForBiometricAuth] = useState<LabOrder | null>(null);

  // Bulk Liquidation Review & Confirmation Modal State
  const [isBulkLiquidationReviewOpen, setIsBulkLiquidationReviewOpen] = useState(false);
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'seguro'>('efectivo');
  const [bulkCashTendered, setBulkCashTendered] = useState('');
  const [bulkLiquidationReceipt, setBulkLiquidationReceipt] = useState<{
    receiptNumber: string;
    date: string;
    time: string;
    totalOrders: number;
    totalAmount: number;
    paymentMethod: string;
    orders: LabOrder[];
  } | null>(null);

  // Computed batch of selected orders for review & liquidation
  const selectedOrdersList = useMemo(() => {
    return orders.filter(o => selectedOrderIds.includes(o.id));
  }, [orders, selectedOrderIds]);

  const totalSelectedOrdersAmount = useMemo(() => {
    return selectedOrdersList.reduce((sum, ord) => {
      const raw = (ord.totalPrice || '').replace(/[^0-9.]/g, '');
      return sum + (parseFloat(raw) || 0);
    }, 0);
  }, [selectedOrdersList]);

  const uniquePatientsInSelected = useMemo(() => {
    return new Set(selectedOrdersList.map(o => o.patientName)).size;
  }, [selectedOrdersList]);

  // Filter orders by mode (active vs archived)
  const baseModeOrders = useMemo(() => {
    return orders.filter(o => mode === 'archived' ? o.isArchived : !o.isArchived);
  }, [orders, mode]);

  // Extract distinct available years from orders
  const availableYears = useMemo<number[]>(() => {
    const rawYears = orders.map(o => o.year || new Date(o.date).getFullYear());
    const uniqueYears = Array.from(new Set(rawYears)).filter((y): y is number => typeof y === 'number' && !isNaN(y) && y > 0);
    return uniqueYears.sort((a, b) => b - a);
  }, [orders]);

  // Filtered orders based on all search and date criteria
  const filteredOrders = useMemo(() => {
    return baseModeOrders.filter(o => {
      // 1. Universal Search (Patient name, order number, seqNumber, nationalId, phone, tests)
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query ||
        o.orderNumber.toLowerCase().includes(query) ||
        (o.patientCode && o.patientCode.toLowerCase().includes(query)) ||
        o.patientName.toLowerCase().includes(query) ||
        (o.nationalId && o.nationalId.includes(query)) ||
        (o.phone && o.phone.includes(query)) ||
        (o.testsList && o.testsList.some(t => t.toLowerCase().includes(query))) ||
        (o.totalPrice && o.totalPrice.toLowerCase().includes(query));

      // 2. Year Filter
      const matchesYear = selectedYear === 'all' || o.year?.toString() === selectedYear || o.date.startsWith(selectedYear);

      // 3. Month Filter
      const orderMonth = o.month || (new Date(o.date).getMonth() + 1);
      const matchesMonth = selectedMonth === 'all' || orderMonth.toString() === selectedMonth;

      // 4. Custom Date Range (Desde - Hasta)
      let matchesDateRange = true;
      if (startDate && o.date < startDate) matchesDateRange = false;
      if (endDate && o.date > endDate) matchesDateRange = false;

      // 5. Status Filter
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

      // 6. Folder Filter
      let matchesFolder = true;
      if (activeFolderFilter !== 'all') {
        if (activeFolderFilter === 'folder-unassigned') {
          matchesFolder = !o.folderId || o.folderId === 'folder-unassigned';
        } else {
          matchesFolder = o.folderId === activeFolderFilter;
        }
      }

      return matchesSearch && matchesYear && matchesMonth && matchesDateRange && matchesStatus && matchesFolder;
    });
  }, [baseModeOrders, searchTerm, selectedYear, selectedMonth, startDate, endDate, statusFilter, activeFolderFilter]);

  // Group orders by Year & Month for temporal folders
  const timeBasedGroups = useMemo(() => {
    const groups: Record<string, { year: number; month: number; monthName: string; count: number; orders: LabOrder[] }> = {};

    baseModeOrders.forEach(o => {
      const y = o.year || new Date(o.date).getFullYear();
      const m = o.month || (new Date(o.date).getMonth() + 1);
      const key = `${y}-${m}`;
      if (!groups[key]) {
        const monthObj = MONTH_NAMES.find(mn => mn.num === m) || { name: `Mes ${m}` };
        groups[key] = {
          year: y,
          month: m,
          monthName: monthObj.name,
          count: 0,
          orders: []
        };
      }
      groups[key].count++;
      groups[key].orders.push(o);
    });

    return Object.values(groups).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [baseModeOrders]);

  // Metrics summary
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  const totalCount = baseModeOrders.length;
  const todayCount = baseModeOrders.filter(o => o.date === todayStr || o.date.startsWith('2026-08-31')).length;
  const thisMonthCount = baseModeOrders.filter(o => (o.year === currentYearNum && o.month === currentMonthNum) || o.date.startsWith('2026-08')).length;
  const classifiedInFoldersCount = baseModeOrders.filter(o => o.folderId && o.folderId !== 'folder-unassigned' && o.folderId !== 'folder-all').length;

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Quick Preset Date Filters
  const handleSetDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'this_month' | 'last_month' | 'this_year' | 'all') => {
    if (preset === 'today') {
      setSelectedYear('2026');
      setSelectedMonth('8');
      setStartDate('2026-08-31');
      setEndDate('2026-08-31');
    } else if (preset === 'yesterday') {
      setSelectedYear('2026');
      setSelectedMonth('8');
      setStartDate('2026-08-30');
      setEndDate('2026-08-30');
    } else if (preset === 'week') {
      setSelectedYear('2026');
      setSelectedMonth('8');
      setStartDate('2026-08-24');
      setEndDate('2026-08-31');
    } else if (preset === 'this_month') {
      setSelectedYear('2026');
      setSelectedMonth('8');
      setStartDate('2026-08-01');
      setEndDate('2026-08-31');
    } else if (preset === 'last_month') {
      setSelectedYear('2026');
      setSelectedMonth('7');
      setStartDate('2026-07-01');
      setEndDate('2026-07-31');
    } else if (preset === 'this_year') {
      setSelectedYear('2026');
      setSelectedMonth('all');
      setStartDate('');
      setEndDate('');
    } else if (preset === 'all') {
      setSelectedYear('all');
      setSelectedMonth('all');
      setStartDate('');
      setEndDate('');
    }
  };

  // Open Move To Folder Modal
  const handleOpenMoveModal = (orderIds: string[]) => {
    setTargetOrderIdsToMove(orderIds);
    setSelectedTargetFolderId(orderFolders.find(f => !f.isSystem)?.id || 'folder-rutina');
    setIsMoveModalOpen(true);
  };

  const handleConfirmMoveToFolder = async () => {
    if (!selectedTargetFolderId || targetOrderIdsToMove.length === 0) return;
    await bulkMoveOrdersToFolder(targetOrderIdsToMove, selectedTargetFolderId);
    setIsMoveModalOpen(false);
    setSelectedOrderIds([]);
  };

  // Create new folder submit
  const handleCreateFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const created = await createOrderFolder(newFolderName, newFolderColor, newFolderDescription);
    setIsCreateFolderModalOpen(false);
    setNewFolderName('');
    setNewFolderDescription('');

    if (isMoveModalOpen) {
      setSelectedTargetFolderId(created.id);
    }
  };

  // Export to CSV/Excel
  const handleExportData = () => {
    const rows = [
      ['N° Orden', 'Código', 'Paciente', 'DNI', 'Teléfono', 'Fecha', 'Hora', 'Exámenes', 'Estado', 'Informe', 'Carpeta', 'Total'],
      ...filteredOrders.map(o => [
        o.orderNumber,
        o.patientCode || '',
        o.patientName,
        o.nationalId,
        o.phone || '',
        o.date,
        o.time || '',
        o.testsList.join('; '),
        o.status,
        o.reportStatus,
        orderFolders.find(f => f.id === o.folderId)?.name || 'Sin Carpeta',
        o.totalPrice || ''
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VACLINIC_${mode === 'archived' ? 'Ordenes_Archivadas' : 'Ordenes_Activas'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Bitácora de órdenes exportada exitosamente en Excel/CSV', 'success');
  };

  // Generate realistic parameters for specific test list
  const generateParametersForTests = (testsList: string[]): ReportParameter[] => {
    const params: ReportParameter[] = [];
    let pId = 1;

    testsList.forEach(tName => {
      const lower = tName.toLowerCase();
      if (lower.includes('gluc')) {
        params.push({
          id: `p-${pId++}`,
          name: 'Glucosa en Suero (Basal / Ayuno)',
          value: '88.5',
          unit: 'mg/dL',
          referenceRange: '70.0 - 100.0 mg/dL',
          status: 'normal',
          methodology: 'Enzimático Hexoquinasa / Espectrofotometría UV',
          sampleType: 'Suero'
        });
      } else if (lower.includes('hema') || lower.includes('sangre')) {
        params.push(
          {
            id: `p-${pId++}`,
            name: 'Hemoglobina (Hb)',
            value: '14.4',
            unit: 'g/dL',
            referenceRange: '12.0 - 16.0 g/dL',
            status: 'normal',
            methodology: 'Fotometría SLS / Impedancia Electrónica',
            sampleType: 'Sangre Total EDTA'
          },
          {
            id: `p-${pId++}`,
            name: 'Hematocrito (Hto)',
            value: '43.2',
            unit: '%',
            referenceRange: '37.0 - 48.0 %',
            status: 'normal',
            methodology: 'Cálculo Acumulativo de Pulsos',
            sampleType: 'Sangre Total EDTA'
          },
          {
            id: `p-${pId++}`,
            name: 'Leucocitos Totales (Glóbulos Blancos)',
            value: '6,850',
            unit: '/uL',
            referenceRange: '4,500 - 11,000 /uL',
            status: 'normal',
            methodology: 'Citometría de Flujo Fluorescente',
            sampleType: 'Sangre Total EDTA'
          },
          {
            id: `p-${pId++}`,
            name: 'Plaquetas (Trombocitos)',
            value: '248,000',
            unit: '/uL',
            referenceRange: '150,000 - 450,000 /uL',
            status: 'normal',
            methodology: 'Impedancia Hidrodinámica',
            sampleType: 'Sangre Total EDTA'
          }
        );
      } else if (lower.includes('lipid') || lower.includes('colest') || lower.includes('triglic')) {
        params.push(
          {
            id: `p-${pId++}`,
            name: 'Colesterol Total',
            value: '172',
            unit: 'mg/dL',
            referenceRange: 'Deseable: < 200.0 mg/dL',
            status: 'normal',
            methodology: 'Enzimático Colorimétrico (CHOD-PAP)',
            sampleType: 'Suero'
          },
          {
            id: `p-${pId++}`,
            name: 'Triglicéridos Séricos',
            value: '135',
            unit: 'mg/dL',
            referenceRange: 'Normal: < 150.0 mg/dL',
            status: 'normal',
            methodology: 'GPO-PAP Enzimático',
            sampleType: 'Suero'
          },
          {
            id: `p-${pId++}`,
            name: 'Colesterol HDL (Protector)',
            value: '54.0',
            unit: 'mg/dL',
            referenceRange: 'Óptimo: > 45.0 mg/dL',
            status: 'normal',
            methodology: 'Inmuno-inhibición Directa',
            sampleType: 'Suero'
          },
          {
            id: `p-${pId++}`,
            name: 'Colesterol LDL (Calculado)',
            value: '91.0',
            unit: 'mg/dL',
            referenceRange: 'Óptimo: < 100.0 mg/dL',
            status: 'normal',
            methodology: 'Fórmula de Friedewald Modificada',
            sampleType: 'Suero'
          }
        );
      } else if (lower.includes('creat') || lower.includes('urea') || lower.includes('renal')) {
        params.push(
          {
            id: `p-${pId++}`,
            name: 'Creatinina en Suero',
            value: '0.88',
            unit: 'mg/dL',
            referenceRange: '0.60 - 1.20 mg/dL',
            status: 'normal',
            methodology: 'Cinética Jaffé Compensada IDMS',
            sampleType: 'Suero'
          },
          {
            id: `p-${pId++}`,
            name: 'Nitrógeno de Urea (BUN)',
            value: '14.2',
            unit: 'mg/dL',
            referenceRange: '7.0 - 20.0 mg/dL',
            status: 'normal',
            methodology: 'Ureasa / GLDH UV',
            sampleType: 'Suero'
          }
        );
      } else if (lower.includes('urin') || lower.includes('ego')) {
        params.push(
          {
            id: `p-${pId++}`,
            name: 'Aspecto y Color',
            value: 'Transparente / Amarillo Paja',
            unit: '-',
            referenceRange: 'Transparente / Amarillo',
            status: 'normal',
            methodology: 'Examen Físico Macroscópico',
            sampleType: 'Orina'
          },
          {
            id: `p-${pId++}`,
            name: 'Densidad Específica',
            value: '1.018',
            unit: '-',
            referenceRange: '1.005 - 1.030',
            status: 'normal',
            methodology: 'Refractometría / Tira Reactiva',
            sampleType: 'Orina'
          },
          {
            id: `p-${pId++}`,
            name: 'Proteínas y Glucosa en Orina',
            value: 'Negativo (Normal)',
            unit: 'mg/dL',
            referenceRange: 'Negativo (< 15 mg/dL)',
            status: 'normal',
            methodology: 'Colorimetría / Tira Reactiva',
            sampleType: 'Orina'
          },
          {
            id: `p-${pId++}`,
            name: 'Sedimento Microscópico (Leucocitos)',
            value: '1 - 2 por campo',
            unit: 'x campo 40x',
            referenceRange: '0 - 3 por campo',
            status: 'normal',
            methodology: 'Microscopía Óptica de Contraste',
            sampleType: 'Orina'
          }
        );
      } else {
        params.push({
          id: `p-${pId++}`,
          name: tName,
          value: 'NEGATIVO / NORMAL',
          unit: 'Resultado',
          referenceRange: 'Valores Estándar Clínicos',
          status: 'normal',
          methodology: 'Ensayo Clínico Estandarizado VACLINIC',
          sampleType: 'Suero / Muestra Biológica'
        });
      }
    });

    return params;
  };

  // Build a certified MedicalReport for an order
  const buildReportForOrder = (ord: LabOrder): MedicalReport => {
    const existing = reports.find(r => r.patientNationalId === ord.nationalId || r.patientName.toLowerCase() === ord.patientName.toLowerCase());
    if (existing) {
      return {
        ...existing,
        reportNumber: `INF-${ord.orderNumber.replace('#', '')}-2026`,
        title: ord.testsList.join(', ') || 'Informe Clínico Consolidado',
        sampleDate: ord.date,
        emissionDate: ord.date + 'T11:30:00.000Z'
      };
    }

    const patientObj = patients.find(p => p.nationalId === ord.nationalId || p.fullName.toLowerCase() === ord.patientName.toLowerCase());
    const patAge = patientObj?.age || 42;
    const patGender = patientObj?.gender || 'F';
    const parameters = generateDemographicParametersForTests(ord.testsList, patAge, patGender, catalogTests);

    return {
      id: `rep-${ord.id}`,
      reportNumber: `INF-${ord.orderNumber.replace('#', '')}-2026`,
      patientId: patientObj?.id || `VAC-${ord.seqNumber || '00198'}`,
      patientName: ord.patientName,
      patientNationalId: ord.nationalId,
      patientAge: patientObj?.age || 42,
      patientGender: patientObj?.gender || 'F',
      category: 'bioquimica',
      title: ord.testsList.join(' + ') || 'Análisis Clínico de Laboratorio',
      sampleDate: ord.date,
      emissionDate: ord.date + 'T12:00:00.000Z',
      laboratoryName: 'VACLINIC LABORATORIO CLÍNICO',
      status: 'publicado',
      sampleType: 'Muestras Biológicas Controladas',
      tubeType: 'Tubos Primarios con Código de Barras',
      parameters: parameters,
      clinicalFindings: 'Parámetros analíticos procesados dentro de los rangos de referencia fisiológicos esperados para la edad y condición del paciente.',
      doctorConclusions: 'Resultados compatibles con normalidad biológica. Se sugiere correlacionar con la historia clínica y criterio del médico tratante.',
      patientExplanation: 'Tus análisis de laboratorio han sido procesados y validados con los más altos estándares de control de calidad.',
      recommendations: [
        'Mantener hábitos saludables y control médico periódico.',
        'Conservar este informe para su próxima consulta médica.'
      ],
      qrVerificationCode: `https://vaclinic.laboratorio.gt/valida?ord=${ord.orderNumber.replace('#', '')}&dni=${ord.nationalId}`,
      signature: {
        bioanalystName: 'Licda. Elena Morales Cruz',
        bioanalystSpecialty: 'Licenciada en Bioanálisis Clínico & Microbiología',
        bioanalystLicense: 'Col. Bioanálisis #4192 / MSPAS-8812',
        doctorName: 'Dr. Alejandro Valenzuela Morales',
        doctorSpecialty: 'Médico Patólogo Clínico',
        doctorLicense: 'CMP-649102 / RNE-28491',
        signedAt: `${ord.date}T12:30:00.000Z`,
        validationHash: `0x79f2c84a${ord.nationalId.padEnd(24, '0')}`
      }
    };
  };

  // Action: Print Official Clinical Report (Membretado con QR)
  const handlePrintOfficialReport = (ord: LabOrder) => {
    const rep = buildReportForOrder(ord);
    setActiveReportToPrint(rep);
  };

  // Action: Print Admission Order Receipt / Ticket
  const handlePrintOrderReceipt = (ord: LabOrder) => {
    setOrderTicketToPrint(ord);
  };

  // Action: Open in Report Editor
  const handleEditResultsInEditor = (ord: LabOrder) => {
    const rep = buildReportForOrder(ord);
    setActiveReportToEdit(rep);
    setStaffActiveTab('redactor');
    showNotification(`Cargando orden ${ord.orderNumber} en el Redactor Clínico`, 'info');
  };

  // Action: Confirm and process bulk orders liquidation
  const handleConfirmBulkLiquidation = () => {
    if (selectedOrdersList.length === 0) return;

    const now = new Date();
    const receiptNum = `LIQ-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Update orders in clinic context to liquidated
    selectedOrdersList.forEach(ord => {
      updateOrder(ord.id, {
        pendingBalance: 0,
        paymentMethod: bulkPaymentMethod,
        notes: `${ord.notes ? `${ord.notes} • ` : ''}[Liquidada en Lote #${receiptNum} el ${now.toLocaleDateString('es-GT')} via ${bulkPaymentMethod.toUpperCase()}]`
      });
    });

    const receiptData = {
      receiptNumber: receiptNum,
      date: now.toLocaleDateString('es-GT'),
      time: now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }),
      totalOrders: selectedOrdersList.length,
      totalAmount: totalSelectedOrdersAmount,
      paymentMethod: bulkPaymentMethod,
      orders: [...selectedOrdersList]
    };

    showNotification(`¡Lote de ${selectedOrdersList.length} órdenes liquidado exitosamente (Q${totalSelectedOrdersAmount.toFixed(2)})!`, 'success');
    setIsBulkLiquidationReviewOpen(false);
    setBulkLiquidationReceipt(receiptData);
    setSelectedOrderIds([]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800 pb-16">
      
      {/* 1. TOP HEADER & ACTION BUTTONS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {mode === 'archived' ? (
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                <Archive className="w-6 h-6" />
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {mode === 'archived' ? 'Órdenes Archivadas' : 'Órdenes de Laboratorio'} ({baseModeOrders.length})
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {mode === 'archived' 
                  ? 'Órdenes históricas organizadas por año, mes y carpetas temáticas para consulta limpia.'
                  : 'Gestión completa de órdenes: ver exámenes cargados, imprimir boletas e informes membretados con QR.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsCreateFolderModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <FolderPlus className="w-4 h-4 text-teal-600" />
            <span>+ Nueva Carpeta</span>
          </button>

          {mode === 'active' && (
            <button
              onClick={() => setStaffActiveTab('nueva_orden')}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Nueva Orden</span>
            </button>
          )}

          <button
            onClick={handleExportData}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            title="Exportar bitácora a Excel/CSV"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exportar (Excel)</span>
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">TOTAL ÓRDENES</div>
          <div className="text-3xl font-black text-slate-900 mt-1 font-mono">{totalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">En este módulo</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">HOY</div>
          <div className="text-3xl font-black text-teal-600 mt-1 font-mono">{todayCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Registradas hoy (31/08)</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">DEL MES</div>
          <div className="text-3xl font-black text-blue-600 mt-1 font-mono">{thisMonthCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Agosto 2026</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider">EN CARPETAS</div>
          <div className="text-3xl font-black text-purple-600 mt-1 font-mono">{classifiedInFoldersCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Clasificadas en archivadores</div>
        </div>
      </div>

      {/* 3. MULTI-SELECTION FLOATING ACTION BAR */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 border border-slate-800 animate-slide-down sticky top-4 z-40">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-teal-500 text-slate-950 font-black text-xs px-2.5 py-1 rounded-lg">
              {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'orden seleccionada' : 'órdenes seleccionadas'}
            </span>
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-1 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 font-semibold">Total a liquidar:</span>
              <span className="text-sm font-black text-teal-300 font-mono">
                Q{totalSelectedOrdersAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setBulkCashTendered(totalSelectedOrdersAmount.toFixed(2));
                setIsBulkLiquidationReviewOpen(true);
              }}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-teal-500/50 shadow-md shadow-teal-900/40 cursor-pointer transition-all hover:scale-[1.02]"
              title="Revisar detalle y confirmar liquidación en caja"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Revisar y Liquidar ({selectedOrderIds.length})</span>
            </button>

            <button
              onClick={() => handleOpenMoveModal(selectedOrderIds)}
              className="bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Mover a Carpeta</span>
            </button>

            {mode === 'active' ? (
              <button
                onClick={() => {
                  bulkArchiveOrders(selectedOrderIds);
                  setSelectedOrderIds([]);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5 text-slate-400" />
                <span>Archivar</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  bulkRestoreOrders(selectedOrderIds);
                  setSelectedOrderIds([]);
                }}
                className="bg-emerald-800/80 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-600 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar a Activas</span>
              </button>
            )}

            <button
              onClick={() => {
                if (window.confirm(`¿Estás seguro de eliminar permanentemente ${selectedOrderIds.length} orden(es)?`)) {
                  bulkDeleteOrders(selectedOrderIds);
                  setSelectedOrderIds([]);
                }
              }}
              className="bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-rose-800 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Eliminar</span>
            </button>

            <button
              onClick={() => setSelectedOrderIds([])}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer ml-1"
              title="Cancelar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. FILTROS PRINCIPALES, BUSCADOR & SELECTOR DE VISTAS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        
        {/* Row 1: Universal Search, Status filter & View switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Universal Live Search */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-orders"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por paciente, N° orden (#198), DNI, teléfono o examen cargado... (Ctrl+F)"
              className="w-full pl-10 pr-16 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-slate-50/50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  Ctrl+F
                </span>
              )}
            </div>
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('Pendiente')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'Pendiente' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendiente
            </button>
            <button
              onClick={() => setStatusFilter('Listo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'Listo' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Listo
            </button>
          </div>

          {/* View Switcher: Lista vs Carpetas */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span>Lista</span>
            </button>
            <button
              onClick={() => setViewMode('folders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'folders' ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>Carpetas</span>
            </button>
          </div>
        </div>

        {/* Row 2: Chronological Quick Selectors (Año / Mes / Presets de Fecha) */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Year & Month Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-slate-500 font-bold">
              <span>Año:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="all">Todos los Años</option>
                {availableYears.map(y => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 text-slate-500 font-bold">
              <span>Mes:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="all">Todos los Meses</option>
                {MONTH_NAMES.map(m => (
                  <option key={m.num} value={m.num.toString()}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Quick Presets */}
            <div className="hidden sm:flex items-center gap-1 ml-2 border-l border-slate-200 pl-3">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Rápido:</span>
              <button
                onClick={() => handleSetDatePreset('today')}
                className="px-2 py-0.5 rounded-md hover:bg-slate-100 text-slate-600 font-semibold text-[11px] cursor-pointer"
              >
                Hoy
              </button>
              <button
                onClick={() => handleSetDatePreset('this_month')}
                className="px-2 py-0.5 rounded-md hover:bg-slate-100 text-slate-600 font-semibold text-[11px] cursor-pointer"
              >
                Este Mes
              </button>
              <button
                onClick={() => handleSetDatePreset('last_month')}
                className="px-2 py-0.5 rounded-md hover:bg-slate-100 text-slate-600 font-semibold text-[11px] cursor-pointer"
              >
                Mes Anterior
              </button>
              <button
                onClick={() => handleSetDatePreset('all')}
                className="px-2 py-0.5 rounded-md hover:bg-slate-100 text-slate-600 font-semibold text-[11px] cursor-pointer"
              >
                Histórico
              </button>
            </div>
          </div>

          {/* Custom Date Range (Desde - Hasta) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 font-semibold">Rango:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 text-xs bg-slate-50"
              title="Fecha inicial"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 text-xs bg-slate-50"
              title="Fecha final"
            />

            {(selectedYear !== 'all' || selectedMonth !== 'all' || startDate || endDate || searchTerm || activeFolderFilter !== 'all') && (
              <button
                onClick={() => {
                  setSelectedYear('all');
                  setSelectedMonth('all');
                  setStartDate('');
                  setEndDate('');
                  setSearchTerm('');
                  setActiveFolderFilter('all');
                  setStatusFilter('all');
                }}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-bold ml-1 cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Folder Filter Ribbon */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Carpeta activa:</span>
          <button
            onClick={() => setActiveFolderFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeFolderFilter === 'all' 
                ? 'bg-slate-900 text-white shadow-xs' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Todas ({baseModeOrders.length})
          </button>

          {orderFolders.filter(f => f.id !== 'folder-all').map(f => {
            const isSelected = activeFolderFilter === f.id;
            const count = baseModeOrders.filter(o => (f.id === 'folder-unassigned' ? (!o.folderId || o.folderId === 'folder-unassigned') : o.folderId === f.id)).length;
            const colorInfo = COLOR_MAP[f.color] || COLOR_MAP.slate;

            return (
              <button
                key={f.id}
                onClick={() => setActiveFolderFilter(f.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected 
                    ? `${colorInfo.badge} shadow-xs ring-2 ${colorInfo.ring}`
                    : `${colorInfo.bg} ${colorInfo.text} border ${colorInfo.border} hover:opacity-90`
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{f.name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-black/20 text-white' : 'bg-white/80 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* ========================================================
          VISTAS DE CONTENIDO: CARPETAS vs TABLA LISTA
         ======================================================== */}
      {viewMode === 'folders' ? (
        /* VISTA CARPETAS: ARCHIVADORES TEMÁTICOS & CRONOLÓGICOS */
        <div className="space-y-6">
          
          {/* Section A: Carpetas Temáticas & Categorías */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-teal-600" />
                <span>Archivadores y Carpetas de Órdenes</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Haz clic en una carpeta para abrir y ver todas sus órdenes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {orderFolders.filter(f => f.id !== 'folder-all').map((folder) => {
                const colorInfo = COLOR_MAP[folder.color] || COLOR_MAP.slate;
                const count = baseModeOrders.filter(o => (folder.id === 'folder-unassigned' ? (!o.folderId || o.folderId === 'folder-unassigned') : o.folderId === folder.id)).length;

                return (
                  <div
                    key={folder.id}
                    className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group shadow-xs ${colorInfo.bg} ${colorInfo.border} hover:shadow-md hover:border-slate-400`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-2xl shadow-xs ${colorInfo.badge}`}>
                            <Folder className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-sm group-hover:text-teal-700 transition-colors">
                              {folder.name}
                            </h3>
                            <span className="text-xs font-mono font-bold text-slate-500">
                              {count} {count === 1 ? 'orden' : 'órdenes'}
                            </span>
                          </div>
                        </div>

                        {!folder.isSystem && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteOrderFolder(folder.id);
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Eliminar carpeta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                        {folder.description || 'Carpeta personalizada para agrupación de órdenes.'}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-black/5 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setActiveFolderFilter(folder.id);
                          setViewMode('list');
                        }}
                        className={`text-xs font-bold ${colorInfo.text} hover:underline flex items-center gap-1 cursor-pointer`}
                      >
                        <span>Abrir y ver órdenes</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {count} registros
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Carpetas Cronológicas por Año & Mes */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                <span>Carpetas Cronológicas por Año y Mes</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Archivadores automáticos generados por fecha para consultar históricos pasados de forma limpia.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
              {timeBasedGroups.map(group => (
                <button
                  key={`${group.year}-${group.month}`}
                  onClick={() => {
                    setSelectedYear(group.year.toString());
                    setSelectedMonth(group.month.toString());
                    setActiveFolderFilter('all');
                    setViewMode('list');
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50/60 hover:bg-teal-50/40 text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between text-slate-400 group-hover:text-teal-600">
                    <Folder className="w-5 h-5" />
                    <span className="text-xs font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {group.count}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm mt-2">{group.monthName}</div>
                  <div className="text-[11px] font-mono text-slate-500">{group.year}</div>
                </button>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* ========================================================
           VISTA LISTA: TABLA ULTRA-LIMPIA E INTERACTIVA
           ======================================================== */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="w-10 px-4 py-3.5 text-center">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Seleccionar todas"
                    >
                      {selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
                        <CheckSquare className="w-4 h-4 text-teal-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">ORDEN</th>
                  <th className="px-4 py-3.5">PACIENTE</th>
                  <th className="px-4 py-3.5">FECHA</th>
                  <th className="px-4 py-3.5">EXÁMENES CARGADOS</th>
                  <th className="px-4 py-3.5">CARPETA</th>
                  <th className="px-4 py-3.5">ESTADO</th>
                  <th className="px-4 py-3.5">INFORME</th>
                  {mode === 'archived' && <th className="px-4 py-3.5">ARCHIVADO</th>}
                  <th className="px-4 py-3.5 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={mode === 'archived' ? 10 : 9} className="text-center py-16 text-slate-400">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <div className="font-bold text-slate-600 text-sm">No se encontraron órdenes</div>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Intenta ajustar los filtros de año, mes, fecha o término de búsqueda.
                      </p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedYear('all');
                          setSelectedMonth('all');
                          setStartDate('');
                          setEndDate('');
                          setStatusFilter('all');
                          setActiveFolderFilter('all');
                        }}
                        className="mt-3 text-xs font-bold text-teal-600 hover:underline cursor-pointer"
                      >
                        Restablecer todos los filtros
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => {
                    const isSelected = selectedOrderIds.includes(ord.id);
                    const folderObj = orderFolders.find(f => f.id === ord.folderId);
                    const folderColor = folderObj ? COLOR_MAP[folderObj.color] || COLOR_MAP.slate : COLOR_MAP.slate;

                    return (
                      <tr 
                        key={ord.id} 
                        onClick={() => setSelectedOrderForDetail(ord)}
                        className={`hover:bg-teal-50/30 transition-colors cursor-pointer ${
                          isSelected ? 'bg-teal-50/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td 
                          className="w-10 px-4 py-3.5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleToggleSelectOrder(ord.id)}
                            className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-teal-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Orden */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 text-sm">
                              {ord.orderNumber}
                            </span>
                            {ord.biometricAuthorized && (
                              <span 
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300"
                                title={`Sello Biométrico Activo: ${ord.biometricAuthData?.authorizedBy || 'Autorizado'}`}
                              >
                                <Fingerprint className="w-2.5 h-2.5 text-emerald-700" />
                                <span>BIO</span>
                              </span>
                            )}
                            {(!ord.biometricAuthorized && (ord.priority === 'stat_panico' || ord.priority === 'urgente' || ord.isHighRisk)) && (
                              <button
                                onClick={() => setOrderForBiometricAuth(ord)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse cursor-pointer hover:bg-rose-200"
                                title="Esta orden de alto riesgo requiere autorización biométrica física"
                              >
                                <Fingerprint className="w-2.5 h-2.5 text-rose-700" />
                                <span>BIO REQ</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Paciente */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 hover:text-teal-700 transition-colors">
                            {ord.patientName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {ord.patientCode || `DNI: ${ord.nationalId}`}
                            {ord.phone ? ` • 📞 ${ord.phone}` : ''}
                          </div>
                        </td>

                        {/* Fecha */}
                        <td className="px-4 py-3.5 text-slate-600 font-mono whitespace-nowrap">
                          {ord.date.includes('-') ? ord.date.split('-').reverse().join('/') : ord.date}
                          {ord.time && <span className="block text-[10px] text-slate-400">{ord.time}</span>}
                        </td>

                        {/* Exámenes Cargados */}
                        <td className="px-4 py-3.5 max-w-[260px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              <FlaskConical className="w-3 h-3 text-teal-600" />
                              <span>{ord.testsCount} {ord.testsCount === 1 ? 'examen' : 'exámenes'}</span>
                            </span>
                            <span className="text-[11px] text-slate-600 truncate font-semibold">
                              {ord.testsList?.join(', ')}
                            </span>
                          </div>
                          <div className="text-[10px] text-teal-600 font-semibold mt-0.5">
                            👁️ Clic para ver lista de pruebas
                          </div>
                        </td>

                        {/* Carpeta */}
                        <td 
                          className="px-4 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {folderObj && folderObj.id !== 'folder-unassigned' ? (
                            <button
                              onClick={() => handleOpenMoveModal([ord.id])}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${folderColor.bg} ${folderColor.text} ${folderColor.border} hover:opacity-80 transition-opacity cursor-pointer`}
                              title="Cambiar de carpeta"
                            >
                              <Folder className="w-3 h-3" />
                              <span>{folderObj.name}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenMoveModal([ord.id])}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-teal-700 hover:bg-slate-100 border border-dashed border-slate-300 transition-colors cursor-pointer"
                              title="Guardar orden en una carpeta"
                            >
                              <FolderPlus className="w-3 h-3" />
                              <span>+ Asignar Carpeta</span>
                            </button>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                            ord.status === 'Listo' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : ord.status === 'En Proceso'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {ord.status}
                          </span>
                        </td>

                        {/* Informe */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            ord.reportStatus === 'Validado'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : ord.reportStatus === 'En Revisión'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ord.reportStatus}
                          </span>
                        </td>

                        {/* Archivado Info (solo en vista archivadas) */}
                        {mode === 'archived' && (
                          <td className="px-4 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                            <div>{ord.archivedAt || '31/08/2026, 11:14 a. m.'}</div>
                            <div className="text-[10px] text-slate-400">por {ord.archivedBy || 'Administrador VACLINIC'}</div>
                          </td>
                        )}

                        {/* Acciones */}
                        <td 
                          className="px-4 py-3.5 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            
                            {/* Ver detalle */}
                            <button
                              onClick={() => setSelectedOrderForDetail(ord)}
                              className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs flex items-center gap-1 border border-teal-200 cursor-pointer shadow-2xs"
                              title="Ver Orden & Exámenes Cargados"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </button>

                            {/* Biometría y Acceso Seguro para Alto Riesgo */}
                            <button
                              onClick={() => setOrderForBiometricAuth(ord)}
                              className={`p-1.5 rounded-lg border cursor-pointer shadow-2xs transition-colors ${
                                ord.biometricAuthorized 
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                                  : 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                              }`}
                              title={ord.biometricAuthorized ? "Sello Biométrico Activo (Verificar)" : "Autorizar Orden Mediante Biometría"}
                            >
                              <Fingerprint className="w-3.5 h-3.5" />
                            </button>

                            {/* Imprimir Informe Membretado */}
                            <button
                              onClick={() => handlePrintOfficialReport(ord)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 text-slate-600 hover:text-blue-700 cursor-pointer shadow-2xs"
                              title="Imprimir Informe Clínico Oficial (Membretado con QR)"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-600" />
                            </button>

                            {/* Imprimir Boleta / Ticket */}
                            <button
                              onClick={() => handlePrintOrderReceipt(ord)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-slate-600 hover:text-amber-700 cursor-pointer shadow-2xs"
                              title="Imprimir Boleta de Admisión / Ticket de Orden"
                            >
                              <Receipt className="w-3.5 h-3.5 text-amber-600" />
                            </button>

                            {/* Mover a Carpeta */}
                            <button
                              onClick={() => handleOpenMoveModal([ord.id])}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                              title="Guardar / Mover a Carpeta"
                            >
                              <Folder className="w-3.5 h-3.5 text-amber-600" />
                            </button>

                            {/* Archivar / Restaurar */}
                            {mode === 'archived' ? (
                              <button
                                onClick={() => restoreOrder(ord.id)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 cursor-pointer"
                                title="Restaurar a órdenes activas"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                              </button>
                            ) : (
                              <button
                                onClick={() => archiveOrder(ord.id)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                                title="Archivar orden"
                              >
                                <Archive className="w-3.5 h-3.5 text-slate-500" />
                              </button>
                            )}

                            {/* Eliminar */}
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Eliminar orden ${ord.orderNumber} de ${ord.patientName}?`)) {
                                  deleteOrder(ord.id);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: DETALLE COMPLETO DE ORDEN & EXÁMENES CARGADOS
         ======================================================== */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">
                      Orden {selectedOrderForDetail.orderNumber}
                    </h3>
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                      Expediente: {selectedOrderForDetail.patientCode || selectedOrderForDetail.nationalId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Detalle clínico de admisión, exámenes cargados y opciones de impresión
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForDetail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient & Order Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="font-black uppercase text-[11px] text-teal-700 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Datos del Paciente</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nombre Completo:</span>
                  <span className="font-bold text-slate-900">{selectedOrderForDetail.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DNI / Identificación:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedOrderForDetail.nationalId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Teléfono:</span>
                  <span className="text-slate-800 font-semibold">{selectedOrderForDetail.phone || '5421-9876'}</span>
                </div>
                {selectedOrderForDetail.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Correo:</span>
                    <span className="text-slate-800 font-semibold truncate max-w-[170px]">{selectedOrderForDetail.email}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="font-black uppercase text-[11px] text-teal-700 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Datos de la Orden</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha y Hora:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedOrderForDetail.date} ({selectedOrderForDetail.time || '11:14 a. m.'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prioridad:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                    selectedOrderForDetail.priority === 'stat_panico' 
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : selectedOrderForDetail.priority === 'urgente' 
                      ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {(selectedOrderForDetail.priority || 'rutina').replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Carpeta asignada:</span>
                  <span className="font-bold text-teal-700">
                    {orderFolders.find(f => f.id === selectedOrderForDetail.folderId)?.name || 'Bandeja de Entrada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Facturado:</span>
                  <span className="font-black text-slate-900 font-mono">{selectedOrderForDetail.totalPrice || 'Q140.00'}</span>
                </div>
              </div>
            </div>

            {/* Preanalytical & Sample Details if present */}
            {(selectedOrderForDetail.origin || selectedOrderForDetail.fastingCondition || selectedOrderForDetail.sampleType || selectedOrderForDetail.phlebotomistName || selectedOrderForDetail.referringDoctor || selectedOrderForDetail.clinicalDiagnosis || selectedOrderForDetail.notes) && (
              <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-xs space-y-2">
                <div className="font-black uppercase text-[11px] text-teal-800 tracking-wider flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Datos Clínicos y Preanalíticos de la Muestra</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700">
                  {selectedOrderForDetail.origin && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Origen / Servicio:</span>
                      <span className="font-semibold capitalize text-slate-800">{selectedOrderForDetail.origin.replace('_', ' ')}</span>
                    </div>
                  )}
                  {selectedOrderForDetail.fastingCondition && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estado de Ayuno:</span>
                      <span className="font-semibold text-slate-800">{selectedOrderForDetail.fastingCondition}</span>
                    </div>
                  )}
                  {selectedOrderForDetail.sampleType && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tipo de Muestra:</span>
                      <span className="font-semibold text-slate-800">{selectedOrderForDetail.sampleType}</span>
                    </div>
                  )}
                  {selectedOrderForDetail.phlebotomistName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Flebotomista:</span>
                      <span className="font-semibold text-slate-800">{selectedOrderForDetail.phlebotomistName}</span>
                    </div>
                  )}
                  {selectedOrderForDetail.referringDoctor && (
                    <div className="flex justify-between sm:col-span-2">
                      <span className="text-slate-500">Médico Solicitante:</span>
                      <span className="font-semibold text-slate-800">{selectedOrderForDetail.referringDoctor}</span>
                    </div>
                  )}
                  {selectedOrderForDetail.clinicalDiagnosis && (
                    <div className="flex justify-between sm:col-span-2">
                      <span className="text-slate-500">Diagnóstico / Motivo:</span>
                      <span className="font-semibold text-slate-800">{selectedOrderForDetail.clinicalDiagnosis}</span>
                    </div>
                  )}
                  {selectedOrderForDetail.notes && (
                    <div className="sm:col-span-2 pt-1 border-t border-teal-200/50 text-slate-600 italic">
                      <strong className="not-italic text-slate-700 font-bold">Observaciones: </strong>
                      {selectedOrderForDetail.notes}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Biometric Security Banner in Details */}
            {selectedOrderForDetail.biometricAuthorized ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <div className="font-black text-emerald-900 flex items-center gap-2">
                    <span>Autorización Biométrica Verificada</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                      {selectedOrderForDetail.biometricAuthData?.method === 'facial' ? 'RECONOCIMIENTO FACIAL' : 'HUELLA DACTILAR / FIDO2'}
                    </span>
                  </div>
                  <div className="text-emerald-700 mt-0.5">
                    Autorizado por <strong className="font-bold">{selectedOrderForDetail.biometricAuthData?.authorizedBy}</strong> ({selectedOrderForDetail.biometricAuthData?.staffRole || 'Director Técnico'})
                  </div>
                  <div className="text-[10px] text-emerald-600 font-mono mt-1">
                    🕒 {selectedOrderForDetail.biometricAuthData?.timestamp} • Dispositivo: {selectedOrderForDetail.biometricAuthData?.deviceType} • Confianza: {selectedOrderForDetail.biometricAuthData?.confidenceScore}%
                  </div>
                </div>
              </div>
            ) : (selectedOrderForDetail.priority === 'stat_panico' || selectedOrderForDetail.priority === 'urgente' || selectedOrderForDetail.isHighRisk) ? (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-rose-900">
                  <Fingerprint className="w-5 h-5 text-rose-600 shrink-0 animate-pulse" />
                  <div>
                    <strong className="font-bold">Orden de Alto Riesgo / STAT:</strong> Requiere validación física por el Químico Biólogo.
                  </div>
                </div>
                <button
                  onClick={() => setOrderForBiometricAuth(selectedOrderForDetail)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                >
                  Validar Ahora
                </button>
              </div>
            ) : null}

            {/* Exámenes Cargados Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black uppercase tracking-wider text-slate-700 text-xs flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-teal-600" />
                  <span>Exámenes Cargados en esta Orden ({selectedOrderForDetail.testsCount}):</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Tubos de muestra y metodología asignada
                </span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedOrderForDetail.testsList?.map((tName, idx) => {
                  const details = getTestDetails(tName);

                  return (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-teal-100 text-teal-800 font-black text-xs font-mono shrink-0">
                          0{idx + 1}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-xs flex items-center gap-2">
                            <span>{tName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-slate-200 text-slate-700">
                              {details.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {details.category} • Metodología: {details.methodology}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${details.tubeColor}`}>
                          {details.tube}
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {details.price}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tubos de Muestra Barcode Strip */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-black uppercase text-teal-400 tracking-wider">
                  Etiqueta de Muestra con Código de Barras
                </div>
                <div className="font-mono text-sm font-bold text-white mt-0.5">
                  VAC-{selectedOrderForDetail.orderNumber.replace('#', '')}-2026-T1
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedOrderForDetail.patientName} • {selectedOrderForDetail.date}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintOrderReceipt(selectedOrderForDetail)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Barcode className="w-4 h-4 text-teal-400" />
                  <span>Imprimir Etiqueta</span>
                </button>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenMoveModal([selectedOrderForDetail.id]);
                    setSelectedOrderForDetail(null);
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Folder className="w-4 h-4 text-amber-600" />
                  <span>Mover a Carpeta</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleEditResultsInEditor(selectedOrderForDetail);
                    setSelectedOrderForDetail(null);
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-teal-700 hover:bg-teal-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Cargar / Editar Resultados</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderForBiometricAuth(selectedOrderForDetail);
                  }}
                  className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    selectedOrderForDetail.biometricAuthorized
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-cyan-300 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
                  }`}
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>{selectedOrderForDetail.biometricAuthorized ? 'Ver Sello Biométrico' : 'Autorizar con Biometría'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePrintOrderReceipt(selectedOrderForDetail);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Imprimir Boleta / Ticket</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handlePrintOfficialReport(selectedOrderForDetail);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Informe Oficial (Membrete)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: TICKET / BOLETA DE ADMISIÓN DE ORDEN (PRINTABLE)
         ======================================================== */}
      {orderTicketToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-slate-900 text-sm">Boleta de Admisión y Recepción</h3>
              </div>
              <button
                onClick={() => setOrderTicketToPrint(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ticket Printable Body */}
            <div className="border border-dashed border-slate-300 p-5 rounded-2xl bg-amber-50/20 font-mono text-xs space-y-3">
              
              {/* Header */}
              <div className="text-center border-b border-slate-200 pb-3">
                <div className="font-black text-base text-slate-900">VACLINIC LABORATORIO CLÍNICO</div>
                <div className="text-[10px] text-slate-500">"Precisión que diagnostica, confianza que cuida"</div>
                <div className="text-[10px] text-slate-600 mt-1">📍 Entrada de Pineda Oratorio Santa Rosa km 79.5</div>
                <div className="text-[10px] text-slate-600">📞 PBX / WhatsApp: 56125563</div>
              </div>

              {/* Order metadata */}
              <div className="space-y-1 text-[11px] border-b border-slate-200 pb-2">
                <div className="flex justify-between font-black text-slate-900">
                  <span>BOLETA DE ORDEN:</span>
                  <span>{orderTicketToPrint.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha y Hora:</span>
                  <span>{orderTicketToPrint.date} {orderTicketToPrint.time || '11:14 a. m.'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paciente:</span>
                  <span className="font-bold">{orderTicketToPrint.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DNI / DPI:</span>
                  <span>{orderTicketToPrint.nationalId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Teléfono:</span>
                  <span>{orderTicketToPrint.phone || '5421-9876'}</span>
                </div>
              </div>

              {/* Tests requested */}
              <div className="border-b border-slate-200 pb-2">
                <div className="font-black text-[11px] uppercase text-slate-700 mb-1.5">
                  EXÁMENES SOLICITADOS:
                </div>
                <div className="space-y-1">
                  {orderTicketToPrint.testsList?.map((t, idx) => {
                    const details = getTestDetails(t);
                    return (
                      <div key={idx} className="flex justify-between text-[11px]">
                        <span>• {t}</span>
                        <span className="font-bold">{details.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial summary */}
              <div className="flex justify-between font-black text-sm text-slate-900 border-b border-slate-200 pb-2">
                <span>TOTAL LIQUIDADO:</span>
                <span>{orderTicketToPrint.totalPrice || 'Q140.00'}</span>
              </div>

              {/* Verification & Barcode */}
              <div className="text-center pt-1 space-y-1.5">
                <div className="text-[10px] text-slate-500">Consulta de resultados en línea con tu DNI:</div>
                <div className="font-bold text-teal-700 text-[10px]">https://vaclinic.laboratorio.gt</div>
                <div className="p-2 bg-white rounded-lg border border-slate-200 inline-block">
                  <QrCode className="w-16 h-16 mx-auto text-slate-800" />
                </div>
                <div className="text-[9px] text-slate-400">
                  Trazabilidad ISO 15189 • Gracias por su confianza
                </div>
              </div>

            </div>

            {/* Ticket Print Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setOrderTicketToPrint(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: GUARDAR / MOVER ORDEN(ES) EN CARPETA
         ======================================================== */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                  <FolderCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Guardar en Carpeta</h3>
                  <p className="text-xs text-slate-500">
                    Mover {targetOrderIdsToMove.length} orden(es) seleccionada(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">
                Selecciona la carpeta de destino:
              </label>

              <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {orderFolders.filter(f => f.id !== 'folder-all').map(f => {
                  const isSelected = selectedTargetFolderId === f.id;
                  const colorInfo = COLOR_MAP[f.color] || COLOR_MAP.slate;

                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedTargetFolderId(f.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? `border-teal-500 ${colorInfo.bg} ring-2 ring-teal-500/20`
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${colorInfo.badge}`}>
                          <Folder className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{f.name}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{f.description}</div>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-teal-600 stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderModalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-teal-500 text-xs font-bold text-teal-700 hover:bg-teal-50/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>+ Crear una Nueva Carpeta</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMoveModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmMoveToFolder}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar en esta Carpeta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: CREAR NUEVA CARPETA PERSONALIZADA
         ======================================================== */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Nueva Carpeta de Archivo</h3>
                  <p className="text-xs text-slate-500">Crea un clasificador para organizar tus órdenes</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateFolderModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Nombre de la Carpeta *
                </label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ej. Chequeos Ejecutivos 2026, Campaña Escolar..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Color Identificador
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {Object.keys(COLOR_MAP).map(colorKey => {
                    const cInfo = COLOR_MAP[colorKey];
                    const isSelected = newFolderColor === colorKey;
                    return (
                      <button
                        key={colorKey}
                        type="button"
                        onClick={() => setNewFolderColor(colorKey)}
                        className={`w-7 h-7 rounded-full ${cInfo.badge} flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'ring-3 ring-slate-900 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={colorKey}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  placeholder="Finalidad de esta carpeta, notas o criterios de archivo..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Crear Carpeta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Biometric Authorization Modal */}
      <BiometricAuthModal
        isOpen={!!orderForBiometricAuth}
        onClose={() => setOrderForBiometricAuth(null)}
        order={orderForBiometricAuth}
        staffName="Lic. Mily Jeannette Rodríguez Magaña"
        staffRole="Químico Biólogo / Director Técnico"
        onAuthorized={(orderId, authResult) => {
          updateOrder(orderId, {
            biometricAuthorized: true,
            isHighRisk: true,
            biometricAuthData: {
              method: authResult.method,
              authorizedBy: authResult.userName,
              staffRole: authResult.userRole,
              timestamp: authResult.timestamp,
              credentialId: authResult.credentialId,
              confidenceScore: authResult.confidenceScore,
              deviceType: authResult.hardwareDevice
            }
          });
          showNotification(`¡Orden autorizada biométricamente por ${authResult.userName}!`, 'success');
        }}
      />

      {/* ======================================================== */}
      {/* BULK LIQUIDATION REVIEW & PAYMENT CONFIRMATION MODAL     */}
      {/* ======================================================== */}
      {isBulkLiquidationReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white border-b border-teal-500/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shadow-inner">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Revisión Previa a Liquidación de Lote de Órdenes
                  </h3>
                  <p className="text-xs text-slate-300">
                    Confirma el total de órdenes y el importe exacto a liquidar antes de asentar en caja.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBulkLiquidationReviewOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Cerrar revisión"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* 1. Metric Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Órdenes a Liquidar</div>
                  <div className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{selectedOrdersList.length}</div>
                  <div className="text-[10px] text-slate-500">Seleccionadas en la lista</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Pacientes Distintos</div>
                  <div className="text-2xl font-black text-teal-600 mt-0.5 font-mono">{uniquePatientsInSelected}</div>
                  <div className="text-[10px] text-slate-500">Titulares de muestra</div>
                </div>

                <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white p-3.5 rounded-2xl border border-teal-500/30">
                  <div className="text-[10px] font-black uppercase text-teal-300 tracking-wider">Importe Total a Cobrar</div>
                  <div className="text-2xl font-black text-teal-300 mt-0.5 font-mono">Q{totalSelectedOrdersAmount.toFixed(2)}</div>
                  <div className="text-[10px] text-teal-100/70">Consolidado neto de caja</div>
                </div>
              </div>

              {/* 2. Itemized Orders Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Órdenes Incluidas en la Liquidación ({selectedOrdersList.length}):</span>
                  </span>
                  <span className="text-[11px] text-slate-500">Importe Individual</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                  {selectedOrdersList.map((ord, idx) => {
                    const priceNum = parseFloat((ord.totalPrice || '').replace(/[^0-9.]/g, '')) || 0;
                    return (
                      <div key={ord.id} className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                        <div className="flex items-center gap-3 pr-2">
                          <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-slate-900">{ord.orderNumber}</span>
                              <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                                ord.priority === 'stat_panico' ? 'bg-rose-100 text-rose-800' :
                                ord.priority === 'urgente' ? 'bg-amber-100 text-amber-800' :
                                'bg-emerald-100 text-emerald-800'
                              }`}>
                                {ord.priority.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="text-slate-800 font-bold mt-0.5">
                              {ord.patientName} <span className="text-slate-400 font-normal">(DPI: {ord.nationalId})</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {ord.date} ({ord.time}) • {ord.testsList?.length || ord.testsCount || 0} exámenes ({ord.testsList?.slice(0, 2).join(', ')}{(ord.testsList?.length || 0) > 2 ? '...' : ''})
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-3">
                          <span className="font-mono font-black text-slate-900 text-sm">
                            Q{priceNum.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderIds(prev => prev.filter(id => id !== ord.id))}
                            className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remover orden de este lote"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Payment Method & Live Cash Calculator */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="font-black text-slate-900 flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-4 h-4 text-teal-700" />
                    <span>Método de Liquidación / Cobro Consolidado:</span>
                  </label>
                  
                  <select
                    value={bulkPaymentMethod}
                    onChange={(e) => setBulkPaymentMethod(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-teal-300 bg-white font-bold text-slate-800 text-xs outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta de Débito / Crédito</option>
                    <option value="transferencia">Transferencia Bancaria / POS</option>
                    <option value="seguro">Seguro Médico / Convenio</option>
                  </select>
                </div>

                {/* Cash Calculator if Efectivo */}
                {bulkPaymentMethod === 'efectivo' && (() => {
                  const tendered = parseFloat(bulkCashTendered) || 0;
                  const change = tendered - totalSelectedOrdersAmount;

                  return (
                    <div className="bg-white p-3.5 rounded-xl border border-teal-200 space-y-3 animate-fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <Banknote className="w-4 h-4 text-emerald-600" />
                          <span>Paga Con (Monto Recibido en Caja):</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-400 text-sm">Q</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={bulkCashTendered}
                            onChange={(e) => setBulkCashTendered(e.target.value)}
                            placeholder={totalSelectedOrdersAmount.toFixed(2)}
                            className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-mono font-bold text-slate-900 text-sm text-right outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Quick Denomination Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-slate-400 font-bold">Rápido:</span>
                        <button
                          type="button"
                          onClick={() => setBulkCashTendered(totalSelectedOrdersAmount.toFixed(2))}
                          className="px-2 py-0.5 rounded-md bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold cursor-pointer transition-colors"
                        >
                          Exacto (Q{totalSelectedOrdersAmount.toFixed(2)})
                        </button>
                        {[100, 200, 500, 1000].filter(d => d >= totalSelectedOrdersAmount || d >= 100).map(denom => (
                          <button
                            key={denom}
                            type="button"
                            onClick={() => setBulkCashTendered(denom.toFixed(2))}
                            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
                          >
                            Q{denom}.00
                          </button>
                        ))}
                      </div>

                      {/* Change or Missing Indicator */}
                      {tendered > 0 && (
                        <div className={`p-2.5 rounded-lg flex items-center justify-between border ${
                          change >= 0 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                            : 'bg-amber-50 border-amber-300 text-amber-900'
                        }`}>
                          <div className="flex items-center gap-1.5 font-bold">
                            <Coins className="w-4 h-4" />
                            <span>{change >= 0 ? 'Cambio / Vuelto a Entregar:' : 'Monto insuficiente:'}</span>
                          </div>
                          <span className="font-mono font-black text-sm">
                            {change >= 0 ? `Q${change.toFixed(2)}` : `Faltan Q${(-change).toFixed(2)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsBulkLiquidationReviewOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Regresar / Modificar Selección</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmBulkLiquidation}
                disabled={selectedOrdersList.length === 0}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-md shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Confirmar Liquidación ({selectedOrdersList.length} órdenes • Q{totalSelectedOrdersAmount.toFixed(2)})</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BULK LIQUIDATION PRINTABLE RECEIPT MODAL                 */}
      {/* ======================================================== */}
      {bulkLiquidationReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm">Comprobante de Liquidación de Lote</h3>
              </div>
              <button
                type="button"
                onClick={() => setBulkLiquidationReceipt(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ticket Printable Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="text-center border-b border-dashed border-slate-300 pb-4 space-y-1">
                <h2 className="text-base font-black text-slate-900">{labSettings.labName || 'LABORATORIO CLÍNICO Y BIOLÓGICO'}</h2>
                <p className="text-[11px] text-slate-500">{labSettings.address || 'Ciudad de Guatemala'}</p>
                <p className="text-[11px] text-slate-500">PBX: {labSettings.phone || '2222-0000'}</p>
                <div className="mt-2 inline-block bg-teal-50 border border-teal-200 px-3 py-1 rounded-full font-mono font-bold text-teal-800">
                  LOTE #{bulkLiquidationReceipt.receiptNumber}
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha y Hora:</span>
                  <span className="font-bold font-mono text-slate-800">{bulkLiquidationReceipt.date} • {bulkLiquidationReceipt.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Método de Liquidación:</span>
                  <span className="font-bold uppercase text-slate-800">{bulkLiquidationReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total de Órdenes Procesadas:</span>
                  <span className="font-bold text-slate-800">{bulkLiquidationReceipt.totalOrders} órdenes</span>
                </div>
              </div>

              {/* Items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-700 flex justify-between">
                  <span>Orden / Paciente</span>
                  <span>Monto</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {bulkLiquidationReceipt.orders.map((o) => (
                    <div key={o.id} className="px-3 py-1.5 flex justify-between items-center text-[11px]">
                      <div>
                        <strong className="font-mono text-slate-900">{o.orderNumber}</strong>
                        <span className="text-slate-500 ml-1.5">{o.patientName}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">
                        Q{(parseFloat((o.totalPrice || '').replace(/[^0-9.]/g, '')) || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Banner */}
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex justify-between items-center">
                <span className="font-bold text-teal-900 uppercase">Total Liquidado en Caja:</span>
                <span className="text-xl font-black text-teal-800 font-mono">Q{bulkLiquidationReceipt.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setBulkLiquidationReceipt(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Comprobante</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
