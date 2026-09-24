import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  Activity, 
  Check, 
  Sliders,
  FileCheck,
  RotateCcw
} from 'lucide-react';
import { ReportParameter, ParameterStatus, ReportStatus } from '../../types';
import { evaluateParameterDetailed } from '../../utils/referenceRangeEvaluator';

interface CriticalValuesConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStatus: ReportStatus;
  parameters: ReportParameter[];
  onConfirmAndSave: (updatedParameters: ReportParameter[], confirmedStatus: ReportStatus) => void;
}

export const CriticalValuesConfirmationModal: React.FC<CriticalValuesConfirmationModalProps> = ({
  isOpen,
  onClose,
  targetStatus,
  parameters,
  onConfirmAndSave
}) => {
  // Mantener copia editable local de los parámetros
  const [localParams, setLocalParams] = useState<ReportParameter[]>([]);
  const [verificationChecked, setVerificationChecked] = useState<boolean>(false);
  const [verificationNotes, setVerificationNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setLocalParams(JSON.parse(JSON.stringify(parameters)));
      setVerificationChecked(false);
      setVerificationNotes('');
    }
  }, [isOpen, parameters]);

  if (!isOpen) return null;

  // Filtrar parámetros con valores fuera de rango o con estado crítico
  const outOfRangeParams = localParams.filter(p => {
    if (!p.value && p.value !== 0) return false;
    const evalInfo = evaluateParameterDetailed(p.value, p.referenceRange, p.minVal, p.maxVal, p.status);
    return evalInfo.isOutOfRange || p.status === 'critical' || p.status === 'high' || p.status === 'low';
  });

  const criticalCount = localParams.filter(p => p.status === 'critical').length;
  const highCount = localParams.filter(p => p.status === 'high').length;
  const lowCount = localParams.filter(p => p.status === 'low').length;

  const handleUpdateLocalParamValue = (id: string, newValue: string) => {
    setLocalParams(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, value: newValue };
          const evalInfo = evaluateParameterDetailed(newValue, p.referenceRange, p.minVal, p.maxVal);
          updated.status = evalInfo.status;
          return updated;
        }
        return p;
      })
    );
  };

  const handleSetLocalStatus = (id: string, newStatus: ParameterStatus) => {
    setLocalParams(prev =>
      prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            status: newStatus,
            criticalConfirmed: newStatus === 'critical' ? true : p.criticalConfirmed
          };
        }
        return p;
      })
    );
  };

  const handleMarkAllCritical = () => {
    setLocalParams(prev =>
      prev.map(p => {
        const evalInfo = evaluateParameterDetailed(p.value, p.referenceRange, p.minVal, p.maxVal, p.status);
        if (evalInfo.isOutOfRange) {
          return { ...p, status: 'critical', criticalConfirmed: true };
        }
        return p;
      })
    );
  };

  const handleMarkAllConfirmed = () => {
    setVerificationChecked(true);
    setLocalParams(prev =>
      prev.map(p => ({
        ...p,
        criticalConfirmed: true
      }))
    );
  };

  const handleConfirm = () => {
    // Aplicar los parámetros confirmados
    const finalizedParams = localParams.map(p => {
      const evalInfo = evaluateParameterDetailed(p.value, p.referenceRange, p.minVal, p.maxVal, p.status);
      return {
        ...p,
        criticalConfirmed: evalInfo.isOutOfRange ? true : p.criticalConfirmed
      };
    });

    onConfirmAndSave(finalizedParams, targetStatus);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-rose-200 flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header con alerta visual roja destacada */}
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white p-5 flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-rose-900/60 px-2 py-0.5 rounded-full text-rose-100 border border-rose-400/40">
                  Seguridad Clínica • Protocolo de Alerta
                </span>
                <span className="text-[10px] font-bold bg-white text-rose-700 px-2 py-0.5 rounded-full">
                  {outOfRangeParams.length} fuera de rango
                </span>
              </div>
              <h2 className="text-lg font-bold mt-1 text-white leading-tight">
                Confirmación de Valores Críticos y Fuera de Rango
              </h2>
              <p className="text-xs text-rose-100 mt-0.5">
                Se detectaron resultados analíticos que exceden los límites fisiológicos de referencia. Confirme si corresponden a Valores Críticos antes de guardar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-rose-200 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
            title="Cerrar y volver al editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de contadores métricos */}
        <div className="bg-rose-50/80 border-b border-rose-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-rose-800">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <span>{criticalCount} Valores Críticos (Alarma)</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{highCount} Valores Elevados ▲</span>
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{lowCount} Valores Bajos ▼</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllCritical}
              className="text-[11px] font-bold text-rose-700 bg-rose-100/80 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition-colors border border-rose-200 cursor-pointer"
            >
              Marcar todos como Críticos ⚠️
            </button>
            <button
              type="button"
              onClick={handleMarkAllConfirmed}
              className="text-[11px] font-bold text-teal-800 bg-teal-100/80 hover:bg-teal-200 px-2.5 py-1 rounded-lg transition-colors border border-teal-200 cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3 h-3 text-teal-700" />
              <span>Marcar Verificados</span>
            </button>
          </div>
        </div>

        {/* Contenido principal: Tabla de parámetros con alerta roja */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Instrucción para el personal de laboratorio:</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Revise si los valores ingresados representan un error tipográfico o si fueron confirmados en el analizador (dimensión D3). Los parámetros marcados como <strong>«Crítico ⚠️»</strong> generarán alerta visual en el portal del paciente y en el informe médico oficial.
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-3">Prueba / Parámetro</th>
                  <th className="py-2.5 px-3 w-36">Resultado Ingresado</th>
                  <th className="py-2.5 px-3 w-20">Unidad</th>
                  <th className="py-2.5 px-3 w-40">Rango Referencia</th>
                  <th className="py-2.5 px-3 w-40 text-center">Desviación</th>
                  <th className="py-2.5 px-3 w-44 text-center">Estado y Clasificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outOfRangeParams.map((param) => {
                  const evalInfo = evaluateParameterDetailed(param.value, param.referenceRange, param.minVal, param.maxVal, param.status);
                  const isCrit = param.status === 'critical' || evalInfo.isCritical;

                  return (
                    <tr 
                      key={param.id} 
                      className={`transition-colors ${
                        isCrit ? 'bg-rose-50/70 border-l-4 border-l-rose-600' : 'bg-amber-50/40 border-l-4 border-l-amber-500'
                      }`}
                    >
                      {/* Nombre y Sección */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {isCrit ? (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <span>{param.name || 'Parámetro sin nombre'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                          {param.section && (
                            <span className="bg-white px-1.5 py-0.2 rounded border border-slate-200">
                              {param.section}
                            </span>
                          )}
                          {param.sampleType && <span>Muestra: {param.sampleType}</span>}
                        </div>
                      </td>

                      {/* Resultado con resaltado en rojo editable para corregir posibles errores de tipeo */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={param.value}
                            onChange={(e) => handleUpdateLocalParamValue(param.id, e.target.value)}
                            className="w-full bg-rose-50 border-2 border-rose-500 text-rose-950 font-mono font-extrabold text-sm px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
                            title="Puede corregir el valor directamente si fue un error tipográfico"
                          />
                          <span className="text-[9px] text-rose-600 font-medium block">
                            Modificable si hubo error de tipeo
                          </span>
                        </div>
                      </td>

                      {/* Unidad */}
                      <td className="py-3 px-3 font-mono text-slate-700 font-medium">
                        {param.unit || '-'}
                      </td>

                      {/* Rango de Referencia */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200 block text-center">
                          {param.referenceRange || 'N/D'}
                        </span>
                      </td>

                      {/* Desviación */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded-full font-extrabold text-[11px] ${
                            isCrit 
                              ? 'bg-rose-600 text-white shadow-xs' 
                              : param.status === 'high' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            {evalInfo.badgeLabel}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">
                            {evalInfo.deviationText}
                          </span>
                        </div>
                      </td>

                      {/* Clasificación interactiva */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col gap-1.5 items-center justify-center">
                          <div className="grid grid-cols-2 gap-1 w-full max-w-[170px]">
                            <button
                              type="button"
                              onClick={() => handleSetLocalStatus(param.id, 'critical')}
                              className={`text-[10px] font-bold py-1 px-1.5 rounded-lg border transition-all cursor-pointer ${
                                param.status === 'critical'
                                  ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                  : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                              }`}
                            >
                              Crítico ⚠️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetLocalStatus(param.id, evalInfo.percentDiff && evalInfo.percentDiff < 0 ? 'low' : 'high')}
                              className={`text-[10px] font-bold py-1 px-1.5 rounded-lg border transition-all cursor-pointer ${
                                param.status === 'high' || param.status === 'low'
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                  : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
                              }`}
                            >
                              Alterado
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSetLocalStatus(param.id, 'normal')}
                            className={`text-[9px] font-medium py-0.5 px-2 rounded-md transition-all cursor-pointer ${
                              param.status === 'normal'
                                ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                                : 'text-slate-400 hover:text-slate-700 hover:underline'
                            }`}
                          >
                            Considerar Normal / Variante
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Confirmación explícita del personal de laboratorio */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={verificationChecked}
                onChange={(e) => setVerificationChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs text-slate-700">
                <strong>Verificación analítica confirmada:</strong> He revisado los resultados en los analizadores de laboratorio, validado los controles de calidad de la corrida y confirmo la veracidad de estos valores para el informe.
              </span>
            </label>

            <div>
              <input
                type="text"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Observación opcional para la bitácora interna (ej. Prueba repetida por duplicado, muestra sin hemólisis...)"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-medium">
            Destino: <span className="font-bold uppercase text-slate-800">{targetStatus}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar y Corregir en Editor
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.98] rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Valores y Continuar Guardado</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
