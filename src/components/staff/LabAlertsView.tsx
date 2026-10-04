import React, { useMemo, useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { calcularAlertasReales, TipoAlerta } from '../../utils/alertasReales';
import { AlertTriangle } from 'lucide-react';

const ETIQUETA: Record<TipoAlerta, string> = { critico: 'Valor crítico', reactivo: 'Reactivos' };

/**
 * Alertas REALES: valores críticos capturados en informes y reactivos con
 * existencias bajas, vencidos o por vencer. Si no hay nada que alertar, la
 * lista queda vacía; no se muestran alertas de ejemplo.
 */
export const LabAlertsView: React.FC = () => {
  const { reports, reagents, setStaffActiveTab, setActiveReportToEdit } = useClinic();
  const [filtro, setFiltro] = useState<'todas' | TipoAlerta>('todas');

  const alertas = useMemo(() => calcularAlertasReales(reports, reagents), [reports, reagents]);
  const visibles = filtro === 'todas' ? alertas : alertas.filter((a) => a.tipo === filtro);
  const cuenta = (t: TipoAlerta) => alertas.filter((a) => a.tipo === t).length;

  const abrir = (tipo: TipoAlerta, referencia: string) => {
    if (tipo === 'critico') {
      const inf = reports.find((r) => r.id === referencia);
      if (inf) { setActiveReportToEdit(inf); setStaffActiveTab('redactor'); }
    } else {
      setStaffActiveTab('ajustes');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 text-slate-800">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-slate-700" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Alertas ({alertas.length})</h1>
          <p className="text-xs text-slate-500">Valores críticos en informes y estado de reactivos. Se calculan con los datos reales del laboratorio.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([['todas', `Todas (${alertas.length})`], ['critico', `Valores críticos (${cuenta('critico')})`], ['reactivo', `Reactivos (${cuenta('reactivo')})`]] as const).map(([id, texto]) => (
          <button
            key={id}
            onClick={() => setFiltro(id)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${filtro === id ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
          >
            {texto}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <div className="border border-slate-300 rounded-xl p-8 text-center text-sm text-slate-600 bg-white">
          No hay alertas.
        </div>
      ) : (
        <ul className="bg-white border border-slate-300 rounded-xl divide-y divide-slate-200">
          {visibles.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className={`text-sm ${a.tipo === 'critico' ? 'font-bold text-red-700' : 'font-semibold text-slate-900'}`}>{a.titulo}</p>
                <p className="text-xs text-slate-600 mt-0.5">{a.detalle}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{ETIQUETA[a.tipo]} · {new Date(a.fecha).toLocaleString('es-GT')}</p>
              </div>
              <button onClick={() => abrir(a.tipo, a.referencia)} className="shrink-0 text-xs font-semibold border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                {a.tipo === 'critico' ? 'Abrir informe' : 'Ir a inventario'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
