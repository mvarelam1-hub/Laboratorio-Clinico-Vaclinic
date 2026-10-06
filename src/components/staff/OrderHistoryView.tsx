import React, { useMemo, useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { seguimientoDePedido } from '../../utils/seguimientoPedido';
import { 
  Clock, 
  Search, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  User, 
  Calendar,
  Layers
} from 'lucide-react';

export const OrderHistoryView: React.FC = () => {
  const { orders, reports, setStaffActiveTab } = useClinic();
  const [searchTerm, setSearchTerm] = useState('');

  // Historial REAL: la etapa más avanzada de cada orden, según lo que el sistema
  // guarda (orden, informe y firma). Sin eventos de ejemplo ni horas inventadas.
  const historyEvents = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    return orders
      .filter((o) => !o.isDeleted)
      .filter((o) => !t || `${o.orderNumber} ${o.patientName}`.toLowerCase().includes(t))
      .sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date) || b.seqNumber - a.seqNumber)
      .slice(0, 50)
      .map((o) => {
        const informe = reports.find((r) => r.orderId === o.id);
        const hechos = seguimientoDePedido(o, informe).filter((p) => p.hecho);
        const ultimo = hechos[hechos.length - 1];
        return {
          id: o.id,
          orderNumber: o.orderNumber,
          patient: o.patientName,
          event: `${ultimo.titulo}${ultimo.detalle ? ` · ${ultimo.detalle}` : ''}`,
          time: [ultimo.fecha || o.date, ultimo.clave === 'registrada' ? o.time : ''].filter(Boolean).join(' '),
        };
      });
  }, [orders, reports, searchTerm]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Historial de Órdenes & Trazabilidad</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Última etapa registrada de cada orden. Abre "Ver Flujo" para el detalle.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <label className="sr-only" htmlFor="buscar-historial">Buscar por paciente o número de orden</label>
        <input
          id="buscar-historial" type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por paciente o número de orden"
          className="w-full sm:w-96 mb-5 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
        {historyEvents.length === 0 && (
          <p className="text-sm text-slate-500 py-6 text-center">Todavía no hay órdenes en el historial.</p>
        )}
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {historyEvents.map((ev) => (
            <div key={ev.id} className="relative flex items-start justify-between gap-4">
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                <CheckCircle2 className="w-3 h-3" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {ev.orderNumber}
                  </span>
                  <span className="font-bold text-xs text-slate-800">• {ev.patient}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  {ev.event}
                </p>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3" />
                  {ev.time}
                </div>
              </div>

              <button
                onClick={() => setStaffActiveTab('episodios')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                <span>Ver Flujo</span>
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
