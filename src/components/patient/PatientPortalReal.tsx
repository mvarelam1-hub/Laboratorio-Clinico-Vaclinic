import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  iniciarSesionPortal, obtenerInformesPortal, descargarPdfPortal, etiquetaEstado,
  PortalApiError, RespuestaInformesPortal, InformePortal
} from '../../services/portalApiService';

/**
 * Portal del Paciente REAL: el paciente escribe el código único de consulta
 * que le dio recepción y ve SOLO los informes ya publicados de su orden.
 * Sin pacientes de ejemplo, sin simuladores y sin texto generado por IA:
 * lo que se muestra es lo que firmó el laboratorio.
 */

const formatoFecha = (v: string | null) =>
  v ? new Date(v).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export const PatientPortalReal: React.FC = () => {
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
  }, []);

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
        <h1 className="text-2xl font-bold text-slate-900">Consulta tus resultados</h1>
        <p className="text-sm text-slate-600 mt-2">
          Escribe el código de consulta que aparece en tu orden o que te entregó recepción.
        </p>
        <form onSubmit={entrar} className="mt-6 space-y-3" noValidate>
          <label htmlFor="codigo-consulta" className="block text-sm font-semibold text-slate-800">Código de consulta</label>
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
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-300 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{datos.paciente}</h1>
          <p className="text-sm text-slate-600">Orden {datos.numeroOrden}</p>
        </div>
        <button onClick={() => cerrarSesion()} className="text-sm font-semibold border border-slate-400 rounded-lg px-3 py-2 hover:bg-slate-100 cursor-pointer">
          Cerrar sesión
        </button>
      </div>

      {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{error}</p>}

      {datos.informes.length === 0 ? (
        <div className="mt-8 border border-slate-300 rounded-lg p-6 text-slate-700">
          <p className="font-semibold">Tus resultados todavía no están publicados.</p>
          <p className="text-sm mt-1">Cuando el laboratorio los publique aparecerán aquí. Si ya pasó el tiempo indicado en tu orden, comunícate con el laboratorio.</p>
        </div>
      ) : (
        datos.informes.map((inf) => (
          <section key={inf.id} className="mt-8 border border-slate-300 rounded-lg overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-3 border-b border-slate-300">
              <div>
                <h2 className="font-bold text-slate-900">{inf.titulo}</h2>
                <p className="text-xs text-slate-600">
                  Informe {inf.numero} · Publicado el {formatoFecha(inf.fechaPublicacion)}
                  {inf.publicadoPor ? ` · Firma: ${inf.publicadoPor}` : ''}
                </p>
              </div>
              <button
                onClick={() => bajarPdf(inf)}
                disabled={descargando === inf.id}
                className="bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-sm font-bold rounded-lg px-4 py-2 cursor-pointer"
              >
                {descargando === inf.id ? 'Abriendo…' : 'Abrir PDF oficial'}
              </button>
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
        ))
      )}

      <p className="text-xs text-slate-500 mt-8">
        Estos resultados deben ser interpretados por tu médico. No sustituyen una consulta médica.
        Si algún valor aparece como crítico, comunícate con tu médico o con el laboratorio de inmediato.
      </p>
    </div>
  );
};
