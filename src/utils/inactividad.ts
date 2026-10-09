/**
 * Lógica pura del cierre de sesión por inactividad (sin DOM, para poder
 * probarla). La usa src/components/staff/InactivityGuard.tsx.
 *
 * - 'activo'   : hubo actividad hace menos de (límite - aviso).
 * - 'aviso'    : faltan `aviso` ms o menos para cerrar: se muestra la
 *                advertencia con cuenta regresiva.
 * - 'expirado' : pasó el límite sin actividad: se cierra la sesión.
 */
export const LIMITE_INACTIVIDAD_MS = 30 * 60 * 1000; // 30 minutos
export const AVISO_INACTIVIDAD_MS = 60 * 1000; // aviso 1 minuto antes

export type EstadoInactividad = 'activo' | 'aviso' | 'expirado';

export function estadoInactividad(
  ultimaActividad: number,
  ahora: number,
  limiteMs: number = LIMITE_INACTIVIDAD_MS,
  avisoMs: number = AVISO_INACTIVIDAD_MS
): EstadoInactividad {
  const inactivo = ahora - ultimaActividad;
  if (inactivo >= limiteMs) return 'expirado';
  if (inactivo >= limiteMs - avisoMs) return 'aviso';
  return 'activo';
}

/** Segundos que faltan para cerrar la sesión (nunca negativo). */
export function segundosRestantes(
  ultimaActividad: number,
  ahora: number,
  limiteMs: number = LIMITE_INACTIVIDAD_MS
): number {
  return Math.max(0, Math.ceil((limiteMs - (ahora - ultimaActividad)) / 1000));
}
