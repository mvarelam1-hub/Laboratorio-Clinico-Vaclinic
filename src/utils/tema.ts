/**
 * Paleta de colores del sistema (Ajustes → "9. Paleta del sistema").
 *
 * El laboratorio elige 4 colores clave y de ellos se derivan los demás
 * (escala de verdes de los botones internos, tonos pastel, etc.). Se aplican
 * como variables CSS sobre <html>, que son las que ya usan todas las clases
 * del diseño (bg-canopy, bg-leaf, bg-coral-pulse, bg-lavender-mist, bg-teal-*).
 *
 * La paleta "bosque" es el diseño original: al elegirla NO se sobrescribe
 * nada, así el CSS por defecto queda intacto.
 */

export const CLAVES_COLOR = ['menu', 'acento', 'boton', 'fondo'] as const;
export type ClaveColor = (typeof CLAVES_COLOR)[number];
export type ColoresTema = Record<ClaveColor, string>;

export interface PaletaListas {
  id: string;
  nombre: string;
  colores: ColoresTema;
}

export const PALETAS: PaletaListas[] = [
  { id: 'bosque', nombre: 'Bosque (original)', colores: { menu: '#0a3922', acento: '#1dbf73', boton: '#ff643b', fondo: '#eee2ff' } },
  { id: 'oceano', nombre: 'Océano', colores: { menu: '#0b2e4a', acento: '#2bb3e0', boton: '#ff8a3d', fondo: '#e3f0fb' } },
  { id: 'vino', nombre: 'Vino', colores: { menu: '#4a0f2b', acento: '#e0508f', boton: '#f4a21b', fondo: '#fbe8f0' } },
  { id: 'grafito', nombre: 'Grafito', colores: { menu: '#1f2933', acento: '#3ec7a8', boton: '#ff643b', fondo: '#eceff1' } },
  { id: 'violeta', nombre: 'Violeta', colores: { menu: '#2d1067', acento: '#a780ff', boton: '#ffb020', fondo: '#f1e9ff' } },
  { id: 'arena', nombre: 'Arena', colores: { menu: '#4a2c14', acento: '#d99a3d', boton: '#f26a4b', fondo: '#f7efe4' } },
];

export const PALETA_ORIGINAL = PALETAS[0];

/**
 * Estilos del sistema. 'bosque' es el diseño actual (admite las paletas de arriba);
 * 'monad' es pergamino + serif + monoespaciada con su propia paleta fija: todo su CSS
 * vive en index.css bajo la clase `estilo-monad` de <html>.
 */
export type EstiloTema = 'bosque' | 'monad';
export const ESTILO_ORIGINAL: EstiloTema = 'bosque';
export const ESTILOS: { id: EstiloTema; nombre: string; descripcion: string; muestra: ColoresTema }[] = [
  {
    id: 'bosque',
    nombre: 'Bosque',
    descripcion: 'El diseño actual: menú verde, tarjetas pastel y letra redondeada. Admite las paletas y los colores propios.',
    muestra: PALETAS[0].colores
  },
  {
    id: 'monad',
    nombre: 'Monad',
    descripcion: 'Fondo pergamino, títulos en serif, texto en monoespaciada, bordes finos y un solo azul para la acción principal.',
    muestra: { menu: '#242424', acento: '#cfdaf5', boton: '#2b59d1', fondo: '#f6f3f1' }
  }
];

export function esEstiloValido(valor: unknown): valor is EstiloTema {
  return valor === 'bosque' || valor === 'monad';
}

/** Activa o quita el estilo sobre <html> (la clase `estilo-monad` que usa index.css). */
export function aplicarEstilo(estilo: EstiloTema, destino: { classList: { add(c: string): unknown; remove(c: string): unknown } } = document.documentElement): void {
  if (estilo === 'monad') destino.classList.add('estilo-monad');
  else destino.classList.remove('estilo-monad');
}

/** Pinta estilo y colores juntos: con Monad no se tocan las variables de la paleta (Monad tiene la suya). */
export function aplicarDiseno(colores: ColoresTema | null, estilo: EstiloTema): void {
  aplicarEstilo(estilo);
  aplicarTema(estilo === 'monad' ? null : colores);
}

const TEXTO_BOTON = '#1a1a1a';
const BLANCO = '#ffffff';
const NEGRO = '#000000';

export function esHexValido(valor: unknown): valor is string {
  return typeof valor === 'string' && /^#[0-9a-fA-F]{6}$/.test(valor.trim());
}

export function normalizarHex(valor: string): string {
  return valor.trim().toLowerCase();
}

function aRgb(hex: string): [number, number, number] {
  const h = normalizarHex(hex).slice(1);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function aHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mezcla `a` con `b`: t=0 devuelve `a`, t=1 devuelve `b`. */
export function mezclar(a: string, b: string, t: number): string {
  const [r1, g1, b1] = aRgb(a);
  const [r2, g2, b2] = aRgb(b);
  return aHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function canal(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminancia(hex: string): number {
  const [r, g, b] = aRgb(hex);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Relación de contraste WCAG entre dos colores (1 a 21). */
export function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [mayor, menor] = la >= lb ? [la, lb] : [lb, la];
  return (mayor + 0.05) / (menor + 0.05);
}

/** Oscurece `hex` hasta que el texto blanco sobre él se lea (contraste ≥ minimo). */
function oscurecerHastaContraste(hex: string, minimo: number): string {
  let t = 0;
  let actual = hex;
  while (contraste(actual, BLANCO) < minimo && t < 0.95) {
    t += 0.05;
    actual = mezclar(hex, NEGRO, t);
  }
  return actual;
}

/** Escala 50…950 a partir del color de acento (la que usan los botones internos). */
export function escalaDesdeAcento(acento: string): Record<string, string> {
  return {
    '50': mezclar(acento, BLANCO, 0.92),
    '100': mezclar(acento, BLANCO, 0.85),
    '200': mezclar(acento, BLANCO, 0.68),
    '300': mezclar(acento, BLANCO, 0.45),
    '400': mezclar(acento, BLANCO, 0.2),
    '500': acento,
    '600': oscurecerHastaContraste(mezclar(acento, NEGRO, 0.42), 4.5),
    '700': mezclar(acento, NEGRO, 0.52),
    '800': mezclar(acento, NEGRO, 0.62),
    '900': mezclar(acento, NEGRO, 0.72),
    '950': mezclar(acento, NEGRO, 0.82),
  };
}

export function sonIguales(a: ColoresTema, b: ColoresTema): boolean {
  return CLAVES_COLOR.every((k) => normalizarHex(a[k]) === normalizarHex(b[k]));
}

/** Variables CSS que produce una paleta. Vacío si es la original (no se toca nada). */
export function variablesDeTema(colores: ColoresTema): Record<string, string> {
  if (sonIguales(colores, PALETA_ORIGINAL.colores)) return {};
  const menu = normalizarHex(colores.menu);
  const acento = normalizarHex(colores.acento);
  const boton = normalizarHex(colores.boton);
  const fondo = normalizarHex(colores.fondo);
  const vars: Record<string, string> = {
    '--color-canopy': menu,
    '--color-canopy-claro': mezclar(menu, BLANCO, 0.08),
    '--color-leaf': acento,
    '--color-coral-pulse': boton,
    '--color-coral-hover': mezclar(boton, BLANCO, 0.12),
    '--color-lavender-mist': fondo,
    '--color-mint-wash': mezclar(acento, BLANCO, 0.8),
    '--color-sage-wash': mezclar(acento, BLANCO, 0.88),
  };
  for (const [paso, valor] of Object.entries(escalaDesdeAcento(acento))) vars[`--color-teal-${paso}`] = valor;
  return vars;
}

/** Todas las variables que esta paleta puede tocar (para limpiarlas antes de aplicar otra). */
const TODAS_LAS_VARIABLES = Object.keys(variablesDeTema({ menu: '#000001', acento: '#000002', boton: '#000003', fondo: '#000004' }));

export interface AvisoColor {
  clave: ClaveColor;
  texto: string;
}

/** Avisos de legibilidad para la combinación elegida (no bloquean el guardado). */
export function avisosDeContraste(colores: ColoresTema): AvisoColor[] {
  const avisos: AvisoColor[] = [];
  if (contraste(colores.boton, TEXTO_BOTON) < 4.5) {
    avisos.push({ clave: 'boton', texto: 'El texto oscuro del botón principal se leería mal sobre este color. Elige uno más claro.' });
  }
  if (contraste(colores.acento, colores.menu) < 3) {
    avisos.push({ clave: 'acento', texto: 'El acento casi no se distingue del color del menú. Elige uno más claro u oscuro.' });
  }
  if (contraste(colores.fondo, '#111111') < 7) {
    avisos.push({ clave: 'fondo', texto: 'El fondo es muy oscuro para el texto. Elige un tono claro.' });
  }
  return avisos;
}

/** Aplica la paleta sobre <html>. `null` devuelve el diseño original. */
export function aplicarTema(colores: ColoresTema | null, destino: HTMLElement = document.documentElement): void {
  for (const v of TODAS_LAS_VARIABLES) destino.style.removeProperty(v);
  if (!colores) return;
  for (const [nombre, valor] of Object.entries(variablesDeTema(colores))) destino.style.setProperty(nombre, valor);
}

const CLAVE_CACHE = 'vaclinic_tema';

/** Último tema conocido en este navegador, para pintarlo antes de que responda el servidor. */
export function leerTemaEnCache(): ColoresTema | null {
  try {
    const crudo = localStorage.getItem(CLAVE_CACHE);
    if (!crudo) return null;
    return validarColores(JSON.parse(crudo));
  } catch {
    return null;
  }
}

export function guardarTemaEnCache(colores: ColoresTema | null): void {
  try {
    if (colores) localStorage.setItem(CLAVE_CACHE, JSON.stringify(colores));
    else localStorage.removeItem(CLAVE_CACHE);
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

const CLAVE_CACHE_ESTILO = 'vaclinic_estilo';

export function leerEstiloEnCache(): EstiloTema {
  try {
    const v = localStorage.getItem(CLAVE_CACHE_ESTILO);
    return esEstiloValido(v) ? v : ESTILO_ORIGINAL;
  } catch {
    return ESTILO_ORIGINAL;
  }
}

export function guardarEstiloEnCache(estilo: EstiloTema): void {
  try {
    if (estilo === ESTILO_ORIGINAL) localStorage.removeItem(CLAVE_CACHE_ESTILO);
    else localStorage.setItem(CLAVE_CACHE_ESTILO, estilo);
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

/** Devuelve los 4 colores normalizados, o `null` si falta alguno o no es #rrggbb. */
export function validarColores(valor: unknown): ColoresTema | null {
  if (!valor || typeof valor !== 'object') return null;
  const origen = valor as Record<string, unknown>;
  const salida = {} as ColoresTema;
  for (const k of CLAVES_COLOR) {
    const v = origen[k];
    if (!esHexValido(v)) return null;
    salida[k] = normalizarHex(v);
  }
  return salida;
}
