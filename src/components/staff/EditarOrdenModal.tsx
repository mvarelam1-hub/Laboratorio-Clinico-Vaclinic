import React, { useEffect, useMemo, useState } from 'react';
import { Lock, X, UserRound, ClipboardList, FlaskConical, Search, Check } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import type { LabOrder, Patient } from '../../types';
import { resolverCodigosAIdsExamen } from '../../services/examenesApiService';
import { agregarExamenesOrdenRemota, OrdenesApiError } from '../../services/ordenesApiService';

interface EditarOrdenModalProps {
  /** Id de la orden (LabOrder.id) que se corrige. */
  ordenId: string;
  onClose: () => void;
}

const CLASE_CAMPO =
  'w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium';
const CLASE_BLOQUEADO =
  'w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 font-mono cursor-not-allowed';

const calcularEdad = (fecha: string): number | undefined => {
  const nacimiento = new Date(fecha);
  if (!fecha || Number.isNaN(nacimiento.getTime())) return undefined;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const aunNoCumple =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
  if (aunNoCumple) edad -= 1;
  return edad >= 0 ? edad : undefined;
};

const dinero = (n: number) => `Q${n.toFixed(2)}`;

/**
 * Editor de una orden: corrige datos del paciente y de la orden y agrega
 * exámenes. El número de orden y el código de consulta se muestran bloqueados:
 * no se pueden cambiar. Agregar un examen con costo exige el número de pago.
 */
export const EditarOrdenModal: React.FC<EditarOrdenModalProps> = ({ ordenId, onClose }) => {
  const { orders, patients, catalogTests, updatePatient, updateOrder, showNotification } = useClinic();
  const orden: LabOrder | undefined = orders.find((o) => o.id === ordenId);
  const paciente: Patient | undefined = useMemo(
    () => (orden?.patientId ? patients.find((p) => p.id === orden.patientId) : undefined),
    [orden?.patientId, patients]
  );

  // Paciente
  const [nombre, setNombre] = useState(paciente?.fullName || '');
  const [dni, setDni] = useState(paciente?.nationalId || '');
  const [nacimiento, setNacimiento] = useState(paciente?.birthDate || '');
  const [genero, setGenero] = useState<'M' | 'F' | 'Otro'>(paciente?.gender || 'M');
  const [telefono, setTelefono] = useState(paciente?.phone || '');
  const [correo, setCorreo] = useState(paciente?.email || '');
  const [direccion, setDireccion] = useState(paciente?.address || '');
  const [guardandoPaciente, setGuardandoPaciente] = useState(false);

  // Orden
  const [prioridad, setPrioridad] = useState<LabOrder['priority']>(orden?.priority || 'rutina');
  const [cama, setCama] = useState(orden?.bedRoom || '');
  const [guardandoOrden, setGuardandoOrden] = useState(false);

  // Exámenes
  const [busqueda, setBusqueda] = useState('');
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [numeroPago, setNumeroPago] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [errorExamenes, setErrorExamenes] = useState<string | null>(null);

  useEffect(() => {
    if (paciente) {
      setNombre(paciente.fullName || '');
      setDni(paciente.nationalId || '');
      setNacimiento(paciente.birthDate || '');
      setGenero(paciente.gender || 'M');
      setTelefono(paciente.phone || '');
      setCorreo(paciente.email || '');
      setDireccion(paciente.address || '');
    }
  }, [paciente]);

  useEffect(() => {
    if (orden) {
      setPrioridad(orden.priority || 'rutina');
      setCama(orden.bedRoom || '');
    }
    // Solo al abrir: no pisar lo que la persona está escribiendo cuando la orden se actualiza.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenId]);

  const codigosEnOrden = useMemo(() => {
    const set = new Set<string>();
    (orden?.examCodes || []).forEach((c) => set.add(c));
    (orden?.detalleRemoto || []).forEach((d) => d.codigoExamen && set.add(d.codigoExamen));
    return set;
  }, [orden?.examCodes, orden?.detalleRemoto]);

  const disponibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return catalogTests
      .filter((t) => t.code && !t.isProfile && t.status !== 'Inactivo' && !codigosEnOrden.has(t.code))
      .filter((t) => !q || t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
      .slice(0, 40);
  }, [catalogTests, busqueda, codigosEnOrden]);

  const elegidos = catalogTests.filter((t) => seleccion.includes(t.code));
  const montoElegido = elegidos.reduce((s, t) => s + (Number(t.price) || 0), 0);

  if (!orden) return null;

  const guardarPaciente = async () => {
    if (!paciente) return;
    if (!nombre.trim()) {
      showNotification('El nombre completo es obligatorio.', 'warning');
      return;
    }
    setGuardandoPaciente(true);
    try {
      const edad = calcularEdad(nacimiento);
      await updatePatient(paciente.id, {
        fullName: nombre.trim(),
        nationalId: dni.trim(),
        birthDate: nacimiento || paciente.birthDate,
        gender: genero,
        ...(edad !== undefined ? { age: edad } : {}),
        phone: telefono.trim(),
        email: correo.trim(),
        address: direccion.trim()
      });
      // Los datos del paciente que se ven en la lista de órdenes.
      await updateOrder(orden.id, {
        patientName: nombre.trim(),
        nationalId: dni.trim(),
        phone: telefono.trim(),
        email: correo.trim()
      });
    } finally {
      setGuardandoPaciente(false);
    }
  };

  const guardarOrden = async () => {
    setGuardandoOrden(true);
    try {
      await updateOrder(orden.id, { priority: prioridad, bedRoom: cama.trim() });
      showNotification('Datos de la orden actualizados.');
    } finally {
      setGuardandoOrden(false);
    }
  };

  const alternar = (codigo: string) =>
    setSeleccion((prev) => (prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]));

  const agregarExamenes = async () => {
    setErrorExamenes(null);
    if (!orden.remoteId) {
      setErrorExamenes('Esta orden no está guardada en el servidor, por eso no se le pueden agregar exámenes.');
      return;
    }
    if (seleccion.length === 0) {
      setErrorExamenes('Elige al menos un examen.');
      return;
    }
    if (montoElegido > 0 && !numeroPago.trim()) {
      setErrorExamenes('Escribe el número de pago (boleta o recibo) para agregar exámenes con costo.');
      return;
    }
    setAgregando(true);
    try {
      const { ids, noEncontrados } = await resolverCodigosAIdsExamen(seleccion);
      if (noEncontrados.length > 0) {
        throw new OrdenesApiError(`Estos exámenes no existen en el catálogo del servidor: ${noEncontrados.join(', ')}.`);
      }
      const r = await agregarExamenesOrdenRemota(orden.remoteId, ids, numeroPago.trim() || undefined);
      await updateOrder(orden.id, {
        testsList: [...orden.testsList, ...elegidos.map((t) => t.name)],
        testsCount: orden.testsCount + elegidos.length,
        examCodes: [...(orden.examCodes || []), ...seleccion],
        detalleRemoto: r.detalle,
        totalPrice: dinero(r.total_cobrado),
        pendingBalance: r.saldo_pendiente,
        status: r.estado_flujo
      });
      showNotification(
        `Se agregaron ${elegidos.length} examen(es) a la orden ${orden.orderNumber}${r.monto_agregado > 0 ? ` (${dinero(r.monto_agregado)})` : ''}.`
      );
      setSeleccion([]);
      setNumeroPago('');
      setBusqueda('');
    } catch (err) {
      setErrorExamenes(err instanceof Error ? err.message : 'No se pudieron agregar los exámenes.');
    } finally {
      setAgregando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Corregir datos de la orden"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-4">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold">Corregir datos de la orden</h3>
            <p className="text-xs text-slate-400">Paciente, datos de la orden y exámenes adicionales</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs max-h-[78vh] overflow-y-auto">
          {/* Datos bloqueados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-1">
                <Lock className="w-3 h-3" /> N.º de orden (no se puede cambiar)
              </label>
              <input value={orden.orderNumber} readOnly disabled className={CLASE_BLOQUEADO} />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-slate-700 mb-1">
                <Lock className="w-3 h-3" /> Código de consulta (no se puede cambiar)
              </label>
              <input value={orden.codigoConsulta || '—'} readOnly disabled className={CLASE_BLOQUEADO} />
            </div>
          </div>

          {/* Paciente */}
          <section className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-black text-slate-900">
              <UserRound className="w-4 h-4 text-teal-600" /> Datos del paciente
            </h4>
            {!paciente ? (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                No se encontró la ficha de este paciente. Corrígela desde la pantalla Pacientes.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Nombre completo *</label>
                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={CLASE_CAMPO} />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">DNI / Documento</label>
                    <input value={dni} onChange={(e) => setDni(e.target.value)} className={`${CLASE_CAMPO} font-mono`} />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fecha de nacimiento</label>
                    <input type="date" value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} className={CLASE_CAMPO} />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Género</label>
                    <select value={genero} onChange={(e) => setGenero(e.target.value as 'M' | 'F' | 'Otro')} className={CLASE_CAMPO}>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                    <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={CLASE_CAMPO} />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Correo</label>
                    <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} className={CLASE_CAMPO} />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dirección</label>
                    <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className={CLASE_CAMPO} />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Un informe que ya fue publicado queda sellado con los datos de ese momento; la corrección se verá en los informes nuevos.
                </p>
                <button
                  type="button"
                  onClick={guardarPaciente}
                  disabled={guardandoPaciente}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {guardandoPaciente ? 'Guardando…' : 'Guardar datos del paciente'}
                </button>
              </>
            )}
          </section>

          {/* Orden */}
          <section className="space-y-3 border-t border-slate-100 pt-5">
            <h4 className="flex items-center gap-2 text-sm font-black text-slate-900">
              <ClipboardList className="w-4 h-4 text-teal-600" /> Datos de la orden
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prioridad</label>
                <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as LabOrder['priority'])} className={CLASE_CAMPO}>
                  <option value="rutina">Rutina</option>
                  <option value="urgente">Urgente</option>
                  <option value="stat_panico">STAT / Pánico</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sede / cama</label>
                <input value={cama} onChange={(e) => setCama(e.target.value)} className={CLASE_CAMPO} placeholder="Opcional" />
              </div>
            </div>
            <button
              type="button"
              onClick={guardarOrden}
              disabled={guardandoOrden}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {guardandoOrden ? 'Guardando…' : 'Guardar datos de la orden'}
            </button>
          </section>

          {/* Exámenes */}
          <section className="space-y-3 border-t border-slate-100 pt-5">
            <h4 className="flex items-center gap-2 text-sm font-black text-slate-900">
              <FlaskConical className="w-4 h-4 text-teal-600" /> Exámenes de la orden
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {orden.testsList.map((t, i) => (
                <span key={`${t}-${i}`} className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium">{t}</span>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">
              Total de la orden: <strong>{orden.totalPrice || '—'}</strong>. Los exámenes que ya tiene la orden no se pueden quitar desde aquí.
            </p>

            <div className="rounded-xl border border-slate-200 p-3 space-y-3 bg-slate-50/60">
              <p className="font-bold text-slate-800">Agregar exámenes</p>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar examen por nombre o código"
                  className={`${CLASE_CAMPO} pl-8`}
                />
              </div>
              <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                {disponibles.length === 0 ? (
                  <p className="p-3 text-slate-500">No hay exámenes que coincidan.</p>
                ) : (
                  disponibles.map((t) => {
                    const marcado = seleccion.includes(t.code);
                    return (
                      <button
                        type="button"
                        key={t.code}
                        onClick={() => alternar(t.code)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left cursor-pointer ${marcado ? 'bg-teal-50' : 'hover:bg-slate-50'}`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${marcado ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300'}`}>
                            {marcado && <Check className="w-3 h-3" />}
                          </span>
                          <span className="truncate font-medium text-slate-800">{t.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">{t.code}</span>
                        </span>
                        <span className="font-bold text-slate-700 shrink-0">{dinero(Number(t.price) || 0)}</span>
                      </button>
                    );
                  })
                )}
              </div>

              {seleccion.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Número de pago {montoElegido > 0 ? '*' : '(opcional)'}
                    </label>
                    <input
                      value={numeroPago}
                      onChange={(e) => setNumeroPago(e.target.value)}
                      placeholder="Boleta o recibo de caja"
                      className={`${CLASE_CAMPO} font-mono`}
                    />
                  </div>
                  <p className="text-slate-700">
                    {seleccion.length} examen(es) · a cobrar <strong>{dinero(montoElegido)}</strong>
                  </p>
                </div>
              )}

              {errorExamenes && (
                <p role="alert" className="text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5 font-medium">{errorExamenes}</p>
              )}

              <button
                type="button"
                onClick={agregarExamenes}
                disabled={agregando || seleccion.length === 0}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {agregando ? 'Agregando…' : 'Agregar a la orden'}
              </button>
              <p className="text-[11px] text-slate-500">
                Si la orden estaba lista o entregada, vuelve a «En Proceso» hasta capturar el resultado del examen nuevo.
              </p>
            </div>
          </section>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-bold text-slate-800 cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
