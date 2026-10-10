import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import {
  obtenerCatalogoPublico, obtenerContenidoPublico, obtenerLaboratorioPublico,
  CatalogoPublico as Catalogo, ContenidoPublicoRespuesta, LaboratorioPublico
} from '../../../services/publicoApiService';
import { ConsultaResultados } from '../PatientPortalReal';
import { CatalogoPublico } from './CatalogoPublico';
import { GuiaPreparacionPublica } from './GuiaPreparacionPublica';
import { PanelesPublicos } from './PanelesPublicos';
import { NoticiasPublicas, ListaContenido } from './NoticiasPublicas';
import { EstadoCarga, TarjetaContacto, TituloSeccion } from './comunes';
import { categoriasConConteo, completarConFabrica } from '../../../utils/catalogoPublico';
import { contactoFinal } from '../../../data/contactoLaboratorio';
import { PortadaLogin, ImagenPortada, usePortadaImagenes } from '../../staff/PortadaLogin';

const AtlasPublico = lazy(() => import('./AtlasPublico'));

export type VistaPortal = 'inicio' | 'resultados' | 'catalogo' | 'preparacion' | 'paneles' | 'atlas' | 'noticias' | 'contacto';

const MENU: { id: VistaPortal; etiqueta: string }[] = [
  { id: 'inicio', etiqueta: 'Inicio' },
  { id: 'resultados', etiqueta: 'Consultar mis Resultados' },
  { id: 'catalogo', etiqueta: 'Catálogo de Pruebas' },
  { id: 'preparacion', etiqueta: 'Guía de Preparación' },
  { id: 'paneles', etiqueta: 'Paneles Preventivos' },
  { id: 'atlas', etiqueta: 'Atlas Microscópico' },
  { id: 'noticias', etiqueta: 'Noticias y Salud' },
  { id: 'contacto', etiqueta: 'Contacto' },
];

export const vistaDesdeHash = (hash: string): VistaPortal => {
  const id = hash.replace(/^#\/?/, '').split('?')[0] as VistaPortal;
  return MENU.some((m) => m.id === id) ? id : 'inicio';
};

function useCarga<T>(cargar: () => Promise<T>) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const recargar = useCallback(() => {
    setCargando(true); setError(null);
    cargar().then(setDatos).catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar.')).finally(() => setCargando(false));
  }, [cargar]);
  useEffect(() => { recargar(); }, [recargar]);
  return { datos, error, cargando, recargar };
}

/** Portal público del paciente: resultados + información del laboratorio (todo real, nada de relleno). */
export const PortalPublico: React.FC = () => {
  const [vista, setVista] = useState<VistaPortal>(() => vistaDesdeHash(window.location.hash));
  const [categoria, setCategoria] = useState<string | null>(null);

  useEffect(() => {
    const alCambiar = () => setVista(vistaDesdeHash(window.location.hash));
    window.addEventListener('hashchange', alCambiar);
    return () => window.removeEventListener('hashchange', alCambiar);
  }, []);

  const ir = (v: VistaPortal) => { window.location.hash = `/${v}`; window.scrollTo({ top: 0 }); };

  const lab = useCarga<LaboratorioPublico>(obtenerLaboratorioPublico);
  const cat = useCarga<Catalogo>(obtenerCatalogoPublico);
  const con = useCarga<ContenidoPublicoRespuesta>(obtenerContenidoPublico);

  const contacto = useMemo(() => contactoFinal(lab.datos), [lab.datos]);
  const nombreLab = contacto.nombre || 'Laboratorio Clínico';

  return (
    <div className="max-w-6xl mx-auto">
      <header className="pt-2 pb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Portal del Paciente</p>
        <p className="text-lg font-extrabold text-slate-900">{nombreLab}</p>
      </header>
      <nav aria-label="Secciones del portal" className="sticky top-0 z-20 -mx-3 sm:mx-0 px-3 sm:px-0 bg-slate-100/95 backdrop-blur border-b border-slate-300 mb-6">
        <ul className="flex gap-1 overflow-x-auto py-2">
          {MENU.map((m) => (
            <li key={m.id} className="shrink-0">
              <a
                href={`#/${m.id}`}
                aria-current={vista === m.id ? 'page' : undefined}
                className={`block px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${vista === m.id ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-white'}`}
              >
                {m.etiqueta}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="pb-10">
        {vista === 'inicio' && (
          <Inicio lab={contacto} catalogo={cat.datos} contenido={con.datos} ir={ir}
            verCategoria={(c) => { setCategoria(c); ir('catalogo'); }} />
        )}
        {/* Siempre montado (oculto) para no perder la sesión del paciente al mirar otras secciones. */}
        <div hidden={vista !== 'resultados'}><ConsultaResultados /></div>
        {vista === 'catalogo' && (
          <EstadoCarga cargando={cat.cargando} error={cat.error} onReintentar={cat.recargar}>
            {cat.datos && <CatalogoPublico key={categoria ?? 'todas'} catalogo={cat.datos} categoriaInicial={categoria} />}
          </EstadoCarga>
        )}
        {vista === 'preparacion' && (
          <EstadoCarga cargando={cat.cargando} error={cat.error} onReintentar={cat.recargar}>
            {cat.datos && <GuiaPreparacionPublica catalogo={cat.datos} />}
          </EstadoCarga>
        )}
        {vista === 'paneles' && (
          <EstadoCarga cargando={cat.cargando} error={cat.error} onReintentar={cat.recargar}>
            {cat.datos && <PanelesPublicos catalogo={cat.datos} />}
          </EstadoCarga>
        )}
        {vista === 'atlas' && <Suspense fallback={<p role="status" className="text-sm text-slate-500 py-8 text-center">Cargando…</p>}><AtlasPublico /></Suspense>}
        {vista === 'noticias' && (
          <EstadoCarga cargando={con.cargando} error={con.error} onReintentar={con.recargar}>
            {con.datos && <NoticiasPublicas contenido={con.datos} />}
          </EstadoCarga>
        )}
        {vista === 'contacto' && (
          <section aria-labelledby="titulo-contacto">
            <div id="titulo-contacto"><TituloSeccion titulo="Contacto" subtitulo={`Escríbenos o visítanos en ${nombreLab}.`} /></div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <TarjetaContacto lab={contacto} />
              </div>
          </section>
        )}
      </div>
    </div>
  );
};

interface InicioProps {
  lab: LaboratorioPublico | null;
  catalogo: Catalogo | null;
  contenido: ContenidoPublicoRespuesta | null;
  ir: (v: VistaPortal) => void;
  verCategoria: (codigo: string) => void;
}

const PASOS = [
  { n: '1', t: 'Visita el laboratorio', d: 'Te atendemos, registramos tu orden y tomamos tu muestra.' },
  { n: '2', t: 'Recibe tu código', d: 'Al registrar tu orden te entregamos tu código de consulta (PIN).' },
  { n: '3', t: 'Consulta tus resultados', d: 'Cuando el laboratorio publique tu informe, escribe tu código aquí para verlo, descargarlo o imprimirlo.' },
];

const Inicio: React.FC<InicioProps> = ({ lab, catalogo, contenido, ir, verCategoria }) => {
  const categorias = useMemo(
    () => (catalogo ? categoriasConConteo(catalogo.examenes.map(completarConFabrica)) : []),
    [catalogo]
  );
  // Mismas imágenes de portada que el acceso del personal (Ajustes → Portada del acceso).
  const imagenesPortada = usePortadaImagenes();
  const promos = contenido?.promociones.slice(0, 2) ?? [];
  const noticias = contenido?.noticias.slice(0, 2) ?? [];

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl px-6 py-10 sm:px-10 sm:py-14 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,400px)] items-center">
        <ImagenPortada clave="fondo_pagina" imagenes={imagenesPortada} alt="" className="absolute inset-0 h-full w-full object-cover" alternativa={null} />
        {imagenesPortada.fondo_pagina && <div className="absolute inset-0 bg-white/85 pointer-events-none" />}
        <div className="relative">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 max-w-3xl">
          {lab?.eslogan || 'Consulta tus resultados y conoce nuestros servicios'}
        </h1>
        <p className="text-slate-600 mt-3 max-w-2xl">
          Aquí puedes ver tus resultados cuando estén listos, conocer las pruebas que ofrece {lab?.nombre || 'el laboratorio'}, sus precios y cómo prepararte para tu examen.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={() => ir('resultados')} className="bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-full px-6 py-3 cursor-pointer">Consultar mis Resultados</button>
          <button onClick={() => ir('catalogo')} className="bg-white border-2 border-slate-300 hover:border-slate-500 text-slate-900 font-bold rounded-full px-6 py-3 cursor-pointer">Ver Catálogo de Pruebas</button>
        </div>
        </div>
        <div className="relative hidden md:flex justify-center">
          <PortadaLogin imagenes={imagenesPortada} telefono={lab?.telefono} ubicacion={lab?.direccion} eslogan={lab?.eslogan} />
        </div>
      </section>

      <section aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="text-xl font-extrabold text-slate-900 mb-3">¿Cómo funciona?</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {PASOS.map((p) => (
            <li key={p.n} className="bg-white border border-slate-200 rounded-2xl p-5">
              <span aria-hidden="true" className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center">{p.n}</span>
              <p className="font-extrabold text-slate-900 mt-3">{p.t}</p>
              <p className="text-sm text-slate-600 mt-1">{p.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {promos.length > 0 && (
        <section aria-labelledby="promos-inicio">
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="promos-inicio" className="text-xl font-extrabold text-slate-900">Promociones vigentes</h2>
            <a href="#/noticias" className="text-sm font-bold text-teal-800 underline">Ver todas</a>
          </div>
          <ListaContenido items={promos} promo vacio="" />
        </section>
      )}

      {categorias.length > 0 && (
        <section aria-labelledby="servicios-inicio">
          <h2 id="servicios-inicio" className="text-xl font-extrabold text-slate-900 mb-3">Nuestros servicios y análisis</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categorias.map((c) => (
              <li key={c.codigo}>
                <button onClick={() => verCategoria(c.codigo)} className="w-full text-left bg-white border border-slate-200 hover:border-teal-600 rounded-xl px-4 py-3 flex items-center justify-between gap-2 cursor-pointer">
                  <span className="font-bold text-slate-900">{c.nombre}</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">{c.total}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {noticias.length > 0 && (
        <section aria-labelledby="noticias-inicio">
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="noticias-inicio" className="text-xl font-extrabold text-slate-900">Noticias y Salud</h2>
            <a href="#/noticias" className="text-sm font-bold text-teal-800 underline">Ver todas</a>
          </div>
          <ListaContenido items={noticias} vacio="" />
        </section>
      )}

      <section aria-labelledby="contacto-inicio" className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 id="contacto-inicio" className="text-xl font-extrabold text-slate-900 mb-3">Contacto</h2>
        <TarjetaContacto lab={lab} />
      </section>
    </div>
  );
};
