import React from 'react';
import { DeviationAlertLevel } from '../../utils/referenceRangeEvaluator';

export interface ParameterDeviationGaugeProps {
  gaugePosition: number; // 0 to 100
  gaugeZone: 'low-red' | 'low-amber' | 'normal' | 'high-amber' | 'high-red';
  alertLevel: DeviationAlertLevel;
  min?: number;
  max?: number;
  value?: string | number;
  compact?: boolean;
}

/**
 * Micro-calibrador visual de desviación clínica para filas de resultados de laboratorio.
 * Proyecta la posición del resultado respecto al rango normal y zonas de alerta (Ámbar y Rojo).
 */
export const ParameterDeviationGauge: React.FC<ParameterDeviationGaugeProps> = ({
  gaugePosition,
  gaugeZone,
  alertLevel,
  min,
  max,
  value,
  compact = true
}) => {
  // Clamp position between 2% and 98% for clean pin rendering
  const clampedPos = Math.max(3, Math.min(97, gaugePosition));

  // Determine indicator dot color
  let dotBg = 'bg-emerald-600 border-white ring-1 ring-emerald-500';
  let labelColor = 'text-emerald-700';

  if (alertLevel === 'red' || gaugeZone === 'low-red' || gaugeZone === 'high-red') {
    dotBg = 'bg-rose-600 border-white ring-1 ring-rose-500 animate-pulse-subtle';
    labelColor = 'text-rose-700 font-bold';
  } else if (alertLevel === 'amber' || gaugeZone === 'low-amber' || gaugeZone === 'high-amber') {
    dotBg = 'bg-amber-500 border-white ring-1 ring-amber-400';
    labelColor = 'text-amber-800 font-bold';
  }

  return (
    <div className={`flex flex-col select-none ${compact ? 'w-24 sm:w-28' : 'w-36'}`} title={`Posición clínica: ${gaugePosition}% (${gaugeZone})`}>
      {/* Visual track with color bands */}
      <div className="relative w-full h-1.5 sm:h-2 bg-slate-200 rounded-full flex overflow-hidden shadow-2xs border border-slate-300/70">
        {/* Low Red Zone (0 - 15%) */}
        <div className="w-[15%] h-full bg-rose-400" title="Zona Crítica Baja (Rojo)" />
        {/* Low Amber Zone (15 - 30%) */}
        <div className="w-[15%] h-full bg-amber-300" title="Zona Moderada Baja (Ámbar)" />
        {/* Normal Zone (30 - 70%) */}
        <div className="w-[40%] h-full bg-emerald-400/90" title="Zona Normal de Referencia (Verde)" />
        {/* High Amber Zone (70 - 85%) */}
        <div className="w-[15%] h-full bg-amber-300" title="Zona Moderada Alta (Ámbar)" />
        {/* High Red Zone (85 - 100%) */}
        <div className="w-[15%] h-full bg-rose-500" title="Zona Crítica Alta (Rojo)" />
      </div>

      {/* Needle indicator dot */}
      <div className="relative w-full h-2 -mt-1.5 pointer-events-none">
        <div 
          className={`absolute -top-0.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full border shadow-xs z-10 ${dotBg}`}
          style={{ left: `${clampedPos}%` }}
        />
      </div>

      {/* Axis markers for min & max */}
      {!compact && (
        <div className="flex justify-between text-[7px] text-slate-500 font-mono px-0.5 mt-0.5">
          <span>{min !== undefined ? min : 'Min'}</span>
          <span className="text-[6.5px] uppercase text-slate-400 font-sans">Normal</span>
          <span>{max !== undefined ? max : 'Max'}</span>
        </div>
      )}
    </div>
  );
};
