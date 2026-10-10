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
  fondo: string;
}[] = [
  { clave: 'area_hematologia', nombre: 'Hematología', Icono: Droplets, fondo: 'bg-peach-wash' },
  { clave: 'area_parasitos', nombre: 'Parásitos', Icono: Bug, fondo: 'bg-lilac-wash' },
  { clave: 'area_cristales', nombre: 'Cristales', Icono: Gem, fondo: 'bg-sky-wash' },
  { clave: 'area_quimica', nombre: 'Química sanguínea', Icono: TestTubes, fondo: 'bg-mint-wash' }
];

interface PortadaLoginProps {
  imagenes: MapaPortada;
  className?: string;
  /** Contacto a mostrar; si no se indica, los datos predeterminados de VACLINIC. */
  telefono?: string | null;
  ubicacion?: string | null;
  eslogan?: string | null;
}

/**
 * Diseño plano: superficie verde bosque, sin sombras; la profundidad sale del
 * cambio de color (círculos y tarjetas pastel sobre el verde).
 */
export const PortadaLogin: React.FC<PortadaLoginProps> = ({ imagenes, className = '', telefono, ubicacion, eslogan }) => {
  return (
    <section
      aria-label="Portada de VACLINIC Laboratorio Clínico"
      className={`tema-vaclinic relative isolate w-full max-w-[460px] overflow-hidden rounded-3xl text-white select-none bg-canopy-claro ${className}`}
    >
      {/* Fondo: imagen elegida o color liso por defecto */}
      <div className="absolute inset-0 -z-20 bg-canopy-claro" />
      <ImagenPortada
        clave="fondo"
        imagenes={imagenes}
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        alternativa={null}
      />
      {/* Velo verde para que el texto siempre se lea, sin importar la imagen elegida */}
      <div className="absolute inset-0 -z-10 bg-canopy/70" />

      <div className="flex min-h-[540px] flex-col items-center px-7 pb-7 pt-8 sm:px-9">
        <p className="rounded-full bg-mint-wash px-3.5 py-1 text-xs font-semibold text-canopy">
          Sistema de laboratorio clínico
        </p>

        {/* Logo */}
        <div className="mt-7 flex h-36 w-36 items-center justify-center rounded-full bg-white p-2.5">
          <ImagenPortada
            clave="logo"
            imagenes={imagenes}
            alt="Logo de VACLINIC"
            className="h-full w-full rounded-full object-contain"
            alternativa={
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-canopy">
                <div className="flex items-center text-leaf">
                  <FlaskConical className="h-9 w-9" />
                  <Microscope className="-ml-2 h-9 w-9" />
                </div>
                <span className="mt-1 rounded-full bg-mint-wash px-2.5 py-0.5 text-[11px] font-bold tracking-[0.2em] text-canopy">
                  VC LAB
                </span>
              </div>
            }
          />
        </div>

        {/* Marca */}
        <h1 className="titulo-display mt-6 text-center text-5xl font-medium text-white">
          VAC<span className="text-leaf">LINIC</span>
        </h1>
        <h2 className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-mint-wash">Laboratorio clínico</h2>
        <p className="mt-3 flex items-start gap-2 text-center text-sm font-medium text-mint-wash">
          <Dna className="mt-0.5 h-4 w-4 flex-shrink-0 text-leaf" />
          {eslogan || 'Precisión que diagnostica, confianza que cuida.'}
        </p>

        {/* Áreas */}
        <ul className="mt-7 grid w-full grid-cols-4 gap-2" aria-label="Áreas del laboratorio">
          {AREAS.map(({ clave, nombre, Icono, fondo }) => (
            <li key={clave} className="flex flex-col items-center gap-1.5 text-center">
              <span className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full ${fondo}`}>
                <ImagenPortada
                  clave={clave}
                  imagenes={imagenes}
                  alt={nombre}
                  className="h-full w-full object-cover"
                  alternativa={<Icono className="h-6 w-6 text-canopy" />}
                />
              </span>
              <span className="text-xs font-semibold leading-tight text-white">{nombre}</span>
            </li>
          ))}
        </ul>

        {/* Contacto */}
        <div className="mt-auto grid w-full grid-cols-1 gap-2.5 pt-7 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-mint-wash text-canopy">
              <Phone className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-graphite">Contáctanos</p>
              <p className="text-base font-bold tracking-wide text-canopy">{telefono || '56125563'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-2.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sky-wash text-canopy">
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-graphite">Nuestra ubicación</p>
              <p className="text-xs font-semibold leading-snug text-canopy">{ubicacion || 'Entrada de Pineda, Oratorio, Santa Rosa km 79.5'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
