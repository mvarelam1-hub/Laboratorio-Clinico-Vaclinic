import React, { useEffect, useState } from 'react';
import { Eye, Target, ShieldCheck, HeartHandshake, HeartPulse, TrendingUp } from 'lucide-react';
import { obtenerNosotros, type Nosotros } from '../../../services/nosotrosApiService';
import { ImagenPortada, usePortadaImagenes } from '../../staff/PortadaLogin';

const ICONOS_VALOR = [ShieldCheck, HeartHandshake, HeartPulse, TrendingUp];
const FONDOS_VALOR = ['bg-mint-wash', 'bg-sky-wash', 'bg-peach-wash', 'bg-lilac-wash'];

function iniciales(nombre: string): string {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

/**
 * Bloque "Quiénes somos" que va dentro del Inicio del portal: presentación,
 * visión, misión, valores y equipo (todo editable desde Ajustes). Si todavía
 * no cargó o falla, simplemente no se muestra y el resto del Inicio sigue igual.
 */
export const NosotrosPublico: React.FC = () => {
  const imagenes = usePortadaImagenes();
  const [datos, setDatos] = useState<Nosotros | null>(null);

  useEffect(() => {
    let vivo = true;
    obtenerNosotros().then((d) => { if (vivo) setDatos(d); }).catch(() => {});
    return () => { vivo = false; };
  }, []);

  return datos ? <Contenido datos={datos} imagenes={imagenes} /> : null;
};

const Contenido: React.FC<{ datos: Nosotros; imagenes: ReturnType<typeof usePortadaImagenes> }> = ({ datos, imagenes }) => {
  const equipo = datos.equipo.map((m, i) => ({ ...m, ranura: i })).filter((m) => m.nombre);
  return (
    <section aria-labelledby="quienes-somos" className="space-y-10">
      <div>
        <h2 id="quienes-somos" className="titulo-display text-3xl sm:text-4xl text-canopy">Quiénes somos</h2>
        <p className="mt-3 max-w-2xl text-lg leading-relaxed text-graphite">{datos.intro}</p>
      </div>

      {/* Visión y misión, en filas alternadas */}
      <div className="space-y-10">
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
      </div>

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

    </section>
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
