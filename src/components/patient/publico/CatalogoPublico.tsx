import React, { useEffect, useMemo, useState } from 'react';
import type { CatalogoPublico as Catalogo } from '../../../services/publicoApiService';
import {
  completarConFabrica, categoriasConConteo, filtrarCatalogo, formatoPrecio, textoEntrega, textoAyuno, componentesDe
} from '../../../utils/catalogoPublico';
import { TituloSeccion, AvisoGeneral } from './comunes';
import { PrecioReservado } from './AvisoPrecios';
import { calcularCotizacion, pruebasYaIncluidas, textoCotizacion, enlaceCotizacion, MAX_PRUEBAS_COTIZACION } from '../../../utils/cotizacion';

interface Props {
  catalogo: Catalogo; categoriaInicial?: string | null;
  /** Aviso que se muestra cuando los precios no están autorizados. */ avisoPrecios?: React.ReactNode;
  /** Contacto del laboratorio para enviar la cotización por WhatsApp. */ whatsapp?: string | null; nombreLab?: string;
}

const CLAVE_SELECCION = 'vaclinic_cotizacion';
// Solo se guardan códigos de pruebas (nunca precios) y solo en esta pestaña.
const leerSeleccion = (): string[] => {
  try { const v = JSON.parse(sessionStorage.getItem(CLAVE_SELECCION) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch { return []; }
};

/** Catálogo de pruebas REAL: solo lo activo y a la venta. El precio solo se ve con sesión del portal (código de consulta). */
export const CatalogoPublico: React.FC<Props> = ({ catalogo, categoriaInicial = null, avisoPrecios, whatsapp = null, nombreLab = 'el laboratorio' }) => {
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState<string | null>(categoriaInicial);
  const [abierto, setAbierto] = useState<string | null>(null);

  const todos = useMemo(() => catalogo.examenes.map(completarConFabrica), [catalogo]);
  const categorias = useMemo(() => categoriasConConteo(todos), [todos]);
  const lista = useMemo(() => filtrarCatalogo(todos, texto, categoria), [todos, texto, categoria]);

  // Cotizador: códigos elegidos (se descartan los que ya no existen en el catálogo).
  const [seleccion, setSeleccion] = useState<string[]>(leerSeleccion);
  const [copiado, setCopiado] = useState(false);
  const porCodigo = useMemo(() => new Map(todos.map((e) => [e.codigo, e])), [todos]);
  const elegidas = useMemo(() => seleccion.map((c) => porCodigo.get(c)).filter((e): e is NonNullable<typeof e> => !!e), [seleccion, porCodigo]);
  useEffect(() => { try { sessionStorage.setItem(CLAVE_SELECCION, JSON.stringify(seleccion)); } catch { /* sin almacenamiento: se usa solo en memoria */ } }, [seleccion]);
  const cotizacion = useMemo(() => calcularCotizacion(elegidas, catalogo.preciosVisibles), [elegidas, catalogo.preciosVisibles]);
  const yaIncluidas = useMemo(() => pruebasYaIncluidas(elegidas, todos), [elegidas, todos]);
  const textoCot = useMemo(() => textoCotizacion(cotizacion, nombreLab), [cotizacion, nombreLab]);
  const enlaceCot = useMemo(() => enlaceCotizacion(whatsapp, textoCot), [whatsapp, textoCot]);
  const alternar = (codigo: string) => setSeleccion((s) => s.includes(codigo) ? s.filter((c) => c !== codigo) : s.length >= MAX_PRUEBAS_COTIZACION ? s : [...s, codigo]);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(textoCot); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* el navegador no permite copiar */ }
  };
  const hayPaquetes = categorias.some((c) => c.codigo === '10_paquetes_especiales');

  return (
    <section aria-labelledby="titulo-catalogo">
      <div id="titulo-catalogo"><TituloSeccion titulo="Catálogo de Pruebas" subtitulo={catalogo.preciosVisibles ? 'Estas son las pruebas que ofrece el laboratorio, con su precio actual.' : 'Estas son las pruebas que ofrece el laboratorio.'} /></div>
      {!catalogo.preciosVisibles && avisoPrecios}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <label className="sr-only" htmlFor="buscar-prueba">Buscar una prueba</label>
        <input
          id="buscar-prueba" type="search" value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar una prueba (ej.: glucosa, orina, hemograma)"
          className="flex-1 border border-slate-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filtrar por categoría">
        <button onClick={() => setCategoria(null)} aria-pressed={categoria === null}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${categoria === null ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'}`}>
          Todas ({todos.length})
        </button>
        {categorias.map((c) => (
          <button key={c.codigo} onClick={() => setCategoria(c.codigo)} aria-pressed={categoria === c.codigo}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer ${categoria === c.codigo ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-500'}`}>
            {c.nombre} ({c.total})
          </button>
        ))}
      </div>

      {todos.length === 0 ? (
        <p className="text-sm text-slate-600 py-8 text-center">El laboratorio todavía no ha publicado su catálogo. Consulta en recepción.</p>
      ) : lista.length === 0 ? (
        <p className="text-sm text-slate-600 py-8 text-center">No encontramos pruebas con esa búsqueda.</p>
      ) : (
        <ul className="grid gap-2">
          {lista.map((e) => {
            const ayuno = textoAyuno(e);
            const entrega = textoEntrega(e.entregaHoras);
            const comp = e.esPerfil || e.parametros.length ? componentesDe(e, todos) : [];
            const hayDetalle = !!(e.descripcion || e.instrucciones || comp.length);
            const esAbierto = abierto === e.codigo;
            return (
              <li key={e.codigo} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{e.nombre}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[e.tipoMuestra && `Muestra: ${e.tipoMuestra}`, entrega && `Entrega: ${entrega}`].filter(Boolean).join(' · ')}
                    </p>
                    {ayuno && <span className="inline-block mt-1 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5">{ayuno}</span>}
                  </div>
                  {catalogo.preciosVisibles
                    ? <p className={`text-lg font-extrabold shrink-0 ${e.precio == null ? 'text-slate-400 text-sm' : 'text-slate-900'}`}>{formatoPrecio(e.precio)}</p>
                    : <PrecioReservado />}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => alternar(e.codigo)} aria-pressed={seleccion.includes(e.codigo)}
                    disabled={!seleccion.includes(e.codigo) && seleccion.length >= MAX_PRUEBAS_COTIZACION}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer disabled:opacity-50 ${seleccion.includes(e.codigo) ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-teal-800 border-teal-600 hover:bg-teal-50'}`}>
                    {seleccion.includes(e.codigo) ? 'Agregada a mi cotización ✓' : 'Agregar a mi cotización'}
                  </button>
                </div>
                {hayDetalle && (
                  <>
                    <button onClick={() => setAbierto(esAbierto ? null : e.codigo)} aria-expanded={esAbierto}
                      className="mt-2 text-xs font-bold text-teal-800 underline cursor-pointer">
                      {esAbierto ? 'Ocultar detalle' : 'Ver detalle'}
                    </button>
                    {esAbierto && (
                      <div className="mt-2 text-sm text-slate-700 space-y-2">
                        {e.descripcion && <p>{e.descripcion}</p>}
                        {e.instrucciones && <p><span className="font-bold">Indicaciones del laboratorio: </span>{e.instrucciones}</p>}
                        {comp.length > 0 && (
                          <div>
                            <p className="font-bold">Incluye:</p>
                            <ul className="list-disc pl-5 text-xs columns-1 sm:columns-2">{comp.map((n) => <li key={n}>{n}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {elegidas.length > 0 && (
        <div className="sticky bottom-3 z-20 mt-4 flex items-center justify-between gap-3 bg-teal-800 text-white rounded-xl px-4 py-2.5 shadow-lg">
          <p className="text-sm font-bold">
            {elegidas.length} {elegidas.length === 1 ? 'prueba' : 'pruebas'} en mi cotización{cotizacion.total != null ? ` · ${formatoPrecio(cotizacion.total)}` : ''}
          </p>
          <button type="button" onClick={() => document.getElementById('titulo-cotizacion')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="px-3 py-1.5 rounded-lg bg-white text-teal-900 text-xs font-bold cursor-pointer">Ver mi cotización</button>
        </div>
      )}
      {elegidas.length > 0 && (
        <aside aria-labelledby="titulo-cotizacion" className="mt-6 bg-white border-2 border-teal-700 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="titulo-cotizacion" className="text-lg font-extrabold text-slate-900">Mi cotización ({elegidas.length} {elegidas.length === 1 ? 'prueba' : 'pruebas'})</h2>
            <button type="button" onClick={() => setSeleccion([])} className="text-xs font-bold text-slate-600 underline cursor-pointer">Vaciar lista</button>
          </div>
          <ul className="mt-3 divide-y divide-slate-200">
            {elegidas.map((e) => (
              <li key={e.codigo} className="py-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{e.nombre}</p>
                  {yaIncluidas.has(e.codigo) && (
                    <p className="text-xs text-amber-800 mt-0.5">Ya está incluida en «{yaIncluidas.get(e.codigo)}»; puedes quitarla para no pagarla dos veces.</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {catalogo.preciosVisibles && <span className={`text-sm font-bold ${e.precio == null ? 'text-slate-400' : 'text-slate-900'}`}>{e.precio == null ? 'Por confirmar' : formatoPrecio(e.precio)}</span>}
                  <button type="button" onClick={() => alternar(e.codigo)} aria-label={`Quitar ${e.nombre}`} className="text-xs font-bold text-red-700 underline cursor-pointer">Quitar</button>
                </div>
              </li>
            ))}
          </ul>
          {cotizacion.total != null ? (
            <div className="mt-3 pt-3 border-t-2 border-slate-300 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Total estimado</span>
              <span className="text-2xl font-extrabold text-slate-900">{formatoPrecio(cotizacion.total)}</span>
            </div>
          ) : (
            <p className="mt-3 text-sm text-amber-950 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
              Los precios no son públicos, por eso aquí no se calcula un total. Envía tu lista por WhatsApp y el laboratorio te dará el precio y las ofertas vigentes, o ingresa tu código de consulta para verlos.
            </p>
          )}
          {cotizacion.sinPrecio > 0 && <p className="mt-2 text-xs text-slate-600">{cotizacion.sinPrecio} {cotizacion.sinPrecio === 1 ? 'prueba tiene' : 'pruebas tienen'} el precio por confirmar y no está incluida en el total.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {enlaceCot ? (
              <a href={enlaceCot} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold">
                {cotizacion.total != null ? 'Enviar cotización por WhatsApp' : 'Pedir cotización por WhatsApp'}
              </a>
            ) : (
              <span className="px-3 py-2 text-xs font-semibold text-slate-700">Pide tu cotización en recepción con esta lista.</span>
            )}
            <button type="button" onClick={copiar} className="px-4 py-2 rounded-lg border border-slate-400 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold cursor-pointer">
              {copiado ? 'Copiado ✓' : 'Copiar lista'}
            </button>
            {hayPaquetes && categoria !== '10_paquetes_especiales' && (
              <button type="button" onClick={() => { setCategoria('10_paquetes_especiales'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="px-4 py-2 rounded-lg border border-teal-600 bg-teal-50 hover:bg-teal-100 text-teal-900 text-sm font-bold cursor-pointer">
                Ver paquetes especiales
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">Cotización informativa: el precio final se confirma en recepción al registrar tu orden.</p>
        </aside>
      )}
      <AvisoGeneral>{catalogo.preciosVisibles ? 'Los precios y tiempos pueden cambiar; confirma en recepción al registrar tu orden. ' : 'Los tiempos pueden cambiar; confirma en recepción al registrar tu orden. '}Los resultados deben ser interpretados por tu médico.</AvisoGeneral>
    </section>
  );
};
