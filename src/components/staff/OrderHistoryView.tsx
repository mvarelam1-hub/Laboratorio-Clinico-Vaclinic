import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
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
  const { episodes, showNotification, setStaffActiveTab } = useClinic();
  const [searchTerm, setSearchTerm] = useState('');

  const historyEvents = [
    { id: 'ev-1', orderNumber: '4D-2026-EP842', patient: 'Carlos Mendoza Ramos', event: 'Muestra procesada en Mindray BS-240 y validada por Dra. Morales', time: 'Hace 12 min', status: 'Validado' },
    { id: 'ev-2', orderNumber: '4D-2026-EP843', patient: 'Lucía Fernández Morales', event: 'Tubo Citrato centrifugado a 3000 RPM (Flebotomía)', time: 'Hace 38 min', status: 'En Proceso' },
    { id: 'ev-3', orderNumber: '4D-2026-EP844', patient: 'Roberto Gómez Suárez', event: 'Admisión registrada en ventanilla y código Barcode impreso', time: 'Hace 1h 10m', status: 'Admitido' },
    { id: 'ev-4', orderNumber: '4D-2026-EP845', patient: 'Elena Soto Villalobos', event: 'Resultados de Uroanálisis enviados por WhatsApp', time: 'Hace 2h', status: 'Entregado' }
  ];

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
                Línea de tiempo detallada de eventos, movimientos de tubos y firmas electrónicas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
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
