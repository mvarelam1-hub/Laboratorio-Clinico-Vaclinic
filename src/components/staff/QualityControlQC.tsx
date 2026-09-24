import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Calendar, 
  FileSpreadsheet, 
  Layers, 
  RotateCcw,
  Check,
  Zap,
  Info,
  HelpCircle
} from 'lucide-react';

interface QCControlPoint {
  day: string;
  value: number;
  status: 'in_control' | 'warning' | 'out_of_control';
  ruleViolated?: string;
}

interface QCAnalyte {
  id: string;
  name: string;
  level: 'Nivel 1 (Normal)' | 'Nivel 2 (Patológico)';
  unit: string;
  mean: number;
  sd: number; // Standard Deviation
  lotNumber: string;
  expirationDate: string;
  analyzer: string;
  points: QCControlPoint[];
}

export const QualityControlQC: React.FC = () => {
  const { showNotification } = useClinic();

  const [analyteList] = useState<QCAnalyte[]>([
    {
      id: 'qc-glucosa-n1',
      name: 'Glucosa en Suero',
      level: 'Nivel 1 (Normal)',
      unit: 'mg/dL',
      mean: 92.0,
      sd: 2.5,
      lotNumber: 'LOT-GLU-2026-B',
      expirationDate: '2026-12-31',
      analyzer: 'Roche Cobas 6000',
      points: [
        { day: '01/08', value: 92.1, status: 'in_control' },
        { day: '05/08', value: 93.4, status: 'in_control' },
        { day: '10/08', value: 91.2, status: 'in_control' },
        { day: '15/08', value: 94.0, status: 'in_control' },
        { day: '20/08', value: 92.8, status: 'in_control' },
        { day: '25/08', value: 93.1, status: 'in_control' },
        { day: '28/08 (Hoy)', value: 92.5, status: 'in_control' }
      ]
    },
    {
      id: 'qc-colesterol-n1',
      name: 'Colesterol Total',
      level: 'Nivel 1 (Normal)',
      unit: 'mg/dL',
      mean: 180.0,
      sd: 4.0,
      lotNumber: 'LOT-CHOL-9812',
      expirationDate: '2026-11-15',
      analyzer: 'Roche Cobas 6000',
      points: [
        { day: '01/08', value: 179.5, status: 'in_control' },
        { day: '05/08', value: 181.2, status: 'in_control' },
        { day: '10/08', value: 183.0, status: 'in_control' },
        { day: '15/08', value: 178.4, status: 'in_control' },
        { day: '20/08', value: 182.1, status: 'in_control' },
        { day: '25/08', value: 184.5, status: 'in_control' },
        { day: '28/08 (Hoy)', value: 180.8, status: 'in_control' }
      ]
    },
    {
      id: 'qc-hb-n1',
      name: 'Hemoglobina (CBC)',
      level: 'Nivel 1 (Normal)',
      unit: 'g/dL',
      mean: 13.8,
      sd: 0.3,
      lotNumber: 'LOT-HEM-5521',
      expirationDate: '2026-10-30',
      analyzer: 'Sysmex XN-1000',
      points: [
        { day: '01/08', value: 13.7, status: 'in_control' },
        { day: '05/08', value: 13.9, status: 'in_control' },
        { day: '10/08', value: 13.6, status: 'in_control' },
        { day: '15/08', value: 13.8, status: 'in_control' },
        { day: '20/08', value: 14.1, status: 'in_control' },
        { day: '25/08', value: 13.8, status: 'in_control' },
        { day: '28/08 (Hoy)', value: 13.9, status: 'in_control' }
      ]
    },
    {
      id: 'qc-k-n1',
      name: 'Potasio Sérico (K+)',
      level: 'Nivel 1 (Normal)',
      unit: 'mEq/L',
      mean: 4.10,
      sd: 0.12,
      lotNumber: 'LOT-ISE-4410',
      expirationDate: '2026-09-30',
      analyzer: 'Radiometer ABL90',
      points: [
        { day: '01/08', value: 4.12, status: 'in_control' },
        { day: '05/08', value: 4.08, status: 'in_control' },
        { day: '10/08', value: 4.15, status: 'in_control' },
        { day: '15/08', value: 4.10, status: 'in_control' },
        { day: '20/08', value: 4.18, status: 'in_control' },
        { day: '25/08', value: 4.09, status: 'in_control' },
        { day: '28/08 (Hoy)', value: 4.11, status: 'in_control' }
      ]
    }
  ]);

  const [selectedAnalyteId, setSelectedAnalyteId] = useState<string>(analyteList[0].id);
  const activeAnalyte = analyteList.find(a => a.id === selectedAnalyteId) || analyteList[0];

  // Levey Jennings Calculations
  const mean = activeAnalyte.mean;
  const sd = activeAnalyte.sd;
  const p3sd = mean + 3 * sd;
  const p2sd = mean + 2 * sd;
  const p1sd = mean + 1 * sd;
  const m1sd = mean - 1 * sd;
  const m2sd = mean - 2 * sd;
  const m3sd = mean - 3 * sd;

  // Chart coordinates mapping (SVG height 220px)
  const chartHeight = 220;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 20;

  const getY = (val: number) => {
    const minVal = m3sd - sd * 0.5;
    const maxVal = p3sd + sd * 0.5;
    const ratio = (val - minVal) / (maxVal - minVal);
    return chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
  };

  const getX = (idx: number, total: number) => {
    return paddingX + (idx / Math.max(1, total - 1)) * (chartWidth - paddingX * 2);
  };

  const pointsCount = activeAnalyte.points.length;
  const polylinePoints = activeAnalyte.points
    .map((pt, idx) => `${getX(idx, pointsCount)},${getY(pt.value)}`)
    .join(' ');

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-3xl border border-emerald-500/20 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 flex-shrink-0 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  LIS • Control de Calidad Interno (QC)
                </span>
                <span className="text-xs text-slate-400 font-mono">Reglas de Westgard / ISO 15189</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                Gráficas Levey-Jennings y Trazabilidad de Reactivos
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Monitoreo diario de controles de calibración normal y patológico para validación técnica de autoanalizadores antes de emitir resultados a pacientes.
              </p>
            </div>
          </div>

          <div className="bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 rounded-2xl text-right">
            <span className="text-[10px] text-emerald-300 uppercase font-bold block">Estado de Calidad General</span>
            <span className="text-sm font-black text-white flex items-center gap-1.5 justify-end">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              100% EN CONTROL
            </span>
          </div>
        </div>
      </div>

      {/* Analyte Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {analyteList.map(analyte => (
          <button
            key={analyte.id}
            onClick={() => setSelectedAnalyteId(analyte.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedAnalyteId === analyte.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {analyte.name} ({analyte.unit})
          </button>
        ))}
      </div>

      {/* Main Levey-Jennings Chart & Analyte Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Levey Jennings SVG Graph */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Gráfica de Levey-Jennings: {activeAnalyte.name}</span>
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Media (x̄): {activeAnalyte.mean} {activeAnalyte.unit} • Desviación Estándar (1SD): ±{activeAnalyte.sd} {activeAnalyte.unit}
              </p>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              <Check className="w-3.5 h-3.5" /> En Control (Sin infracción Westgard)
            </span>
          </div>

          {/* SVG Chart */}
          <div className="w-full overflow-x-auto bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-56 text-xs font-mono"
            >
              {/* Reference Grid lines */}
              {/* +3SD */}
              <line x1={paddingX} y1={getY(p3sd)} x2={chartWidth - paddingX} y2={getY(p3sd)} stroke="#e11d48" strokeDasharray="3 3" strokeWidth="1" />
              <text x={chartWidth - paddingX + 5} y={getY(p3sd) + 4} fill="#f43f5e" fontSize="9">+3SD ({p3sd.toFixed(1)})</text>

              {/* +2SD */}
              <line x1={paddingX} y1={getY(p2sd)} x2={chartWidth - paddingX} y2={getY(p2sd)} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth="1" />
              <text x={chartWidth - paddingX + 5} y={getY(p2sd) + 4} fill="#fbbf24" fontSize="9">+2SD ({p2sd.toFixed(1)})</text>

              {/* +1SD */}
              <line x1={paddingX} y1={getY(p1sd)} x2={chartWidth - paddingX} y2={getY(p1sd)} stroke="#64748b" strokeDasharray="2 2" strokeWidth="0.8" />
              <text x={chartWidth - paddingX + 5} y={getY(p1sd) + 4} fill="#94a3b8" fontSize="9">+1SD ({p1sd.toFixed(1)})</text>

              {/* MEAN (Center) */}
              <line x1={paddingX} y1={getY(mean)} x2={chartWidth - paddingX} y2={getY(mean)} stroke="#10b981" strokeWidth="2" />
              <text x={chartWidth - paddingX + 5} y={getY(mean) + 4} fill="#34d399" fontSize="10" fontWeight="bold">MEDIA ({mean.toFixed(1)})</text>

              {/* -1SD */}
              <line x1={paddingX} y1={getY(m1sd)} x2={chartWidth - paddingX} y2={getY(m1sd)} stroke="#64748b" strokeDasharray="2 2" strokeWidth="0.8" />
              <text x={chartWidth - paddingX + 5} y={getY(m1sd) + 4} fill="#94a3b8" fontSize="9">-1SD ({m1sd.toFixed(1)})</text>

              {/* -2SD */}
              <line x1={paddingX} y1={getY(m2sd)} x2={chartWidth - paddingX} y2={getY(m2sd)} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth="1" />
              <text x={chartWidth - paddingX + 5} y={getY(m2sd) + 4} fill="#fbbf24" fontSize="9">-2SD ({m2sd.toFixed(1)})</text>

              {/* -3SD */}
              <line x1={paddingX} y1={getY(m3sd)} x2={chartWidth - paddingX} y2={getY(m3sd)} stroke="#e11d48" strokeDasharray="3 3" strokeWidth="1" />
              <text x={chartWidth - paddingX + 5} y={getY(m3sd) + 4} fill="#f43f5e" fontSize="9">-3SD ({m3sd.toFixed(1)})</text>

              {/* Polyline Data */}
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                points={polylinePoints}
              />

              {/* Points */}
              {activeAnalyte.points.map((pt, idx) => {
                const cx = getX(idx, pointsCount);
                const cy = getY(pt.value);
                return (
                  <g key={idx}>
                    <circle cx={cx} cy={cy} r="4.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                    <text x={cx} y={chartHeight - 4} fill="#94a3b8" fontSize="8" textAnchor="middle">{pt.day}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>Última corrida de calibración: <strong>Hoy 07:30 AM</strong></span>
            <span>Coeficiente de Variación (CV%): <strong className="text-emerald-600 font-mono font-bold">1.8% (Óptimo &lt; 5%)</strong></span>
          </div>
        </div>

        {/* Right 1 Col: Reagent & Westgard Rules Validation */}
        <div className="space-y-6">
          
          {/* Reagent Kit Meta */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2">
              Lote de Reactivo & Calibrador
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lote de Reactivo:</span>
                <span className="font-mono font-bold text-slate-900">{activeAnalyte.lotNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Equipo Analizador:</span>
                <span className="font-semibold text-slate-800">{activeAnalyte.analyzer}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nivel de Control:</span>
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{activeAnalyte.level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Caducidad de Lote:</span>
                <span className="font-mono text-emerald-700 font-bold">{activeAnalyte.expirationDate}</span>
              </div>
            </div>
          </div>

          {/* Westgard Rules Checklist */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Evaluación Reglas de Westgard</span>
              <span className="text-[10px] text-emerald-600 font-bold">APROBADO</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div>
                  <span className="font-mono font-bold text-slate-900 block">Regla 1-3s (Aleatoria)</span>
                  <span className="text-[10px] text-slate-500">Ningún punto excede ±3SD</span>
                </div>
                <Check className="w-4 h-4 text-emerald-600 font-bold" />
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div>
                  <span className="font-mono font-bold text-slate-900 block">Regla 2-2s (Sistemática)</span>
                  <span className="text-[10px] text-slate-500">Sin 2 puntos consecutivos en ±2SD</span>
                </div>
                <Check className="w-4 h-4 text-emerald-600 font-bold" />
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div>
                  <span className="font-mono font-bold text-slate-900 block">Regla R-4s (Rango)</span>
                  <span className="text-[10px] text-slate-500">Diferencia inter-control &lt; 4SD</span>
                </div>
                <Check className="w-4 h-4 text-emerald-600 font-bold" />
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div>
                  <span className="font-mono font-bold text-slate-900 block">Regla 10-x (Tendencia)</span>
                  <span className="text-[10px] text-slate-500">Sin desplazamiento a un solo lado de la media</span>
                </div>
                <Check className="w-4 h-4 text-emerald-600 font-bold" />
              </div>
            </div>

            <button
              onClick={() => showNotification('Certificado de Control de Calidad CLIA exportado para auditoría')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-3"
            >
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Exportar Reporte QC para Auditoría</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
