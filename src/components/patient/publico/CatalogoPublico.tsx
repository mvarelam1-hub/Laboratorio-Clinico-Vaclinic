import React, { useMemo, useState } from 'react';
import type { CatalogoPublico as Catalogo } from '../../../services/publicoApiService';
import {
  completarConFabrica, categoriasConConteo, filtrarCatalogo, formatoPrecio, textoEntrega, textoAyuno, componentesDe
} from '../../../utils/catalogoPublico';
import { TituloSeccion, AvisoGeneral } from './comunes';

interface Props { catalogo: Catalogo; categoriaInicial?: string | null; }

/** Catálogo de pruebas REAL: solo lo activo y a la venta, con el precio vigente del laboratorio. */
export const CatalogoPublico: React.FC<Props> = ({ catalogo, categoriaInicial = null }) => {
  const [texto, setTexto] = useState('');
  const [categoria, setCategoria] = useState<string | null>(categoriaInicial);
  const [abierto, setAbierto] = useState<string | null>(null);

  const todos = useMemo(() => catalogo.examenes.map(completarConFabrica), [catalogo]);
  const categorias = useMemo(() => categoriasConConteo(todos), [todos]);
  const lista = useMemo(() => filtrarCatalogo(todos, texto, categoria), [todos, texto, categoria]);

  return (
    <section aria-labelledby="titulo-catalogo">
      <div id="titulo-catalogo"><TituloSeccion titulo="Catálogo de Pruebas" subtitulo="Estas son las pruebas que ofrece el laboratorio, con su precio actual." /></div>

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
                  <p className={`text-lg font-extrabold shrink-0 ${e.precio == null ? 'text-slate-400 text-sm' : 'text-slate-900'}`}>{formatoPrecio(e.precio)}</p>
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
      <AvisoGeneral>Los precios y tiempos pueden cambiar; confirma en recepción al registrar tu orden. Los resultados deben ser interpretados por tu médico.</AvisoGeneral>
    </section>
  );
};
