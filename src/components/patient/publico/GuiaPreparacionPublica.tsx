import React, { useMemo, useState } from 'react';
import type { CatalogoPublico } from '../../../services/publicoApiService';
import { SECCIONES_GUIA, PREGUNTAS_FRECUENTES } from '../../../data/guiaPreparacion';
import { completarConFabrica, filtrarCatalogo, textoAyuno } from '../../../utils/catalogoPublico';
import { TituloSeccion, AvisoGeneral } from './comunes';

/** Guía de preparación: indicaciones generales + lo que el laboratorio escribió por prueba. */
export const GuiaPreparacionPublica: React.FC<{ catalogo: CatalogoPublico }> = ({ catalogo }) => {
  const [texto, setTexto] = useState('');
  const [abierta, setAbierta] = useState<string | null>('antes');
  const [faq, setFaq] = useState<number | null>(null);

  // Solo pruebas con una indicación real (ayuno o instrucciones) escrita por el laboratorio.
  const conIndicacion = useMemo(
    () => catalogo.examenes.map(completarConFabrica).filter((e) => textoAyuno(e) || e.instrucciones),
    [catalogo]
  );
  const visibles = useMemo(() => filtrarCatalogo(conIndicacion, texto, null), [conIndicacion, texto]);

  return (
    <section aria-labelledby="titulo-guia">
      <div id="titulo-guia"><TituloSeccion titulo="Guía de Preparación" subtitulo="Cómo prepararte para que tu muestra sea la correcta y tu resultado sea confiable." /></div>

      <p className="text-sm bg-amber-50 border border-amber-300 text-amber-950 rounded-lg px-4 py-3 mb-5">
        Estas son indicaciones generales. Si el laboratorio o tu médico te dieron instrucciones distintas para tu examen, sigue esas.
      </p>

      <div className="grid gap-2 mb-8">
        {SECCIONES_GUIA.map((s) => {
          const abiertaS = abierta === s.id;
          return (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl">
              <button onClick={() => setAbierta(abiertaS ? null : s.id)} aria-expanded={abiertaS} aria-controls={`guia-${s.id}`}
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 cursor-pointer">
                <span>
                  <span className="block font-bold text-slate-900">{s.titulo}</span>
                  <span className="block text-xs text-slate-500">{s.resumen}</span>
                </span>
                <span aria-hidden="true" className="text-slate-400 font-bold">{abiertaS ? '−' : '+'}</span>
              </button>
              {abiertaS && (
                <ul id={`guia-${s.id}`} className="px-4 pb-4 list-disc pl-9 text-sm text-slate-700 space-y-1.5">
                  {s.pasos.map((p) => <li key={p}>{p}</li>)}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="text-lg font-extrabold text-slate-900 mb-1">Indicaciones específicas por prueba</h2>
      {conIndicacion.length === 0 ? (
        <p className="text-sm text-slate-600 mb-8">
          El laboratorio todavía no ha registrado indicaciones por cada prueba. Pregunta en recepción qué necesitas para tu examen.
        </p>
      ) : (
        <div className="mb-8">
          <label className="sr-only" htmlFor="buscar-indicacion">Buscar una prueba</label>
          <input id="buscar-indicacion" type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar una prueba"
            className="w-full sm:w-96 border border-slate-400 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-teal-600" />
          <ul className="grid gap-2">
            {visibles.map((e) => (
              <li key={e.codigo} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
                <p className="font-bold text-slate-900">{e.nombre}</p>
                {textoAyuno(e) && <p className="text-slate-700"><span className="font-bold">Ayuno: </span>{textoAyuno(e)}</p>}
                {e.instrucciones && <p className="text-slate-700">{e.instrucciones}</p>}
              </li>
            ))}
            {visibles.length === 0 && <li className="text-sm text-slate-600">Ninguna prueba coincide con la búsqueda.</li>}
          </ul>
        </div>
      )}

      <h2 className="text-lg font-extrabold text-slate-900 mb-2">Preguntas frecuentes</h2>
      <div className="grid gap-2">
        {PREGUNTAS_FRECUENTES.map((q, i) => (
          <div key={q.pregunta} className="bg-white border border-slate-200 rounded-xl">
            <button onClick={() => setFaq(faq === i ? null : i)} aria-expanded={faq === i}
              className="w-full text-left px-4 py-3 flex justify-between gap-3 font-bold text-sm text-slate-900 cursor-pointer">
              {q.pregunta}<span aria-hidden="true" className="text-slate-400">{faq === i ? '−' : '+'}</span>
            </button>
            {faq === i && <p className="px-4 pb-3 text-sm text-slate-700">{q.respuesta}</p>}
          </div>
        ))}
      </div>
      <AvisoGeneral>Esta guía es informativa y no sustituye la indicación de tu médico.</AvisoGeneral>
    </section>
  );
};
