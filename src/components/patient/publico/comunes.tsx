import React from 'react';
import type { LaboratorioPublico } from '../../../services/publicoApiService';

export const fechaLarga = (v: string | null | undefined): string => {
  if (!v) return '';
  const d = new Date(String(v).slice(0, 10) + 'T12:00:00');
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const EstadoCarga: React.FC<{ cargando: boolean; error: string | null; onReintentar: () => void; children: React.ReactNode }> = ({ cargando, error, onReintentar, children }) => {
  if (cargando) return <p role="status" className="text-sm text-slate-500 py-8 text-center">Cargando…</p>;
  if (error) {
    return (
      <div role="alert" className="text-center py-8">
        <p className="text-sm font-semibold text-red-700">{error}</p>
        <button onClick={onReintentar} className="mt-3 text-sm font-bold underline text-teal-800 cursor-pointer">Intentar de nuevo</button>
      </div>
    );
  }
  return <>{children}</>;
};

export const TituloSeccion: React.FC<{ titulo: string; subtitulo?: string }> = ({ titulo, subtitulo }) => (
  <header className="mb-5">
    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{titulo}</h1>
    {subtitulo && <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-3xl">{subtitulo}</p>}
  </header>
);

export const AvisoGeneral: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs text-slate-500 mt-6 border-t border-slate-200 pt-3">{children}</p>
);

/** Solo dígitos para wa.me; null si no parece un teléfono. */
export function enlaceWhatsapp(numero: string | null): string | null {
  if (!numero) return null;
  const d = numero.replace(/\D/g, '');
  return d.length >= 8 ? `https://wa.me/${d.length === 8 ? '502' + d : d}` : null;
}

export const TarjetaContacto: React.FC<{ lab: LaboratorioPublico | null }> = ({ lab }) => {
  if (!lab) return null;
  const ubicacion = [lab.direccion, lab.ciudad, lab.departamento].filter(Boolean).join(', ');
  const wa = enlaceWhatsapp(lab.whatsapp);
  const filas: { etiqueta: string; contenido: React.ReactNode }[] = [];
  if (ubicacion) filas.push({ etiqueta: 'Dirección', contenido: ubicacion });
  if (lab.telefono) filas.push({ etiqueta: 'Teléfono', contenido: <a className="underline" href={`tel:${lab.telefono.replace(/[^\d+]/g, '')}`}>{lab.telefono}</a> });
  if (lab.telefonoSecundario) filas.push({ etiqueta: 'Otro teléfono', contenido: <a className="underline" href={`tel:${lab.telefonoSecundario.replace(/[^\d+]/g, '')}`}>{lab.telefonoSecundario}</a> });
  if (lab.whatsapp) filas.push({ etiqueta: 'WhatsApp', contenido: wa ? <a className="underline" href={wa} target="_blank" rel="noopener noreferrer">{lab.whatsapp}</a> : lab.whatsapp });
  if (lab.email) filas.push({ etiqueta: 'Correo', contenido: <a className="underline" href={`mailto:${lab.email}`}>{lab.email}</a> });
  if (lab.website) filas.push({ etiqueta: 'Sitio web', contenido: <a className="underline" href={/^https?:\/\//.test(lab.website) ? lab.website : `https://${lab.website}`} target="_blank" rel="noopener noreferrer">{lab.website}</a> });
  if (!filas.length) return null;
  return (
    <dl className="grid sm:grid-cols-[9rem_1fr] gap-x-4 gap-y-2 text-sm">
      {filas.map((f) => (
        <React.Fragment key={f.etiqueta}>
          <dt className="font-bold text-slate-500">{f.etiqueta}</dt>
          <dd className="text-slate-900 break-words">{f.contenido}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
};
