/**
 * Filtro por periodo de la lista de Órdenes. Usa SIEMPRE la fecha real del
 * equipo (hora local, no UTC) — nunca fechas fijas.
 */
export type Periodo = 'todas' | 'hoy' | 'semana' | 'mes' | 'anio';

export const aFechaLocal = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** ¿La fecha (YYYY-MM-DD) cae dentro del periodo, respecto a `ahora`? La semana va de lunes a hoy. */
export const coincidePeriodo = (fecha: string, periodo: Periodo, ahora: Date = new Date()): boolean => {
  if (periodo === 'todas') return true;
  const f = (fecha || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return false;
  const hoy = aFechaLocal(ahora);
  if (periodo === 'hoy') return f === hoy;
  if (periodo === 'mes') return f.slice(0, 7) === hoy.slice(0, 7);
  if (periodo === 'anio') return f.slice(0, 4) === hoy.slice(0, 4);
  const lunes = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
  return f >= aFechaLocal(lunes) && f <= hoy;
};
