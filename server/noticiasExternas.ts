/**
 * Titulares de salud de una fuente externa (LabMedica en Español) para la
 * sección "Noticias y Salud" del Portal del Paciente.
 *
 * Qué hace: lee los feeds RSS PÚBLICOS de LabMedica cada cierto tiempo y
 * guarda en memoria titular + resumen corto + fecha + enlace. Qué NO hace:
 * no copia los artículos ni sus imágenes; el paciente siempre sale a la
 * página original (con su nombre como fuente).
 *
 * Seguridad: las direcciones a consultar son una lista fija (no vienen del
 * usuario), solo se aceptan enlaces https del propio dominio de la fuente y
 * todo texto se limpia de etiquetas HTML antes de guardarse.
 */

export interface NoticiaExterna {
  titulo: string;
  resumen: string;
  enlace: string;
  /** Fecha en formato YYYY-MM-DD, o null si el feed no la trae bien. */
  fecha: string | null;
  fuente: string;
  tema: string;
}

export interface FeedExterno { tema: string; url: string; }

export const FUENTE_EXTERNA = 'LabMedica en Español';
const DOMINIO_FUENTE = 'labmedica.es';

export const FEEDS_EXTERNOS: FeedExterno[] = [
  { tema: 'Química clínica', url: 'https://www.labmedica.es/rss/301/química_clínica.rss' },
  { tema: 'Hematología', url: 'https://www.labmedica.es/rss/303/hematología.rss' },
  { tema: 'Inmunología', url: 'https://www.labmedica.es/rss/304/inmunología.rss' },
  { tema: 'Microbiología', url: 'https://www.labmedica.es/rss/305/microbiología.rss' },
  { tema: 'Diagnóstico molecular', url: 'https://www.labmedica.es/rss/302/diagnostico_molecular.rss' },
  { tema: 'Patología', url: 'https://www.labmedica.es/rss/294740024/patología.rss' },
];

const MAX_NOTICIAS = 12;
const MAX_BYTES_FEED = 500_000;
const TIEMPO_ESPERA_MS = 8000;
export const VIGENCIA_CACHE_MS = 30 * 60 * 1000;

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodificar(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '';
    }
    return ENTIDADES[e.toLowerCase()] ?? m;
  });
}

/** Quita CDATA y etiquetas, decodifica entidades y colapsa espacios. */
export function limpiarTexto(crudo: string, max: number): string {
  const sinCdata = crudo.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  const sinEtiquetas = decodificar(sinCdata).replace(/<[^>]*>/g, ' ');
  const limpio = decodificar(sinEtiquetas).replace(/\s+/g, ' ').trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1).trimEnd()}…` : limpio;
}

function etiqueta(bloque: string, nombre: string): string {
  const m = bloque.match(new RegExp(`<${nombre}[^>]*>([\\s\\S]*?)</${nombre}>`, 'i'));
  return m ? m[1] : '';
}

function enlaceSeguro(valor: string): string | null {
  try {
    const u = new URL(valor.trim());
    const host = u.hostname.toLowerCase();
    if (u.protocol !== 'https:') return null;
    if (host !== DOMINIO_FUENTE && !host.endsWith(`.${DOMINIO_FUENTE}`)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function fechaIso(valor: string): string | null {
  const t = Date.parse(valor.trim());
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

/** Convierte el XML de un feed RSS 2.0 en noticias. Ignora lo que no sea válido. */
export function parsearRss(xml: string, tema: string): NoticiaExterna[] {
  const noticias: NoticiaExterna[] = [];
  const bloques = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  for (const bloque of bloques) {
    const titulo = limpiarTexto(etiqueta(bloque, 'title'), 200);
    const enlace = enlaceSeguro(limpiarTexto(etiqueta(bloque, 'link'), 600));
    if (!titulo || !enlace) continue;
    noticias.push({
      titulo,
      resumen: limpiarTexto(etiqueta(bloque, 'description'), 300),
      enlace,
      fecha: fechaIso(limpiarTexto(etiqueta(bloque, 'pubDate'), 80)),
      fuente: FUENTE_EXTERNA,
      tema,
    });
  }
  return noticias;
}

/** Junta varias listas, quita repetidas por enlace y deja las más recientes primero. */
export function combinarNoticias(listas: NoticiaExterna[][], max = MAX_NOTICIAS): NoticiaExterna[] {
  const vistos = new Set<string>();
  const todas: NoticiaExterna[] = [];
  for (const lista of listas) {
    for (const n of lista) {
      if (vistos.has(n.enlace)) continue;
      vistos.add(n.enlace);
      todas.push(n);
    }
  }
  todas.sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''));
  return todas.slice(0, max);
}

async function descargarFeed(feed: FeedExterno): Promise<NoticiaExterna[]> {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_ESPERA_MS);
  try {
    const r = await fetch(encodeURI(feed.url), {
      signal: control.signal,
      headers: {
        'User-Agent': 'VACLINIC-Portal/1.0 (titulares con enlace a la fuente original)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const texto = await r.text();
    if (texto.length > MAX_BYTES_FEED) throw new Error('feed demasiado grande');
    return parsearRss(texto, feed.tema);
  } finally {
    clearTimeout(temporizador);
  }
}

let cache: { en: number; noticias: NoticiaExterna[] } | null = null;
let enCurso: Promise<NoticiaExterna[]> | null = null;

/** Solo para pruebas. */
export function reiniciarCacheNoticiasExternas(): void {
  cache = null;
  enCurso = null;
}

async function refrescar(): Promise<NoticiaExterna[]> {
  const resultados = await Promise.allSettled(FEEDS_EXTERNOS.map(descargarFeed));
  const listas: NoticiaExterna[][] = [];
  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') listas.push(r.value);
    else console.warn(`[noticias-externas] No se pudo leer "${FEEDS_EXTERNOS[i].tema}":`, r.reason?.message ?? r.reason);
  });
  const combinadas = combinarNoticias(listas);
  // Si TODO falló, se conserva lo último que sí funcionó (aunque esté viejo).
  if (combinadas.length === 0 && cache) {
    cache = { en: Date.now() - VIGENCIA_CACHE_MS + 5 * 60 * 1000, noticias: cache.noticias };
    return cache.noticias;
  }
  cache = { en: Date.now(), noticias: combinadas };
  return combinadas;
}

/**
 * Devuelve los titulares. Se actualizan solos: si pasaron más de 30 minutos
 * desde la última lectura, la siguiente visita al portal dispara una nueva.
 * Nunca lanza error: si la fuente no responde, devuelve lo último guardado o [].
 */
export async function obtenerNoticiasExternas(): Promise<NoticiaExterna[]> {
  if (cache && Date.now() - cache.en < VIGENCIA_CACHE_MS) return cache.noticias;
  if (!enCurso) {
    enCurso = refrescar().finally(() => { enCurso = null; });
  }
  try {
    return await enCurso;
  } catch {
    return cache?.noticias ?? [];
  }
}
