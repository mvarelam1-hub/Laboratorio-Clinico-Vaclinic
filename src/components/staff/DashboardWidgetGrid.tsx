import React, { useState, useEffect, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Sliders, 
  RotateCcw, 
  ChevronUp, 
  ChevronDown, 
  BarChart3, 
  AlertTriangle, 
  Cpu, 
  Clock, 
  Layers, 
  ShieldCheck, 
  Check, 
  X, 
  Activity, 
  ArrowUpRight, 
  TrendingUp, 
  FlaskConical, 
  CheckCircle2, 
  Users, 
  Maximize2, 
  Minimize2, 
  ArrowLeft, 
  ArrowRight,
  Zap,
  Info,
  Calendar,
  Sparkles,
  ExternalLink,
  PackagePlus,
  PackageMinus
} from 'lucide-react';

export type WidgetId = 
  | 'daily_volume' 
  | 'urgent_samples' 
  | 'equipment_status' 
  | 'tat_performance' 
  | 'traceability_4d' 
  | 'quality_control'
  | 'reagents_stock_alert';

export interface WidgetConfig {
  id: WidgetId;
  title: string;
  category: string;
  description: string;
  isVisible: boolean;
  isCollapsed: boolean;
  colSpan: 'single' | 'double' | 'full';
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: 'reagents_stock_alert',
    title: 'Monitoreo de Reactivos & Stock Crítico',
    category: 'Cadena de Suministro',
    description: 'Alertas tempranas de desabastecimiento cuando los reactivos clínicos alcanzan o perforan el umbral mínimo.',
    isVisible: true,
    isCollapsed: false,
    colSpan: 'single'
  },
  {
    id: 'urgent_samples',
    title: 'Muestras Urgentes & STAT Pánico',
    category: 'Seguridad Clínica',
    description: 'Monitoreo en tiempo real de muestras críticas que requieren atención inmediata.',
    isVisible: true,
    isCollapsed: false,
    colSpan: 'single'
  },
  {
    id: 'daily_volume',
    title: 'Volumen Diario de Muestras',
    category: 'Operaciones & Capacidad',
    description: 'Conteo y tendencia de órdenes registradas hoy frente a metas y distribución por área.',
    isVisible: true,
    isCollapsed: false,
    colSpan: 'single'
  },
  {
    id: 'equipment_status',
    title: 'Estado de Analizadores & Equipos LIS',
    category: 'Instrumentación Analítica',
    description: 'Telemetría y disponibilidad de autoanalizadores de hematología, química e inmunoquímica.',
    isVisible: true,
    isCollapsed: false,
    colSpan: 'single'
  },
  {
    id: 'tat_performance',
    title: 'Cumplimiento de Tiempos TAT (SLA)',
    category: 'Calidad de Servicio',
    description: 'Tiempos de entrega promedio por disciplina médica vs meta institucional.',
    isVisible: true,
    isCollapsed: false,
    colSpan: 'single'
  },
  {
    id: 'traceability_4d',
    title: 'Flujo de Trabajo LABVACLINIC (Pipeline de Muestras)',
    category: 'Trazabilidad',
    description: 'Supervisión de tubos a través de Admisión, Flebotomía, Analizadores y Validación.',
    isVisible: true,
    isCollapsed: false,
    colSpan: 'single'
  },
  {
    id: 'quality_control',
    title: 'Control de Calidad Analítico (Westgard & QC)',
    category: 'Garantía Analítica',
    description: 'Calibraciones diarias, corridas de control bi-nivel y cumplimiento ISO 15189.',
    isVisible: true,
    isCollapsed: false,
    colSpan: 'single'
  }
];

const LOCAL_STORAGE_KEY = 'vaclinic_staff_dashboard_widgets_v2';

export const DashboardWidgetGrid: React.FC = () => {
  const { 
    reports, 
    episodes, 
    patients, 
    branches, 
    currentBranch, 
    setStaffActiveTab,
    showNotification,
    reagents,
    criticalReagents,
    lowStockReagents,
    reagentsBelowMinThreshold,
    quickRestockReagent,
    simulateReagentConsumption,
    restockAllCriticalReagents,
    navigateToInventory
  } = useClinic();

  // Widget layout state with local storage persistence
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with default to guarantee all ids exist
          const merged = DEFAULT_WIDGETS.map(def => {
            const found = parsed.find((p: WidgetConfig) => p.id === def.id);
            return found ? { ...def, ...found } : def;
          });
          // Order based on saved array
          const ordered = [...parsed.filter((p: WidgetConfig) => DEFAULT_WIDGETS.some(d => d.id === p.id))];
          DEFAULT_WIDGETS.forEach(def => {
            if (!ordered.some(o => o.id === def.id)) {
              ordered.push(def);
            }
          });
          return ordered;
        }
      }
    } catch (e) {
      console.error('Error loading widget config:', e);
    }
    return DEFAULT_WIDGETS;
  });

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<WidgetId | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<WidgetId | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(widgets));
    } catch (e) {
      console.error('Error saving widget config:', e);
    }
  }, [widgets]);

  // Toggle visibility of a specific widget
  const handleToggleVisibility = (id: WidgetId) => {
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, isVisible: !w.isVisible } : w))
    );
  };

  // Toggle collapse state of a specific widget
  const handleToggleCollapse = (id: WidgetId) => {
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, isCollapsed: !w.isCollapsed } : w))
    );
  };

  // Reset to default layout
  const handleResetToDefault = () => {
    setWidgets(DEFAULT_WIDGETS);
    showNotification('Diseño de widgets restablecido a valores predeterminados', 'info');
  };

  // Show all widgets
  const handleShowAll = () => {
    setWidgets(prev => prev.map(w => ({ ...w, isVisible: true })));
    showNotification('Todos los widgets activados', 'success');
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: WidgetId) => {
    setDraggedWidgetId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: WidgetId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDragLeave = () => {
    // Keep clean
  };

  const handleDrop = (e: React.DragEvent, targetId: WidgetId) => {
    e.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === targetId) {
      setDraggedWidgetId(null);
      setDragOverWidgetId(null);
      return;
    }

    setWidgets(prev => {
      const fromIndex = prev.findIndex(w => w.id === draggedWidgetId);
      const toIndex = prev.findIndex(w => w.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const updated = [...prev];
      const [movedItem] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedItem);
      return updated;
    });

    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  // Accessible move up/down/left/right buttons
  const handleMoveWidget = (id: WidgetId, direction: 'prev' | 'next') => {
    setWidgets(prev => {
      const index = prev.findIndex(w => w.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === 'prev' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  // Metric Computations
  const branchEpisodes = useMemo(() => {
    if (currentBranch === 'central') return episodes;
    return episodes.filter(e => e.branchId === currentBranch);
  }, [episodes, currentBranch]);

  // Urgent & Panic Samples
  const urgentSamples = useMemo(() => {
    return branchEpisodes.filter(e => 
      e.priority === 'stat_panico' || e.priority === 'urgente'
    );
  }, [branchEpisodes]);

  const panicCount = urgentSamples.filter(e => e.priority === 'stat_panico').length;
  const urgentCount = urgentSamples.filter(e => e.priority === 'urgente').length;

  // 4D Dimension counts
  const d1Count = branchEpisodes.filter(e => e.currentDimension === 'D1_admision').length;
  const d2Count = branchEpisodes.filter(e => e.currentDimension === 'D2_flebotomia').length;
  const d3Count = branchEpisodes.filter(e => e.currentDimension === 'D3_analizadores').length;
  const d4Count = branchEpisodes.filter(e => e.currentDimension === 'D4_validacion').length;
  const totalInPipeline = d1Count + d2Count + d3Count + d4Count;

  // Daily volume statistics
  const todayCount = 142 + reports.length;
  const dailyTarget = 160;
  const volumePercentage = Math.min(100, Math.round((todayCount / dailyTarget) * 100));

  // Visible widgets list
  const visibleWidgets = widgets.filter(w => w.isVisible);
  const hiddenCount = widgets.length - visibleWidgets.length;

  /* ========================================================================== */
  /* INDIVIDUAL WIDGET RENDERERS                                                */
  /* ========================================================================== */

  // 1. WIDGET: Urgent & Panic Samples
  const renderUrgentSamplesWidget = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">STAT / Pánico</span>
            </div>
            <div className="text-xl font-black text-rose-900 mt-0.5">{panicCount || 2}</div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 border border-rose-300">
            &lt; 15 min
          </span>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Urgentes</span>
            </div>
            <div className="text-xl font-black text-amber-900 mt-0.5">{urgentCount || 5}</div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 border border-amber-300">
            &lt; 30 min
          </span>
        </div>
      </div>

      {/* Critical Sample Queue preview */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-700 block">Cola Prioritaria Activa:</span>
        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
          {urgentSamples.slice(0, 3).map((s, idx) => (
            <div key={s.id || idx} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <div className="font-bold text-slate-800 truncate flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.priority === 'stat_panico' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <span className="truncate">{s.patientName}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {s.episodeNumber} &middot; {s.currentDimension.replace('D3_analizadores', 'En Analizador').replace('D2_flebotomia', 'Flebotomía')}
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 whitespace-nowrap">
                {idx === 0 ? '8 min rest' : '14 min rest'}
              </span>
            </div>
          ))}
          {urgentSamples.length === 0 && (
            <div className="p-3 bg-slate-50 text-center rounded-lg border border-slate-200 text-xs text-slate-500">
              ✓ No hay alertas STAT críticas pendientes en este momento
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setStaffActiveTab('episodios')}
        className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
      >
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Abrir Centro de Mando LABVACLINIC</span>
      </button>
    </div>
  );

  // 2. WIDGET: Daily Volume
  const renderDailyVolumeWidget = () => (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Muestras Hoy</span>
          <div className="text-2xl font-black text-slate-900 flex items-baseline gap-2">
            <span>{todayCount}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +14.2%
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 block">Meta Diaria</span>
          <span className="text-xs font-mono font-bold text-slate-700">{todayCount} / {dailyTarget}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${volumePercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>Capacidad operativa</span>
          <span className="font-bold text-teal-700">{volumePercentage}% alcanzado</span>
        </div>
      </div>

      {/* Hourly mini bars */}
      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
        <span className="text-[10px] font-bold text-slate-600 block mb-1.5">Distribución por Horario:</span>
        <div className="flex items-end justify-between gap-1 h-12 pt-1 px-1">
          {[
            { hour: '07h', val: 18, pct: 40 },
            { hour: '09h', val: 42, pct: 95 },
            { hour: '11h', val: 34, pct: 75 },
            { hour: '13h', val: 20, pct: 45 },
            { hour: '15h', val: 28, pct: 60 },
            { hour: '17h', val: 14, pct: 30 },
          ].map((bar, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className={`w-full rounded-t-sm transition-all ${i === 1 ? 'bg-teal-600' : 'bg-slate-300'}`}
                style={{ height: `${bar.pct}%` }}
                title={`${bar.hour}: ${bar.val} muestras`}
              />
              <span className="text-[9px] font-mono text-slate-500">{bar.hour}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 3. WIDGET: Equipment & Analyzers Status
  const renderEquipmentStatusWidget = () => (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700">Analizadores Activos</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          4 / 4 Operativos
        </span>
      </div>

      <div className="space-y-1.5">
        {[
          {
            name: 'Sysmex XN-550',
            spec: 'Hematología 5-Diff',
            status: 'En Línea',
            statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
            reagent: '88% reactivo',
            qc: 'QC 07:15 OK'
          },
          {
            name: 'Mindray BS-240 / Cobas',
            spec: 'Química Sanguínea',
            status: 'Lote en Corrida',
            statusColor: 'text-cyan-700 bg-cyan-50 border-cyan-200',
            reagent: '37.1°C Óptimo',
            qc: '16 tubos'
          },
          {
            name: 'Beckman Access 2',
            spec: 'Inmunoensayo & Hormonas',
            status: 'Standby / Listo',
            statusColor: 'text-slate-700 bg-slate-100 border-slate-200',
            reagent: 'Troponina / TSH',
            qc: 'Calibrado'
          },
          {
            name: 'Bact/Alert 3D',
            spec: 'Microbiología Automatizada',
            status: 'Incubando (12)',
            statusColor: 'text-teal-700 bg-teal-50 border-teal-200',
            reagent: '0 alarmas',
            qc: 'Temp 36.5°C'
          }
        ].map((eq, i) => (
          <div key={i} className="p-2 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between text-xs transition-colors">
            <div className="truncate pr-2">
              <div className="font-bold text-slate-900 truncate">{eq.name}</div>
              <div className="text-[10px] text-slate-500">{eq.spec}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${eq.statusColor}`}>
                {eq.status}
              </span>
              <div className="text-[9px] text-slate-500 mt-0.5 font-mono">{eq.reagent}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setStaffActiveTab('analizadores')}
        className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
      >
        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        <span>Gestionar Lotes en Analizadores</span>
      </button>
    </div>
  );

  // 4. WIDGET: Turnaround Time (TAT) & SLA
  const renderTatWidget = () => (
    <div className="space-y-3">
      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TAT Promedio General</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">28.4 min</div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ✓ 98.8% en Meta
          </span>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Meta: &lt; 45 min</div>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        {[
          { area: 'STAT Pánico', actual: '11 min', target: '15 min', pct: 99 },
          { area: 'Hematología', actual: '19 min', target: '30 min', pct: 98 },
          { area: 'Química Sanguínea', actual: '31 min', target: '45 min', pct: 96 },
          { area: 'Uroanálisis & Sedimento', actual: '22 min', target: '35 min', pct: 97 },
        ].map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="font-semibold text-slate-700">{item.area}</span>
              <span className="font-mono font-bold text-slate-900">{item.actual} <span className="text-slate-400 font-normal">/ {item.target}</span></span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-teal-500 rounded-full" 
                style={{ width: `${item.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 5. WIDGET: Traceability 4D Pipeline
  const renderTraceabilityWidget = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700">Muestras en Tránsito</span>
        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {totalInPipeline || 24} órdenes
        </span>
      </div>

      {/* 4 Dimension Steps */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
          <div className="text-[10px] font-bold text-slate-500">D1</div>
          <div className="text-base font-black text-slate-900">{d1Count || 6}</div>
          <div className="text-[9px] text-slate-500 truncate">Admisión</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
          <div className="text-[10px] font-bold text-cyan-600">D2</div>
          <div className="text-base font-black text-cyan-900">{d2Count || 8}</div>
          <div className="text-[9px] text-slate-500 truncate">Flebotomía</div>
        </div>
        <div className="bg-teal-50 border border-teal-200 p-2 rounded-xl">
          <div className="text-[10px] font-bold text-teal-700">D3</div>
          <div className="text-base font-black text-teal-900">{d3Count || 7}</div>
          <div className="text-[9px] text-teal-700 truncate">Analizadores</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
          <div className="text-[10px] font-bold text-emerald-700">D4</div>
          <div className="text-base font-black text-emerald-900">{d4Count || 3}</div>
          <div className="text-[9px] text-emerald-700 truncate">Validación</div>
        </div>
      </div>

      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-600 flex-shrink-0" />
          <span className="text-[11px]">Trazabilidad código de barras activa</span>
        </div>
        <button
          onClick={() => setStaffActiveTab('episodios')}
          className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          Ver Flujo <ChevronDown className="w-3 h-3 -rotate-90" />
        </button>
      </div>
    </div>
  );

  // 6. WIDGET: Quality Control & Westgard
  const renderQualityControlWidget = () => (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-700">Auditoría QC Diaria</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
          ISO 15189:2022
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <div className="text-[10px] text-slate-500 font-medium">Controles Corridos</div>
          <div className="text-base font-black text-slate-900 mt-0.5">6 / 6 OK</div>
          <div className="text-[9px] text-emerald-600 font-bold">100% Aprobado</div>
        </div>

        <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <div className="text-[10px] text-slate-500 font-medium">Reglas Westgard</div>
          <div className="text-base font-black text-slate-900 mt-0.5">0 Críticas</div>
          <div className="text-[9px] text-slate-500">Sin violaciones 1:3s</div>
        </div>
      </div>

      <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-slate-600">Bioquímica (Cobas / BS-240):</span>
          <span className="font-bold text-emerald-700">Nivel 1 & 2 Válido</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Hematología (Sysmex 8-Check):</span>
          <span className="font-bold text-emerald-700">En Rango (&plusmn;1.5 SD)</span>
        </div>
      </div>

      <button
        onClick={() => setStaffActiveTab('calidad_qc')}
        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-300"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
        <span>Abrir Gráficas de Levey-Jennings</span>
      </button>
    </div>
  );

  // 7. WIDGET: Reagents Continuous Stock Monitoring & Critical Alerts
  const renderReagentsStockAlertWidget = () => {
    const hasCritical = reagentsBelowMinThreshold.length > 0;

    if (!hasCritical) {
      return (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-center space-y-1">
            <div className="inline-flex p-2 rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="font-bold text-emerald-900 text-xs">Stock de Reactivos 100% Óptimo</div>
            <p className="text-[11px] text-emerald-700 leading-snug">
              Todos los reactivos analíticos operan sobre el umbral de seguridad (ISO 15189).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] text-slate-500">Insumos Monitoreados</div>
              <div className="text-base font-black text-slate-900 mt-0.5">{reagents.length}</div>
              <div className="text-[9px] text-emerald-600 font-semibold">Tiempo Real</div>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[10px] text-slate-500">Alertas de Quiebre</div>
              <div className="text-base font-black text-emerald-600 mt-0.5">0</div>
              <div className="text-[9px] text-slate-500">Sin riesgo de parada</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={navigateToInventory}
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-300"
            >
              <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
              <span>Ver Inventario</span>
            </button>

            {reagents.length > 0 && (
              <button
                onClick={() => simulateReagentConsumption(reagents[0].id, Math.max(1, reagents[0].currentStock - 4))}
                className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[10px] border border-rose-200 transition-all cursor-pointer"
                title="Probar simulación de desgaste para activar alerta visual"
              >
                Simular Consumo
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Status header badge */}
        <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5">
          <div className="p-1 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-black text-rose-950 flex items-center justify-between">
              <span>¡Alerta de Abastecimiento!</span>
              <span className="text-[10px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-extrabold">
                {criticalReagents.length} Crítico(s)
              </span>
            </div>
            <p className="text-[11px] text-rose-800 mt-0.5">
              {reagentsBelowMinThreshold.length} reactivo(s) por debajo o en su nivel de reserva mínima.
            </p>
          </div>
        </div>

        {/* Critical items mini list */}
        <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5">
          {reagentsBelowMinThreshold.map((r) => {
            const isCritical = r.currentStock <= Math.floor(r.minStockAlert * 0.5) || r.status === 'critico';
            const pct = Math.min(100, Math.round((r.currentStock / r.minStockAlert) * 100));

            return (
              <div 
                key={r.id}
                className={`p-2 rounded-xl border text-xs bg-white shadow-2xs space-y-1.5 ${
                  isCritical ? 'border-rose-300 ring-1 ring-rose-200' : 'border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 truncate max-w-[170px]" title={r.name}>
                    {r.name}
                  </span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                    isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {r.currentStock} / {r.minStockAlert} {r.unit}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isCritical ? 'bg-rose-600' : 'bg-amber-500'}`}
                    style={{ width: `${Math.max(10, pct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-0.5 text-[10px]">
                  <span className="text-slate-500 truncate max-w-[140px]">{r.associatedTests.slice(0, 2).join(', ')}</span>
                  <button
                    onClick={() => quickRestockReagent(r.id)}
                    className="text-[10px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-0.5 cursor-pointer"
                  >
                    <PackagePlus className="w-3 h-3" />
                    <span>+ Reponer</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Widget Footer Actions */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={navigateToInventory}
            className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span>Gestionar Inventario</span>
          </button>

          <button
            onClick={restockAllCriticalReagents}
            className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1 transition-all cursor-pointer border border-emerald-300"
            title="Reabastecer todos los críticos al nivel óptimo"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restock Express</span>
          </button>
        </div>
      </div>
    );
  };

  // Helper mapping widget ID to component renderer
  const renderWidgetBody = (id: WidgetId) => {
    switch (id) {
      case 'reagents_stock_alert':
        return renderReagentsStockAlertWidget();
      case 'urgent_samples':
        return renderUrgentSamplesWidget();
      case 'daily_volume':
        return renderDailyVolumeWidget();
      case 'equipment_status':
        return renderEquipmentStatusWidget();
      case 'tat_performance':
        return renderTatWidget();
      case 'traceability_4d':
        return renderTraceabilityWidget();
      case 'quality_control':
        return renderQualityControlWidget();
      default:
        return null;
    }
  };

  const getWidgetIcon = (id: WidgetId) => {
    switch (id) {
      case 'reagents_stock_alert':
        return <FlaskConical className="w-4 h-4 text-rose-600" />;
      case 'urgent_samples':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'daily_volume':
        return <BarChart3 className="w-4 h-4 text-teal-600" />;
      case 'equipment_status':
        return <Cpu className="w-4 h-4 text-cyan-600" />;
      case 'tat_performance':
        return <Clock className="w-4 h-4 text-indigo-600" />;
      case 'traceability_4d':
        return <Layers className="w-4 h-4 text-amber-600" />;
      case 'quality_control':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-4">

      {/* Widget System Admin Top Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center font-black">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 uppercase">
                Panel Modular de Métricas & Widgets LIS
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {visibleWidgets.length} de {widgets.length} activos
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Arrastra y suelta (&vellip;&vellip;) para reordenar o activa/desactiva métricas clave
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hiddenCount > 0 && (
            <button
              onClick={handleShowAll}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
              title="Mostrar todos los widgets ocultos"
            >
              <Eye className="w-3.5 h-3.5 text-teal-600" />
              <span>Mostrar Ocultos ({hiddenCount})</span>
            </button>
          )}

          <button
            onClick={() => setIsCustomizeOpen(true)}
            id="btn-customize-widgets"
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Personalizar Widgets</span>
          </button>
        </div>
      </div>

      {/* Customize & Toggle Visibility Modal */}
      {isCustomizeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold">Personalizar Panel de Métricas</h3>
              </div>
              <button
                onClick={() => setIsCustomizeOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-slate-500">
                Selecciona qué métricas mostrar en tu pantalla principal. Los cambios se guardan automáticamente en tu navegador.
              </p>

              <div className="space-y-2">
                {widgets.map((widget, index) => (
                  <div
                    key={widget.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      widget.isVisible 
                        ? 'bg-white border-slate-200 shadow-xs' 
                        : 'bg-slate-50/70 border-dashed border-slate-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                        {getWidgetIcon(widget.id)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{widget.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">#{index + 1}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{widget.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Move controls inside modal */}
                      <div className="flex items-center gap-0.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                        <button
                          onClick={() => handleMoveWidget(widget.id, 'prev')}
                          disabled={index === 0}
                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                          title="Mover arriba"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveWidget(widget.id, 'next')}
                          disabled={index === widgets.length - 1}
                          className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
                          title="Mover abajo"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Visibility Toggle */}
                      <button
                        onClick={() => handleToggleVisibility(widget.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          widget.isVisible
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {widget.isVisible ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Oculto</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <button
                  onClick={handleResetToDefault}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Predeterminado</span>
                </button>

                <button
                  onClick={() => setIsCustomizeOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* The Draggable Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleWidgets.map((widget, index) => {
          const isDragging = draggedWidgetId === widget.id;
          const isDragOver = dragOverWidgetId === widget.id && !isDragging;

          return (
            <div
              key={widget.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, widget.id)}
              onDragEnd={handleDragEnd}
              className={`
                bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden
                ${isDragging ? 'opacity-40 scale-95 border-teal-500 border-dashed shadow-lg' : 'border-slate-200 shadow-xs hover:shadow-md'}
                ${isDragOver ? 'border-2 border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/20' : ''}
              `}
            >
              {/* Card Header (Drag Handle & Controls) */}
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
                
                {/* Left side: Drag handle + Title */}
                <div className="flex items-center gap-2 truncate">
                  <div 
                    className="cursor-grab active:cursor-grabbing p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                    title="Arrastra para reordenar"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="p-1.5 rounded-lg bg-white shadow-2xs border border-slate-200">
                    {getWidgetIcon(widget.id)}
                  </div>
                  <h3 className="text-xs font-black text-slate-900 truncate">
                    {widget.title}
                  </h3>
                </div>

                {/* Right side: Reorder arrows, collapse, hide */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Left / Right micro reorder controls */}
                  <button
                    onClick={() => handleMoveWidget(widget.id, 'prev')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                    title="Mover a la izquierda"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveWidget(widget.id, 'next')}
                    disabled={index === visibleWidgets.length - 1}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                    title="Mover a la derecha"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Collapse toggle */}
                  <button
                    onClick={() => handleToggleCollapse(widget.id)}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-800 cursor-pointer"
                    title={widget.isCollapsed ? 'Expandir widget' : 'Minimizar widget'}
                  >
                    {widget.isCollapsed ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Hide widget */}
                  <button
                    onClick={() => handleToggleVisibility(widget.id)}
                    className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-700 cursor-pointer"
                    title="Ocultar este widget"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Card Body (Collapsible) */}
              {!widget.isCollapsed && (
                <div className="p-4 flex-1">
                  {renderWidgetBody(widget.id)}
                </div>
              )}

              {/* Minimized Placeholder */}
              {widget.isCollapsed && (
                <div className="p-2 bg-slate-50 text-[11px] text-slate-400 text-center font-medium">
                  Widget minimizado &middot; Haz clic en &and; para desplegar
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Empty State when all widgets are hidden */}
      {visibleWidgets.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Sliders className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Todos los widgets están ocultos</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Has ocultado todas las métricas del panel. Puedes reactivarlas o restablecer la configuración predeterminada.
          </p>
          <button
            onClick={handleShowAll}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
          >
            Activar Todos los Widgets
          </button>
        </div>
      )}

    </div>
  );
};
