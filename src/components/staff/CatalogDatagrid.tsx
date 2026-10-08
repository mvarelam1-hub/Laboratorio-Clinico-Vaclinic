import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LabCatalogItem, LabCatalogCategory, LabResultType } from '../../types';
import { CATALOG_CATEGORIES_META } from '../../data/factoryCatalog';
import {
  Search,
  Filter,
  Check,
  X,
  Edit2,
  Save,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Layers,
  Sparkles,
  DollarSign,
  Tag,
  Clock,
  FlaskConical,
  Droplet,
  Heart,
  ShieldAlert,
  Activity,
  ShieldCheck,
  Microscope,
  Dna,
  Award,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  Wand2,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Plus,
  HelpCircle,
  Copy,
  Percent,
  RefreshCw
} from 'lucide-react';

interface CatalogDatagridProps {
  catalogTests: LabCatalogItem[];
  categoryMap: Map<string, typeof CATALOG_CATEGORIES_META[0]>;
  onSaveTest: (id: string, updates: Partial<LabCatalogItem>) => void;
  onBulkSave: (updatedTests: LabCatalogItem[]) => void;
  onDeleteTest: (id: string) => void;
  onViewDetails: (test: LabCatalogItem) => void;
  renderCategoryIcon: (catId: string) => React.ReactNode;
  showNotification: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

// Common reference range presets for lab bioanalysts
const COMMON_RANGE_PRESETS = [
  { label: 'Negativo / Normal', value: 'Negativo' },
  { label: 'No Reactivo (Serología)', value: 'No Reactivo' },
  { label: 'Índice < 0.90 (Negativo)', value: '< 0.90' },
  { label: 'Glucosa Ayuno (70 - 100 mg/dL)', value: '70 - 100', unit: 'mg/dL' },
  { label: 'Colesterol Total (< 200 mg/dL)', value: '< 200', unit: 'mg/dL' },
  { label: 'Triglicéridos (< 150 mg/dL)', value: '< 150', unit: 'mg/dL' },
  { label: 'Creatinina (0.7 - 1.3 mg/dL)', value: '0.7 - 1.3', unit: 'mg/dL' },
  { label: 'Ácido Úrico (3.5 - 7.2 mg/dL)', value: '3.5 - 7.2', unit: 'mg/dL' },
  { label: 'Urea (15 - 45 mg/dL)', value: '15 - 45', unit: 'mg/dL' },
  { label: 'Bilirrubina Total (0.2 - 1.2 mg/dL)', value: '0.2 - 1.2', unit: 'mg/dL' },
  { label: 'TGO / AST (0 - 40 U/L)', value: '0 - 40', unit: 'U/L' },
  { label: 'TGP / ALT (0 - 45 U/L)', value: '0 - 45', unit: 'U/L' },
  { label: 'Hemoglobina (12.0 - 17.5 g/dL)', value: '12.0 - 17.5', unit: 'g/dL' },
  { label: 'Hematocrito (36 - 52 %)', value: '36 - 52', unit: '%' },
  { label: 'Leucocitos (4,500 - 11,000 /µL)', value: '4,500 - 11,000', unit: '/µL' },
  { label: 'Plaquetas (150,000 - 450,000 /µL)', value: '150,000 - 450,000', unit: '/µL' },
  { label: 'TSH Ultrasensible (0.4 - 4.5 µUI/mL)', value: '0.4 - 4.5', unit: 'µUI/mL' },
  { label: 'T4 Libre (0.8 - 1.8 ng/dL)', value: '0.8 - 1.8', unit: 'ng/dL' },
  { label: 'PSA Total (< 4.0 ng/mL)', value: '< 4.0', unit: 'ng/mL' },
  { label: 'HBA1c (< 5.7 % Normal)', value: '< 5.7', unit: '%' },
  { label: 'Densidad Urinaria (1.005 - 1.030)', value: '1.005 - 1.030', unit: '' },
  { label: 'pH Urinario (5.0 - 8.0)', value: '5.0 - 8.0', unit: 'pH' }
];

const COMMON_UNITS = [
  'mg/dL',
  'g/dL',
  'U/L',
  'UI/mL',
  'µUI/mL',
  'ng/mL',
  'µg/dL',
  'pg/mL',
  '%',
  '/µL',
  'x10³/µL',
  'x10⁶/µL',
  'mm/h',
  'seg',
  'fl',
  'pg',
  'mmol/L',
  'mEq/L',
  'mg/24h',
  'copias/mL'
];

const COMMON_SAMPLE_TYPES = [
  'Suero sanguíneo',
  'Plasma EDTA',
  'Plasma citratado',
  'Sangre total EDTA',
  'Sangre total con heparina',
  'Orina simple al azar',
  'Orina primera de la mañana',
  'Orina de 24 horas',
  'Muestra fecal (Heces frescas)',
  'Hisopado nasofaríngeo',
  'Líquido cefalorraquídeo (LCR)',
  'Líquido sinovial / pleural',
  'Secreción faríngea / ótica'
];

type SortField = 'code' | 'name' | 'category' | 'resultType' | 'unit' | 'referenceRange' | 'price' | 'sampleType';
type SortDirection = 'asc' | 'desc';

export const CatalogDatagrid: React.FC<CatalogDatagridProps> = ({
  catalogTests,
  categoryMap,
  onSaveTest,
  onBulkSave,
  onDeleteTest,
  onViewDetails,
  renderCategoryIcon,
  showNotification
}) => {
  // Filters state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [resultTypeFilter, setResultTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'missing_range' | 'missing_unit' | 'has_changes' | 'priced' | 'free'>('all');
  
  // Datagrid density & column options
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');
  const [showOptionalColumns, setShowOptionalColumns] = useState<boolean>(true);
  const [autoSaveOnBlur, setAutoSaveOnBlur] = useState<boolean>(true);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Multi-selection state
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Pending changes state: key = test.id, value = partial item
  const [pendingChanges, setPendingChanges] = useState<Record<string, Partial<LabCatalogItem>>>({});

  // Active inline cell / popovers
  const [activePresetPopoverId, setActivePresetPopoverId] = useState<string | null>(null);
  const [activeUnitPopoverId, setActiveUnitPopoverId] = useState<string | null>(null);

  // Bulk Edit Modal State
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkActionType, setBulkActionType] = useState<'range' | 'unit' | 'sample' | 'category' | 'price' | 'type'>('range');
  const [bulkRangeValue, setBulkRangeValue] = useState<string>('');
  const [bulkUnitValue, setBulkUnitValue] = useState<string>('');
  const [bulkSampleValue, setBulkSampleValue] = useState<string>('Suero sanguíneo');
  const [bulkCategoryValue, setBulkCategoryValue] = useState<LabCatalogCategory>('03_quimica_sanguinea');
  const [bulkTypeValue, setBulkTypeValue] = useState<LabResultType>('Numérico');
  const [bulkPriceAdjustment, setBulkPriceAdjustment] = useState<{ mode: 'percent' | 'fixed_add' | 'flat'; value: number }>({
    mode: 'percent',
    value: 10
  });

  // Calculate local merged item
  const getEffectiveTest = (test: LabCatalogItem): LabCatalogItem => {
    const changes = pendingChanges[test.id];
    if (!changes) return test;
    return { ...test, ...changes };
  };

  // Check if a row has pending changes
  const hasChanges = (testId: string) => {
    return !!pendingChanges[testId] && Object.keys(pendingChanges[testId]).length > 0;
  };

  const totalPendingCount = Object.keys(pendingChanges).length;

  // Handle cell value change
  const handleCellChange = (testId: string, field: keyof LabCatalogItem, value: any) => {
    setPendingChanges(prev => {
      const existing = prev[testId] || {};
      const originalTest = catalogTests.find(t => t.id === testId);
      
      const updated = { ...existing, [field]: value };
      
      // Auto-update priceFormatted if price is modified
      if (field === 'price') {
        const numPrice = Number(value) || 0;
        updated.price = numPrice;
        updated.priceFormatted = `Q${numPrice}`;
      }

      // If category is changed, update categoryName
      if (field === 'category') {
        const meta = categoryMap.get(value);
        if (meta) {
          updated.categoryName = meta.name;
        }
      }

      // Check if value equals original
      if (originalTest && originalTest[field] === value) {
        delete (updated as any)[field];
      }

      if (Object.keys(updated).length === 0) {
        const copy = { ...prev };
        delete copy[testId];
        return copy;
      }

      return {
        ...prev,
        [testId]: updated
      };
    });

    // If autoSaveOnBlur is enabled, we could also sync directly or rely on the pending state
  };

  // Save single row changes
  const handleSaveRow = (testId: string) => {
    const changes = pendingChanges[testId];
    if (!changes) return;

    onSaveTest(testId, changes);

    setPendingChanges(prev => {
      const copy = { ...prev };
      delete copy[testId];
      return copy;
    });
  };

  // Revert single row changes
  const handleRevertRow = (testId: string) => {
    setPendingChanges(prev => {
      const copy = { ...prev };
      delete copy[testId];
      return copy;
    });
  };

  // Save ALL pending changes
  const handleSaveAllPending = () => {
    if (totalPendingCount === 0) return;

    const updatedList = catalogTests.map(test => {
      const changes = pendingChanges[test.id];
      if (changes) {
        const merged = { ...test, ...changes };
        if (merged.price !== undefined) {
          merged.priceFormatted = `Q${merged.price}`;
        }
        return merged;
      }
      return test;
    });

    onBulkSave(updatedList);
    setPendingChanges({});
    showNotification(`Se han guardado exitosamente los cambios de ${totalPendingCount} pruebas`, 'success');
  };

  // Discard all pending changes
  const handleDiscardAll = () => {
    setPendingChanges({});
    showNotification('Se han descartado todos los cambios no guardados', 'info');
  };

  // Filtered & Sorted tests
  const filteredAndSortedTests = useMemo(() => {
    return catalogTests
      .filter(test => {
        const effective = getEffectiveTest(test);
        const matchesCat = selectedCategory === 'all' || effective.category === selectedCategory;
        const matchesQuery =
          effective.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          effective.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (effective.description && effective.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (effective.unit && effective.unit.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (effective.referenceRange && effective.referenceRange.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (effective.sampleType && effective.sampleType.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesType = resultTypeFilter === 'all' || effective.resultType === resultTypeFilter;

        let matchesStatus = true;
        if (statusFilter === 'missing_range') {
          matchesStatus = !effective.referenceRange || effective.referenceRange.trim() === '';
        } else if (statusFilter === 'missing_unit') {
          matchesStatus = effective.resultType === 'Numérico' && (!effective.unit || effective.unit.trim() === '');
        } else if (statusFilter === 'has_changes') {
          matchesStatus = hasChanges(test.id);
        } else if (statusFilter === 'priced') {
          matchesStatus = effective.price > 0;
        } else if (statusFilter === 'free') {
          matchesStatus = effective.price === 0;
        }

        return matchesCat && matchesQuery && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        const effA = getEffectiveTest(a);
        const effB = getEffectiveTest(b);

        let valA: any = effA[sortField] || '';
        let valB: any = effB[sortField] || '';

        if (sortField === 'price') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [catalogTests, pendingChanges, selectedCategory, searchQuery, resultTypeFilter, statusFilter, sortField, sortDirection]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = catalogTests.length;
    const withRange = catalogTests.filter(t => {
      const eff = getEffectiveTest(t);
      return eff.referenceRange && eff.referenceRange.trim() !== '';
    }).length;
    const withUnit = catalogTests.filter(t => {
      const eff = getEffectiveTest(t);
      return eff.unit && eff.unit.trim() !== '';
    }).length;
    const priced = catalogTests.filter(t => getEffectiveTest(t).price > 0).length;
    const coveragePercent = total > 0 ? Math.round((withRange / total) * 100) : 0;
    return { total, withRange, withUnit, priced, coveragePercent };
  }, [catalogTests, pendingChanges]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedRowIds.size === filteredAndSortedTests.length) {
      setSelectedRowIds(new Set());
    } else {
      const allIds = new Set(filteredAndSortedTests.map(t => t.id));
      setSelectedRowIds(allIds);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectMissingRanges = () => {
    const missing = filteredAndSortedTests
      .filter(t => {
        const eff = getEffectiveTest(t);
        return !eff.referenceRange || eff.referenceRange.trim() === '';
      })
      .map(t => t.id);
    
    setSelectedRowIds(new Set(missing));
    showNotification(`${missing.length} pruebas sin rango de referencia seleccionadas`, 'info');
  };

  // Sorting helper
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Apply Bulk Updates
  const handleApplyBulkChanges = () => {
    if (selectedRowIds.size === 0) {
      showNotification('Seleccione al menos una prueba para aplicar cambios en lote', 'warning');
      return;
    }

    const targetIds: string[] = Array.from(selectedRowIds);
    const newPending: Record<string, Partial<LabCatalogItem>> = { ...pendingChanges };

    targetIds.forEach((id: string) => {
      const current = newPending[id] || {};
      const original = catalogTests.find(t => t.id === id);
      if (!original) return;

      if (bulkActionType === 'range') {
        current.referenceRange = bulkRangeValue;
        if (bulkUnitValue) {
          current.unit = bulkUnitValue;
        }
      } else if (bulkActionType === 'unit') {
        current.unit = bulkUnitValue;
      } else if (bulkActionType === 'sample') {
        current.sampleType = bulkSampleValue;
      } else if (bulkActionType === 'category') {
        current.category = bulkCategoryValue;
        const meta = categoryMap.get(bulkCategoryValue);
        if (meta) current.categoryName = meta.name;
      } else if (bulkActionType === 'type') {
        current.resultType = bulkTypeValue;
      } else if (bulkActionType === 'price') {
        let newPrice = original.price;
        if (bulkPriceAdjustment.mode === 'percent') {
          newPrice = Math.round(original.price * (1 + bulkPriceAdjustment.value / 100));
        } else if (bulkPriceAdjustment.mode === 'fixed_add') {
          newPrice = Math.max(0, original.price + bulkPriceAdjustment.value);
        } else if (bulkPriceAdjustment.mode === 'flat') {
          newPrice = Math.max(0, bulkPriceAdjustment.value);
        }
        current.price = newPrice;
        current.priceFormatted = `Q${newPrice}`;
      }

      newPending[id] = current;
    });

    setPendingChanges(newPending);
    setShowBulkModal(false);
    showNotification(
      `Se aplicaron cambios masivos a ${targetIds.length} pruebas seleccionadas. Recuerde hacer clic en "Guardar Cambios".`,
      'success'
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Stats & Progress */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-5 text-white border border-teal-800/40 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Datagrid Clínico & Edición Masiva de Pruebas
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-400/30">
                Edición en Celda
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Edite valores de referencia, unidades, tarifas en Quetzales y condiciones analíticas directamente en la cuadrícula. Seleccione múltiples filas para aplicar ajustes en lote simultáneamente.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Pruebas</span>
              <span className="font-bold text-sm text-white font-mono">{stats.total}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Con Rangos</span>
              <span className="font-bold text-sm text-teal-300 font-mono">
                {stats.withRange} <span className="text-[10px] text-teal-400/80">({stats.coveragePercent}%)</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Con Unidades</span>
              <span className="font-bold text-sm text-cyan-300 font-mono">{stats.withUnit}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tarifadas (&gt;Q0)</span>
              <span className="font-bold text-sm text-amber-300 font-mono">{stats.priced}</span>
            </div>
          </div>
        </div>

        {/* Pending Changes Action Bar (Prominent when edits exist) */}
        {totalPendingCount > 0 && (
          <div className="mt-4 pt-3 border-t border-teal-800/40 flex flex-wrap items-center justify-between gap-3 bg-teal-950/60 p-3 rounded-xl border border-teal-500/30 animate-pulse">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-teal-100">
                Hay <span className="font-bold text-amber-300 font-mono text-sm">{totalPendingCount}</span> pruebas con modificaciones pendientes de guardar en el catálogo.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDiscardAll}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-600 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Descartar Cambios
              </button>
              <button
                onClick={handleSaveAllPending}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Guardar Todos los Cambios ({totalPendingCount})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Specialty Filter Pills */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-teal-600" />
            Filtro por Especialidad / Categoría Oficial
          </span>
          <span className="font-mono">{filteredAndSortedTests.length} pruebas en vista</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Todas</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-200 dark:bg-slate-200 dark:text-slate-800 text-[10px]">
              {catalogTests.length}
            </span>
          </button>

          {CATALOG_CATEGORIES_META.map(cat => {
            const count = catalogTests.filter(t => t.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {renderCategoryIcon(cat.id)}
                <span>{cat.shortName}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isSelected ? 'bg-teal-700 text-teal-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and Secondary Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar prueba, código, rango, unidad, muestra..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="md:col-span-4">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Filtro Estado: Todos los Registros</option>
              <option value="missing_range">⚠️ Requieren Rango de Referencia (Sin definir)</option>
              <option value="missing_unit">⚠️ Requieren Unidad de Medida (Numéricas)</option>
              <option value="has_changes">📝 Con Cambios Pendientes de Guardar</option>
              <option value="priced">💲 Con Tarifa Individual (&gt; Q0)</option>
              <option value="free">🆓 Incluidas en Baterías (Q0)</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={resultTypeFilter}
              onChange={e => setResultTypeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Tipo: Todos</option>
              <option value="Numérico">Numérico</option>
              <option value="Texto">Texto</option>
              <option value="Opciones">Opciones</option>
            </select>

            <button
              onClick={() => setShowOptionalColumns(!showOptionalColumns)}
              title={showOptionalColumns ? 'Ocultar columnas secundarias' : 'Mostrar todas las columnas'}
              className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1 ${
                showOptionalColumns
                  ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Selection Bulk Action Toolbar (Sticky / Visible when rows are selected) */}
      {selectedRowIds.size > 0 && (
        <div className="bg-indigo-900 text-white rounded-2xl p-4 shadow-xl border border-indigo-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-700 rounded-lg text-xs font-bold font-mono">
              {selectedRowIds.size} de {filteredAndSortedTests.length} seleccionadas
            </span>
            <span className="text-xs text-indigo-200 hidden sm:inline">
              Acciones por lote para múltiples pruebas:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setBulkActionType('range');
                setBulkRangeValue('');
                setBulkUnitValue('');
                setShowBulkModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Asignar Rango en Lote
            </button>

            <button
              onClick={() => {
                setBulkActionType('unit');
                setBulkUnitValue('');
                setShowBulkModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Tag className="w-3.5 h-3.5" />
              Asignar Unidad
            </button>

            <button
              onClick={() => {
                setBulkActionType('price');
                setShowBulkModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Percent className="w-3.5 h-3.5" />
              Ajustar Tarifas (Q)
            </button>

            <button
              onClick={() => {
                setBulkActionType('sample');
                setShowBulkModal(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Tipo de Muestra
            </button>

            <button
              onClick={() => setSelectedRowIds(new Set())}
              className="px-2.5 py-1.5 bg-indigo-800 hover:bg-indigo-700 text-indigo-200 text-xs font-medium rounded-xl transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Desmarcar
            </button>
          </div>
        </div>
      )}

      {/* Datagrid Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse select-none">
            {/* Sticky Header */}
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-[11px] shadow-sm border-b border-slate-200 dark:border-slate-700">
              <tr>
                {/* Selection Checkbox */}
                <th className="py-3 px-3 w-10 text-center bg-slate-100 dark:bg-slate-800">
                  <button
                    onClick={handleToggleSelectAll}
                    title="Seleccionar todas las visibles"
                    className="text-slate-600 dark:text-slate-300 hover:text-teal-600"
                  >
                    {selectedRowIds.size > 0 && selectedRowIds.size === filteredAndSortedTests.length ? (
                      <CheckSquare className="w-4 h-4 text-teal-600" />
                    ) : selectedRowIds.size > 0 ? (
                      <div className="w-4 h-4 bg-teal-600 rounded flex items-center justify-center text-white text-[9px] font-bold">
                        -
                      </div>
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>

                {/* Code Column */}
                <th
                  onClick={() => handleSort('code')}
                  className="py-3 px-3 w-24 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Código</span>
                    {sortField === 'code' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-teal-600" /> : <ChevronDown className="w-3 h-3 text-teal-600" />
                    )}
                  </div>
                </th>

                {/* Test Name Column */}
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-3 min-w-[200px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Nombre de la Prueba</span>
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-teal-600" /> : <ChevronDown className="w-3 h-3 text-teal-600" />
                    )}
                  </div>
                </th>

                {/* Category Column */}
                <th
                  onClick={() => handleSort('category')}
                  className="py-3 px-3 min-w-[150px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Especialidad / Categoría</span>
                    {sortField === 'category' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-teal-600" /> : <ChevronDown className="w-3 h-3 text-teal-600" />
                    )}
                  </div>
                </th>

                {/* Result Type Column */}
                <th className="py-3 px-3 w-28">
                  <span>Tipo</span>
                </th>

                {/* Reference Range (CORE FEATURE) */}
                <th
                  onClick={() => handleSort('referenceRange')}
                  className="py-3 px-3 min-w-[210px] cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors bg-teal-50/50 dark:bg-teal-950/20"
                >
                  <div className="flex items-center gap-1 text-teal-800 dark:text-teal-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Rango de Referencia Normal</span>
                    {sortField === 'referenceRange' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>

                {/* Unit Column */}
                <th
                  onClick={() => handleSort('unit')}
                  className="py-3 px-3 w-28 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Unidad</span>
                    {sortField === 'unit' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-teal-600" /> : <ChevronDown className="w-3 h-3 text-teal-600" />
                    )}
                  </div>
                </th>

                {/* Price (Q) Column */}
                <th
                  onClick={() => handleSort('price')}
                  className="py-3 px-3 w-28 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1 text-teal-700 dark:text-teal-400">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Tarifa (Q)</span>
                    {sortField === 'price' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>

                {/* Optional Sample Type Column */}
                {showOptionalColumns && (
                  <th className="py-3 px-3 min-w-[150px]">
                    <span>Tipo de Muestra</span>
                  </th>
                )}

                {/* Actions / Save Column */}
                <th className="py-3 px-3 w-28 text-center bg-slate-100 dark:bg-slate-800">
                  <span>Acciones</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAndSortedTests.length === 0 ? (
                <tr>
                  <td colSpan={showOptionalColumns ? 10 : 9} className="py-16 text-center text-slate-400">
                    <FlaskConical className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400 text-sm">
                      No se encontraron pruebas que coincidan con los filtros aplicados
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setStatusFilter('all');
                        setResultTypeFilter('all');
                      }}
                      className="mt-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 rounded-lg text-xs font-semibold hover:bg-teal-100"
                    >
                      Restablecer todos los filtros
                    </button>
                  </td>
                </tr>
              ) : (
                filteredAndSortedTests.map((test, index) => {
                  const effective = getEffectiveTest(test);
                  const isModified = hasChanges(test.id);
                  const isSelected = selectedRowIds.has(test.id);
                  const catMeta = categoryMap.get(effective.category);
                  const isNumeric = effective.resultType === 'Numérico';
                  const isMissingRange = isNumeric && (!effective.referenceRange || effective.referenceRange.trim() === '');
                  const isMissingUnit = isNumeric && (!effective.unit || effective.unit.trim() === '');

                  return (
                    <tr
                      key={test.id}
                      className={`transition-colors group ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                          : isModified
                          ? 'bg-amber-50/50 dark:bg-amber-950/20'
                          : index % 2 === 0
                          ? 'bg-white dark:bg-slate-900'
                          : 'bg-slate-50/50 dark:bg-slate-800/30'
                      } hover:bg-teal-50/40 dark:hover:bg-slate-800/60`}
                    >
                      {/* Select Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(test.id)}
                          className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>

                      {/* Code Cell (Editable) */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={effective.code || ''}
                          onChange={e => handleCellChange(test.id, 'code', e.target.value)}
                          className="w-full px-2 py-1 font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-teal-500 rounded focus:outline-none transition-all"
                          placeholder="Código"
                        />
                      </td>

                      {/* Name Cell (Editable) */}
                      <td className="py-2 px-2">
                        <div className="relative">
                          <input
                            type="text"
                            value={effective.name}
                            onChange={e => handleCellChange(test.id, 'name', e.target.value)}
                            className="w-full px-2 py-1 font-semibold text-slate-900 dark:text-slate-100 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-teal-500 rounded focus:outline-none transition-all"
                            placeholder="Nombre de la prueba"
                          />
                          {test.isProfile && (
                            <span className="absolute right-1 top-1/2 -translate-y-1/2 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 pointer-events-none">
                              Panel
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category Cell (Dropdown) */}
                      <td className="py-2 px-2">
                        <select
                          value={effective.category}
                          onChange={e => handleCellChange(test.id, 'category', e.target.value as LabCatalogCategory)}
                          className={`w-full py-1 px-1.5 text-xs font-semibold rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-teal-500 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer`}
                        >
                          {CATALOG_CATEGORIES_META.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.shortName}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Result Type Cell (Dropdown) */}
                      <td className="py-2 px-2">
                        <select
                          value={effective.resultType}
                          onChange={e => handleCellChange(test.id, 'resultType', e.target.value as LabResultType)}
                          className="w-full py-1 px-1.5 text-xs rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-teal-500 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="Numérico">Numérico</option>
                          <option value="Texto">Texto</option>
                          <option value="Opciones">Opciones</option>
                        </select>
                      </td>

                      {/* Reference Range Cell (INLINE EDITABLE + PRESETS) */}
                      <td className={`py-2 px-2 relative ${isMissingRange ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''}`}>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={effective.referenceRange || ''}
                            onChange={e => handleCellChange(test.id, 'referenceRange', e.target.value)}
                            placeholder={isNumeric ? 'Ej. 70 - 100 o < 200' : 'Ej. Negativo o No Reactivo'}
                            className={`w-full px-2 py-1 font-mono text-xs font-bold rounded focus:outline-none transition-all ${
                              isMissingRange
                                ? 'bg-white dark:bg-slate-800 border-2 border-amber-400 text-amber-900 dark:text-amber-200 placeholder-amber-400'
                                : 'bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent hover:border-teal-300 dark:hover:border-teal-700 focus:border-teal-500 text-teal-900 dark:text-teal-200'
                            }`}
                          />
                          
                          {/* Quick Preset Selector Button */}
                          <button
                            type="button"
                            onClick={() => setActivePresetPopoverId(activePresetPopoverId === test.id ? null : test.id)}
                            title="Seleccionar rango de referencia predefinido"
                            className="p-1 rounded bg-slate-100 hover:bg-teal-100 text-slate-500 hover:text-teal-700 dark:bg-slate-800 dark:hover:bg-teal-950/80 dark:text-slate-400 shrink-0 transition-colors"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Preset Quick Menu Popover */}
                        {activePresetPopoverId === test.id && (
                          <div className="absolute left-2 top-full mt-1 z-30 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 text-xs space-y-1.5 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
                              <span className="flex items-center gap-1 text-[11px]">
                                <Sparkles className="w-3 h-3 text-teal-600" />
                                Rangos Clínicos Frecuentes
                              </span>
                              <button
                                onClick={() => setActivePresetPopoverId(null)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                              {COMMON_RANGE_PRESETS.map((preset, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => {
                                    handleCellChange(test.id, 'referenceRange', preset.value);
                                    if (preset.unit) {
                                      handleCellChange(test.id, 'unit', preset.unit);
                                    }
                                    setActivePresetPopoverId(null);
                                  }}
                                  className="w-full text-left p-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/60 text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors"
                                >
                                  <span className="font-medium text-[11px] truncate">{preset.label}</span>
                                  <span className="font-mono font-bold text-teal-600 text-[10px] shrink-0 ml-1">
                                    [{preset.value}]
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Unit Cell (Editable + Quick Suggestions) */}
                      <td className={`py-2 px-2 relative ${isMissingUnit ? 'bg-amber-50/70 dark:bg-amber-950/30' : ''}`}>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={effective.unit || ''}
                            onChange={e => handleCellChange(test.id, 'unit', e.target.value)}
                            placeholder={isNumeric ? 'mg/dL' : '-'}
                            className={`w-full px-2 py-1 font-mono text-xs font-semibold rounded focus:outline-none transition-all ${
                              isMissingUnit
                                ? 'bg-white dark:bg-slate-800 border border-amber-400 text-amber-900 placeholder-amber-400'
                                : 'bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-teal-500 text-slate-800 dark:text-slate-200'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setActiveUnitPopoverId(activeUnitPopoverId === test.id ? null : test.id)}
                            title="Seleccionar unidad sugerida"
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 shrink-0 text-[10px] font-mono"
                          >
                            ▾
                          </button>
                        </div>

                        {/* Unit Suggestions Popover */}
                        {activeUnitPopoverId === test.id && (
                          <div className="absolute left-0 top-full mt-1 z-30 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 text-xs animate-in fade-in duration-150">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 text-[10px]">
                              <span>Unidades Comunes</span>
                              <button onClick={() => setActiveUnitPopoverId(null)}>
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-1 pt-1 max-h-36 overflow-y-auto">
                              {COMMON_UNITS.map((u, uIdx) => (
                                <button
                                  key={uIdx}
                                  type="button"
                                  onClick={() => {
                                    handleCellChange(test.id, 'unit', u);
                                    setActiveUnitPopoverId(null);
                                  }}
                                  className="px-2 py-1 text-left rounded hover:bg-teal-50 dark:hover:bg-teal-950/60 font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  {u}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Price Cell (Editable Numeric) */}
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[11px] font-bold text-slate-400">Q</span>
                          <input
                            type="number"
                            min="0"
                            value={effective.price}
                            onChange={e => handleCellChange(test.id, 'price', Number(e.target.value))}
                            className="w-16 px-1.5 py-1 text-right font-mono font-bold text-xs text-teal-700 dark:text-teal-300 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent hover:border-teal-300 dark:hover:border-teal-700 focus:border-teal-500 rounded focus:outline-none transition-all"
                          />
                        </div>
                      </td>

                      {/* Optional Sample Type Cell */}
                      {showOptionalColumns && (
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={effective.sampleType || ''}
                            onChange={e => handleCellChange(test.id, 'sampleType', e.target.value)}
                            placeholder="Suero, Plasma, etc."
                            className="w-full px-2 py-1 text-xs text-slate-600 dark:text-slate-400 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-teal-500 rounded focus:outline-none transition-all"
                          />
                        </td>
                      )}

                      {/* Row Actions */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isModified ? (
                            <>
                              <button
                                onClick={() => handleSaveRow(test.id)}
                                title="Guardar cambios de esta prueba"
                                className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-sm transition-transform active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRevertRow(test.id)}
                                title="Descartar cambios"
                                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 rounded-md transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onViewDetails(effective)}
                                title="Ver Ficha Técnica Completa"
                                className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/60 rounded-md transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {!test.isFactory && (
                                <button
                                  onClick={() => onDeleteTest(test.id)}
                                  title="Eliminar prueba personalizada"
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Datagrid Footer Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>
              Mostrando <strong className="text-slate-700 dark:text-slate-300 font-mono">{filteredAndSortedTests.length}</strong> de <strong className="text-slate-700 dark:text-slate-300 font-mono">{catalogTests.length}</strong> pruebas
            </span>
            {selectedRowIds.size > 0 && (
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                • {selectedRowIds.size} seleccionadas
              </span>
            )}
            {totalPendingCount > 0 && (
              <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                • {totalPendingCount} con cambios pendientes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectMissingRanges}
              className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded-lg hover:bg-amber-100 text-[11px] font-semibold transition-colors flex items-center gap-1"
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Seleccionar pruebas sin rango
            </button>

            {totalPendingCount > 0 && (
              <button
                onClick={handleSaveAllPending}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow transition-colors flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar Todos ({totalPendingCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: BULK EDIT / ASIGNACIÓN MASIVA */}
      {/* ========================================================================= */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-indigo-600" />
                  Actualización Masiva ({selectedRowIds.size} Pruebas)
                </h3>
                <p className="text-xs text-slate-500">
                  Aplique el mismo valor simultáneamente a todas las pruebas seleccionadas
                </p>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBulkActionType('range')}
                className={`p-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                  bulkActionType === 'range'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Rango</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkActionType('unit')}
                className={`p-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                  bulkActionType === 'unit'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Unidad</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkActionType('price')}
                className={`p-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                  bulkActionType === 'price'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Percent className="w-4 h-4" />
                <span>Tarifas (Q)</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkActionType('sample')}
                className={`p-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                  bulkActionType === 'sample'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                <span>Muestra</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkActionType('category')}
                className={`p-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                  bulkActionType === 'category'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Categoría</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkActionType('type')}
                className={`p-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                  bulkActionType === 'type'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-200 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Tag className="w-4 h-4" />
                <span>Tipo Res.</span>
              </button>
            </div>

            {/* Form Fields by Action Type */}
            <div className="space-y-3 pt-2 text-sm">
              {bulkActionType === 'range' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Rango de Referencia a Asignar *
                    </label>
                    <input
                      type="text"
                      value={bulkRangeValue}
                      onChange={e => setBulkRangeValue(e.target.value)}
                      placeholder="Ej. Negativo, No Reactivo, 70 - 100, < 200, etc."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Unidad de Medida (Opcional)
                    </label>
                    <input
                      type="text"
                      value={bulkUnitValue}
                      onChange={e => setBulkUnitValue(e.target.value)}
                      placeholder="mg/dL, %, ng/mL, etc."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Plantillas Frecuentes:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Negativo', 'No Reactivo', '< 0.90', 'Normal: 0 - 1.0', '< 200', '70 - 100'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setBulkRangeValue(val)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {bulkActionType === 'unit' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Unidad de Medida a Asignar *
                    </label>
                    <input
                      type="text"
                      value={bulkUnitValue}
                      onChange={e => setBulkUnitValue(e.target.value)}
                      placeholder="Ej. mg/dL, U/L, ng/mL, %"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Unidades Comunes:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_UNITS.slice(0, 10).map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setBulkUnitValue(u)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-mono"
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {bulkActionType === 'price' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Ajuste Tarifario *
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setBulkPriceAdjustment({ ...bulkPriceAdjustment, mode: 'percent' })}
                        className={`p-2 rounded-xl text-xs font-semibold border ${
                          bulkPriceAdjustment.mode === 'percent'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        % Porcentaje
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkPriceAdjustment({ ...bulkPriceAdjustment, mode: 'fixed_add' })}
                        className={`p-2 rounded-xl text-xs font-semibold border ${
                          bulkPriceAdjustment.mode === 'fixed_add'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        +Q Monto Fijo
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkPriceAdjustment({ ...bulkPriceAdjustment, mode: 'flat' })}
                        className={`p-2 rounded-xl text-xs font-semibold border ${
                          bulkPriceAdjustment.mode === 'flat'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        Tarifa Fija (Q)
                      </button>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                        {bulkPriceAdjustment.mode === 'percent' ? '%' : 'Q'}
                      </span>
                      <input
                        type="number"
                        value={bulkPriceAdjustment.value}
                        onChange={e => setBulkPriceAdjustment({ ...bulkPriceAdjustment, value: Number(e.target.value) })}
                        placeholder={bulkPriceAdjustment.mode === 'percent' ? 'Ej. 10 para +10%' : 'Ej. 25'}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-base"
                      />
                    </div>
                  </div>
                </div>
              )}

              {bulkActionType === 'sample' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Muestra a Asignar *
                    </label>
                    <select
                      value={bulkSampleValue}
                      onChange={e => setBulkSampleValue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      {COMMON_SAMPLE_TYPES.map((s, idx) => (
                        <option key={idx} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {bulkActionType === 'category' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Nueva Categoría Oficial *
                    </label>
                    <select
                      value={bulkCategoryValue}
                      onChange={e => setBulkCategoryValue(e.target.value as LabCatalogCategory)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      {CATALOG_CATEGORIES_META.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {bulkActionType === 'type' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Resultado *
                    </label>
                    <select
                      value={bulkTypeValue}
                      onChange={e => setBulkTypeValue(e.target.value as LabResultType)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Numérico">Numérico</option>
                      <option value="Texto">Texto</option>
                      <option value="Opciones">Opciones</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyBulkChanges}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Aplicar a {selectedRowIds.size} Pruebas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
