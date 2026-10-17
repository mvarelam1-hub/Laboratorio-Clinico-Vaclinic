import React from 'react';

export interface PestanaHub<T extends string> {
  id: T;
  etiqueta: string;
  contador?: number;
  /** Contador en rojo (algo que atender) en lugar de gris (solo informativo). */
  alerta?: boolean;
}

interface HubTabsProps<T extends string> {
  pestanas: PestanaHub<T>[];
  activa: T;
  onCambiar: (id: T) => void;
  etiquetaAccesible: string;
}

/**
 * Barra de pestañas común de las pantallas agrupadas (Órdenes, Alertas y
 * críticos). Cada pestaña sigue siendo una "pestaña de personal" propia, así que
 * los accesos directos del sistema (por ejemplo, ir a "papelera") siguen
 * funcionando igual que antes.
 */
export function HubTabs<T extends string>({ pestanas, activa, onCambiar, etiquetaAccesible }: HubTabsProps<T>) {
  return (
    <div role="tablist" aria-label={etiquetaAccesible} className="mb-4 flex flex-wrap gap-1.5 print:hidden">
      {pestanas.map((p) => {
        const seleccionada = p.id === activa;
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={seleccionada}
            onClick={() => onCambiar(p.id)}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
              seleccionada
                ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700'
            }`}
          >
            <span>{p.etiqueta}</span>
            {p.contador != null && p.contador > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                  p.alerta ? 'bg-rose-600 text-white' : seleccionada ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {p.contador}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
