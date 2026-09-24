import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { BranchSiteId, SampleTransferManifest } from '../../types';
import { 
  Building2, 
  Truck, 
  Thermometer, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  Search, 
  ShieldCheck, 
  Layers, 
  MapPin, 
  Activity, 
  Cpu, 
  RefreshCw,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const MultisiteManager: React.FC = () => {
  const { 
    branches, 
    currentBranch, 
    setCurrentBranch, 
    isMultiBranchEnabled,
    setIsMultiBranchEnabled,
    transfers, 
    addSampleTransfer, 
    episodes, 
    showNotification 
  } = useClinic();

  const [showNewTransferModal, setShowNewTransferModal] = useState(false);
  const [originBranch, setOriginBranch] = useState<BranchSiteId>('este');
  const [destinationBranch, setDestinationBranch] = useState<BranchSiteId>('central');
  const [courierName, setCourierName] = useState('Logística Médica Labymed (Unidad #06)');
  const [tempControl, setTempControl] = useState<'2_8_grados' | 'congelado_menos_20' | 'temperatura_ambiente'>('2_8_grados');
  const [tempLogged, setTempLogged] = useState<number>(4.1);
  const [samplesCount, setSamplesCount] = useState<number>(14);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (originBranch === destinationBranch) {
      showNotification('La sede de origen y destino no pueden ser la misma', 'error');
      return;
    }

    await addSampleTransfer({
      originBranch,
      destinationBranch,
      courierName,
      departureTime: new Date().toISOString(),
      estimatedArrivalTime: new Date(Date.now() + 45 * 60000).toISOString(),
      status: 'en_transito',
      temperatureControl: tempControl,
      temperatureLogged: Number(tempLogged),
      samplesCount: Number(samplesCount),
      samplesCodes: [`4D-BAR-${Math.floor(10000 + Math.random() * 90000)}`, `4D-BAR-${Math.floor(10000 + Math.random() * 90000)}`]
    });

    setShowNewTransferModal(false);
  };

  const getBranchName = (id: BranchSiteId) => {
    return branches.find(b => b.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">

      {/* Control Banner: Sede Única vs Multi-Sede */}
      {!isMultiBranchEnabled ? (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-200 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Opción Desactivada por el Momento
              </span>
              <span className="text-xs font-bold text-amber-800">
                Operando en Modo Sede Única
              </span>
            </div>
            <h2 className="text-base font-black text-slate-900">
              VACLINIC Laboratorio Clínico • Sede Central
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              La red de múltiples sucursales y traslados de muestras inter-sede está actualmente <strong>desactivada</strong> para simplificar las operaciones en una sola sede física (Entrada de Pineda, Oratorio, Santa Rosa km 79.5).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsMultiBranchEnabled(true);
                showNotification('Opción Multi-Sede activada con éxito', 'success');
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Activar Opción Multi-Sede</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>
              <strong>Modo Multi-Sede Activo:</strong> Puede monitorear sedes y programar traslados. Si desea operar solo para una sede, puede desactivar esta opción.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsMultiBranchEnabled(false);
              showNotification('Opción Multi-Sede desactivada por el momento (Operando en Sede Única)', 'info');
            }}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold px-3 py-1.5 rounded-xl text-[11px] flex-shrink-0 cursor-pointer transition-all"
          >
            Desactivar por el momento (Sede Única)
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl border border-indigo-500/20 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-500/40">
              VACLINIC • Red de Sedes y Tomas de Muestra
            </span>
            <span className="text-xs text-indigo-300 font-mono">Red Nacional Conectada</span>
          </div>
          <h1 className="text-xl font-black tracking-tight mt-1 text-white">
            Plataforma Centralizada de Múltiples Sitios
          </h1>
          <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
            Supervisión remota en tiempo real, consolidación de datos clínicos inter-sucursal y control de cadena de custodia de muestras con temperatura monitoreada.
          </p>
        </div>

        <button
          onClick={() => setShowNewTransferModal(true)}
          className="bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 self-start md:self-auto"
        >
          <Truck className="w-4 h-4" />
          <span>Nueva Remesa / Transporte</span>
        </button>
      </div>

      {/* Branches Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {branches.map((b) => {
          const isSelected = currentBranch === b.id;
          const branchEpisodes = episodes.filter(e => e.branchId === b.id);
          const urgentCount = branchEpisodes.filter(e => e.priority === 'urgente' || e.priority === 'stat_panico').length;

          return (
            <div 
              key={b.id}
              className={`p-5 rounded-2xl border transition-all ${
                isSelected 
                  ? 'bg-slate-900 text-white border-teal-500 shadow-lg ring-2 ring-teal-500/30' 
                  : 'bg-white text-slate-900 border-slate-200 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  isSelected ? 'bg-teal-500 text-slate-950' : 'bg-slate-100 text-slate-700'
                }`}>
                  {b.code} {b.isMain && '• HUB'}
                </span>
                
                <button
                  onClick={() => {
                    setCurrentBranch(b.id);
                    showNotification(`Conectado a sede: ${b.name}`);
                  }}
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isSelected ? 'Sede Activa ✓' : 'Seleccionar'}
                </button>
              </div>

              <h3 className="text-sm font-bold mt-3 leading-snug">{b.name}</h3>
              <p className={`text-[11px] mt-1 flex items-center gap-1 ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{b.address}</span>
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className={`block text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>Muestras</span>
                  <strong className="text-sm">{b.activeSamplesCount}</strong>
                </div>
                <div>
                  <span className={`block text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>Analizadores</span>
                  <strong className="text-sm">{b.analyzersConnected}</strong>
                </div>
                <div>
                  <span className={`block text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>SLA</span>
                  <strong className="text-sm text-emerald-400">{b.slaCompliance}%</strong>
                </div>
              </div>

              {urgentCount > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{urgentCount} muestras críticas en cola</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cadena de Custodia & Traspaso de Muestras Inter-Sucursales */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Manifiestos de Transporte & Cadena de Custodia Térmica ({transfers.length})
            </span>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Control de Calidad Pre-analítico ISO 15189
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {transfers.map((man) => (
            <div key={man.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {man.manifestCode}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    man.status === 'entregado'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                  }`}>
                    {man.status === 'entregado' ? '✓ Entregado en Sede Central' : '🚚 En Tránsito'}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                  <span>{getBranchName(man.originBranch)}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-teal-700">{getBranchName(man.destinationBranch)}</span>
                </div>

                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                  <span>Transportista: <strong>{man.courierName}</strong></span>
                  <span>•</span>
                  <span>Muestras: <strong>{man.samplesCount} tubos</strong></span>
                </div>
              </div>

              {/* Temperature Control Indicator */}
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium">
                    <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                    <span>Temperatura</span>
                  </div>
                  <strong className="text-sm text-slate-900 font-mono">
                    {man.temperatureLogged}°C
                  </strong>
                  <span className="block text-[9px] text-emerald-600 font-bold">
                    {man.temperatureControl === '2_8_grados' ? 'Rango 2-8°C OK' : 'Control Activo'}
                  </span>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  <div>Salida: <strong>{new Date(man.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
                  <div>Llegada Est: <strong>{new Date(man.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Sample Transfer Modal */}
      {showNewTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Despacho de Muestras Multisucursal</h3>
              </div>
              <button
                onClick={() => setShowNewTransferModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sede de Origen</label>
                  <select
                    value={originBranch}
                    onChange={(e) => setOriginBranch(e.target.value as BranchSiteId)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sede Destino (HUB)</label>
                  <select
                    value={destinationBranch}
                    onChange={(e) => setDestinationBranch(e.target.value as BranchSiteId)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Empresa / Transportista</label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Control Térmico</label>
                  <select
                    value={tempControl}
                    onChange={(e) => setTempControl(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="2_8_grados">Refrigerado (2°C a 8°C)</option>
                    <option value="congelado_menos_20">Congelado (-20°C)</option>
                    <option value="temperatura_ambiente">Ambiente Controlado</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Temperatura Inicial (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempLogged}
                    onChange={(e) => setTempLogged(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cantidad de Tubos / Muestras</label>
                <input
                  type="number"
                  value={samplesCount}
                  onChange={(e) => setSamplesCount(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTransferModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md cursor-pointer"
                >
                  Generar Manifiesto & Despachar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
