import React, { useCallback, useEffect, useState } from 'react';
import { Eye, Target, ShieldCheck, HeartHandshake, HeartPulse, TrendingUp, FlaskConical, Phone } from 'lucide-react';
import { obtenerNosotros, type Nosotros } from '../../../services/nosotrosApiService';
import { ImagenPortada, usePortadaImagenes } from '../../staff/PortadaLogin';
import { EstadoCarga } from './comunes';
import { FondoMicroscopio } from './FondoAnimado';

interface Props {
  nombreLab: string;
  /** Lleva al paciente a otra sección del portal. */
  ir: (vista: 'catalogo' | 'contacto') => void;
}

const ICONOS_VALOR = [ShieldCheck, HeartHandshake, HeartPulse, TrendingUp];
const FONDOS_VALOR = ['bg-mint-wash', 'bg-sky-wash', 'bg-peach-wash', 'bg-lilac-wash'];

function iniciales(nombre: string): string {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

/** Pestaña "Nosotros": quiénes somos, visión, misión, valores y equipo (todo editable desde Ajustes). */
export const NosotrosPublico: React.FC<Props> = ({ nombreLab, ir }) => {
  const imagenes = usePortadaImagenes();
  const [datos, setDatos] = useState<Nosotros | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    obtenerNosotros()
      .then(setDatos)
      .catch((e) => setError(e instanceof Error ? e.message : 'No se pudo cargar.'))
      .finally(() => setCargando(false));
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  return (
    <EstadoCarga cargando={cargando} error={error} onReintentar={cargar}>
      {datos && <Contenido datos={datos} nombreLab={nombreLab} ir={ir} imagenes={imagenes} />}
    </EstadoCarga>
  );
};

const Contenido: React.FC<{ datos: Nosotros; nombreLab: string; ir: Props['ir']; imagenes: ReturnType<typeof usePortadaImagenes> }> = ({ datos, nombreLab, ir, imagenes }) => {
  const equipo = datos.equipo.map((m, i) => ({ ...m, ranura: i })).filter((m) => m.nombre);
  return (
    <div className="space-y-12">
      {/* Encabezado con la animación del microscopio */}
      <section aria-labelledby="titulo-nosotros" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-canopy via-teal-800 to-cyan-700 text-white">
        <FondoMicroscopio />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-canopy/80 via-canopy/30 to-transparent" />
        <div className="relative z-10 max-w-xl px-6 py-14 sm:px-10 sm:py-20">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" /> Nosotros
          </p>
          <h2 id="titulo-nosotros" className="titulo-display mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
            Conoce {nombreLab}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/90">{datos.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => ir('catalogo')} className="rounded-full bg-coral-pulse px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-hover">
              Ver catálogo de pruebas
            </button>
            <button type="button" onClick={() => ir('contacto')} className="rounded-full border border-white/50 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              Contáctanos
            </button>
          </div>
        </div>
      </section>

      {/* Visión y misión, en filas alternadas */}
      <section aria-label="Visión y misión" className="space-y-10">
        <FilaTexto
          icono={<Eye className="h-5 w-5" aria-hidden="true" />}
          etiqueta="Visión"
          titulo="Hacia dónde vamos"
          texto={datos.vision}
          clave="nosotros_vision"
          imagenes={imagenes}
          fondo="bg-sky-wash"
        />
        <FilaTexto
          invertida
          icono={<Target className="h-5 w-5" aria-hidden="true" />}
          etiqueta="Misión"
          titulo="Qué hacemos cada día"
          texto={datos.mision}
          clave="nosotros_mision"
          imagenes={imagenes}
          fondo="bg-peach-wash"
        />
      </section>

      {datos.valores.length > 0 && (
        <section aria-labelledby="titulo-valores">
          <h3 id="titulo-valores" className="titulo-display text-2xl font-semibold text-canopy">Lo que nos guía</h3>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {datos.valores.map((v, i) => {
              const Icono = ICONOS_VALOR[i % ICONOS_VALOR.length];
              return (
                <li key={`${v.titulo}-${i}`} className={`rounded-3xl p-5 ${FONDOS_VALOR[i % FONDOS_VALOR.length]}`}>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-canopy">
                    <Icono className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h4 className="mt-3 text-base font-semibold text-canopy">{v.titulo}</h4>
                  {v.texto && <p className="mt-1 text-sm leading-relaxed text-graphite">{v.texto}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {equipo.length > 0 && (
        <section aria-labelledby="titulo-equipo">
          <h3 id="titulo-equipo" className="titulo-display text-2xl font-semibold text-canopy">Nuestro equipo</h3>
          <ul className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {equipo.map((m) => (
              <li key={m.ranura} className="overflow-hidden rounded-3xl bg-cream">
                <ImagenPortada
                  clave={(`equipo_${m.ranura + 1}`) as 'equipo_1' | 'equipo_2' | 'equipo_3' | 'equipo_4'}
                  imagenes={imagenes}
                  alt={`Foto de ${m.nombre}`}
                  className="aspect-square w-full object-cover"
                  alternativa={
                    <div className="flex aspect-square w-full items-center justify-center bg-sage-wash text-4xl font-semibold text-canopy" aria-hidden="true">
                      {iniciales(m.nombre)}
                    </div>
                  }
                />
                <div className="p-4">
                  <p className="text-sm font-semibold text-canopy">{m.nombre}</p>
                  {m.cargo && <p className="mt-0.5 text-xs text-graphite">{m.cargo}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Invitación final */}
      <section aria-labelledby="titulo-invitacion" className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-canopy via-teal-800 to-cyan-700 text-white">
        <div aria-hidden="true" className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-coral-pulse/25 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-lilac-wash/20 blur-3xl" />
        <ImagenPortada
          clave="nosotros_servicios"
          imagenes={imagenes}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          alternativa={null}
        />
        <div className="relative z-10 flex flex-col items-start gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div>
            <h3 id="titulo-invitacion" className="titulo-display text-2xl font-semibold">¿Tienes dudas sobre tu estudio?</h3>
            <p className="mt-1 text-sm text-white/90">Consulta el catálogo o escríbenos: con gusto te orientamos.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => ir('catalogo')} className="rounded-full bg-coral-pulse px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-hover">
              Catálogo de pruebas
            </button>
            <button type="button" onClick={() => ir('contacto')} className="inline-flex items-center gap-2 rounded-full border border-white/50 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              <Phone className="h-4 w-4" aria-hidden="true" /> Contacto
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const FilaTexto: React.FC<{
  icono: React.ReactNode; etiqueta: string; titulo: string; texto: string;
  clave: 'nosotros_vision' | 'nosotros_mision'; imagenes: ReturnType<typeof usePortadaImagenes>;
  fondo: string; invertida?: boolean;
}> = ({ icono, etiqueta, titulo, texto, clave, imagenes, fondo, invertida }) => (
  <div className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
    <div className={invertida ? 'md:order-2' : ''}>
      <ImagenPortada
        clave={clave}
        imagenes={imagenes}
        alt={`${etiqueta} del laboratorio`}
        className="h-64 w-full rounded-3xl object-cover md:h-72"
        alternativa={
          <div className={`flex h-64 w-full items-center justify-center rounded-3xl text-canopy md:h-72 ${fondo}`} aria-hidden="true">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 [&>svg]:h-10 [&>svg]:w-10">{icono}</span>
          </div>
        }
      />
    </div>
    <div className={invertida ? 'md:order-1' : ''}>
      <p className="inline-flex items-center gap-2 rounded-full bg-mint-wash px-3 py-1 text-xs font-semibold text-canopy">{icono}{etiqueta}</p>
      <h3 className="titulo-display mt-3 text-2xl font-semibold text-canopy">{titulo}</h3>
      <p className="mt-3 text-base leading-relaxed text-graphite">{texto}</p>
    </div>
  </div>
);
