import React, { useMemo, useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Send, Search } from 'lucide-react';
import { enlaceWhatsApp, mensajeResultadosListos } from '../../utils/mensajeResultados';

/**
 * Entrega de resultados: informes YA PUBLICADOS, con el aviso al paciente por
 * WhatsApp (se abre WhatsApp con el mensaje listo; el envío lo hace el
 * personal). No hay bitácora de envíos de ejemplo ni estados de entrega
 * inventados: el sistema no puede saber si el paciente leyó el mensaje.
 */
export const LabDispatchesView: React.FC = () => {
  const { reports, patients, orders, labSettings, showNotification } = useClinic();
  const [busqueda, setBusqueda] = useState('');

  const publicados = useMemo(
    () => reports
      .filter((r) => r.status === 'publicado' || r.status === 'entregado')
      .filter((r) => !busqueda.trim() || `${r.patientName} ${r.reportNumber}`.toLowerCase().includes(busqueda.trim().toLowerCase()))
      .sort((a, b) => new Date(b.emissionDate).getTime() - new Date(a.emissionDate).getTime()),
    [reports, busqueda]
  );

  const mensajePara = (r: (typeof reports)[number]) => {
    const orden = orders.find((o) => o.id === r.orderId);
    return mensajeResultadosListos({
      paciente: r.patientName,
      codigoConsulta: orden?.codigoConsulta,
      urlPortal: window.location.origin,
      laboratorio: labSettings.labName || 'el laboratorio',
      telefonoLab: labSettings.whatsappNumber || labSettings.phone
    });
  };

  const avisar = (r: (typeof reports)[number]) => {
    const telefono = patients.find((p) => p.id === r.patientId)?.phone;
    const enlace = enlaceWhatsApp(telefono, mensajePara(r));
    if (!enlace) { showNotification('Este paciente no tiene un teléfono válido registrado.', 'warning'); return; }
    window.open(enlace, '_blank', 'noopener,noreferrer');
  };

  const copiar = async (r: (typeof reports)[number]) => {
    try { await navigator.clipboard.writeText(mensajePara(r)); showNotification('Mensaje copiado.', 'success'); }
    catch { showNotification('No se pudo copiar el mensaje.', 'error'); }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 text-slate-800">
      <div className="flex items-center gap-3">
        <Send className="w-6 h-6 text-slate-700" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Entrega de resultados</h1>
          <p className="text-xs text-slate-500">Informes publicados y aviso al paciente por WhatsApp.</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar paciente o informe"
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm" />
      </div>

      {publicados.length === 0 ? (
        <div className="border border-slate-300 rounded-xl p-8 text-center text-sm text-slate-600 bg-white">
          Todavía no hay informes publicados.
        </div>
      ) : (
        <div className="bg-white border border-slate-300 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-600 border-b border-slate-300">
                <th className="px-4 py-2">Paciente</th><th className="px-4 py-2">Informe</th><th className="px-4 py-2">Fecha</th><th className="px-4 py-2 text-right">Aviso</th>
              </tr>
            </thead>
            <tbody>
              {publicados.map((r) => (
                <tr key={r.id} className="border-b border-slate-200 last:border-0">
                  <td className="px-4 py-2 font-semibold text-slate-900">{r.patientName || '—'}</td>
                  <td className="px-4 py-2 text-slate-700">{r.reportNumber}<span className="block text-xs text-slate-500">{r.title}</span></td>
                  <td className="px-4 py-2 text-slate-700">{new Date(r.emissionDate).toLocaleDateString('es-GT')}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button onClick={() => avisar(r)} className="text-xs font-semibold bg-teal-700 text-white rounded-lg px-3 py-1.5 mr-2 cursor-pointer">WhatsApp</button>
                    <button onClick={() => copiar(r)} className="text-xs font-semibold border border-slate-300 rounded-lg px-3 py-1.5 cursor-pointer">Copiar mensaje</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
