import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  obtenerCatalogoPublico, obtenerContenidoPublico, obtenerLaboratorioPublico,
  CatalogoPublico as Catalogo, ContenidoPublicoRespuesta, LaboratorioPublico
} from '../../../services/publicoApiService';
import { ConsultaResultados } from '../PatientPortalReal';
import { CatalogoPublico } from './CatalogoPublico';
import { GuiaPreparacionPublica } from './GuiaPreparacionPublica';
import { PanelesPublicos } from './PanelesPublicos';
import { AvisoPrecios } from './AvisoPrecios';
import { NoticiasPublicas, ListaContenido } from './NoticiasPublicas';
import { NosotrosPublico } from './NosotrosPublico';
import { FondoMargenes } from './FondoAnimado';
import { EstadoCarga, TarjetaContacto } from './comunes';
import { categoriasConConteo, completarConFabrica } from '../../../utils/catalogoPublico';
import { contactoFinal } from '../../../data/contactoLaboratorio';
import { PortadaLogin, ImagenPortada, usePortadaImagenes } from '../../staff/PortadaLogin';

const AtlasPublico = lazy(() => import('./AtlasPublico'));

export type VistaPortal = 'inicio' | 'resultados' | 'catalogo' | 'preparacion' | 'paneles' | 'atlas' | 'noticias';

const MENU: { id: VistaPortal; etiqueta: string }[] = [
  { id: 'inicio', etiqueta: 'Inicio' },
  { id: 'resultados', etiqueta: 'Consultar mis Resultados' },
  { id: 'catalogo', etiqueta: 'Catálogo de Pruebas' },
  { id: 'preparacion', etiqueta: 'Guía de Preparación' },
  { id: 'paneles', etiqueta: 'Paneles Preventivos' },
  { id: 'atlas', etiqueta: 'Atlas Microscópico' },
  { id: 'noticias', etiqueta: 'Noticias y Salud' },
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

  const raiz = useRef<HTMLDivElement>(null);
  const lab = useCarga<LaboratorioPublico>(obtenerLaboratorioPublico);
  // Sesión del portal (código de consulta): con ella el servidor incluye los precios del catálogo.
  const [tokenPortal, setTokenPortal] = useState<string | null>(null);
  const cargarCatalogo = useCallback(() => obtenerCatalogoPublico(tokenPortal), [tokenPortal]);
  const cat = useCarga<Catalogo>(cargarCatalogo);
  const con = useCarga<ContenidoPublicoRespuesta>(obtenerContenidoPublico);

  const contacto = useMemo(() => contactoFinal(lab.datos), [lab.datos]);
  const nombreLab = contacto.nombre || 'Laboratorio Clínico';
  const avisoPrecios = (
    <AvisoPrecios whatsapp={contacto.whatsapp || contacto.telefono} nombreLab={nombreLab} alIngresarCodigo={() => ir('resultados')} />
  );

  return (
    <div ref={raiz} className="tema-vaclinic max-w-6xl mx-auto">
      <FondoMargenes referencia={raiz} />
      <header className="relative z-10 pt-2 pb-3">
        <p className="text-xs font-semibold text-graphite">Portal del Paciente</p>
        <p className="text-xl font-semibold text-canopy tracking-tight">{nombreLab}</p>
      </header>
      <nav aria-label="Secciones del portal" className="sticky top-0 z-20 -mx-3 sm:mx-0 px-3 sm:px-0 bg-lavender-mist/95 backdrop-blur border-b border-frost mb-6">
        <ul className="flex gap-1 overflow-x-auto py-2">
          {MENU.map((m) => (
            <li key={m.id} className="shrink-0">
              <a
                href={`#/${m.id}`}
                aria-current={vista === m.id ? 'page' : undefined}
                className={`block px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${vista === m.id ? 'bg-canopy text-white' : 'text-graphite hover:bg-white'}`}
              >
                {m.etiqueta}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative z-10 pb-10">
        {vista === 'inicio' && (
          <Inicio lab={contacto} catalogo={cat.datos} contenido={con.datos} ir={ir}
            verCategoria={(c) => { setCategoria(c); ir('catalogo'); }} />
        )}
        {/* Siempre montado (oculto) para no perder la sesión del paciente al mirar otras secciones. */}
        <div hidden={vista !== 'resultados'}><ConsultaResultados alCambiarSesion={setTokenPortal} /></div>
        {vista === 'catalogo' && (
          <EstadoCarga cargando={cat.cargando} error={cat.error} onReintentar={cat.recargar}>
            {cat.datos && <CatalogoPublico key={categoria ?? 'todas'} catalogo={cat.datos} categoriaInicial={categoria} avisoPrecios={avisoPrecios} />}
          </EstadoCarga>
        )}
        {vista === 'preparacion' && (
          <EstadoCarga cargando={cat.cargando} error={cat.error} onReintentar={cat.recargar}>
            {cat.datos && <GuiaPreparacionPublica catalogo={cat.datos} />}
          </EstadoCarga>
        )}
        {vista === 'paneles' && (
          <EstadoCarga cargando={cat.cargando} error={cat.error} onReintentar={cat.recargar}>
            {cat.datos && <PanelesPublicos catalogo={cat.datos} avisoPrecios={avisoPrecios} />}
          </EstadoCarga>
        )}
        {vista === 'atlas' && <Suspense fallback={<p role="status" className="text-sm text-slate-500 py-8 text-center">Cargando…</p>}><AtlasPublico /></Suspense>}
        {vista === 'noticias' && (
          <EstadoCarga cargando={con.cargando} error={con.error} onReintentar={con.recargar}>
            {con.datos && <NoticiasPublicas contenido={con.datos} />}
          </EstadoCarga>
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
  { n: '1', t: 'Visita el laboratorio', d: 'Te atendemos, registramos tu orden y tomamos tu muestra.', fondo: 'bg-mint-wash' },
  { n: '2', t: 'Recibe tu código', d: 'Al registrar tu orden te entregamos tu código de consulta (PIN).', fondo: 'bg-sky-wash' },
  { n: '3', t: 'Consulta tus resultados', d: 'Cuando el laboratorio publique tu informe, escribe tu código aquí para verlo, descargarlo o imprimirlo.', fondo: 'bg-peach-wash' },
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
      <section className="relative isolate overflow-hidden bg-canopy rounded-3xl px-6 py-10 sm:px-12 sm:py-16 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,400px)] items-center">
        <ImagenPortada clave="fondo_pagina" imagenes={imagenesPortada} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" alternativa={null} />
        {imagenesPortada.fondo_pagina && <div className="absolute inset-0 -z-10 bg-canopy/85 pointer-events-none" />}
        <div className="relative">
        <h1 className="titulo-display text-4xl sm:text-6xl text-white max-w-3xl">
          {lab?.eslogan || 'Consulta tus resultados y conoce nuestros servicios'}
        </h1>
        <p className="text-lg text-mint-wash mt-4 max-w-2xl">
          Aquí puedes ver tus resultados cuando estén listos, conocer las pruebas que ofrece {lab?.nombre || 'el laboratorio'} y cómo prepararte para tu examen.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={() => ir('resultados')} className="bg-coral-pulse hover:bg-coral-hover text-[#1a1a1a] font-semibold rounded-full px-6 py-3 cursor-pointer transition-colors">Consultar mis Resultados</button>
          <button onClick={() => ir('catalogo')} className="bg-transparent border border-white hover:bg-white/10 text-white font-medium rounded-full px-6 py-3 cursor-pointer transition-colors">Ver Catálogo de Pruebas</button>
        </div>
        </div>
        <div className="relative hidden md:flex justify-center">
          <PortadaLogin imagenes={imagenesPortada} telefono={lab?.telefono} ubicacion={lab?.direccion} eslogan={lab?.eslogan} />
        </div>
      </section>

      <section aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="titulo-display text-3xl sm:text-5xl text-canopy mb-5">¿Cómo funciona?</h2>
        <ol className="grid gap-6 sm:grid-cols-3">
          {PASOS.map((p) => (
            <li key={p.n} className={`${p.fondo} rounded-3xl p-6 sm:p-8`}>
              <span aria-hidden="true" className="w-10 h-10 rounded-full bg-white text-canopy font-bold flex items-center justify-center">{p.n}</span>
              <p className="text-2xl font-bold text-canopy tracking-tight mt-4">{p.t}</p>
              <p className="text-base text-graphite mt-2">{p.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {promos.length > 0 && (
        <section aria-labelledby="promos-inicio">
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="promos-inicio" className="titulo-display text-3xl sm:text-4xl text-canopy">Promociones vigentes</h2>
            <a href="#/noticias" className="text-sm font-semibold text-canopy underline">Ver todas</a>
          </div>
          <ListaContenido items={promos} promo vacio="" />
        </section>
      )}

      {categorias.length > 0 && (
        <section aria-labelledby="servicios-inicio">
          <h2 id="servicios-inicio" className="titulo-display text-3xl sm:text-4xl text-canopy mb-4">Nuestros servicios y análisis</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categorias.map((c) => (
              <li key={c.codigo}>
                <button onClick={() => verCategoria(c.codigo)} className="w-full text-left bg-white hover:bg-sage-wash rounded-2xl px-5 py-4 flex items-center justify-between gap-2 cursor-pointer transition-colors">
                  <span className="font-semibold text-slate-900">{c.nombre}</span>
                  <span className="text-xs font-semibold text-canopy bg-mint-wash rounded-full px-3 py-1">{c.total}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <NosotrosPublico />

      {noticias.length > 0 && (
        <section aria-labelledby="noticias-inicio">
          <div className="flex items-baseline justify-between mb-3">
            <h2 id="noticias-inicio" className="titulo-display text-3xl sm:text-4xl text-canopy">Noticias y Salud</h2>
            <a href="#/noticias" className="text-sm font-semibold text-canopy underline">Ver todas</a>
          </div>
          <ListaContenido items={noticias} vacio="" />
        </section>
      )}

      <section aria-labelledby="contacto-inicio" className="bg-cream rounded-3xl p-6 sm:p-8">
        <h2 id="contacto-inicio" className="titulo-display text-3xl sm:text-4xl text-canopy mb-4">Contacto</h2>
        <TarjetaContacto lab={lab} />
      </section>
    </div>
  );
};
