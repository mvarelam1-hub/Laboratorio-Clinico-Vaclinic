import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, Loader2, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import {
  POSICIONES_PORTADA,
  obtenerPortada,
  prepararImagen,
  subirImagenPortada,
  quitarImagenPortada,
  urlImagenPortada,
  type ClavePortada,
  type MapaPortada
} from '../../../services/portadaApiService';
import { PortadaLogin } from '../PortadaLogin';
import { NosotrosEditor } from './NosotrosEditor';

/**
 * Ajustes → "8. Portada del acceso": el laboratorio elige las imágenes que
 * forman la portada del login del personal. Cada imagen se reduce y comprime
 * en el navegador y se guarda en la base de datos. Quitar una imagen vuelve
 * al dibujo por defecto. Solo administrador_ti y director pueden cambiarlas
 * (lo valida el servidor); cada cambio queda en la bitácora.
 */
export const PortadaSettingsTab: React.FC = () => {
  const [imagenes, setImagenes] = useState<MapaPortada>({});
  const [ocupada, setOcupada] = useState<ClavePortada | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const entradas = useRef<Partial<Record<ClavePortada, HTMLInputElement | null>>>({});

  const recargar = async () => setImagenes(await obtenerPortada());
  useEffect(() => { recargar(); }, []);

  const elegir = async (clave: ClavePortada, maxLado: number, archivo: File | undefined) => {
    if (!archivo) return;
    setMensaje(null);
    setOcupada(clave);
    const listo = await prepararImagen(archivo, maxLado);
    if (listo.ok === false) {
      setOcupada(null);
      setMensaje({ tipo: 'error', texto: listo.message });
      return;
    }
    const r = await subirImagenPortada(clave, listo.base64);
    setOcupada(null);
    if (r.ok === true) {
      await recargar();
      setMensaje({ tipo: 'ok', texto: 'Imagen guardada. Ya se ve en la portada del acceso.' });
    } else {
      setMensaje({ tipo: 'error', texto: r.message });
    }
  };

  const quitar = async (clave: ClavePortada) => {
    setMensaje(null);
    setOcupada(clave);
    const r = await quitarImagenPortada(clave);
    setOcupada(null);
    if (r.ok === true) {
      await recargar();
      setMensaje({ tipo: 'ok', texto: 'Imagen quitada. Se muestra el dibujo por defecto.' });
    } else {
      setMensaje({ tipo: 'error', texto: r.message });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="space-y-4 xl:col-span-7">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h3 className="text-sm font-black text-slate-900">Portada del acceso del personal</h3>
          <p className="mt-1 text-xs text-slate-600">
            Elige las imágenes que forman la portada. Se reducen solas para que carguen rápido y se guardan en el sistema.
            Si quitas una, vuelve el dibujo por defecto.
          </p>
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-medium text-amber-900">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            Estas imágenes las ve cualquier persona que abra la pantalla de acceso. No subas fotos de pacientes, resultados ni datos personales.
          </p>
        </div>

        {mensaje && (
          <div
            role="status"
            className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-medium ${
              mensaje.tipo === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {mensaje.tipo === 'ok' ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
            <span>{mensaje.texto}</span>
          </div>
        )}

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {POSICIONES_PORTADA.map((p) => {
            const version = imagenes[p.clave]?.version;
            const trabajando = ocupada === p.clave;
            return (
              <li key={p.clave} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {version ? (
                    <img src={urlImagenPortada(p.clave, version)} alt={p.etiqueta} className="h-full w-full object-contain" />
                  ) : (
                    <span className="px-1 text-center text-[10px] font-semibold leading-tight text-slate-400">Dibujo por defecto</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900">{p.etiqueta}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{p.ayuda}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      ref={(el) => { entradas.current[p.clave] = el; }}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      aria-label={`Elegir imagen: ${p.etiqueta}`}
                      onChange={(e) => {
                        const archivo = e.target.files?.[0];
                        e.target.value = '';
                        elegir(p.clave, p.maxLado, archivo);
                      }}
                    />
                    <button
                      type="button"
                      disabled={trabajando}
                      onClick={() => entradas.current[p.clave]?.click()}
                      className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-teal-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {trabajando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
                      {version ? 'Cambiar' : 'Seleccionar imagen'}
                    </button>
                    {version && (
                      <button
                        type="button"
                        disabled={trabajando}
                        onClick={() => quitar(p.clave)}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <NosotrosEditor />
      </div>

      <div className="xl:col-span-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Vista previa de la portada</p>
        <div className="flex justify-center">
          <PortadaLogin imagenes={imagenes} />
        </div>
      </div>
    </div>
  );
};
