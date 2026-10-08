import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  RotateCcw, 
  Activity, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  getAgeCategory, 
  getAgeGroupDescription, 
  getGenderLabel, 
  DeviationAlertLevel 
} from '../../utils/referenceRangeEvaluator';

export interface DemographicFilterState {
  highlightEnabled: boolean;
  showGauges: boolean;
  filterMode: 'all' | 'out-of-range' | 'amber-only' | 'red-only';
  simulatedAge?: number;
  simulatedGender?: 'M' | 'F' | 'Otro';
  isSimulating: boolean;
}

export interface ReportAgeSexRangeViewerProps {
  realPatientName: string;
  realPatientAge?: number;
  realPatientGender?: string;
  totalParametersCount: number;
  normalCount: number;
  amberCount: number;
  redCount: number;
  filterState: DemographicFilterState;
  onFilterStateChange: (state: DemographicFilterState) => void;
  className?: string;
  isPrintPreview?: boolean;
}

export const ReportAgeSexRangeViewer: React.FC<ReportAgeSexRangeViewerProps> = ({
  realPatientName,
  realPatientAge = 35,
  realPatientGender = 'M',
  totalParametersCount,
  normalCount,
  amberCount,
  redCount,
  filterState,
  onFilterStateChange,
  className = '',
  isPrintPreview = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  const effectiveAge = filterState.isSimulating && filterState.simulatedAge !== undefined 
    ? filterState.simulatedAge 
    : realPatientAge;

  const effectiveGender = filterState.isSimulating && filterState.simulatedGender 
    ? filterState.simulatedGender 
    : (realPatientGender || 'M');

  const ageCategoryLabel = getAgeGroupDescription(effectiveAge);
  const genderLabel = getGenderLabel(effectiveGender);

  const handleResetSimulation = () => {
    onFilterStateChange({
      ...filterState,
      isSimulating: false,
      simulatedAge: undefined,
      simulatedGender: undefined
    });
    setShowSimulator(false);
  };

  const handleToggleHighlight = () => {
    onFilterStateChange({
      ...filterState,
      highlightEnabled: !filterState.highlightEnabled
    });
  };

  const handleToggleGauges = () => {
    onFilterStateChange({
      ...filterState,
      showGauges: !filterState.showGauges
    });
  };

  const handleSetFilterMode = (mode: DemographicFilterState['filterMode']) => {
    onFilterStateChange({
      ...filterState,
      filterMode: mode
    });
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-linear-to-r from-slate-50 via-white to-sky-50/40 p-2.5 sm:p-3 shadow-2xs transition-all ${className}`}>
      {/* Top bar: Summary & Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left: Identity and Demographic Context */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-7 h-7 rounded-lg bg-[#082133] text-cyan-400 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Activity className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase text-[#082133] tracking-wide flex items-center gap-1">
                CONTROL DEMOGRÁFICO DE RANGOS
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-200">
                EDAD Y SEXO
              </span>
              {filterState.isSimulating && (
                <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                  SIMULACIÓN ACTIVA
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-600 mt-0.5 flex-wrap">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                <User className="w-3 h-3 text-slate-400" />
                {genderLabel}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                <Calendar className="w-3 h-3 text-slate-400" />
                {effectiveAge} años ({ageCategoryLabel})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Real-time Metric Badges (Amber & Red Highlights) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Normal Count */}
          <button
            type="button"
            onClick={() => handleSetFilterMode('all')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
              filterState.filterMode === 'all'
                ? 'bg-emerald-100 border-emerald-300 text-emerald-900 shadow-2xs ring-1 ring-emerald-400'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/60'
            }`}
            title="Ver todos los parámetros normales"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Normal: {normalCount}</span>
          </button>

          {/* Amber Out of Range Count */}
          <button
            type="button"
            onClick={() => handleSetFilterMode(filterState.filterMode === 'amber-only' ? 'all' : 'amber-only')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border transition-all ${
              amberCount > 0 
                ? (filterState.filterMode === 'amber-only'
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-2xs ring-2 ring-amber-400'
                    : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100')
                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-default'
            }`}
            title="Filtrar resultados con desviación moderada (Color Ámbar)"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-2xs"></span>
            <span>Ámbar (Moderado): {amberCount}</span>
          </button>

          {/* Red Critical Count */}
          <button
            type="button"
            onClick={() => handleSetFilterMode(filterState.filterMode === 'red-only' ? 'all' : 'red-only')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border transition-all ${
              redCount > 0 
                ? (filterState.filterMode === 'red-only'
                    ? 'bg-rose-100 border-rose-400 text-rose-950 shadow-2xs ring-2 ring-rose-500 animate-pulse-subtle'
                    : 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100')
                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-default'
            }`}
            title="Filtrar resultados con desviación crítica / pánico (Color Rojo)"
          >
            <AlertTriangle className={`w-3 h-3 ${redCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Rojo (Crítico): {redCount}</span>
          </button>

          {/* Expand / Controls toggle button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
            title="Ajustes de la herramienta visual"
          >
            <Sliders className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">Herramienta</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Controls Drawer (Interactive clinical adjustments) */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-2.5 text-xs animate-fadeIn print:hidden">
          
          {/* Main Visual Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
            <div className="flex items-center gap-3 flex-wrap">
              
              {/* Highlight toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] font-semibold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={filterState.highlightEnabled}
                  onChange={handleToggleHighlight}
                  className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 border-slate-300"
                />
                <span>Resaltado visual en <strong className="text-amber-800">Ámbar</strong> y <strong className="text-rose-700">Rojo</strong></span>
              </label>

              {/* Mini-gauges toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-[10.5px] font-semibold text-slate-800 select-none">
                <input
                  type="checkbox"
                  checked={filterState.showGauges}
                  onChange={handleToggleGauges}
                  className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 border-slate-300"
                />
                <span>Mostrar mini-barras de calibración clínica</span>
              </label>
            </div>

            {/* Quick action: Demographic Simulator */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowSimulator(!showSimulator)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md border flex items-center gap-1 transition-all ${
                  showSimulator || filterState.isSimulating
                    ? 'bg-sky-100 border-sky-300 text-sky-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3 h-3 text-sky-600" />
                <span>Simulador de Edad/Sexo</span>
              </button>

              {filterState.isSimulating && (
                <button
                  type="button"
                  onClick={handleResetSimulation}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center gap-1 transition-all"
                  title="Restablecer a datos reales del paciente"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Restablecer</span>
                </button>
              )}
            </div>
          </div>

          {/* Demographic Simulator Panel */}
          {showSimulator && (
            <div className="bg-sky-50/70 border border-sky-200 rounded-lg p-2.5 text-[11px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-950 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-sky-600" />
                  Simular evaluación con otra edad o sexo (Prueba de Rangos de Referencia):
                </span>
                <span className="text-[10px] text-sky-800">
                  Paciente real: {realPatientGender === 'M' ? 'Hombre' : 'Mujer'}, {realPatientAge} años
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Gender selector */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-slate-600">Sexo:</span>
                  <div className="inline-flex rounded-md shadow-2xs border border-slate-300 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => onFilterStateChange({
                        ...filterState,
                        isSimulating: true,
                        simulatedGender: 'M',
                        simulatedAge: effectiveAge
                      })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        effectiveGender === 'M' ? 'bg-[#082133] text-cyan-300' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      ♂ Masculino
                    </button>
                    <button
                      type="button"
                      onClick={() => onFilterStateChange({
                        ...filterState,
                        isSimulating: true,
                        simulatedGender: 'F',
                        simulatedAge: effectiveAge
                      })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        effectiveGender === 'F' ? 'bg-[#082133] text-cyan-300' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      ♀ Femenino
                    </button>
                  </div>
                </div>

                {/* Age selector */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-slate-600">Edad simulada:</span>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={effectiveAge}
                    onChange={(e) => onFilterStateChange({
                      ...filterState,
                      isSimulating: true,
                      simulatedAge: Math.max(0, parseInt(e.target.value, 10) || 0),
                      simulatedGender: effectiveGender as any
                    })}
                    className="w-16 px-1.5 py-0.5 border border-slate-300 rounded text-center text-[10.5px] font-bold bg-white focus:outline-teal-500"
                  />
                  <span className="text-[10px] text-slate-500">años</span>
                </div>

                {/* Quick Age Presets */}
                <div className="flex items-center gap-1">
                  <span className="text-[9.5px] text-slate-500">Grupos:</span>
                  <button
                    type="button"
                    onClick={() => onFilterStateChange({ ...filterState, isSimulating: true, simulatedAge: 5, simulatedGender: effectiveGender as any })}
                    className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 font-semibold"
                  >
                    Pediátrico (5a)
                  </button>
                  <button
                    type="button"
                    onClick={() => onFilterStateChange({ ...filterState, isSimulating: true, simulatedAge: 35, simulatedGender: effectiveGender as any })}
                    className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 font-semibold"
                  >
                    Adulto (35a)
                  </button>
                  <button
                    type="button"
                    onClick={() => onFilterStateChange({ ...filterState, isSimulating: true, simulatedAge: 72, simulatedGender: effectiveGender as any })}
                    className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] hover:bg-slate-100 font-semibold"
                  >
                    Geriátrico (72a)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Clinical Color Legend */}
          <div className="flex flex-wrap items-center justify-between text-[9.5px] text-slate-600 bg-slate-100/80 p-1.5 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800">Criterio de Resaltado Visual:</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <strong>Normal</strong>: En rango
              </span>
              <span className="flex items-center gap-1 text-amber-900">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <strong>Ámbar</strong>: Desviación moderada / fuera de rango
              </span>
              <span className="flex items-center gap-1 text-rose-900">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <strong>Rojo</strong>: Desviación severa / crítico (&gt;40% o pánico)
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
