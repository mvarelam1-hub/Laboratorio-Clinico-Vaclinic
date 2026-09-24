import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  AlertTriangle, 
  AlertCircle, 
  PackageMinus, 
  PackagePlus, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  FlaskConical, 
  ArrowRight, 
  RefreshCw,
  Zap,
  CheckCircle2,
  X,
  Layers,
  ThermometerSnowflake,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

export const CriticalReagentsDashboardAlert: React.FC = () => {
  const { 
    reagents,
    criticalReagents, 
    lowStockReagents, 
    reagentsBelowMinThreshold,
    quickRestockReagent,
    simulateReagentConsumption,
    restockAllCriticalReagents,
    navigateToInventory,
    showNotification
  } = useClinic();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  // If no reagents are below minimum stock threshold, don't show the alert (or show healthy indicator when toggled)
  if (reagentsBelowMinThreshold.length === 0) {
    return null;
  }

  if (isDismissed) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-amber-900 font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Alerta de inventario minimizada: {reagentsBelowMinThreshold.length} reactivo(s) bajo el nivel mínimo</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDismissed(false)}
            className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
          >
            Ver Alerta Completa
          </button>
          <button
            onClick={navigateToInventory}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] cursor-pointer"
          >
            Ir a Inventario
          </button>
        </div>
      </div>
    );
  }

  const affectedTestsCount = Array.from(
    new Set(reagentsBelowMinThreshold.flatMap(r => r.associatedTests))
  ).length;

  return (
    <div 
      id="critical-reagents-dashboard-alert" 
      className="relative overflow-hidden rounded-2xl border-2 border-rose-400 bg-gradient-to-r from-rose-50 via-amber-50/70 to-rose-50/50 p-4 sm:p-5 shadow-md transition-all duration-300"
    >
      {/* Visual Accent Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 animate-pulse" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md">
              <AlertTriangle className="w-5 h-5 animate-bounce-short" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 border-2 border-white" />
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 border border-rose-300">
                Monitoreo Continuo de Stock LIS
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white">
                {criticalReagents.length} Críticos
              </span>
              {lowStockReagents.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white">
                  {lowStockReagents.length} Bajo Mínimo
                </span>
              )}
              <span className="text-[11px] text-slate-500 font-medium">
                &middot; {affectedTestsCount} pruebas diagnósticas comprometidas
              </span>
            </div>

            <h2 className="text-sm sm:text-base font-black text-slate-900 mt-1 flex items-center gap-2">
              <span>Alerta Visual: Reactivos Críticos Alcanzaron Niveles Mínimos</span>
            </h2>

            <p className="text-xs text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
              El módulo de inventarios detectó insumos analíticos por debajo de la reserva de seguridad (<span className="font-semibold text-slate-800">minStockAlert</span>). 
              Se requiere reposición inmediata para evitar la detención de pruebas en los autoanalizadores.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl border border-slate-200 bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            title={isExpanded ? 'Colapsar detalle' : 'Expandir detalle'}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="hidden sm:inline">Contraer</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="hidden sm:inline">Desplegar ({reagentsBelowMinThreshold.length})</span>
              </>
            )}
          </button>

          <button
            onClick={navigateToInventory}
            id="btn-alert-go-to-inventory"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
            <span>Gestionar en Inventarios</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            title="Minimizar alerta"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Critical Reagents Cards Grid */}
      {isExpanded && (
        <div className="mt-4 pt-3.5 border-t border-rose-200/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-rose-600" />
              Reactivos que violan el umbral de seguridad ({reagentsBelowMinThreshold.length}):
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={restockAllCriticalReagents}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-emerald-300"
              >
                <PackagePlus className="w-3 h-3" />
                <span>Reabastecer Todos los Críticos</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {reagentsBelowMinThreshold.map((item) => {
              const isCritical = item.currentStock <= Math.floor(item.minStockAlert * 0.5) || item.status === 'critico';
              const stockPercentage = Math.min(100, Math.round((item.currentStock / item.minStockAlert) * 100));

              return (
                <div 
                  key={item.id}
                  className={`
                    p-3 rounded-xl border bg-white shadow-2xs transition-all flex flex-col justify-between
                    ${isCritical ? 'border-rose-300 ring-1 ring-rose-200' : 'border-amber-300'}
                  `}
                >
                  <div className="space-y-1.5">
                    {/* Header line: status tag & code */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.code}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        isCritical 
                          ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' 
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {isCritical ? '¡STOCK CRÍTICO!' : 'BAJO MÍNIMO'}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="font-black text-slate-900 text-xs leading-snug line-clamp-1" title={item.name}>
                      {item.name}
                    </div>

                    {/* Location & Supplier */}
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                      <span className="truncate">{item.supplier}</span>
                      <span>&middot;</span>
                      <span className="truncate font-mono">{item.lotNumber}</span>
                    </div>

                    {/* Stock level visualization */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-[11px] text-slate-500">Stock Actual / Mínimo:</span>
                        <div className="font-mono">
                          <span className={`font-black ${isCritical ? 'text-rose-600 text-sm' : 'text-amber-600 font-bold'}`}>
                            {item.currentStock}
                          </span>
                          <span className="text-slate-400 font-medium"> / {item.minStockAlert} {item.unit}</span>
                        </div>
                      </div>

                      {/* Visual progress bar */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCritical ? 'bg-rose-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(8, stockPercentage)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>0</span>
                        <span className="font-bold text-rose-600">{stockPercentage}% del mínimo</span>
                        <span>Mín: {item.minStockAlert}</span>
                      </div>
                    </div>

                    {/* Associated tests affected */}
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-slate-600 block mb-0.5">Pruebas en riesgo:</span>
                      <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                        {item.associatedTests.map((test, i) => (
                          <span 
                            key={i}
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[180px]"
                          >
                            {test}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this item */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => simulateReagentConsumption(item.id, 2)}
                      className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 px-1.5 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Simular corrida analítica que desgasta reactivo"
                    >
                      -2 Consumo
                    </button>

                    <button
                      onClick={() => quickRestockReagent(item.id)}
                      className={`
                        px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs
                        ${isCritical 
                          ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                          : 'bg-teal-600 hover:bg-teal-700 text-white'
                        }
                      `}
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>+ Reponer Lote</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Bottom helper bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>La alerta se desactiva automáticamente al reabastecer los reactivos por encima de su nivel de alerta.</span>
            </span>

            <button
              onClick={navigateToInventory}
              className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 underline cursor-pointer"
            >
              <span>Abrir catálogo de reactivos completo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
