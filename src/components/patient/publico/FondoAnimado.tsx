import React, { useEffect, useRef } from 'react';
import { iniciarAnimacionMicroscopio, iniciarFondoMargenes } from './fondoMicroscopio';

const prefiereMenosMovimiento = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    return iniciarAnimacionMicroscopio(el, prefiereMenosMovimiento());
  }, []);
  return <canvas ref={lienzo} aria-hidden="true" className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
};

/**
 * Fondo de todo el portal del paciente: una red de puntos suave detrás del
 * contenido y, en el espacio en blanco de cada lado, un microscopio que se
 * forma y se deshace. `referencia` es el contenedor del contenido (para saber
 * cuánto espacio sobra a los lados). Quien lo use debe poner su contenido con
 * `relative z-10` para que quede por encima.
 */
export const FondoMargenes: React.FC<{ referencia: React.RefObject<HTMLElement | null> }> = ({ referencia }) => {
  const lienzo = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = lienzo.current;
    const contenido = referencia.current;
    if (!el || !contenido) return;
    return iniciarFondoMargenes(el, contenido, prefiereMenosMovimiento());
  }, [referencia]);
  return <canvas ref={lienzo} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
};
