import React, { useMemo, useState } from 'react';
import type { CatalogoPublico } from '../../../services/publicoApiService';
import { completarConFabrica, componentesDe, esPanel, formatoPrecio, nombreCategoria, textoAyuno, textoEntrega } from '../../../utils/catalogoPublico';
import { TituloSeccion, AvisoGeneral } from './comunes';

/**
 * Paneles y perfiles: estudios que agrupan varias pruebas en una sola orden.
 * Solo se listan los que el laboratorio tiene activos y a la venta; el precio y
 * lo que incluye es lo que figura en su catálogo.
 */
export const PanelesPublicos: React.FC<{ catalogo: CatalogoPublico }> = ({ catalogo }) => {
  const [abierto, setAbierto] = useState<string | null>(null);

  const todos = useMemo(() => catalogo.examenes.map(completarConFabrica), [catalogo]);
  const paneles = useMemo(() => {
    const delCatalogo = todos.filter(esPanel).map((e) => ({
      codigo: e.codigo, nombre: e.nombre, precio: e.precio, descripcion: e.descripcion,
      muestra: e.tipoMuestra, entrega: textoEntrega(e.entregaHoras), ayuno: textoAyuno(e),
      componentes: componentesDe(e, todos), categoria: nombreCategoria(e.categoria, e.categoriaNombre),
    }));
    const codigos = new Set(delCatalogo.map((p) => p.codigo));
    const delLab = catalogo.perfiles.filter((p) => !codigos.has(p.codigo)).map((p) => ({
      codigo: p.codigo, nombre: p.nombre, precio: p.precio, descripcion: p.descripcion,
      muestra: null as string | null, entrega: null as string | null, ayuno: null as string | null,
      componentes: p.examenes, categoria: p.categoriaNombre || 'Perfiles del laboratorio',
    }));
    return [...delCatalogo, ...delLab].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [catalogo, todos]);

  return (
    <section aria-labelledby="titulo-paneles">
      <div id="titulo-paneles"><TituloSeccion titulo="Paneles Preventivos" subtitulo="Perfiles y paneles que reúnen varios estudios en una sola orden. Pregunta a tu médico cuál te conviene." /></div>
      {paneles.length === 0 ? (
        <p className="text-sm text-slate-600 py-8 text-center">El laboratorio todavía no ha publicado paneles o perfiles.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {paneles.map((p) => {
            const esAbierto = abierto === p.codigo;
            return (
              <li key={p.codigo} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{p.categoria}</p>
                <h2 className="font-extrabold text-slate-900 mt-0.5">{p.nombre}</h2>
                {p.descripcion && <p className="text-sm text-slate-600 mt-1">{p.descripcion}</p>}
                <p className="text-xs text-slate-500 mt-1">
                  {[p.muestra && `Muestra: ${p.muestra}`, p.entrega && `Entrega: ${p.entrega}`, p.ayuno].filter(Boolean).join(' · ')}
                </p>
                <div className="flex items-end justify-between gap-2 mt-3 pt-3 border-t border-slate-100 mt-auto">
                  <p className={`font-extrabold ${p.precio == null ? 'text-sm text-slate-400' : 'text-xl text-slate-900'}`}>{formatoPrecio(p.precio)}</p>
                  {p.componentes.length > 0 && (
                    <button onClick={() => setAbierto(esAbierto ? null : p.codigo)} aria-expanded={esAbierto}
                      className="text-xs font-bold text-teal-800 underline cursor-pointer">
                      {esAbierto ? 'Ocultar' : `Ver qué incluye (${p.componentes.length})`}
                    </button>
                  )}
                </div>
                {esAbierto && (
                  <ul className="list-disc pl-5 text-xs text-slate-700 mt-2 columns-1 sm:columns-2">
                    {p.componentes.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <AvisoGeneral>Los paneles son agrupaciones de pruebas; no indican por sí solos un diagnóstico. Los resultados deben ser interpretados por tu médico.</AvisoGeneral>
    </section>
  );
};
