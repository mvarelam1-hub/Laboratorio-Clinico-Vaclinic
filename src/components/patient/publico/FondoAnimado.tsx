import React, { useEffect, useRef } from 'react';
import { iniciarAnimacionMicroscopio } from './fondoMicroscopio';

/**
 * Fondo animado del encabezado de "Nosotros": puntos y líneas que flotan y se
 * juntan formando un microscopio. Es solo decorativo (no lo leen los lectores
 * de pantalla) y respeta "reducir movimiento" del sistema.
 */
export const FondoMicroscopio: React.FC<{ className?: string }> = ({ className = '' }) => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = lienzo.current;
    if (!el) return;
    const reducir = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return iniciarAnimacionMicroscopio(el, reducir);
  }, []);
  return <canvas ref={lienzo} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
};
