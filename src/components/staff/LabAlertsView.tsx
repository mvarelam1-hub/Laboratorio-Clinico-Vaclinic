import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { 
  AlertTriangle, 
  Search, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ShieldAlert, 
  Cpu, 
  FlaskConical, 
  Droplets,
  Bell
} from 'lucide-react';

export const LabAlertsView: React.FC = () => {
  const { showNotification } = useClinic();
  const [filterType, setFilterType] = useState('all');

  const alerts = [
    { id: 'alt-1', type: 'critico', title: 'Valor Crítico de Pánico: Glucosa 485 mg/dL', patient: 'Carlos Mendoza Ramos', order: 'ORD-2026-EP842', time: 'Hace 8 min', status: 'Pendiente Notificación Médica' },
    { id: 'alt-2', type: 'critico', title: 'Valor Crítico de Pánico: Potasio 6.8 mEq/L', patient: 'Elena Soto Villalobos', order: 'ORD-2026-EP845', time: 'Hace 22 min', status: 'Notificado a Médico de Guardia' },
    { id: 'alt-3', type: 'sla', title: 'SLA en Riesgo: Tiempo de Protrombina (TP)', patient: 'Lucía Fernández Morales', order: 'ORD-2026-EP843', time: 'Hace 35 min', status: 'En Analizador Mindray' },
    { id: 'alt-4', type: 'muestra', title: 'Muestra con Hemólisis Leve Detectada', patient: 'Roberto Gómez Suárez', order: 'ORD-2026-EP844', time: 'Hace 50 min', status: 'Verificada por Analista' },
    { id: 'alt-5', type: 'calibracion', title: 'Calibración Requerida: Reactivo Bilirrubinas', patient: 'Mindray BS-240', order: 'Equipo Químico', time: 'Hace 1h', status: 'Aviso Técnico' },
    { id: 'alt-6', type: 'control', title: 'Control de Calidad Nivel 2: Regla 1-3s', patient: 'Sysmex XN-550', order: 'Hematología', time: 'Hace 2h', status: 'Corregido y Aceptado' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-800">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Alertas Clínicas & Notificaciones (91)</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Supervisión de valores de pánico, desviaciones de control de calidad y tiempos SLA.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => showNotification('Todas las alertas rutinarias han sido marcadas como revisadas.', 'info')}
          className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
        >
          Marcar Revisadas
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'Todas las Alertas (91)' },
          { id: 'critico', label: '🚨 Valores de Pánico (14)' },
          { id: 'sla', label: '⏱️ Tiempos SLA (28)' },
          { id: 'muestra', label: '🧪 Muestras & Calidad (31)' },
          { id: 'calibracion', label: '⚙️ Reactivos & Equipos (18)' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {alerts.map((al) => (
          <div
            key={al.id}
            className={`bg-white rounded-2xl p-5 border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              al.type === 'critico' ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl mt-0.5 ${
                al.type === 'critico' ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-100 text-amber-800'
              }`}>
                {al.type === 'critico' ? <Zap className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900">{al.title}</h3>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-slate-700">Paciente/Equipo: {al.patient}</span>
                  <span>•</span>
                  <span className="font-mono text-teal-700 font-bold">{al.order}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    {al.time}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                al.type === 'critico' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-700'
              }`}>
                {al.status}
              </span>
              <button
                onClick={() => showNotification(`Protocolo de atención ejecutado para ${al.patient}`, 'success')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Gestionar
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
