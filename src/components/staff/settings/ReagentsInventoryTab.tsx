import React, { useState, useMemo } from 'react';
import { useClinic } from '../../../context/ClinicContext';
import { ReagentInventoryItem, ReagentMovementLog } from '../../../types/reagentInventory';
import { 
  FlaskConical, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  PackageMinus, 
  PackagePlus, 
  Sliders, 
  Calendar, 
  Building, 
  MapPin, 
  History, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  X, 
  Info, 
  Bell, 
  ChevronDown, 
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  Barcode,
  Activity,
  Zap
} from 'lucide-react';
import { playNotificationChime } from '../../../utils/audioChime';

export const ReagentsInventoryTab: React.FC = () => {
  const { 
    reagents, 
    reagentMovements, 
    addReagent, 
    updateReagent, 
    deleteReagent, 
    registerReagentMovement, 
    resetReagentsToFactory, 
    exportReagentsJson, 
    importReagentsJson, 
    currentStaffUser, 
    showNotification,
    setStaffActiveTab,
    restockAllCriticalReagents,
    simulateReagentConsumption,
    quickRestockReagent
  } = useClinic();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [stockStatusFilter, setStockStatusFilter] = useState<'todos' | 'critico' | 'bajo_stock' | 'optimo' | 'vencido'>('todos');
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);

  // Modals & Panels
  const [isNewReagentModalOpen, setIsNewReagentModalOpen] = useState(false);
  const [editingReagent, setEditingReagent] = useState<ReagentInventoryItem | null>(null);
  const [selectedReagentForMovement, setSelectedReagentForMovement] = useState<ReagentInventoryItem | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'salida_consumo' | 'ajuste' | 'baja_vencimiento'>('salida_consumo');
  const [movementQty, setMovementQty] = useState<number>(1);
  const [movementReason, setMovementReason] = useState<string>('');
  const [isMovementsHistoryOpen, setIsMovementsHistoryOpen] = useState(false);

  // Form State for New / Edit Reagent
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ReagentInventoryItem['category']>('bioquimica');
  const [formAssociatedTests, setFormAssociatedTests] = useState('');
  const [formLotNumber, setFormLotNumber] = useState('');
  const [formExpirationDate, setFormExpirationDate] = useState('');
  const [formCurrentStock, setFormCurrentStock] = useState<number>(10);
  const [formMinStockAlert, setFormMinStockAlert] = useState<number>(15);
  const [formOptimalStock, setFormOptimalStock] = useState<number>(50);
  const [formUnit, setFormUnit] = useState('Kits');
  const [formStorageCondition, setFormStorageCondition] = useState<ReagentInventoryItem['storageCondition']>('refrigerado_2_8');
  const [formSupplier, setFormSupplier] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formCostPerUnit, setFormCostPerUnit] = useState<number>(150);
  const [formTestsPerUnit, setFormTestsPerUnit] = useState<number>(100);
  const [formNotes, setFormNotes] = useState('');

  // Calculations & Metrics
  const criticalStockItems = useMemo(() => {
    return reagents.filter(r => r.currentStock <= Math.floor(r.minStockAlert * 0.5));
  }, [reagents]);

  const lowStockItems = useMemo(() => {
    return reagents.filter(r => r.currentStock <= r.minStockAlert && r.currentStock > Math.floor(r.minStockAlert * 0.5));
  }, [reagents]);

  const expiringSoonItems = useMemo(() => {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);
    return reagents.filter(r => {
      const exp = new Date(r.expirationDate);
      return exp <= next30Days;
    });
  }, [reagents]);

  const totalInventoryValue = useMemo(() => {
    return reagents.reduce((acc, r) => acc + (r.currentStock * r.costPerUnit), 0);
  }, [reagents]);

  // Filtered reagents list
  const filteredReagents = useMemo(() => {
    return reagents.filter(item => {
      // Category filter
      if (selectedCategory !== 'todos' && item.category !== selectedCategory) {
        return false;
      }

      // Stock status filter
      if (stockStatusFilter !== 'todos' && item.status !== stockStatusFilter) {
        return false;
      }

      // Only alerts filter
      if (showOnlyAlerts && item.currentStock > item.minStockAlert) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        const matchLot = item.lotNumber.toLowerCase().includes(q);
        const matchSupplier = item.supplier.toLowerCase().includes(q);
        const matchTests = item.associatedTests.some(t => t.toLowerCase().includes(q));
        return matchName || matchCode || matchLot || matchSupplier || matchTests;
      }

      return true;
    });
  }, [reagents, selectedCategory, stockStatusFilter, showOnlyAlerts, searchQuery]);

  // Open Edit Modal
  const handleOpenEdit = (reagent: ReagentInventoryItem) => {
    setEditingReagent(reagent);
    setFormCode(reagent.code);
    setFormName(reagent.name);
    setFormCategory(reagent.category);
    setFormAssociatedTests(reagent.associatedTests.join(', '));
    setFormLotNumber(reagent.lotNumber);
    setFormExpirationDate(reagent.expirationDate);
    setFormCurrentStock(reagent.currentStock);
    setFormMinStockAlert(reagent.minStockAlert);
    setFormOptimalStock(reagent.optimalStock);
    setFormUnit(reagent.unit);
    setFormStorageCondition(reagent.storageCondition);
    setFormSupplier(reagent.supplier);
    setFormLocation(reagent.location);
    setFormCostPerUnit(reagent.costPerUnit);
    setFormTestsPerUnit(reagent.testsPerUnit);
    setFormNotes(reagent.notes || '');
    setIsNewReagentModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingReagent(null);
    setFormCode(`RGT-${Math.floor(100 + Math.random() * 900)}`);
    setFormName('');
    setFormCategory('bioquimica');
    setFormAssociatedTests('');
    setFormLotNumber(`LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setFormExpirationDate(nextYear.toISOString().slice(0, 10));
    setFormCurrentStock(20);
    setFormMinStockAlert(15);
    setFormOptimalStock(50);
    setFormUnit('Kits');
    setFormStorageCondition('refrigerado_2_8');
    setFormSupplier('');
    setFormLocation('Refrigerador Clínico #1');
    setFormCostPerUnit(200);
    setFormTestsPerUnit(100);
    setFormNotes('');
    setIsNewReagentModalOpen(true);
  };

  // Save or Update Reagent
  const handleSaveReagent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      showNotification('Por favor ingresa el nombre y código del reactivo', 'warning');
      return;
    }

    const associatedList = formAssociatedTests
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    let calculatedStatus: ReagentInventoryItem['status'] = 'optimo';
    const isExpired = new Date(formExpirationDate) < new Date();
    if (isExpired) {
      calculatedStatus = 'vencido';
    } else if (formCurrentStock <= Math.floor(formMinStockAlert * 0.5)) {
      calculatedStatus = 'critico';
    } else if (formCurrentStock <= formMinStockAlert) {
      calculatedStatus = 'bajo_stock';
    }

    if (editingReagent) {
      updateReagent(editingReagent.id, {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        category: formCategory,
        associatedTests: associatedList.length > 0 ? associatedList : ['Pruebas generales'],
        lotNumber: formLotNumber.trim(),
        expirationDate: formExpirationDate,
        currentStock: Number(formCurrentStock),
        minStockAlert: Number(formMinStockAlert),
        optimalStock: Number(formOptimalStock),
        unit: formUnit.trim(),
        storageCondition: formStorageCondition,
        supplier: formSupplier.trim() || 'Proveedor no especificado',
        location: formLocation.trim() || 'Almacén general',
        costPerUnit: Number(formCostPerUnit),
        testsPerUnit: Number(formTestsPerUnit),
        status: calculatedStatus,
        notes: formNotes.trim()
      });
      showNotification(`Reactivo "${formName}" actualizado`, 'success');
    } else {
      addReagent({
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        category: formCategory,
        associatedTests: associatedList.length > 0 ? associatedList : ['Pruebas generales'],
        lotNumber: formLotNumber.trim(),
        expirationDate: formExpirationDate,
        currentStock: Number(formCurrentStock),
        minStockAlert: Number(formMinStockAlert),
        optimalStock: Number(formOptimalStock),
        unit: formUnit.trim(),
        storageCondition: formStorageCondition,
        supplier: formSupplier.trim() || 'Proveedor no especificado',
        location: formLocation.trim() || 'Almacén general',
        costPerUnit: Number(formCostPerUnit),
        testsPerUnit: Number(formTestsPerUnit),
        status: calculatedStatus,
        notes: formNotes.trim()
      });
      showNotification(`Nuevo reactivo "${formName}" registrado en el inventario`, 'success');
    }

    setIsNewReagentModalOpen(false);
  };

  // Submit Quick Movement
  const handleExecuteMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReagentForMovement) return;
    if (movementQty <= 0) {
      showNotification('La cantidad debe ser mayor a 0', 'warning');
      return;
    }

    registerReagentMovement(
      selectedReagentForMovement.id,
      movementType,
      movementQty,
      movementReason.trim() || (movementType === 'salida_consumo' ? 'Consumo de pruebas analíticas' : 'Entrada de reposición')
    );

    setSelectedReagentForMovement(null);
    setMovementQty(1);
    setMovementReason('');
  };

  // Export JSON
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportReagentsJson());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `VACLINIC_Inventario_Reactivos_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Catálogo e inventario de reactivos exportado en JSON', 'info');
  };

  // Import JSON
  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        importReagentsJson(text);
      }
    };
    reader.readAsText(file);
  };

  const getStorageBadge = (condition: ReagentInventoryItem['storageCondition']) => {
    switch (condition) {
      case 'refrigerado_2_8':
        return <span className="bg-cyan-50 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-cyan-200">2°C a 8°C (Refrig.)</span>;
      case 'congelado_menos_20':
        return <span className="bg-indigo-50 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-200">-20°C (Congelado)</span>;
      case 'protegido_luz':
        return <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">Protegido de luz</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">Temp. Ambiente (15-25°C)</span>;
    }
  };

  const getCategoryName = (cat: ReagentInventoryItem['category']) => {
    const map: Record<string, string> = {
      bioquimica: 'Bioquímica Clínica',
      hematologia: 'Hematología & Coag.',
      inmunologia: 'Inmunología & Serología',
      microbiologia: 'Microbiología & Medios',
      uroanalisis: 'Uroanálisis & Sedimento',
      coagulacion: 'Coagulación Especial',
      insumos_generales: 'Insumos y Diluyentes'
    };
    return map[cat] || cat;
  };

  return (
    <div className="space-y-6">
      
      {/* Real-time Inventory Monitoring & Dashboard Sync Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-3.5 sm:p-4 rounded-2xl border border-slate-700 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-teal-600/30 text-teal-400 border border-teal-500/40 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">Monitoreo de Stock Automatizado LIS</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-700">
                  En Vivo &bull; Sincronizado
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                El sistema evalúa continuamente cada reactivo frente a su <span className="text-teal-300 font-mono font-bold">minStockAlert</span>. Si el stock desciende del mínimo, se dispara inmediatamente una alerta visual prioritaria en el Dashboard principal.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStaffActiveTab('dashboard')}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Ver Alertas en Dashboard</span>
            </button>

            {reagents.length > 0 && (
              <button
                onClick={() => simulateReagentConsumption(reagents[0].id, Math.max(1, reagents[0].currentStock - 3))}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                title="Desgasta reactivo para activar y comprobar la alerta visual en el Dashboard"
              >
                <span>Simular Desgaste</span>
              </button>
            )}

            {criticalStockItems.length > 0 && (
              <button
                onClick={restockAllCriticalReagents}
                className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Reposición Express</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overview & Critical Stock Banner */}
      {(criticalStockItems.length > 0 || lowStockItems.length > 0) && (
        <div className="bg-amber-50/90 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 animate-bounce-short">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                  <span>Alerta de Abastecimiento Crítico para Pruebas Clínicas</span>
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-300">
                    {criticalStockItems.length} En Riesgo de Desabastecimiento
                  </span>
                </h3>
                <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                  Hay {criticalStockItems.length + lowStockItems.length} reactivo(s) por debajo o cerca del umbral mínimo de seguridad. 
                  Una interrupción en el stock impedirá el procesamiento de órdenes diagnósticas (ej: Glucosa, Tiempos de Coagulación, Hemogramas).
                </p>

                {/* Quick list of affected reagents */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {criticalStockItems.map(item => (
                    <div 
                      key={item.id}
                      className="bg-white/90 border border-rose-300 rounded-lg px-2.5 py-1 text-xs flex items-center gap-2 shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                      <span className="font-bold text-rose-950">{item.name}</span>
                      <span className="font-mono text-[11px] bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                        Quedan: {item.currentStock} {item.unit} (Mín: {item.minStockAlert})
                      </span>
                      <button
                        onClick={() => {
                          setSelectedReagentForMovement(item);
                          setMovementType('entrada');
                          setMovementQty(item.optimalStock - item.currentStock);
                          setMovementReason('Reabastecimiento urgente por stock crítico');
                        }}
                        className="text-[10px] font-bold text-teal-700 hover:text-teal-900 underline cursor-pointer"
                      >
                        Reabastecer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowOnlyAlerts(!showOnlyAlerts)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                showOnlyAlerts
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100/50'
              }`}
            >
              {showOnlyAlerts ? 'Ver Todos los Reactivos' : 'Filtrar Sólo Alertas'}
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Reactivos</span>
            <FlaskConical className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{reagents.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Insumos activos en catálogo</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stock Crítico</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{criticalStockItems.length}</div>
          <div className="text-[11px] text-rose-600 font-bold mt-1">Requieren compra inmediata</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bajo Stock</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{lowStockItems.length}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">Cercanos al umbral de alerta</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Valorización Total</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900">
            Q{totalInventoryValue.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">En inventario disponible</div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Main Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar reactivo por nombre, código (RGT-GLU-01), lote, prueba o proveedor..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 flex-wrap justify-end">
            <button
              onClick={() => setIsMovementsHistoryOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Kardex e historial de entradas y salidas"
            >
              <History className="w-3.5 h-3.5 text-teal-600" />
              <span>Kardex / Movimientos ({reagentMovements.length})</span>
            </button>

            <button
              onClick={handleExport}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Exportar inventario a JSON"
            >
              <Download className="w-4 h-4 text-slate-600" />
            </button>

            <label
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer inline-flex items-center"
              title="Importar catálogo e inventario desde JSON"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImport(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Reactivo</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-bold text-[11px] uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Área:
            </span>
            {[
              { id: 'todos', label: 'Todas las áreas' },
              { id: 'bioquimica', label: 'Bioquímica' },
              { id: 'hematologia', label: 'Hematología' },
              { id: 'inmunologia', label: 'Inmunología' },
              { id: 'microbiologia', label: 'Microbiología' },
              { id: 'uroanalisis', label: 'Uroanálisis' },
              { id: 'coagulacion', label: 'Coagulación' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold text-[11px] uppercase mr-1">Estado:</span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'critico', label: 'Crítico' },
              { id: 'bajo_stock', label: 'Bajo' },
              { id: 'optimo', label: 'Óptimo' }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setStockStatusFilter(st.id as any)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  stockStatusFilter === st.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Reactivo / Insumo</th>
                <th className="py-3 px-3">Área / Pruebas</th>
                <th className="py-3 px-3">Lote / Vencimiento</th>
                <th className="py-3 px-3">Ubicación & Frío</th>
                <th className="py-3 px-3 text-center">Nivel de Stock</th>
                <th className="py-3 px-3 text-right">Costo Unit.</th>
                <th className="py-3 px-4 text-center">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReagents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <FlaskConical className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600 text-sm">No se encontraron reactivos</p>
                    <p className="text-xs mt-0.5">Intenta con otro término de búsqueda o limpia los filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredReagents.map(reagent => {
                  const stockPercent = Math.min(100, Math.round((reagent.currentStock / reagent.optimalStock) * 100));
                  const isCritical = reagent.currentStock <= Math.floor(reagent.minStockAlert * 0.5);
                  const isLow = reagent.currentStock <= reagent.minStockAlert && !isCritical;
                  
                  return (
                    <tr 
                      key={reagent.id} 
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isCritical ? 'bg-rose-50/30' : isLow ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Name & Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2.5">
                          <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                            isCritical 
                              ? 'bg-rose-100 text-rose-700' 
                              : isLow 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-teal-50 text-teal-700'
                          }`}>
                            <FlaskConical className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{reagent.name}</span>
                              {isCritical && (
                                <span className="bg-rose-100 text-rose-800 text-[9px] font-black uppercase px-1.5 py-0.2 rounded border border-rose-300">
                                  CRÍTICO
                                </span>
                              )}
                              {isLow && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-1.5 py-0.2 rounded border border-amber-300">
                                  BAJO STOCK
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                              <span className="font-bold text-slate-700">{reagent.code}</span>
                              <span>•</span>
                              <span>{reagent.supplier}</span>
                            </div>
                            {reagent.notes && (
                              <div className="text-[10px] text-slate-500 italic mt-0.5">
                                {reagent.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category & Associated Tests */}
                      <td className="py-3 px-3">
                        <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
                          {getCategoryName(reagent.category)}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-1" title={reagent.associatedTests.join(', ')}>
                          {reagent.associatedTests.join(', ')}
                        </div>
                      </td>

                      {/* Lot & Expiration */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-xs font-bold text-slate-800">{reagent.lotNumber}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Vence: {reagent.expirationDate}</span>
                        </div>
                      </td>

                      {/* Storage & Location */}
                      <td className="py-3 px-3">
                        <div>{getStorageBadge(reagent.storageCondition)}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium mt-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{reagent.location}</span>
                        </div>
                      </td>

                      {/* Current Stock vs Min Stock Gauge */}
                      <td className="py-3 px-3">
                        <div className="w-36 mx-auto">
                          <div className="flex items-center justify-between text-xs font-black mb-1">
                            <span className={isCritical ? 'text-rose-700' : isLow ? 'text-amber-700' : 'text-slate-900'}>
                              {reagent.currentStock} {reagent.unit}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Mín: {reagent.minStockAlert}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                isCritical 
                                  ? 'bg-rose-500' 
                                  : isLow 
                                  ? 'bg-amber-500' 
                                  : 'bg-teal-500'
                              }`}
                              style={{ width: `${stockPercent}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
                            <span>Óptimo: {reagent.optimalStock}</span>
                            <span>~{reagent.currentStock * reagent.testsPerUnit} determinaciones</span>
                          </div>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-black text-slate-900">
                          Q{reagent.costPerUnit.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          por {reagent.unit}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Add Stock */}
                          <button
                            onClick={() => {
                              setSelectedReagentForMovement(reagent);
                              setMovementType('entrada');
                              setMovementQty(10);
                              setMovementReason('Recepción de pedido de reposición');
                            }}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-colors cursor-pointer"
                            title="Registrar Entrada (+ Stock)"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>

                          {/* Quick Consume Stock */}
                          <button
                            onClick={() => {
                              setSelectedReagentForMovement(reagent);
                              setMovementType('salida_consumo');
                              setMovementQty(1);
                              setMovementReason('Consumo corrida analítica matutina');
                            }}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                            title="Registrar Consumo (- Stock)"
                          >
                            <PackageMinus className="w-4 h-4" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEdit(reagent)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                            title="Editar configuración y umbrales de alerta"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Reagent */}
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Está seguro de eliminar "${reagent.name}" del inventario de reactivos?`)) {
                                deleteReagent(reagent.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                            title="Eliminar reactivo"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Footer info bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">{filteredReagents.length} reactivos mostrados</span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Stock Crítico (&lt; 50% del mínimo)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Bajo Stock (&lt; Alerta mínima)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span>Stock Óptimo</span>
            </span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('¿Desea restablecer el catálogo de reactivos inicial con ejemplos clínicos completos?')) {
                resetReagentsToFactory();
              }
            }}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold hover:underline cursor-pointer"
          >
            Restablecer Reactivos Iniciales
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR O EDITAR REACTIVO CON ALERTAS DE STOCK   */}
      {/* ========================================================= */}
      {isNewReagentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingReagent ? 'Editar Ficha de Reactivo & Umbrales' : 'Nuevo Reactivo de Laboratorio'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configura alertas de stock mínimo para evitar paradas en el servicio.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewReagentModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReagent} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de Insumo / LIS *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="RGT-GLU-01"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Comercial & Descripción del Reactivo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Kit Glucosa Hexoquinasa UV (Roche)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Área Analítica
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                  >
                    <option value="bioquimica">Bioquímica Clínica</option>
                    <option value="hematologia">Hematología & Coagulación</option>
                    <option value="inmunologia">Inmunología & Serología</option>
                    <option value="microbiologia">Microbiología & Medios</option>
                    <option value="uroanalisis">Uroanálisis</option>
                    <option value="coagulacion">Coagulación Especial</option>
                    <option value="insumos_generales">Insumos y Diluyentes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pruebas / Exámenes que lo Utilizan
                  </label>
                  <input
                    type="text"
                    value={formAssociatedTests}
                    onChange={(e) => setFormAssociatedTests(e.target.value)}
                    placeholder="Glucosa, Curva de Tolerancia (separar por comas)"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* UMBRALES DE ALERTA DE STOCK (CRÍTICO) */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-3">
                <div className="flex items-center gap-2 text-teal-900 font-black text-xs">
                  <Bell className="w-4 h-4 text-teal-700" />
                  <span>Configuración de Alertas & Umbrales de Seguridad</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Stock Actual *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={formCurrentStock}
                      onChange={(e) => setFormCurrentStock(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-rose-700 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>Alerta Stock Mínimo *</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formMinStockAlert}
                      onChange={(e) => setFormMinStockAlert(Number(e.target.value))}
                      className="w-full px-3 py-2 border-2 border-rose-300 rounded-xl text-xs font-black text-rose-950 bg-rose-50/40"
                    />
                    <p className="text-[10px] text-rose-600 mt-0.5">Dispara alerta visual en el panel</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Stock Óptimo (Meta)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formOptimalStock}
                      onChange={(e) => setFormOptimalStock(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Unidad de Presentación
                    </label>
                    <input
                      type="text"
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      placeholder="Kits, Frascos (100mL), Cartuchos, Cajas"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Determinaciones / Pruebas por Unidad
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formTestsPerUnit}
                      onChange={(e) => setFormTestsPerUnit(Number(e.target.value))}
                      placeholder="Ej: 250 pruebas por kit"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* LOTE, VENCIMIENTO Y CONDICIONES DE ALMACENAMIENTO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Lote
                  </label>
                  <input
                    type="text"
                    value={formLotNumber}
                    onChange={(e) => setFormLotNumber(e.target.value)}
                    placeholder="LOT-2026-X"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    required
                    value={formExpirationDate}
                    onChange={(e) => setFormExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Condición de Almacenamiento
                  </label>
                  <select
                    value={formStorageCondition}
                    onChange={(e) => setFormStorageCondition(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                  >
                    <option value="refrigerado_2_8">Refrigerado (2°C a 8°C)</option>
                    <option value="congelado_menos_20">Congelado (-20°C)</option>
                    <option value="temperatura_ambiente">Temperatura Ambiente (15-25°C)</option>
                    <option value="protegido_luz">Protegido de la Luz</option>
                  </select>
                </div>
              </div>

              {/* PROVEEDOR Y COSTOS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Proveedor / Casa Comercial
                  </label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    placeholder="Roche, Wiener Lab, Sysmex, Bio-Rad"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ubicación Física en Laboratorio
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Refrigerador #1, Estante B2"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Costo Unitario (Q)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={formCostPerUnit}
                    onChange={(e) => setFormCostPerUnit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas de Manejo Especial o Control de Calidad
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej: Calibrar semanalmente; dejar atemperar 30 min antes del montaje analítico."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewReagentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
                >
                  {editingReagent ? 'Guardar Cambios' : 'Registrar Reactivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ENTRADA / SALIDA RÁPIDA DE STOCK (MOVIMIENTO)      */}
      {/* ========================================================= */}
      {selectedReagentForMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl text-white ${
                  movementType === 'entrada' ? 'bg-teal-600' : 'bg-amber-600'
                }`}>
                  {movementType === 'entrada' ? <PackagePlus className="w-4 h-4" /> : <PackageMinus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {movementType === 'entrada' ? 'Entrada de Stock (Reabastecer)' : 'Salida / Consumo de Reactivo'}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                    {selectedReagentForMovement.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReagentForMovement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteMovement} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-[11px] block">Stock Disponible:</span>
                  <span className="font-black text-sm text-slate-900">
                    {selectedReagentForMovement.currentStock} {selectedReagentForMovement.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 text-[11px] block">Umbral Alerta Mínima:</span>
                  <span className="font-bold text-rose-700">
                    {selectedReagentForMovement.minStockAlert} {selectedReagentForMovement.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tipo de Operación
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('entrada')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      movementType === 'entrada'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>Entrada (+ Stock)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('salida_consumo')}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      movementType === 'salida_consumo'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <PackageMinus className="w-3.5 h-3.5" />
                    <span>Consumo (- Stock)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cantidad a {movementType === 'entrada' ? 'Ingresar' : 'Descontar'} ({selectedReagentForMovement.unit}) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo / Observación del Movimiento
                </label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder={movementType === 'entrada' ? 'Ej: Pedido orden de compra #8902' : 'Ej: Corrida matutina 60 determinaciones'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReagentForMovement(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-black shadow-sm transition-all cursor-pointer ${
                    movementType === 'entrada' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Confirmar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KARDEX / HISTORIAL DE MOVIMIENTOS                  */}
      {/* ========================================================= */}
      {isMovementsHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-scale-up">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 text-white shadow-xs">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Kardex & Auditoría de Movimientos de Reactivos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Trazabilidad ISO 15189 de entradas, consumos y mermas por lote.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMovementsHistoryOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {reagentMovements.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-600 text-sm">No hay movimientos registrados</p>
                  <p className="text-xs mt-0.5">Las entradas y consumos quedarán archivados aquí automáticamente.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reagentMovements.map(mov => (
                    <div 
                      key={mov.id}
                      className="p-3 bg-slate-50/70 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          mov.type === 'entrada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : mov.type === 'salida_consumo'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-800'
                        }`}>
                          {mov.type === 'entrada' ? (
                            <PackagePlus className="w-4 h-4" />
                          ) : (
                            <PackageMinus className="w-4 h-4" />
                          )}
                        </div>

                        <div>
                          <div className="font-bold text-slate-900">
                            {mov.reagentName}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-2">
                            <span>{mov.reason}</span>
                            <span>•</span>
                            <span>Operador: {mov.operator}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`font-black font-mono text-sm ${
                          mov.type === 'entrada' ? 'text-emerald-700' : 'text-amber-700'
                        }`}>
                          {mov.type === 'entrada' ? `+${mov.quantity}` : `-${mov.quantity}`}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {mov.previousStock} ➔ {mov.newStock} | {mov.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsMovementsHistoryOpen(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
