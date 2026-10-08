/**
 * Modo demostración vs. modo real.
 *
 * Por defecto el sistema corre en MODO REAL: no se cargan pacientes, órdenes,
 * informes, mensajes de chat, alertas ni personal de ejemplo; todo lo que se
 * ve viene de la base de datos real (o está vacío hasta que se registre).
 *
 * Para capacitaciones o demostraciones se puede activar el modo demo con la
 * variable de entorno de Vite `VITE_DEMO_MODE=true` al compilar. En ese modo
 * se cargan los datos de ejemplo de `src/data/*` y se habilitan los
 * simuladores (push, consumo de reactivos, etc.). NUNCA debe activarse en el
 * sitio que usan pacientes y personal con datos reales.
 */
export const DEMO_MODE: boolean = import.meta.env.VITE_DEMO_MODE === 'true';

/** Devuelve los datos de ejemplo solo en modo demo; en modo real, una lista vacía. */
export function soloEnDemo<T>(datosDemo: T[]): T[] {
  return DEMO_MODE ? datosDemo : [];
}
