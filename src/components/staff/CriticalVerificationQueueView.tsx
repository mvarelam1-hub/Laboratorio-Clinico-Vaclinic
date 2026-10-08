import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, CheckCircle2, Lock, WifiOff } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import {
  obtenerPendientesVerificacionRemoto,
  verificarResultadoRemoto,
  ResultadosApiError,
  ResultadoPendienteVerificacion
} from '../../services/resultadosApiService';

/**
 * Cola de "Verificación de críticos" (migración 0018, server/routes/
 * resultados.ts). Un resultado fuera de rango no puede publicarse hasta que
 * un SEGUNDO bioanalista -distinto de quien lo capturó y de quien lo
 * validó- lo confirme aquí. A diferencia de LabAlertsView (datos de
 * muestra), esta lista viene en vivo de PATCH/GET /api/resultados.
 *
 * La regla se hace cumplir en el servidor y en la base de datos: este botón
 * solo es la forma de ejercerla; ocultarlo o deshabilitarlo aquí no es la
 * protección (por eso un 409 del servidor también se muestra tal cual).
 */
export const CriticalVerificationQueueView: React.FC = () => {
  const { showNotification, isOnline, isSimulatingOffline } = useClinic();
  const enLinea = isOnline && !isSimulatingOffline;

  const [pendientes, setPendientes] = useState<ResultadoPendienteVerificacion[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [revisado, setRevisado] = useState(false);
  const [verificando, setVerificando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    if (!enLinea) return;
    setCargando(true);
    setError(null);
    try {
      setPendientes(await obtenerPendientesVerificacionRemoto());
    } catch (err) {
      setError(err instanceof ResultadosApiError ? err.message : 'No se pudo cargar la cola de verificación.');
    } finally {
      setCargando(false);
    }
  }, [enLinea]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const verificar = async (idResultado: number) => {
    setVerificando(idResultado);
    try {
      await verificarResultadoRemoto(idResultado);
      showNotification('Resultado crítico verificado. Ya puede publicarse el informe.', 'success');
      setConfirmando(null);
      setRevisado(false);
      await cargar();
    } catch (err) {
      const mensaje = err instanceof ResultadosApiError ? err.message : 'Error de red desconocido.';
      showNotification(`No se pudo verificar: ${mensaje}`, 'warning');
      await cargar();
    } finally {
      setVerificando(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 animate-fade-in text-slate-800">
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Verificación de críticos{pendientes ? ` (${pendientes.length})` : ''}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium max-w-xl">
              Resultados fuera de rango ya validados que esperan a un segundo bioanalista. No se pueden publicar hasta que los verifique alguien distinto de quien los capturó y de quien los validó.
            </p>
          </div>
        </div>
        <button
          onClick={cargar}
          disabled={!enLinea || cargando}
          className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {!enLinea && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <WifiOff className="w-4 h-4 flex-shrink-0" />
          Sin conexión: la verificación se hace contra el servidor, así que no está disponible fuera de línea.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {enLinea && pendientes && pendientes.length === 0 && !error && (
        <div className="flex flex-col items-center gap-2 p-10 rounded-2xl bg-white border border-slate-200 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <p className="text-sm font-bold text-slate-700">No hay resultados críticos esperando verificación.</p>
        </div>
      )}

      <div className="space-y-3">
        {(pendientes || []).map((r) => {
          const abierto = confirmando === r.id_resultado;
          return (
            <div key={r.id_resultado} className="bg-white rounded-2xl border border-rose-200 shadow-xs p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wide">
                      Fuera de rango
                    </span>
                    <span className="text-xs font-mono text-slate-500">{r.numero_orden}</span>
                  </div>
                  <p className="mt-1 text-sm font-black text-slate-900 truncate">{r.paciente}</p>
                  <p className="text-sm text-slate-700">
                    {r.nombre_examen}:{' '}
                    <span className="font-black text-rose-700">
                      {r.valor_capturado} {r.unidad_medida || ''}
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Capturó: <b>{r.analista || 'desconocido'}</b> · Validó: <b>{r.validado_por_nombre || 'desconocido'}</b>
                  </p>
                </div>

                {r.puede_verificar ? (
                  !abierto && (
                    <button
                      onClick={() => {
                        setConfirmando(r.id_resultado);
                        setRevisado(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer flex items-center gap-2 self-start sm:self-center"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verificar
                    </button>
                  )
                ) : (
                  <div
                    className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 self-start sm:self-center"
                    title="Tú capturaste o validaste este resultado: debe verificarlo otro bioanalista."
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Debe verificarlo otro bioanalista
                  </div>
                )}
              </div>

              {abierto && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="flex items-start gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={revisado}
                      onChange={(e) => setRevisado(e.target.checked)}
                      className="mt-0.5"
                    />
                    Revisé el valor, la muestra y el rango de referencia, y confirmo que el resultado es correcto.
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => verificar(r.id_resultado)}
                      disabled={!revisado || verificando === r.id_resultado}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verificando === r.id_resultado ? 'Verificando…' : 'Confirmar verificación'}
                    </button>
                    <button
                      onClick={() => {
                        setConfirmando(null);
                        setRevisado(false);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
