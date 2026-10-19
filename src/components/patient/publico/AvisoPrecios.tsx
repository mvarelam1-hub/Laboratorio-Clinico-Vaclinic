import React from 'react';
import { Lock } from 'lucide-react';
import { enlaceSolicitudPrecios } from '../../../utils/catalogoPublico';

interface Props {
  whatsapp: string | null;
  nombreLab: string;
  alIngresarCodigo: () => void;
}

/** Aviso que se muestra donde irían los precios cuando no hay sesión con código de consulta. */
export const AvisoPrecios: React.FC<Props> = ({ whatsapp, nombreLab, alIngresarCodigo }) => {
  const enlace = enlaceSolicitudPrecios(whatsapp, nombreLab);
  return (
    <div role="note" className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 mb-5">
      <p className="flex items-start gap-2 text-sm text-amber-950 min-w-0">
        <Lock className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          <strong>Los precios no son públicos.</strong> Los ven los pacientes que ya tienen un código de consulta de una orden del laboratorio, o quien solicite autorización.
        </span>
      </p>
      <div className="flex flex-wrap gap-2 shrink-0">
        <button type="button" onClick={alIngresarCodigo}
          className="px-3 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold cursor-pointer">
          Ingresar mi código de consulta
        </button>
        {enlace ? (
          <a href={enlace} target="_blank" rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg border border-amber-400 bg-white hover:bg-amber-100 text-amber-950 text-xs font-bold">
            Solicitar autorización por WhatsApp
          </a>
        ) : (
          <span className="px-3 py-2 text-xs font-semibold text-amber-950">Solicita la autorización en recepción.</span>
        )}
      </div>
    </div>
  );
};

/** Texto que reemplaza al precio cuando no está autorizado. */
export const PrecioReservado: React.FC = () => (
  <p className="flex items-center gap-1 text-xs font-semibold text-slate-500 shrink-0">
    <Lock className="w-3 h-3" aria-hidden="true" /> Precio con autorización
  </p>
);
