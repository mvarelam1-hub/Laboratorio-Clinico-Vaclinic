import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  Send, 
  MessageSquare, 
  Mail, 
  CheckCheck, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw,
  ExternalLink,
  Phone
} from 'lucide-react';

export const LabDispatchesView: React.FC = () => {
  const { showNotification } = useClinic();
  const [search, setSearch] = useState('');

  const dispatches = [
    { id: 'disp-1', patient: 'Carlos Mendoza Ramos', phone: '+502 5612-5563', channel: 'WhatsApp', reportNum: 'LAB-2026-8941', status: 'Entregado & Leído', time: '14:22', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'disp-2', patient: 'Lucía Fernández Morales', phone: '+502 4192-8831', channel: 'WhatsApp', reportNum: 'LAB-2026-8942', status: 'Entregado & Leído', time: '13:45', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'disp-3', patient: 'Roberto Gómez Suárez', email: 'roberto.gomez@gmail.com', channel: 'Correo Electrónico', reportNum: 'LAB-2026-8943', status: 'Enviado con Éxito', time: '12:10', icon: Mail, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { id: 'disp-4', patient: 'Elena Soto Villalobos', phone: '+502 3341-9022', channel: 'SMS + WhatsApp', reportNum: 'LAB-2026-8944', status: 'Entregado', time: '11:05', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'disp-5', patient: 'Dr. Mario Morales (Médico Referente)', phone: '+502 5900-1122', channel: 'Portal Médico', reportNum: 'LAB-2026-8941', status: 'Consultado por Médico', time: '10:30', icon: Send, color: 'text-purple-600 bg-purple-50 border-purple-200' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Envíos y Notificaciones a Pacientes (169)</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Bitácora de reportes enviados por WhatsApp, Correo Electrónico y Portal de Resultados.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => showNotification('Sincronizando estado de entrega con servidores de WhatsApp API...', 'info')}
          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar Estatus</span>
        </button>
      </div>

      {/* Dispatches List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Destinatario</th>
                <th className="px-5 py-3.5">Canal</th>
                <th className="px-5 py-3.5">N° Informe</th>
                <th className="px-5 py-3.5">Hora de Envío</th>
                <th className="px-5 py-3.5">Estatus de Entrega</th>
                <th className="px-5 py-3.5 text-right">Reenviar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {dispatches.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900">{d.patient}</div>
                    <div className="text-[11px] text-slate-400">{d.phone || d.email}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${d.color}`}>
                      <d.icon className="w-3 h-3" />
                      {d.channel}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-teal-700">{d.reportNum}</td>
                  <td className="px-5 py-3.5 text-slate-500">{d.time}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                      <CheckCheck className="w-3.5 h-3.5" />
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => showNotification(`Reenviando mensaje por WhatsApp a ${d.patient}...`, 'success')}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-teal-50 hover:text-teal-700 text-slate-600 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      Reenviar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
