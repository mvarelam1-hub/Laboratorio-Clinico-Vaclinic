/**
 * Línea de tiempo del pedido que ve el paciente en el Portal. Todo sale de
 * datos reales de la orden: nunca se marca un paso como cumplido por
 * costumbre, ni se inventan fechas ni avisos enviados.
 */
export interface PasoSeguimiento {
  clave: 'registrado' | 'solicitud' | 'muestra' | 'ingresados' | 'validados' | 'disponibles';
  etiqueta: string;
  completado: boolean;
  /** ISO; solo cuando el sistema guarda esa fecha de verdad. */
  fecha: string | null;
}

export interface EntradaSeguimiento {
  fechaRegistro: string | Date | null;
  estadoFlujo: string | null;
  totalExamenes: number;
  informes: Array<{ estado: string; fechaCreacion: string | Date | null; fechaPublicacion: string | Date | null }>;
}

const aIso = (v: string | Date | null | undefined): string | null => {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

function compararIso(a: string | null, b: string | null): number {
  const x = a ?? '';
  const y = b ?? '';
  if (x < y) return -1;
  return x > y ? 1 : 0;
}

export function calcularSeguimiento(e: EntradaSeguimiento): PasoSeguimiento[] {
  const enRevisionOMas = e.informes.filter((i) => ['revision', 'publicado', 'entregado'].includes(i.estado));
  const publicados = e.informes.filter((i) => ['publicado', 'entregado'].includes(i.estado));
  const muestraRecibida = (!!e.estadoFlujo && e.estadoFlujo !== 'Pendiente') || e.informes.length > 0;
  // Fechas ISO 8601: el orden por unidades de codigo coincide con el cronologico (no se usa localeCompare).
  const primeraCreacion = enRevisionOMas.map((i) => aIso(i.fechaCreacion)).filter(Boolean).sort(compararIso)[0] ?? null;
  const ultimaPublicacion = publicados.map((i) => aIso(i.fechaPublicacion)).filter(Boolean).sort(compararIso).slice(-1)[0] ?? null;
  const fechaOrden = aIso(e.fechaRegistro);
  const n = e.totalExamenes;
  return [
    { clave: 'registrado', etiqueta: 'Paciente registrado', completado: true, fecha: fechaOrden },
    { clave: 'solicitud', etiqueta: n > 0 ? `Solicitud de exámenes generada (${n} ${n === 1 ? 'examen' : 'exámenes'})` : 'Solicitud de exámenes generada', completado: true, fecha: fechaOrden },
    { clave: 'muestra', etiqueta: muestraRecibida ? 'Muestra recibida' : 'Muestra pendiente de recepción', completado: muestraRecibida, fecha: null },
    { clave: 'ingresados', etiqueta: 'Resultados ingresados', completado: enRevisionOMas.length > 0, fecha: primeraCreacion },
    { clave: 'validados', etiqueta: 'Resultados validados', completado: publicados.length > 0, fecha: ultimaPublicacion },
    { clave: 'disponibles', etiqueta: 'Resultados disponibles', completado: publicados.length > 0, fecha: ultimaPublicacion }
  ];
}
