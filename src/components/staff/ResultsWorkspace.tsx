import React, { useMemo, useState } from 'react';
import { Search, FileText, FlaskConical, Inbox } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import { construirBorradorDeOrden } from '../../utils/borradorInforme';
import { saldoPendienteDeOrden } from '../../utils/validarInformeContraOrden';
import type { LabOrder } from '../../types';
import { ReportEditor } from './ReportEditor';

type FiltroEstado = 'todas' | 'Pendiente' | 'Listo';

/**
 * Ingreso de resultados: a la izquierda las órdenes de trabajo, a la derecha el
 * redactor de la orden elegida. Elegir una orden abre su informe real (o un
 * borrador con SOLO los exámenes de esa orden).
 */
export const ResultsWorkspace: React.FC = () => {
  const {
    orders,
    reports,
    patients,
    catalogTests,
    customProfiles,
    labSettings,
    activeReportToEdit,
    setActiveReportToEdit
  } = useClinic();

  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('todas');

  const ordenActivaId = activeReportToEdit?.orderId;

  const edadDe = (o: LabOrder): number | null => {
    const p = patients.find(
      (x) => (o.nationalId && x.nationalId === o.nationalId) || (o.patientCode && x.patientCode === o.patientCode)
    );
    return typeof p?.age === 'number' && p.age >= 0 ? p.age : null;
  };

  const lista = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return orders
      .filter((o) => !o.isArchived && !o.isDeleted)
      .filter((o) => filtro === 'todas' || o.status === filtro)
      .filter(
        (o) =>
          !q ||
          o.patientName.toLowerCase().includes(q) ||
          o.orderNumber.toLowerCase().includes(q) ||
          (o.codigoConsulta || '').toLowerCase().includes(q) ||
          (o.nationalId || '').includes(q)
      )
      .sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
  }, [orders, busqueda, filtro]);

  const abrirOrden = (o: LabOrder) => {
    const existente = reports.find((r) => r.orderId === o.id);
    if (existente) {
      setActiveReportToEdit(existente);
      return;
    }
    const paciente = patients.find((p) => o.nationalId && p.nationalId === o.nationalId);
    setActiveReportToEdit(
      construirBorradorDeOrden({
        orderId: o.id,
        orderNumber: o.orderNumber,
        patientId: paciente?.id || '',
        patientName: o.patientName,
        nationalId: o.nationalId,
        patientAge: paciente?.age,
        patientGender: paciente?.gender,
        testsList: o.testsList,
        examCodes: o.examCodes,
        catalogTests,
        customProfiles,
        sampleDate: o.createdAt || o.date,
        laboratoryName: labSettings.labName || 'VACLINIC LABORATORIO CLÍNICO'
      })
    );
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-[20rem_minmax(0,1fr)] gap-5 items-start">
      {/* Órdenes de trabajo */}
      <aside className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 lg:sticky lg:top-[calc(var(--navbar-h,0px)+1rem)] max-h-[calc(100vh-var(--navbar-h,0px)-2rem)] flex flex-col" data-testid="lista-ordenes-trabajo">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-teal-600" />
          <h2 className="text-base font-black text-slate-900">Órdenes de Trabajo</h2>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">{lista.length} {lista.length === 1 ? 'encontrada' : 'encontradas'}</p>

        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar paciente o código…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {(['todas', 'Pendiente', 'Listo'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                filtro === f ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'todas' ? 'Todas' : f}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2 overflow-y-auto pr-0.5 flex-1 min-h-0">
          {lista.length === 0 && (
            <div className="text-center text-xs text-slate-400 py-8">
              <Inbox className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
              {orders.length === 0 ? 'Todavía no hay órdenes registradas.' : 'Ninguna orden coincide.'}
            </div>
          )}
          {lista.map((o) => {
            const informe = reports.find((r) => r.orderId === o.id);
            const activa = ordenActivaId === o.id;
            const saldo = saldoPendienteDeOrden(o);
            const edad = edadDe(o);
            return (
              <button
                key={o.id}
                onClick={() => abrirOrden(o)}
                data-testid="tarjeta-orden-trabajo"
                className={`w-full text-left rounded-xl border p-3 transition-all cursor-pointer ${
                  activa ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-600 truncate">{o.orderNumber}</span>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      informe?.status === 'publicado'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : informe
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {informe?.status === 'publicado' ? 'Publicado' : informe ? 'En captura' : 'Pendiente'}
                  </span>
                </div>
                <div className="mt-1 text-sm font-black text-slate-900 uppercase leading-tight">{o.patientName}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <FlaskConical className="w-3 h-3" />
                  <span>{edad !== null ? `${edad} a · ` : ''}{o.testsCount} {o.testsCount === 1 ? 'prueba' : 'pruebas'}</span>
                </div>
                {saldo > 0 && (
                  <div className="mt-1.5 inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                    Saldo Q{saldo.toFixed(2)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Redactor de la orden elegida */}
      <section className="min-w-0">
        {ordenActivaId ? (
          <ReportEditor key={ordenActivaId} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-10 text-center" data-testid="sin-orden-elegida">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h1 className="text-xl font-black text-slate-900">Ingreso de Resultados de Laboratorio</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Elige una orden de la lista para capturar los resultados de sus exámenes. Solo se pueden ingresar y enviar los exámenes de órdenes ya pagadas.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};
