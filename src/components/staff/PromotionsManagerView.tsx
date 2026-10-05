import React, { useCallback, useEffect, useState } from 'react';
import { BadgePercent, Plus } from 'lucide-react';
import { useClinic } from '../../context/ClinicContext';
import {
  ContenidoAdmin, ContenidoEntrada, TipoContenido,
  listarContenido, crearContenido, actualizarContenido, eliminarContenido
} from '../../services/contenidoPublicoApiService';

/**
 * Noticias y promociones del Portal del Paciente. Lo que se escribe aquí es lo
 * ÚNICO que el público ve en esas secciones: no hay contenido de ejemplo. Un
 * borrador no se muestra hasta que se marca "Publicado".
 */

const vacio = (tipo: TipoContenido): ContenidoEntrada => ({
  tipo, titulo: '', resumen: '', cuerpo: '', etiqueta: '', fuente: '', enlace: '',
  fechaPublicacion: new Date().toISOString().slice(0, 10), vigenteHasta: '', publicado: false,
});

const hoy = () => new Date().toISOString().slice(0, 10);

function estadoDe(c: ContenidoAdmin): { texto: string; clase: string } {
  if (!c.publicado) return { texto: 'Borrador', clase: 'bg-slate-100 text-slate-700 border-slate-300' };
  if (c.fecha_publicacion > hoy()) return { texto: 'Programado', clase: 'bg-amber-50 text-amber-800 border-amber-300' };
  if (c.vigente_hasta && c.vigente_hasta < hoy()) return { texto: 'Vencido', clase: 'bg-slate-100 text-slate-600 border-slate-300' };
  return { texto: 'Visible al público', clase: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
}

export const PromotionsManagerView: React.FC = () => {
  const { showNotification, hasPermission, currentStaffUser } = useClinic();
  const puedeEditar = hasPermission(currentStaffUser, 'catalogo_tarifas_editar');

  const [items, setItems] = useState<ContenidoAdmin[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<TipoContenido>('promocion');
  const [editando, setEditando] = useState<{ id: number | null; datos: ContenidoEntrada } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try { setItems(await listarContenido()); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cargar.'); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const lista = items.filter((i) => i.tipo === filtro);

  const abrirNuevo = () => { setErrorForm(null); setEditando({ id: null, datos: vacio(filtro) }); };
  const abrirEditar = (c: ContenidoAdmin) => {
    setErrorForm(null);
    setEditando({ id: c.id_contenido, datos: {
      tipo: c.tipo, titulo: c.titulo, resumen: c.resumen, cuerpo: c.cuerpo, etiqueta: c.etiqueta || '',
      fuente: c.fuente || '', enlace: c.enlace || '', fechaPublicacion: c.fecha_publicacion,
      vigenteHasta: c.vigente_hasta || '', publicado: c.publicado,
    } });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    setGuardando(true); setErrorForm(null);
    try {
      if (editando.id == null) await crearContenido(editando.datos);
      else await actualizarContenido(editando.id, editando.datos);
      showNotification(editando.datos.publicado ? 'Guardado y visible en el portal.' : 'Guardado como borrador.', 'success');
      setEditando(null);
      await cargar();
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally { setGuardando(false); }
  };

  const alternarPublicado = async (c: ContenidoAdmin) => {
    try {
      await actualizarContenido(c.id_contenido, {
        tipo: c.tipo, titulo: c.titulo, resumen: c.resumen, cuerpo: c.cuerpo, etiqueta: c.etiqueta || '',
        fuente: c.fuente || '', enlace: c.enlace || '', fechaPublicacion: c.fecha_publicacion,
        vigenteHasta: c.vigente_hasta || '', publicado: !c.publicado,
      });
      showNotification(c.publicado ? 'Ya no se muestra en el portal.' : 'Publicado en el portal.', 'success');
      await cargar();
    } catch (err) { showNotification(err instanceof Error ? err.message : 'No se pudo cambiar.', 'error'); }
  };

  const borrar = async (c: ContenidoAdmin) => {
    if (!window.confirm(`¿Eliminar "${c.titulo}" definitivamente? Si solo quieres ocultarlo, usa "Despublicar".`)) return;
    try { await eliminarContenido(c.id_contenido); showNotification('Eliminado.', 'success'); await cargar(); }
    catch (err) { showNotification(err instanceof Error ? err.message : 'No se pudo eliminar.', 'error'); }
  };

  const set = (campo: keyof ContenidoEntrada, valor: string | boolean) =>
    setEditando((p) => (p ? { ...p, datos: { ...p.datos, [campo]: valor } } : p));

  const etiquetaTipo = filtro === 'promocion' ? 'promoción' : 'noticia';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 text-slate-800">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BadgePercent className="w-6 h-6 text-teal-600" />
            <h1 className="text-2xl font-black text-slate-900">Noticias y promociones del portal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium max-w-2xl">
            Lo que publiques aquí lo ven los pacientes en el Portal del Paciente (Inicio y "Noticias y Salud"). Solo se muestra lo marcado como publicado.
          </p>
        </div>
        {puedeEditar && (
          <button onClick={abrirNuevo} className="self-start bg-teal-700 hover:bg-teal-800 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm cursor-pointer">
            <Plus className="w-4 h-4" /> Nueva {etiquetaTipo}
          </button>
        )}
      </div>

      {!puedeEditar && (
        <p className="text-sm bg-amber-50 border border-amber-300 text-amber-950 rounded-lg px-4 py-2">
          Puedes ver el contenido, pero tu rol no tiene permiso para crear o cambiar promociones y noticias.
        </p>
      )}

      <div role="tablist" aria-label="Tipo de contenido" className="flex gap-2">
        {([['promocion', 'Promociones'], ['noticia', 'Noticias y salud']] as const).map(([id, et]) => (
          <button key={id} role="tab" aria-selected={filtro === id} onClick={() => setFiltro(id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold border cursor-pointer ${filtro === id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'}`}>
            {et} ({items.filter((i) => i.tipo === id).length})
          </button>
        ))}
      </div>

      {cargando ? <p role="status" className="text-sm text-slate-500">Cargando…</p>
        : error ? <p role="alert" className="text-sm font-semibold text-red-700">{error} <button className="underline" onClick={cargar}>Reintentar</button></p>
        : lista.length === 0 ? (
          <p className="text-sm text-slate-600 bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
            Todavía no hay {filtro === 'promocion' ? 'promociones' : 'noticias'}. El portal público dirá que no hay nada publicado hasta que crees una.
          </p>
        ) : (
          <ul className="grid gap-3">
            {lista.map((c) => {
              const est = estadoDe(c);
              return (
                <li key={c.id_contenido} className="bg-white border border-slate-200 rounded-2xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="font-extrabold text-slate-900">{c.titulo}</h2>
                      <p className="text-xs text-slate-500">
                        Publicación: {c.fecha_publicacion}{c.vigente_hasta ? ` · Vigente hasta: ${c.vigente_hasta}` : ''}{c.etiqueta ? ` · ${c.etiqueta}` : ''}
                      </p>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${est.clase}`}>{est.texto}</span>
                  </div>
                  {c.resumen && <p className="text-sm text-slate-700 mt-2">{c.resumen}</p>}
                  {puedeEditar && (
                    <div className="flex flex-wrap gap-3 mt-3 text-sm font-bold">
                      <button onClick={() => abrirEditar(c)} className="text-teal-800 underline cursor-pointer">Editar</button>
                      <button onClick={() => alternarPublicado(c)} className="text-slate-800 underline cursor-pointer">{c.publicado ? 'Despublicar' : 'Publicar'}</button>
                      <button onClick={() => borrar(c)} className="text-red-700 underline cursor-pointer">Eliminar</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

      {editando && (
        <div role="dialog" aria-modal="true" aria-labelledby="titulo-form-contenido" className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-3 overflow-y-auto">
          <form onSubmit={guardar} className="bg-white rounded-2xl w-full max-w-xl p-5 space-y-3 my-4">
            <h2 id="titulo-form-contenido" className="text-lg font-extrabold text-slate-900">
              {editando.id == null ? 'Nueva' : 'Editar'} {editando.datos.tipo === 'promocion' ? 'promoción' : 'noticia'}
            </h2>
            <label className="block text-sm font-bold">Título *
              <input value={editando.datos.titulo} onChange={(e) => set('titulo', e.target.value)} maxLength={160} required autoFocus
                className="mt-1 w-full border border-slate-400 rounded-lg px-3 py-2 font-normal" />
            </label>
            <label className="block text-sm font-bold">Resumen (lo que se ve en la tarjeta)
              <textarea value={editando.datos.resumen} onChange={(e) => set('resumen', e.target.value)} maxLength={400} rows={2}
                className="mt-1 w-full border border-slate-400 rounded-lg px-3 py-2 font-normal" />
            </label>
            <label className="block text-sm font-bold">{editando.datos.tipo === 'promocion' ? 'Condiciones y detalle' : 'Texto completo'}
              <textarea value={editando.datos.cuerpo} onChange={(e) => set('cuerpo', e.target.value)} maxLength={6000} rows={5}
                className="mt-1 w-full border border-slate-400 rounded-lg px-3 py-2 font-normal" />
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-sm font-bold">Etiqueta (opcional)
                <input value={editando.datos.etiqueta} onChange={(e) => set('etiqueta', e.target.value)} maxLength={40} placeholder="Ej.: Prevención"
                  className="mt-1 w-full border border-slate-400 rounded-lg px-3 py-2 font-normal" />
              </label>
              <label className="block text-sm font-bold">Fecha de publicación
                <input type="date" value={editando.datos.fechaPublicacion} onChange={(e) => set('fechaPublicacion', e.target.value)}
                  className="mt-1 w-full border border-slate-400 rounded-lg px-3 py-2 font-normal" />
              </label>
              {editando.datos.tipo === 'promocion' ? (
                <label className="block text-sm font-bold">Vigente hasta (opcional)
                  <input type="date" value={editando.datos.vigenteHasta} onChange={(e) => set('vigenteHasta', e.target.value)}
                    className="mt-1 w-full border border-slate-400 rounded-lg px-3 py-2 font-normal" />
                </label>
              ) : (
                <label className="block text-sm font-bold">Fuente (si copias de otro medio)
                  <input value={editando.datos.fuente} onChange={(e) => set('fuente', e.target.value)} maxLength={120} placeholder="Ej.: Ministerio de Salud"
                    className="mt-1 w-full border border-slate-400 rounded-lg px-3 py-2 font-normal" />
                </label>
              )}
              <label className="block text-sm font-bold">Enlace (opcional)
                <input type="url" value={editando.datos.enlace} onChange={(e) => set('enlace', e.target.value)} placeholder="https://"
                  className="mt-1 w-full border border-slate-400 rounded-lg px-3 py-2 font-normal" />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={editando.datos.publicado} onChange={(e) => set('publicado', e.target.checked)} />
              Publicado (visible para los pacientes)
            </label>
            {errorForm && <p role="alert" className="text-sm font-semibold text-red-700">{errorForm}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setEditando(null)} className="px-4 py-2 text-sm font-bold text-slate-700 cursor-pointer">Cancelar</button>
              <button type="submit" disabled={guardando} className="px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white text-sm font-bold cursor-pointer">
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
