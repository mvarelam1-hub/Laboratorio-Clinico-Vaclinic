import React, { useState } from 'react';
import type { ContenidoPublico, ContenidoPublicoRespuesta } from '../../../services/publicoApiService';
import { TituloSeccion, fechaLarga } from './comunes';

const Tarjeta: React.FC<{ c: ContenidoPublico; promo?: boolean }> = ({ c, promo }) => {
  const [abierta, setAbierta] = useState(false);
  const hayMas = !!c.cuerpo || !!c.enlace;
  return (
    <li className={`bg-white rounded-2xl p-5 border ${promo ? 'border-teal-300' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
        {c.etiqueta && <span className={`px-2 py-0.5 rounded-full ${promo ? 'bg-teal-100 text-teal-900' : 'bg-slate-100 text-slate-700'}`}>{c.etiqueta}</span>}
        <span className="text-slate-400">{fechaLarga(c.fechaPublicacion)}</span>
        {promo && c.vigenteHasta && <span className="text-teal-800">Vigente hasta el {fechaLarga(c.vigenteHasta)}</span>}
      </div>
      <h2 className="font-extrabold text-slate-900 text-lg mt-2">{c.titulo}</h2>
      {c.resumen && <p className="text-sm text-slate-700 mt-1">{c.resumen}</p>}
      {abierta && (
        <div className="mt-3 text-sm text-slate-800 space-y-2">
          {c.cuerpo && <p className="whitespace-pre-line">{c.cuerpo}</p>}
          {c.enlace && <p><a className="underline text-teal-800 font-bold" href={c.enlace} target="_blank" rel="noopener noreferrer">Ver más</a></p>}
        </div>
      )}
      {c.fuente && <p className="text-xs text-slate-500 mt-2">Fuente: {c.fuente}</p>}
      {hayMas && (
        <button onClick={() => setAbierta(!abierta)} aria-expanded={abierta} className="mt-2 text-xs font-bold text-teal-800 underline cursor-pointer">
          {abierta ? 'Mostrar menos' : promo ? 'Ver condiciones' : 'Leer más'}
        </button>
      )}
    </li>
  );
};

export const ListaContenido: React.FC<{ items: ContenidoPublico[]; promo?: boolean; vacio: string }> = ({ items, promo, vacio }) =>
  items.length === 0
    ? <p className="text-sm text-slate-600 py-6">{vacio}</p>
    : <ul className="grid gap-3 sm:grid-cols-2">{items.map((c) => <Tarjeta key={c.id} c={c} promo={promo} />)}</ul>;

/** Noticias de salud y promociones publicadas por el laboratorio (nada de relleno). */
export const NoticiasPublicas: React.FC<{ contenido: ContenidoPublicoRespuesta }> = ({ contenido }) => (
  <section aria-labelledby="titulo-noticias">
    <div id="titulo-noticias"><TituloSeccion titulo="Noticias y Salud" subtitulo="Consejos de salud y novedades del laboratorio." /></div>
    <ListaContenido items={contenido.noticias} vacio="Aún no hay noticias publicadas. Vuelve pronto." />

    <h2 className="text-xl font-extrabold text-slate-900 mt-8 mb-3">Promociones vigentes</h2>
    <ListaContenido items={contenido.promociones} promo vacio="Por ahora no hay promociones vigentes. Consulta en recepción." />
  </section>
);
