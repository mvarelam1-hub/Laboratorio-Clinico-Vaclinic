import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import {
  obtenerNosotrosAdmin,
  guardarNosotros,
  LIMITES_NOSOTROS,
  MAX_VALORES_NOSOTROS,
  MAX_EQUIPO_NOSOTROS,
  type Nosotros,
} from '../../../services/nosotrosApiService';

type Aviso = { tipo: 'ok' | 'error'; texto: string } | null;

const campo = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-200';

function rellenar(d: Nosotros): Nosotros {
  const valores = [...d.valores];
  while (valores.length < MAX_VALORES_NOSOTROS) valores.push({ titulo: '', texto: '' });
  const equipo = [...d.equipo];
  while (equipo.length < MAX_EQUIPO_NOSOTROS) equipo.push({ nombre: '', cargo: '' });
  return { ...d, valores, equipo };
}

/**
 * Ajustes → "Nosotros": los textos de la pestaña Nosotros del Portal del
 * Paciente. Las fotos se cambian arriba, en la lista de imágenes (las que
 * empiezan con "Nosotros"). El equipo solo se muestra si tiene nombre.
 */
export const NosotrosEditor: React.FC = () => {
  const [datos, setDatos] = useState<Nosotros | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  useEffect(() => {
    let vivo = true;
    obtenerNosotrosAdmin().then((r) => {
      if (!vivo) return;
      if (r.ok) setDatos(rellenar(r.datos));
      else setAviso({ tipo: 'error', texto: r.message });
      setCargando(false);
    });
    return () => { vivo = false; };
  }, []);

  function cambiar(parche: Partial<Nosotros>) {
    setDatos((d) => (d ? { ...d, ...parche } : d));
    setAviso(null);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!datos) return;
    setGuardando(true);
    setAviso(null);
    const r = await guardarNosotros(datos);
    setGuardando(false);
    if (r.ok) {
      setDatos(rellenar(r.datos));
      setAviso({ tipo: 'ok', texto: 'Listo: la página Nosotros ya muestra estos textos.' });
    } else {
      setAviso({ tipo: 'error', texto: r.message });
    }
  }

  if (cargando) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600" role="status">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden="true" /> Cargando textos de Nosotros…
      </div>
    );
  }
  if (!datos) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">
        {aviso?.texto || 'No se pudo cargar la página Nosotros.'}
      </div>
    );
  }

  const contador = (valor: string, max: number) => (
    <span className={`text-[11px] ${valor.length > max ? 'font-bold text-rose-700' : 'text-slate-500'}`}>{valor.length}/{max}</span>
  );

  return (
    <form onSubmit={guardar} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <h3 className="text-sm font-black text-slate-900">Página «Nosotros» del portal del paciente</h3>
      <p className="mt-1 text-xs text-slate-600">
        Escribe aquí los textos que verán los pacientes. Las fotos de esta página se cambian en la lista de imágenes de arriba
        (las que dicen «Nosotros»). Si dejas el equipo vacío, esa sección no se muestra.
      </p>

      <div className="mt-4 space-y-4">
        <label className="block text-xs font-bold text-slate-800">
          <span className="flex justify-between"><span>Presentación (texto grande del encabezado)</span>{contador(datos.intro, LIMITES_NOSOTROS.intro)}</span>
          <textarea className={campo} rows={2} value={datos.intro} onChange={(e) => cambiar({ intro: e.target.value })} />
        </label>
        <label className="block text-xs font-bold text-slate-800">
          <span className="flex justify-between"><span>Visión</span>{contador(datos.vision, LIMITES_NOSOTROS.vision)}</span>
          <textarea className={campo} rows={4} value={datos.vision} onChange={(e) => cambiar({ vision: e.target.value })} />
        </label>
        <label className="block text-xs font-bold text-slate-800">
          <span className="flex justify-between"><span>Misión</span>{contador(datos.mision, LIMITES_NOSOTROS.mision)}</span>
          <textarea className={campo} rows={4} value={datos.mision} onChange={(e) => cambiar({ mision: e.target.value })} />
        </label>

        <fieldset>
          <legend className="text-xs font-bold text-slate-800">Valores (hasta {MAX_VALORES_NOSOTROS}; deja vacío para quitar uno)</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {datos.valores.map((v, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="block text-[11px] font-bold text-slate-700">
                  Título {i + 1}
                  <input className={campo} value={v.titulo} maxLength={LIMITES_NOSOTROS.valorTitulo + 20}
                    onChange={(e) => cambiar({ valores: datos.valores.map((x, k) => (k === i ? { ...x, titulo: e.target.value } : x)) })} />
                </label>
                <label className="mt-2 block text-[11px] font-bold text-slate-700">
                  <span className="flex justify-between"><span>Descripción corta</span>{contador(v.texto, LIMITES_NOSOTROS.valorTexto)}</span>
                  <textarea className={campo} rows={2} value={v.texto}
                    onChange={(e) => cambiar({ valores: datos.valores.map((x, k) => (k === i ? { ...x, texto: e.target.value } : x)) })} />
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-bold text-slate-800">Equipo (hasta {MAX_EQUIPO_NOSOTROS}; la foto N va con la persona N)</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {datos.equipo.map((m, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="block text-[11px] font-bold text-slate-700">
                  Nombre {i + 1}
                  <input className={campo} value={m.nombre} maxLength={LIMITES_NOSOTROS.nombre + 20}
                    onChange={(e) => cambiar({ equipo: datos.equipo.map((x, k) => (k === i ? { ...x, nombre: e.target.value } : x)) })} />
                </label>
                <label className="mt-2 block text-[11px] font-bold text-slate-700">
                  Cargo
                  <input className={campo} value={m.cargo} maxLength={LIMITES_NOSOTROS.cargo + 20}
                    onChange={(e) => cambiar({ equipo: datos.equipo.map((x, k) => (k === i ? { ...x, cargo: e.target.value } : x)) })} />
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={guardando}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60">
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Guardar página Nosotros
        </button>
        {aviso && (
          <p role={aviso.tipo === 'error' ? 'alert' : 'status'}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${aviso.tipo === 'ok' ? 'text-emerald-700' : 'text-rose-700'}`}>
            {aviso.tipo === 'ok' ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <AlertCircle className="h-4 w-4" aria-hidden="true" />}
            {aviso.texto}
          </p>
        )}
      </div>
    </form>
  );
};
