import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  iniciarSesionPortal, obtenerInformesPortal, descargarPdfPortal, etiquetaEstado,
  PortalApiError, RespuestaInformesPortal, InformePortal
} from '../../services/portalApiService';

/**
 * Consulta de resultados del Portal del Paciente REAL (se muestra dentro de
 * PortalPublico, junto al catálogo, la guía y las noticias): el paciente escribe el código único de consulta
 * que le dio recepción y ve SOLO los informes ya publicados de su orden.
 * Sin pacientes de ejemplo, sin simuladores y sin texto generado por IA:
 * lo que se muestra es lo que firmó el laboratorio.
 */

const formatoFecha = (v: string | null) =>
  v ? new Date(v).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export const ConsultaResultados: React.FC<{ alCambiarSesion?: (token: string | null) => void }> = ({ alCambiarSesion }) => {
  const [codigo, setCodigo] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [datos, setDatos] = useState<RespuestaInformesPortal | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState<number | null>(null);
  const temporizador = useRef<number | undefined>(undefined);

  const cerrarSesion = useCallback((mensaje?: string) => {
    window.clearTimeout(temporizador.current);
    setToken(null);
    setDatos(null);
    setCodigo('');
    setError(mensaje ?? null);
    alCambiarSesion?.(null);
  }, [alCambiarSesion]);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) { setError('Escribe el código de consulta que aparece en tu orden.'); return; }
    setCargando(true);
    setError(null);
    try {
      const sesion = await iniciarSesionPortal(codigo);
      const respuesta = await obtenerInformesPortal(sesion.token);
      setToken(sesion.token);
      setDatos(respuesta);
      alCambiarSesion?.(sesion.token);
      // La sesión del servidor dura 15 min: se cierra sola un poco antes.
      temporizador.current = window.setTimeout(
        () => cerrarSesion('Por tu seguridad la sesión se cerró. Ingresa tu código otra vez para continuar.'),
        Math.max(30, sesion.expiresInSeconds - 20) * 1000
      );
    } catch (err) {
      setError(err instanceof PortalApiError ? err.message : 'No se pudo consultar. Inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  const bajarPdf = async (inf: InformePortal) => {
    if (!token) return;
    setDescargando(inf.id);
    setError(null);
    try {
      const blob = await descargarPdfPortal(token, inf.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      if (err instanceof PortalApiError && err.sesionVencida) cerrarSesion('Tu sesión venció. Ingresa tu código otra vez.');
      else setError(err instanceof PortalApiError ? err.message : 'No se pudo abrir el informe.');
    } finally {
      setDescargando(null);
    }
  };

  // ---------------- Pantalla de ingreso ----------------
  if (!token || !datos) {
    return (
      <div className="max-w-md mx-auto py-10 sm:py-16">
        <h1 className="text-2xl font-bold text-slate-900">Consultar mis resultados</h1>
        <p className="text-sm text-slate-600 mt-2">
          Escribe tu código de consulta (PIN): el que aparece en tu orden o que te entregó recepción.
        </p>
        <form onSubmit={entrar} className="mt-6 space-y-3" noValidate>
          <label htmlFor="codigo-consulta" className="block text-sm font-semibold text-slate-800">Código de consulta (PIN)</label>
          <input
            id="codigo-consulta"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full border border-slate-400 rounded-lg px-3 py-3 text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-600"
            placeholder="Ej.: A1B2C3D4"
          />
          {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold rounded-lg py-3 cursor-pointer"
          >
            {cargando ? 'Consultando…' : 'Ver mis resultados'}
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-6">
          ¿No tienes tu código? Pídelo en recepción del laboratorio. Solo verás informes que el laboratorio ya haya publicado.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          ¿Recibiste un informe y quieres comprobar que es auténtico? <a href="/verificar" className="underline text-teal-800">Verifícalo aquí</a>.
        </p>
      </div>
    );
  }

  // ---------------- Resultados ----------------
  const pasos = datos.seguimiento?.pasos ?? [];
  const fechaCorta = (v: string | null | undefined) =>
    v ? new Date(v).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  const hayPublicados = datos.informes.length > 0;

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-5">
      <div className="flex items-center justify-between gap-3 bg-white rounded-3xl shadow-md border border-slate-200/70 px-6 py-5">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Bienvenido/a</p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase break-words">{datos.paciente}</h1>
        </div>
        <button onClick={() => cerrarSesion()} className="text-sm font-bold text-slate-500 hover:text-slate-800 px-2 py-1 cursor-pointer shrink-0">
          Salir
        </button>
      </div>

      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}

      <section className="bg-white rounded-3xl shadow-md border border-slate-200/70 px-6 py-6" aria-label="Seguimiento de tu orden">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Orden {datos.numeroOrden}</p>
        {datos.seguimiento?.fechaOrden && <p className="text-sm text-slate-500">Fecha: {fechaCorta(datos.seguimiento.fechaOrden)}</p>}

        {pasos.length > 0 && (
          <ol className="mt-5">
            {pasos.map((paso, i) => (
              <li key={paso.clave} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    aria-hidden="true"
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 ${paso.completado ? 'bg-emerald-600' : 'bg-white border-2 border-slate-300'}`}
                  >
                    {paso.completado ? '✓' : ''}
                  </span>
                  {i < pasos.length - 1 && <span className={`w-0.5 flex-1 min-h-5 ${paso.completado && pasos[i + 1].completado ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
                </div>
                <div className="pb-4">
                  <p className={`text-sm font-bold leading-6 ${paso.completado ? 'text-emerald-800' : 'text-slate-500'}`}>
                    {paso.etiqueta}
                    <span className="sr-only">{paso.completado ? ' (completado)' : ' (pendiente)'}</span>
                  </p>
                  {paso.completado && paso.fecha && <p className="text-xs text-slate-500">{fechaCorta(paso.fecha)}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}

        {hayPublicados ? (
          <div className="border-t border-slate-200 pt-4 mt-1 flex flex-wrap gap-2">
            {datos.informes.map((inf) => (
              <button
                key={inf.id}
                onClick={() => bajarPdf(inf)}
                disabled={descargando === inf.id}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-bold rounded-full px-5 py-2.5 cursor-pointer"
              >
                {descargando === inf.id ? 'Abriendo…' : datos.informes.length > 1 ? `Ver / Descargar / Imprimir PDF · ${inf.titulo}` : 'Ver / Descargar / Imprimir PDF'}
              </button>
            ))}
          </div>
        ) : (
          <p className="border-t border-slate-200 pt-4 mt-1 text-sm text-slate-600">
            {!pasos.find((x) => x.clave === 'muestra')?.completado
              ? 'El laboratorio todavía no registra la recepción de tu muestra.'
              : !pasos.find((x) => x.clave === 'ingresados')?.completado
                ? 'Tu muestra ya fue recibida y tus exámenes están en proceso.'
                : 'Tus resultados ya fueron ingresados y están en revisión del laboratorio.'}{' '}
            Aparecerán aquí cuando el laboratorio los publique. Si ya pasó el tiempo indicado en tu orden, comunícate con el laboratorio.
          </p>
        )}
      </section>

      {datos.informes.map((inf) => (
          <section key={inf.id} className="bg-white rounded-3xl shadow-md border border-slate-200/70 overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-5 py-3 border-b border-slate-200">
              <div>
                <h2 className="font-bold text-slate-900">{inf.titulo}</h2>
                <p className="text-xs text-slate-600">
                  Informe {inf.numero} · Publicado el {formatoFecha(inf.fechaPublicacion)}
                  {inf.publicadoPor ? ` · Firma: ${inf.publicadoPor}` : ''}
                </p>
              </div>
            </header>

            {inf.parametros.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-600 border-b border-slate-300">
                      <th className="px-4 py-2 font-semibold">Examen</th>
                      <th className="px-4 py-2 font-semibold">Resultado</th>
                      <th className="px-4 py-2 font-semibold">Valores de referencia</th>
                      <th className="px-4 py-2 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inf.parametros.map((p, i) => {
                      const est = etiquetaEstado(p.estado);
                      return (
                        <tr key={`${p.nombre}-${i}`} className="border-b border-slate-200 last:border-0">
                          <td className="px-4 py-2 text-slate-900">{p.nombre}</td>
                          <td className={`px-4 py-2 ${est.anormal ? 'font-bold' : ''} text-slate-900`}>{String(p.valor)} <span className="text-slate-600 font-normal">{p.unidad}</span></td>
                          <td className="px-4 py-2 text-slate-700">{p.referencia || '—'}</td>
                          <td className={`px-4 py-2 ${est.critico ? 'font-bold text-red-700' : est.anormal ? 'font-bold text-slate-900' : 'text-slate-700'}`}>{est.texto}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {inf.conclusion && inf.conclusion.trim() && (
              <div className="px-4 py-3 border-t border-slate-300">
                <h3 className="text-xs uppercase tracking-wide font-semibold text-slate-600">Conclusión del laboratorio</h3>
                <p className="text-sm text-slate-900 mt-1 whitespace-pre-line">{inf.conclusion}</p>
              </div>
            )}
            {inf.recomendaciones.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-300">
                <h3 className="text-xs uppercase tracking-wide font-semibold text-slate-600">Recomendaciones</h3>
                <ul className="list-disc pl-5 text-sm text-slate-900 mt-1">
                  {inf.recomendaciones.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </section>
      ))}

      <p className="text-xs text-slate-500 pt-2">
        Estos resultados deben ser interpretados por tu médico. No sustituyen una consulta médica.
        Si algún valor aparece como crítico, comunícate con tu médico o con el laboratorio de inmediato.
      </p>
    </div>
  );
};
