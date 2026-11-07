/**
 * Lógica pura del catálogo público: completa cada examen del servidor con la
 * ficha de fábrica (descripción, ayuno, parámetros) cuando el laboratorio no la
 * ha editado, agrupa por categoría y filtra por texto. Lo que el laboratorio
 * guardó en el servidor siempre manda sobre la ficha de fábrica.
 */
import { CATALOG_CATEGORIES_META, FACTORY_CATALOG_TESTS } from '../data/factoryCatalog';
import { COMPOSICION_POR_CODIGO } from '../data/composicionPerfiles';
import type { ExamenPublico } from '../services/publicoApiService';

export const normalizarTexto = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const FABRICA = new Map(FACTORY_CATALOG_TESTS.map((t) => [t.code, t]));

/** Examen del servidor + datos de fábrica solo donde el servidor no trae nada. */
export function completarConFabrica(e: ExamenPublico): ExamenPublico {
  const f = FABRICA.get(e.codigo);
  if (!f) return e;
  const parametros = e.parametros.length ? e.parametros : (f.includedParameters ?? []);
  return {
    ...e,
    descripcion: e.descripcion ?? (f.description?.trim() || null),
    ayuno: e.ayuno ?? (f.fasting?.trim() || null),
    requiereAyuno: e.requiereAyuno ?? (typeof f.requiresFasting === 'boolean' ? f.requiresFasting : null),
    instrucciones: e.instrucciones ?? (f.patientInstructions?.trim() || null),
    parametros,
  };
}

/** Nombres de los exámenes que componen un perfil/panel (por código), si se conocen. */
export function componentesDe(e: ExamenPublico, todos: ExamenPublico[]): string[] {
  if (e.parametros.length) return e.parametros;
  const codigos = COMPOSICION_POR_CODIGO[e.codigo];
  if (!codigos) return [];
  const porCodigo = new Map(todos.map((x) => [x.codigo, x.nombre]));
  return codigos.map((c) => porCodigo.get(c)).filter((n): n is string => !!n);
}

export function nombreCategoria(codigo: string | null, personalizado?: string | null): string {
  if (personalizado) return personalizado;
  const meta = CATALOG_CATEGORIES_META.find((c) => c.id === codigo);
  if (meta) return meta.shortName;
  return codigo ? codigo.replace(/^\d+_/, '').replace(/_/g, ' ') : 'Otros';
}

export interface GrupoCategoria { codigo: string; nombre: string; total: number; }

/** Categorías con la cantidad de pruebas, en el orden del catálogo. */
export function categoriasConConteo(lista: ExamenPublico[]): GrupoCategoria[] {
  const mapa = new Map<string, GrupoCategoria>();
  for (const e of lista) {
    const cod = e.categoria || 'otros';
    const g = mapa.get(cod) ?? { codigo: cod, nombre: nombreCategoria(e.categoria, e.categoriaNombre), total: 0 };
    g.total += 1;
    mapa.set(cod, g);
  }
  return [...mapa.values()].sort((a, b) => a.codigo.localeCompare(b.codigo));
}

export function filtrarCatalogo(lista: ExamenPublico[], texto: string, categoria: string | null): ExamenPublico[] {
  const t = normalizarTexto(texto);
  return lista.filter((e) => {
    if (categoria && (e.categoria || 'otros') !== categoria) return false;
    if (!t) return true;
    return normalizarTexto(`${e.nombre} ${e.codigo} ${e.descripcion ?? ''} ${e.tipoMuestra ?? ''}`).includes(t);
  });
}

export const formatoPrecio = (p: number | null): string =>
  p == null ? 'Consultar precio' : `Q${Number.isInteger(p) ? p : p.toFixed(2)}`;

/**
 * Enlace de WhatsApp para pedir autorización y conocer los precios. Devuelve
 * null si el laboratorio no tiene número. Un número de 8 dígitos es de
 * Guatemala (+502).
 */
export function enlaceSolicitudPrecios(whatsapp: string | null | undefined, nombreLab: string): string | null {
  let numero = (whatsapp || '').replace(/\D/g, '');
  if (numero.length === 8) numero = `502${numero}`;
  if (numero.length < 8) return null;
  const mensaje = `Hola, quisiera autorización para conocer los precios de las pruebas de ${nombreLab}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function textoEntrega(horas: number | null): string | null {
  if (horas == null || horas <= 0) return null;
  if (horas < 24) return `${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? '1 día' : `${dias} días`;
}

/** Texto de ayuno si el laboratorio lo indica; null si no hay dato (no se supone). */
export function textoAyuno(e: ExamenPublico): string | null {
  if (e.ayuno) return e.ayuno;
  if (e.requiereAyuno === true) return 'Requiere ayuno';
  return null;
}

/** Perfiles/paneles/paquetes: lo que agrupa varios estudios. */
export function esPanel(e: ExamenPublico): boolean {
  return e.esPerfil || e.categoria === '01_perfiles_paneles' || e.categoria === '10_paquetes_especiales';
}
