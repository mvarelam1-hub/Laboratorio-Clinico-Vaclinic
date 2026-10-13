import React, { useEffect, useState } from 'react';
import { fechaLarga } from './comunes';

interface NoticiaExterna {
  titulo: string;
  resumen: string;
  enlace: string;
  fecha: string | null;
  fuente: string;
  tema: string;
}

/**
 * Titulares de salud de una fuente externa (LabMedica en Español), leídos por
 * el servidor y renovados solos. Solo se muestra titular, resumen corto y el
 * enlace a la página original: el contenido completo es de la fuente.
 * Si la fuente no responde, la sección simplemente no aparece.
 */
export const NoticiasExternas: React.FC = () => {
  const [items, setItems] = useState<NoticiaExterna[] | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch('/api/publico/noticias-externas')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (vivo) setItems(Array.isArray(d) ? d : []); })
      .catch(() => { if (vivo) setItems([]); });
    return () => { vivo = false; };
  }, []);

  if (items === null) {
    return <p className="text-sm text-slate-500 mt-8" role="status">Cargando noticias de salud…</p>;
  }
  const validas = items.filter((n) => typeof n.enlace === 'string' && n.enlace.startsWith('https://'));
  if (validas.length === 0) return null;

  return (
    <section aria-labelledby="titulo-noticias-externas" className="mt-8">
      <h2 id="titulo-noticias-externas" className="text-xl font-extrabold text-slate-900 mb-1">Actualidad en salud y laboratorio</h2>
      <p className="text-xs text-slate-500 mb-3">
        Titulares de {validas[0].fuente}, actualizados automáticamente. Información general: no sustituye la consulta con su médico.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {validas.map((n) => (
          <li key={n.enlace} className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-900">{n.tema}</span>
              {n.fecha && <span className="text-slate-400">{fechaLarga(n.fecha)}</span>}
            </div>
            <h3 className="font-extrabold text-slate-900 text-base mt-2">{n.titulo}</h3>
            {n.resumen && <p className="text-sm text-slate-700 mt-1">{n.resumen}</p>}
            <p className="text-xs text-slate-500 mt-auto pt-3">
              Fuente: {n.fuente} ·{' '}
              <a className="underline text-teal-800 font-bold" href={n.enlace} target="_blank" rel="noopener noreferrer">Leer la noticia completa</a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};
