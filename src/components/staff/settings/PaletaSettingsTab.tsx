import React, { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Info, RotateCcw, Save, Undo2 } from 'lucide-react';
import {
  PALETAS,
  PALETA_ORIGINAL,
  CLAVES_COLOR,
  aplicarTema,
  avisosDeContraste,
  esHexValido,
  guardarTemaEnCache,
  leerTemaEnCache,
  mezclar,
  normalizarHex,
  sonIguales,
  type ClaveColor,
  type ColoresTema
} from '../../../utils/tema';
import { guardarTemaRemoto, obtenerTemaRemoto, restablecerTemaRemoto } from '../../../services/temaApiService';

/**
 * Ajustes → "9. Paleta del sistema": el laboratorio elige entre paletas listas
 * o cambia 4 colores clave. Mientras se edita, la aplicación completa se ve con
 * esos colores (vista previa en vivo); solo al guardar se aplican a todos los
 * usuarios y al portal del paciente. Solo administrador_ti y director pueden
 * guardar (lo valida el servidor) y cada cambio queda en la bitácora.
 */

const CAMPOS: { clave: ClaveColor; etiqueta: string; ayuda: string }[] = [
  { clave: 'menu', etiqueta: 'Menú y barras', ayuda: 'Menú lateral, barra superior y fondos oscuros.' },
  { clave: 'acento', etiqueta: 'Acento', ayuda: 'Opción activa del menú, detalles y botones internos.' },
  { clave: 'boton', etiqueta: 'Botón principal', ayuda: 'Los botones más importantes (por ejemplo "Revisar y liquidar").' },
  { clave: 'fondo', etiqueta: 'Fondo de la página', ayuda: 'El color detrás de las tarjetas blancas.' }
];

export const PaletaSettingsTab: React.FC = () => {
  const [colores, setColores] = useState<ColoresTema>(PALETA_ORIGINAL.colores);
  const [textos, setTextos] = useState<ColoresTema>(PALETA_ORIGINAL.colores);
  const [paleta, setPaleta] = useState<string>('bosque');
  const [ocupado, setOcupado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  // Lo que hoy tiene el laboratorio guardado: a esto se vuelve al salir sin guardar.
  const guardado = useRef<ColoresTema>(PALETA_ORIGINAL.colores);

  useEffect(() => {
    let vivo = true;
    let cargado = false;
    obtenerTemaRemoto().then((r) => {
      if (!vivo) return;
      cargado = true;
      // r === undefined: no se pudo consultar; se deja lo que ya se ve.
      const base = r ? r.colores : r === null ? PALETA_ORIGINAL.colores : (leerTemaEnCache() ?? PALETA_ORIGINAL.colores);
      guardado.current = base;
      aplicarTema(base);
      setColores(base);
      setTextos(base);
      setPaleta(r?.paleta ?? (r ? 'personalizada' : 'bosque'));
      setCargando(false);
    });
    return () => {
      vivo = false;
      // Si se sale sin guardar, la aplicación vuelve a la paleta guardada
      // (solo si ya se supo cuál es; antes de cargar no se toca nada).
      if (cargado) aplicarTema(guardado.current);
    };
  }, []);

  const cambiar = (nuevos: ColoresTema, idPaleta: string) => {
    setColores(nuevos);
    setTextos(nuevos);
    setPaleta(idPaleta);
    setMensaje(null);
    aplicarTema(nuevos); // vista previa en vivo
  };

  const elegirPaleta = (id: string) => {
    const p = PALETAS.find((x) => x.id === id);
    if (p) cambiar(p.colores, p.id);
  };

  const cambiarColor = (clave: ClaveColor, valor: string) => {
    setTextos((t) => ({ ...t, [clave]: valor }));
    if (!esHexValido(valor)) return;
    const nuevos = { ...colores, [clave]: normalizarHex(valor) };
    setColores(nuevos);
    setPaleta('personalizada');
    setMensaje(null);
    aplicarTema(nuevos);
  };

  const hayCambios = !sonIguales(colores, guardado.current);
  const avisos = avisosDeContraste(colores);

  const guardar = async () => {
    setMensaje(null);
    setOcupado(true);
    const r = await guardarTemaRemoto(paleta === 'personalizada' ? null : paleta, colores);
    setOcupado(false);
    if (r.ok === true) {
      guardado.current = colores;
      guardarTemaEnCache(colores);
      setMensaje({ tipo: 'ok', texto: 'Paleta guardada. Todos los usuarios y el portal del paciente la verán al recargar la página.' });
    } else {
      setMensaje({ tipo: 'error', texto: r.message });
    }
  };

  const descartar = () => {
    cambiar(guardado.current, paleta === 'personalizada' ? 'personalizada' : paleta);
    setMensaje(null);
  };

  const volverAlOriginal = async () => {
    setMensaje(null);
    setOcupado(true);
    const r = await restablecerTemaRemoto();
    setOcupado(false);
    if (r.ok === true) {
      guardado.current = PALETA_ORIGINAL.colores;
      guardarTemaEnCache(null);
      setColores(PALETA_ORIGINAL.colores);
      setTextos(PALETA_ORIGINAL.colores);
      setPaleta('bosque');
      aplicarTema(null);
      setMensaje({ tipo: 'ok', texto: 'Se restableció el diseño original (Bosque).' });
    } else {
      setMensaje({ tipo: 'error', texto: r.message });
    }
  };

  if (cargando) {
    return (
      <p role="status" className="flex items-center gap-2 py-8 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando la paleta…
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="space-y-4 xl:col-span-7">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-black text-slate-900">Paleta de colores del sistema</h3>
          <p className="mt-1 text-xs text-slate-600">
            Elige una paleta lista o cambia los cuatro colores clave. Mientras eliges, toda la aplicación se ve con esos colores como
            vista previa; solo al guardar se aplican para todo el laboratorio y para el portal del paciente.
          </p>
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-sky-wash p-3 text-[11px] font-medium text-slate-800">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            Solo el administrador de sistemas y el director pueden guardar la paleta. Los demás usuarios verán el cambio al recargar la página.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-black text-slate-900">Paletas listas</p>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PALETAS.map((p) => {
              const activa = paleta === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => elegirPaleta(p.id)}
                    aria-pressed={activa}
                    className={`w-full cursor-pointer rounded-2xl border p-3 text-left transition-colors ${
                      activa ? 'border-leaf bg-sage-wash' : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex overflow-hidden rounded-full">
                      {CLAVES_COLOR.map((k) => (
                        <span key={k} className="h-6 flex-1" style={{ backgroundColor: p.colores[k] }} />
                      ))}
                    </span>
                    <span className="mt-2 block text-xs font-bold text-slate-900">{p.nombre}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-black text-slate-900">Colores propios</p>
          <ul className="mt-3 space-y-3">
            {CAMPOS.map((c) => (
              <li key={c.clave} className="flex flex-wrap items-center gap-3">
                <input
                  type="color"
                  aria-label={`Elegir color: ${c.etiqueta}`}
                  value={colores[c.clave]}
                  onChange={(e) => cambiarColor(c.clave, e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                />
                <input
                  type="text"
                  aria-label={`Código del color: ${c.etiqueta}`}
                  value={textos[c.clave]}
                  onChange={(e) => cambiarColor(c.clave, e.target.value)}
                  maxLength={7}
                  spellCheck={false}
                  className={`w-28 rounded-lg border px-3 py-2 font-mono text-xs ${esHexValido(textos[c.clave]) ? 'border-slate-300' : 'border-rose-400 bg-rose-50'}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900">{c.etiqueta}</p>
                  <p className="text-[11px] leading-snug text-slate-500">{c.ayuda}</p>
                </div>
              </li>
            ))}
          </ul>

          {avisos.length > 0 && (
            <ul className="mt-4 space-y-2" aria-label="Avisos de legibilidad">
              {avisos.map((a) => (
                <li key={a.clave} className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-medium text-amber-900">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                  {a.texto}
                </li>
              ))}
            </ul>
          )}
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={guardar}
            disabled={ocupado || !hayCambios}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-coral-pulse px-5 py-2.5 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-coral-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar para todo el laboratorio
          </button>
          <button
            type="button"
            onClick={descartar}
            disabled={ocupado || !hayCambios}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Undo2 className="h-4 w-4" />
            Descartar cambios
          </button>
          <button
            type="button"
            onClick={volverAlOriginal}
            disabled={ocupado}
            className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Volver al diseño original
          </button>
        </div>
      </div>

      <div className="xl:col-span-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Vista previa</p>
        <div className="overflow-hidden rounded-3xl border border-slate-200" style={{ backgroundColor: colores.fondo }} aria-hidden="true">
          <div className="flex min-h-[260px]">
            <div className="w-1/3 space-y-2 p-3" style={{ backgroundColor: colores.menu }}>
              <p className="text-xs font-bold text-white">VACLINIC</p>
              <p className="rounded-full px-3 py-1.5 text-[11px] font-bold" style={{ backgroundColor: colores.acento, color: colores.menu }}>Nueva orden</p>
              <p className="px-3 py-1.5 text-[11px] font-medium" style={{ color: mezclar(colores.menu, '#ffffff', 0.85) }}>Pacientes</p>
              <p className="px-3 py-1.5 text-[11px] font-medium" style={{ color: mezclar(colores.menu, '#ffffff', 0.85) }}>Órdenes</p>
            </div>
            <div className="flex-1 space-y-3 p-4">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm font-bold text-slate-900">Nueva orden</p>
                <p className="mt-1 text-[11px] text-slate-500">Así se verán las tarjetas y los botones.</p>
                <span
                  className="mt-3 inline-block rounded-full px-4 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: colores.boton, color: '#1a1a1a' }}
                >
                  Revisar y liquidar
                </span>
              </div>
              <div className="rounded-2xl p-4" style={{ backgroundColor: mezclar(colores.acento, '#ffffff', 0.8) }}>
                <p className="text-sm font-bold" style={{ color: colores.menu }}>Tarjeta con acento</p>
                <p className="mt-1 text-[11px] text-slate-700">Detalles y fondos suaves salen del acento.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
