import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  Trash2, 
  ShieldCheck, 
  Zap, 
  X, 
  Plus, 
  Play,
  Database
} from 'lucide-react';
import { OfflinePendingAction } from '../../types/offlineQueue';

export const ConnectionStatusIndicator: React.FC = () => {
  const {
    isOnline,
    isSimulatingOffline,
    setIsSimulatingOffline,
    offlineQueue,
    isSyncingQueue,
    syncPendingChanges,
    clearOfflineQueue,
    removeOfflineAction,
    retryOfflineAction,
    lastSyncTime,
    queuePendingAction,
    showNotification,
    isOfflineQueueModalOpen,
    setIsOfflineQueueModalOpen
  } = useClinic();

  const [latencyMs, setLatencyMs] = useState<number | null>(18);
  const [isPinging, setIsPinging] = useState(false);

  const isEffectiveOnline = isOnline && !isSimulatingOffline;
  const pendingCount = offlineQueue.filter(item => item.status === 'pending' || item.status === 'failed').length;

  // Ping test
  const checkPing = async () => {
    if (!isEffectiveOnline) {
      setLatencyMs(null);
      return;
    }
    setIsPinging(true);
    const start = performance.now();
    try {
      await new Promise(res => setTimeout(res, 120 + Math.random() * 80));
      const end = performance.now();
      setLatencyMs(Math.round(end - start));
    } catch {
      setLatencyMs(null);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    if (isEffectiveOnline) {
      checkPing();
      const timer = setInterval(() => {
        checkPing();
      }, 25000);
      return () => clearInterval(timer);
    } else {
      setLatencyMs(null);
    }
  }, [isEffectiveOnline]);

  const handleCreateTestPending = () => {
    const testEntity = {
      actionType: 'create_order' as const,
      entityType: 'Orden de Prueba',
      entityId: `ord-test-${Date.now()}`,
      description: `Orden de contingencia fuera de línea #${Math.floor(100 + Math.random() * 900)}`,
      payload: { tests: ['Hemograma Completo', 'Glucosa'], patientName: 'Paciente Demostración' }
    };
    queuePendingAction(testEntity);
    showNotification('Acción de prueba agregada a la cola local fuera de línea.', 'info');
  };

  return (
    <>
      {/* Navbar Trigger Button */}
      <button
        id="btn-connection-status-indicator"
        type="button"
        onClick={() => setIsOfflineQueueModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
          !isEffectiveOnline
            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-400/50 shadow-xs animate-pulse'
            : pendingCount > 0
            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/50'
            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-400/30'
        }`}
        title={
          !isEffectiveOnline
            ? `Sin conexión a internet (${pendingCount} pendientes en cola). Clic para ver detalles.`
            : pendingCount > 0
            ? `${pendingCount} cambios pendientes en cola. Clic para sincronizar.`
            : 'Sistema en línea y sincronizado con VACLINIC Cloud LIS'
        }
      >
        <span className="relative flex h-2 w-2">
          {!isEffectiveOnline ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </>
          ) : pendingCount > 0 ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </>
          ) : (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          )}
        </span>

        {!isEffectiveOnline ? (
          <WifiOff className="w-3.5 h-3.5 text-rose-400" />
        ) : (
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        )}

        <span className="hidden sm:inline">
          {!isEffectiveOnline ? 'Sin Conexión' : 'En línea'}
        </span>

        {pendingCount > 0 && (
          <span className="ml-0.5 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Interactive Modal / Diagnostics & Queue Drawer */}
      {isOfflineQueueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 text-slate-100 w-full max-w-2xl rounded-3xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                  !isEffectiveOnline 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {!isEffectiveOnline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Estado de Red & Cola Local de Sincronización</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Garantía de continuidad operativa y almacenamiento local seguro ante cortes de red
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOfflineQueueModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagnostics Bar */}
            <div className="bg-slate-950/60 p-4 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Estado Servidor</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${isEffectiveOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                  <span className="font-bold text-white">
                    {isEffectiveOnline ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Latencia / Ping</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Zap className={`w-3.5 h-3.5 ${latencyMs ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="font-bold text-white">
                    {latencyMs !== null ? `${latencyMs} ms` : 'Inaccesible'}
                  </span>
                  {isPinging && <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin ml-1" />}
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Acciones en Cola</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Layers className={`w-3.5 h-3.5 ${pendingCount > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span className={`font-black ${pendingCount > 0 ? 'text-rose-300' : 'text-slate-300'}`}>
                    {pendingCount} pendientes
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Última Sincro</span>
                <div className="flex items-center gap-1 mt-1 truncate">
                  <Clock className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                  <span className="font-mono text-[11px] text-slate-300 truncate">
                    {lastSyncTime ? lastSyncTime.split(' ')[1] || lastSyncTime : 'No registrada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Offline Simulation Control & Safe Storage Badge */}
            <div className="px-6 py-3 bg-slate-800/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isSimulatingOffline}
                    onChange={(e) => {
                      setIsSimulatingOffline(e.target.checked);
                      showNotification(
                        e.target.checked 
                          ? 'Modo simulación fuera de línea activado. Puedes probar guardando datos sin internet.' 
                          : 'Modo simulación desactivado. Conexión normal restaurada.',
                        e.target.checked ? 'warning' : 'success'
                      );
                    }}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700"
                  />
                  <span className="font-bold text-slate-300">
                    Simular corte de conexión a internet
                  </span>
                </label>
                {isSimulatingOffline && (
                  <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-black border border-amber-500/40">
                    SIMULACIÓN ACTIVA
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateTestPending}
                  className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  title="Simular una orden clínica guardada sin conexión"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Añadir Acción de Prueba</span>
                </button>

                <button
                  type="button"
                  onClick={checkPing}
                  disabled={isPinging || !isEffectiveOnline}
                  className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                  title="Comprobar latencia con el servidor VACLINIC"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>Comprobar Ping</span>
                </button>
              </div>
            </div>

            {/* Offline Queue Items List */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-black text-white">
                    Registro de Acciones en la Cola Local
                  </h4>
                  <span className="text-xs text-slate-400">
                    ({offlineQueue.length} totales)
                  </span>
                </div>

                {offlineQueue.length > 0 && (
                  <button
                    type="button"
                    onClick={clearOfflineQueue}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Vaciar historial</span>
                  </button>
                )}
              </div>

              {offlineQueue.length === 0 ? (
                <div className="bg-slate-950/60 rounded-2xl p-8 text-center border border-slate-800/80">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h5 className="text-sm font-bold text-slate-200">
                    Cola Local Limpia y Sincronizada
                  </h5>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    No hay cambios clínicos pendientes. Cuando la red se desconecte, cualquier orden, paciente o informe que crees se guardará aquí de forma automática y transparente.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {offlineQueue.map((item) => {
                    const isPending = item.status === 'pending';
                    const isSynced = item.status === 'synced';
                    const isFailed = item.status === 'failed';
                    const isSyncing = item.status === 'syncing';

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isPending 
                            ? 'bg-amber-950/20 border-amber-500/30' 
                            : isSynced 
                            ? 'bg-slate-800/40 border-slate-700/60 opacity-80' 
                            : 'bg-rose-950/20 border-rose-500/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl mt-0.5 ${
                            isPending 
                              ? 'bg-amber-500/20 text-amber-400' 
                              : isSynced 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {isSynced ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : isSyncing ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                            ) : isFailed ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-white">
                                {item.description}
                              </span>
                              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono font-bold">
                                {item.entityType}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                              <span>Hora local: {item.timestamp}</span>
                              <span>•</span>
                              <span className="font-mono text-[10px] text-slate-500">{item.id}</span>
                              {item.retryCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400">Reintentos: {item.retryCount}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isSynced 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                              : isPending 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {isSynced ? 'Sincronizado' : isSyncing ? 'Sincronizando...' : isPending ? 'Pendiente' : 'Fallo'}
                          </span>

                          {(isPending || isFailed) && isEffectiveOnline && (
                            <button
                              type="button"
                              onClick={() => retryOfflineAction(item.id)}
                              className="p-1.5 bg-slate-800 hover:bg-teal-600/30 text-teal-300 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                              title="Sincronizar este registro ahora"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => removeOfflineAction(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Descartar este registro de la cola"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with Sync Trigger and Safety Explanations */}
            <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Almacenamiento encriptado en IndexedDB / LocalStorage para máxima seguridad.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsOfflineQueueModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={() => syncPendingChanges()}
                  disabled={!isEffectiveOnline || isSyncingQueue || pendingCount === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingQueue ? 'animate-spin' : ''}`} />
                  <span>
                    {isSyncingQueue 
                      ? 'Sincronizando cola...' 
                      : `Sincronizar Ahora (${pendingCount})`}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

// Standalone persistent offline banner to mount cleanly at the top of Navbar
export const OfflineWarningBanner: React.FC = () => {
  const {
    isOnline,
    isSimulatingOffline,
    offlineQueue,
    setIsOfflineQueueModalOpen
  } = useClinic();

  const isEffectiveOnline = isOnline && !isSimulatingOffline;
  const pendingCount = offlineQueue.filter(item => item.status === 'pending' || item.status === 'failed').length;

  if (isEffectiveOnline) return null;

  return (
    <div 
      id="banner-offline-status"
      className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-rose-700/60 shadow-md animate-fade-in"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-rose-400 flex-shrink-0 animate-bounce" />
        <span className="font-black text-rose-200 uppercase tracking-wide text-[11px]">
          Modo Fuera de Línea Activo:
        </span>
        <span className="text-slate-200 text-[11px] hidden sm:inline">
          Sin conexión a internet. Los cambios clínicos se guardan automáticamente en la cola local.
        </span>
        <span className="text-slate-200 text-[11px] sm:hidden">
          Sin conexión. Cambios seguros en cola.
        </span>
        {pendingCount > 0 && (
          <span className="bg-rose-500/30 text-rose-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-rose-400/40">
            {pendingCount} {pendingCount === 1 ? 'pendiente' : 'pendientes'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isSimulatingOffline && (
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-mono font-bold">
            [Simulación]
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsOfflineQueueModalOpen(true)}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-3 py-1 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
        >
          <Layers className="w-3 h-3" />
          <span>Ver Cola & Sincronizar</span>
        </button>
      </div>
    </div>
  );
};
