/**
 * Cotizador del catálogo público: lógica pura.
 *
 * Reglas:
 *  - Los precios NO son públicos: solo hay total cuando el servidor los envió
 *    (sesión con código de consulta). Sin ellos, la cotización es solo la lista
 *    de pruebas y se pide el precio al laboratorio.
 *  - Una prueba sin precio (null) nunca cuenta como Q0: se marca «por confirmar».
 *  - Si una prueba ya viene dentro de un perfil/paquete seleccionado, se avisa
 *    para no cobrarla dos veces.
 */
import { COMPOSICION_POR_CODIGO } from '../data/composicionPerfiles';
import type { ExamenPublico } from '../services/publicoApiService';
import { esPanel, formatoPrecio, normalizarTexto } from './catalogoPublico';

export interface Cotizacion {
  pruebas: ExamenPublico[];
  /** true si el servidor envió los precios (sesión del portal). */
  preciosVisibles: boolean;
  /** Suma de las pruebas con precio; null si los precios no son visibles. */
  total: number | null;
  /** Cuántas pruebas seleccionadas no tienen precio definido (solo con precios visibles). */
  sinPrecio: number;
}

export function calcularCotizacion(pruebas: ExamenPublico[], preciosVisibles: boolean): Cotizacion {
  if (!preciosVisibles) return { pruebas, preciosVisibles, total: null, sinPrecio: 0 };
  let total = 0;
  let sinPrecio = 0;
  for (const p of pruebas) {
    if (p.precio == null || !Number.isFinite(p.precio)) sinPrecio += 1;
    else total += p.precio;
  }
  // Redondeo a centavos para evitar 0.1 + 0.2.
  return { pruebas, preciosVisibles, total: Math.round(total * 100) / 100, sinPrecio };
}

/**
 * Pruebas seleccionadas que ya están incluidas en OTRO perfil/paquete también
 * seleccionado. Devuelve código de la prueba → nombre del paquete que la incluye.
 */
export function pruebasYaIncluidas(seleccion: ExamenPublico[], todos: ExamenPublico[]): Map<string, string> {
  const resultado = new Map<string, string>();
  const porCodigo = new Map(todos.map((x) => [x.codigo, x]));
  for (const panel of seleccion.filter(esPanel)) {
    const codigos = new Set(COMPOSICION_POR_CODIGO[panel.codigo] ?? []);
    const nombres = new Set(panel.parametros.map(normalizarTexto));
    for (const e of seleccion) {
      if (e.codigo === panel.codigo || resultado.has(e.codigo)) continue;
      const incluidaPorCodigo = codigos.has(e.codigo);
      const incluidaPorNombre = nombres.size > 0 && nombres.has(normalizarTexto(porCodigo.get(e.codigo)?.nombre ?? e.nombre));
      if (incluidaPorCodigo || incluidaPorNombre) resultado.set(e.codigo, panel.nombre);
    }
  }
  return resultado;
}

/** Texto plano de la cotización (WhatsApp o copiar): una línea por prueba; precios solo si son visibles. Sin emojis. */
export function textoCotizacion(c: Cotizacion, nombreLab: string): string {
  const lineas = c.pruebas.map((p, i) => `${i + 1}. ${p.nombre}${c.preciosVisibles ? ` - ${formatoPrecio(p.precio)}` : ''}`);
  const cabecera = c.preciosVisibles ? `Cotización de pruebas - ${nombreLab}` : `Hola, quisiera cotizar estas pruebas en ${nombreLab}:`;
  const pie: string[] = [];
  if (c.preciosVisibles && c.total != null) {
    pie.push(`Total: ${formatoPrecio(c.total)}${c.sinPrecio ? ` (más ${c.sinPrecio} prueba${c.sinPrecio === 1 ? '' : 's'} con precio por confirmar)` : ''}`);
    pie.push('Precios referenciales; se confirman en recepción al registrar la orden.');
  } else {
    pie.push('¿Me pueden indicar el precio y si hay paquetes u ofertas?');
  }
  return [cabecera, '', ...lineas, '', ...pie].join('\n');
}

/** Enlace de WhatsApp con la cotización. null si el laboratorio no tiene número (8 dígitos = Guatemala, +502). */
export function enlaceCotizacion(whatsapp: string | null | undefined, texto: string): string | null {
  let numero = (whatsapp || '').replace(/\D/g, '');
  if (numero.length === 8) numero = `502${numero}`;
  if (numero.length < 8) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

/** Máximo de pruebas por cotización: evita enlaces de WhatsApp demasiado largos. */
export const MAX_PRUEBAS_COTIZACION = 40;
