import React, { useState } from 'react';
import { MedicalReport } from '../../types';
import { ArrowDownRight, ArrowUpRight, Minus, GitCompare, Calendar, CheckCircle2, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';

interface StudyComparatorProps {
  reports: MedicalReport[];
  currentReportId?: string;
}

export const StudyComparator: React.FC<StudyComparatorProps> = ({ reports, currentReportId }) => {
  const publishedReports = reports.filter(r => r.status === 'publicado' || r.status === 'entregado');

  const [reportAId, setReportAId] = useState<string>(
    publishedReports[1]?.id || publishedReports[0]?.id || ''
  );
  const [reportBId, setReportBId] = useState<string>(
    currentReportId || publishedReports[0]?.id || ''
  );

  const reportA = publishedReports.find(r => r.id === reportAId);
  const reportB = publishedReports.find(r => r.id === reportBId);

  if (publishedReports.length < 2) {
    return (
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-8 text-center border border-slate-200 dark:border-slate-700">
        <GitCompare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Se requiere al menos 2 estudios para comparar
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          A medida que te realices nuevos chequeos y análisis de laboratorio, aquí podrás ver la evolución exacta y el cambio porcentual de cada parámetro.
        </p>
      </div>
    );
  }

  // Find common parameters
  const commonParams = reportB?.parameters.map(paramB => {
    const paramA = reportA?.parameters.find(p => p.name.toLowerCase() === paramB.name.toLowerCase());
    const valA = paramA ? (typeof paramA.value === 'number' ? paramA.value : parseFloat(paramA.value)) : null;
    const valB = typeof paramB.value === 'number' ? paramB.value : parseFloat(paramB.value);

    let diff: number | null = null;
    let percentChange: number | null = null;
    let isImproved: boolean | null = null;

    if (valA !== null && !isNaN(valA) && !isNaN(valB)) {
      diff = valB - valA;
      percentChange = (diff / valA) * 100;

      // Determine if change is good:
      // For Colesterol, LDL, Trigliceridos, Glucosa, TSH: decrease is usually good if it was high
      const isBadWhenHigh = /colesterol|ldl|triglic|glucosa|ácido úrico/i.test(paramB.name);
      const isGoodWhenHigh = /hdl|eritrocitos|hemoglobina/i.test(paramB.name);

      if (isBadWhenHigh) {
        isImproved = diff <= 0;
      } else if (isGoodWhenHigh) {
        isImproved = diff >= 0;
      } else {
        isImproved = Math.abs(diff) < (valA * 0.05); // stable
      }
    }

    return {
      name: paramB.name,
      unit: paramB.unit,
      paramA,
      paramB,
      valA,
      valB,
      diff,
      percentChange,
      isImproved
    };
  }) || [];

  return (
    <div className="space-y-6">
      
      {/* Selector Header */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-slate-800 dark:to-slate-900 p-5 rounded-2xl border border-teal-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Comparador de Evolución Clínica
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 ml-auto flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-600" />
            Análisis Comparativo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Study A (Base / Previous) */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Estudio Base (Anterior)
            </label>
            <select
              value={reportAId}
              onChange={(e) => setReportAId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-xs rounded-lg p-2 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              {publishedReports.map((r) => (
                <option key={r.id} value={r.id}>
                  {new Date(r.sampleDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} — {r.title} ({r.reportNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Study B (Recent / Current) */}
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-teal-300 dark:border-teal-700 ring-1 ring-teal-400/30">
            <label className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              Estudio Reciente (Actual)
            </label>
            <select
              value={reportBId}
              onChange={(e) => setReportBId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-teal-300 dark:border-teal-600 text-xs rounded-lg p-2 font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              {publishedReports.map((r) => (
                <option key={r.id} value={r.id}>
                  {new Date(r.sampleDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} — {r.title} ({r.reportNumber})
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">Biomarcador</th>
              <th className="px-4 py-3">
                {reportA ? new Date(reportA.sampleDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 'Estudio A'}
              </th>
              <th className="px-4 py-3 text-teal-700 dark:text-teal-400">
                {reportB ? new Date(reportB.sampleDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 'Estudio B'}
              </th>
              <th className="px-4 py-3">Variación (Delta)</th>
              <th className="px-4 py-3 text-right">Evolución</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {commonParams.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                  {row.name}
                  <span className="text-[10px] block text-slate-400 font-normal">
                    {row.paramB.referenceRange}
                  </span>
                </td>

                <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-400">
                  {row.paramA ? `${row.paramA.value} ${row.paramA.unit}` : '—'}
                </td>

                <td className="px-4 py-3.5 font-black text-sm text-slate-900 dark:text-white">
                  {row.paramB.value} <span className="text-xs font-normal text-slate-500">{row.paramB.unit}</span>
                </td>

                <td className="px-4 py-3.5">
                  {row.diff !== null && row.percentChange !== null ? (
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded text-xs ${
                        row.isImproved
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                      }`}>
                        {row.diff > 0 ? '+' : ''}{row.diff.toFixed(1)} {row.unit}
                        <span className="text-[10px] font-medium ml-1">
                          ({row.percentChange > 0 ? '+' : ''}{row.percentChange.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">Sin datos previos</span>
                  )}
                </td>

                <td className="px-4 py-3.5 text-right">
                  {row.isImproved === true ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                      <TrendingDown className="w-3.5 h-3.5" />
                      Mejoría
                    </span>
                  ) : row.isImproved === false ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                      <TrendingUp className="w-3.5 h-3.5" />
                      En Observación
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                      <Minus className="w-3.5 h-3.5" />
                      Estable
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
