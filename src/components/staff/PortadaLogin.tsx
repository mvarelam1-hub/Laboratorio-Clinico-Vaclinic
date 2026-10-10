import React, { useEffect, useState } from 'react';
import { Droplets, Bug, Gem, TestTubes, FlaskConical, Microscope, Phone, MapPin, Dna } from 'lucide-react';
import { obtenerPortada, urlImagenPortada, type MapaPortada, type ClavePortada } from '../../services/portadaApiService';

/**
 * Portada de VACLINIC: lado izquierdo del login del personal y banner del
 * inicio del portal del paciente (mismas imágenes en ambos).
 *
 * Cada imagen (logo, fondo y los 4 íconos de áreas) la puede elegir el
 * laboratorio desde Ajustes → "8. Portada del acceso" (ver PortadaSettingsTab).
 * Si una posición no tiene imagen —o la imagen no carga— se muestra el dibujo
 * por defecto, así que la pantalla nunca queda rota ni vacía.
 */

/** Lee del servidor qué imágenes hay subidas (sin sesión: el login aún no la tiene). */
export function usePortadaImagenes(): MapaPortada {
  const [mapa, setMapa] = useState<MapaPortada>({});
  useEffect(() => {
    let vivo = true;
    obtenerPortada().then((r) => { if (vivo) setMapa(r); });
    return () => { vivo = false; };
  }, []);
  return mapa;
}

interface ImagenPortadaProps {
  clave: ClavePortada;
  imagenes: MapaPortada;
  alt: string;
  className?: string;
  /** Se muestra si no hay imagen subida o si falla al cargar. */
  alternativa: React.ReactNode;
}

/** Imagen subida con regreso automático al dibujo por defecto si falla. */
export const ImagenPortada: React.FC<ImagenPortadaProps> = ({ clave, imagenes, alt, className, alternativa }) => {
  const [fallo, setFallo] = useState(false);
  const version = imagenes[clave]?.version;
  useEffect(() => { setFallo(false); }, [version]);
  if (!version || fallo) return <>{alternativa}</>;
  return <img src={urlImagenPortada(clave, version)} alt={alt} className={className} onError={() => setFallo(true)} draggable={false} />;
};

const AREAS: {
  clave: ClavePortada;
  nombre: string;
  Icono: React.ElementType;
  anillo: string;
  fondo: string;
  color: string;
}[] = [
  { clave: 'area_hematologia', nombre: 'Hematología', Icono: Droplets, anillo: 'ring-rose-400/80', fondo: 'from-rose-500/30 to-red-700/40', color: 'text-rose-200' },
  { clave: 'area_parasitos', nombre: 'Parásitos', Icono: Bug, anillo: 'ring-violet-400/80', fondo: 'from-violet-500/30 to-indigo-700/40', color: 'text-violet-200' },
  { clave: 'area_cristales', nombre: 'Cristales', Icono: Gem, anillo: 'ring-cyan-300/80', fondo: 'from-cyan-400/30 to-sky-700/40', color: 'text-cyan-100' },
  { clave: 'area_quimica', nombre: 'Química sanguínea', Icono: TestTubes, anillo: 'ring-emerald-300/80', fondo: 'from-emerald-400/30 to-teal-700/40', color: 'text-emerald-100' }
];

interface PortadaLoginProps {
  imagenes: MapaPortada;
  className?: string;
  /** Contacto a mostrar; si no se indica, los datos predeterminados de VACLINIC. */
  telefono?: string | null;
  ubicacion?: string | null;
  eslogan?: string | null;
}

export const PortadaLogin: React.FC<PortadaLoginProps> = ({ imagenes, className = '', telefono, ubicacion, eslogan }) => {
  return (
    <section
      aria-label="Portada de VACLINIC Laboratorio Clínico"
      className={`relative isolate w-full max-w-[460px] overflow-hidden rounded-3xl text-white shadow-2xl ring-1 ring-white/10 select-none bg-[#04222a] ${className}`}
    >
      {/* Fondo: imagen elegida o degradado por defecto */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#04222a] via-[#075560] to-[#0a7a6e]" />
      <ImagenPortada
        clave="fondo"
        imagenes={imagenes}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        alternativa={
          <div
            className="absolute inset-0 -z-20 opacity-[0.12]"
            style={{ backgroundImage: 'radial-gradient(#7ee8dc 1.2px, transparent 1.2px)', backgroundSize: '22px 22px' }}
          />
        }
      />
      {/* Velo para que el texto siempre se lea, sin importar la imagen elegida */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#031a20]/80 via-[#04303a]/55 to-[#031a20]/90" />

      <div className="flex min-h-[560px] flex-col items-center px-7 pb-7 pt-8 sm:px-9">
        <p className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-teal-100 backdrop-blur">
          Sistema de laboratorio clínico
        </p>

        {/* Logo */}
        <div className="mt-7 flex h-36 w-36 items-center justify-center rounded-full bg-white/10 p-2.5 shadow-[0_0_60px_-10px_rgba(94,234,212,0.55)] ring-1 ring-white/30 backdrop-blur-sm">
          <ImagenPortada
            clave="logo"
            imagenes={imagenes}
            alt="Logo de VACLINIC"
            className="h-full w-full rounded-full object-contain"
            alternativa={
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-gradient-to-b from-[#06161d] to-[#0b2c35] ring-2 ring-teal-400/70">
                <div className="flex items-center text-teal-200">
                  <FlaskConical className="h-9 w-9" />
                  <Microscope className="-ml-2 h-9 w-9" />
                </div>
                <span className="mt-1 rounded-full border border-teal-400/40 bg-black/40 px-2.5 py-0.5 font-mono text-[11px] font-black tracking-[0.25em] text-cyan-100">
                  VC LAB
                </span>
              </div>
            }
          />
        </div>

        {/* Marca */}
        <h1 className="mt-6 text-center text-4xl font-black leading-none tracking-tight sm:text-[2.6rem]">
          VAC<span className="text-teal-300">LINIC</span>
        </h1>
        <div className="mt-2 flex items-center gap-2.5">
          <span className="h-px w-8 bg-teal-300/60" />
          <h2 className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-teal-50/90">Laboratorio clínico</h2>
          <span className="h-px w-8 bg-teal-300/60" />
        </div>
        <p className="mt-3 flex items-center gap-2 text-center text-[13px] font-medium italic text-teal-50/90">
          <Dna className="h-3.5 w-3.5 flex-shrink-0 text-teal-300" />
          {eslogan || 'Precisión que diagnostica, confianza que cuida.'}
        </p>

        {/* Áreas */}
        <ul className="mt-7 grid w-full grid-cols-4 gap-2" aria-label="Áreas del laboratorio">
          {AREAS.map(({ clave, nombre, Icono, anillo, fondo, color }) => (
            <li key={clave} className="flex flex-col items-center gap-1.5 text-center">
              <span className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${fondo} ring-2 ${anillo} backdrop-blur-sm`}>
                <ImagenPortada
                  clave={clave}
                  imagenes={imagenes}
                  alt={nombre}
                  className="h-full w-full object-cover"
                  alternativa={<Icono className={`h-6 w-6 ${color}`} />}
                />
              </span>
              <span className="text-[9.5px] font-bold uppercase leading-tight tracking-wide text-white/90">{nombre}</span>
            </li>
          ))}
        </ul>

        {/* Contacto */}
        <div className="mt-auto grid w-full grid-cols-1 gap-2.5 pt-7 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-teal-200">
              <Phone className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-100/80">Contáctanos</p>
              <p className="text-base font-black tracking-wide">{telefono || '56125563'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-teal-400/20 text-teal-200">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-100/80">Nuestra ubicación</p>
              <p className="text-[11px] font-bold leading-snug">{ubicacion || 'Entrada de Pineda, Oratorio, Santa Rosa km 79.5'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
