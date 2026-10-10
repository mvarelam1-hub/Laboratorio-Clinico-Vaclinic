import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PALETAS,
  PALETA_ORIGINAL,
  aplicarTema,
  avisosDeContraste,
  contraste,
  escalaDesdeAcento,
  esHexValido,
  guardarTemaEnCache,
  leerTemaEnCache,
  mezclar,
  validarColores,
  variablesDeTema
} from './tema';

describe('colores', () => {
  it('valida #rrggbb y nada más', () => {
    expect(esHexValido('#0a3922')).toBe(true);
    expect(esHexValido('#0A3922')).toBe(true);
    expect(esHexValido('0a3922')).toBe(false);
    expect(esHexValido('#fff')).toBe(false);
    expect(esHexValido('red')).toBe(false);
    expect(esHexValido(null)).toBe(false);
  });

  it('mezcla colores y calcula contraste WCAG', () => {
    expect(mezclar('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mezclar('#102030', '#ffffff', 0)).toBe('#102030');
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contraste('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('la escala 600 siempre deja el texto blanco legible', () => {
    for (const p of PALETAS) {
      const e = escalaDesdeAcento(p.colores.acento);
      expect(contraste(e['600'], '#ffffff')).toBeGreaterThanOrEqual(4.5);
    }
    // incluso con un acento muy claro
    expect(contraste(escalaDesdeAcento('#ffe066')['600'], '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('paletas listas', () => {
  it('todas tienen 4 colores válidos y el botón se lee con texto oscuro', () => {
    for (const p of PALETAS) {
      expect(validarColores(p.colores)).toEqual(p.colores);
      expect(avisosDeContraste(p.colores)).toEqual([]);
    }
  });

  it('la original no sobrescribe nada; las demás sí', () => {
    expect(variablesDeTema(PALETA_ORIGINAL.colores)).toEqual({});
    const v = variablesDeTema(PALETAS[1].colores);
    expect(v['--color-canopy']).toBe(PALETAS[1].colores.menu);
    expect(v['--color-leaf']).toBe(PALETAS[1].colores.acento);
    expect(v['--color-coral-pulse']).toBe(PALETAS[1].colores.boton);
    expect(v['--color-lavender-mist']).toBe(PALETAS[1].colores.fondo);
    expect(v['--color-teal-600']).toBeTruthy();
  });
});

describe('avisos de legibilidad', () => {
  it('avisa si el botón, el acento o el fondo no se leen', () => {
    const avisos = avisosDeContraste({ menu: '#0a3922', acento: '#0b3b24', boton: '#220044', fondo: '#101010' });
    expect(avisos.map((a) => a.clave).sort()).toEqual(['acento', 'boton', 'fondo']);
  });
});

/** Destino falso: imita solo lo que usa aplicarTema (style.setProperty/removeProperty/getPropertyValue). */
function crearDestino() {
  const valores = new Map<string, string>();
  const destino = {
    style: {
      setProperty: (n: string, v: string) => void valores.set(n, v),
      removeProperty: (n: string) => void valores.delete(n),
      getPropertyValue: (n: string) => valores.get(n) ?? ''
    }
  };
  return destino as unknown as HTMLElement;
}

/** localStorage falso en memoria. */
function crearAlmacen() {
  const datos = new Map<string, string>();
  return {
    getItem: (k: string) => (datos.has(k) ? datos.get(k)! : null),
    setItem: (k: string, v: string) => void datos.set(k, String(v)),
    removeItem: (k: string) => void datos.delete(k),
    clear: () => datos.clear()
  };
}

describe('aplicar y recordar', () => {
  let almacen: ReturnType<typeof crearAlmacen>;
  beforeEach(() => {
    almacen = crearAlmacen();
    vi.stubGlobal('localStorage', almacen);
  });

  it('aplica las variables sobre el elemento y las quita al volver al original', () => {
    const el = crearDestino();
    aplicarTema(PALETAS[2].colores, el);
    expect(el.style.getPropertyValue('--color-canopy')).toBe(PALETAS[2].colores.menu);
    aplicarTema(PALETAS[1].colores, el);
    expect(el.style.getPropertyValue('--color-canopy')).toBe(PALETAS[1].colores.menu);
    aplicarTema(null, el);
    expect(el.style.getPropertyValue('--color-canopy')).toBe('');
    expect(el.style.getPropertyValue('--color-teal-600')).toBe('');
  });

  it('guarda y lee la paleta del navegador, ignorando datos dañados', () => {
    guardarTemaEnCache(PALETAS[3].colores);
    expect(leerTemaEnCache()).toEqual(PALETAS[3].colores);
    almacen.setItem('vaclinic_tema', '{"menu":"url(x)"}');
    expect(leerTemaEnCache()).toBeNull();
    almacen.setItem('vaclinic_tema', 'no es json');
    expect(leerTemaEnCache()).toBeNull();
    guardarTemaEnCache(null);
    expect(almacen.getItem('vaclinic_tema')).toBeNull();
  });

  it('si el navegador no permite guardar, no falla', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); }, removeItem: () => { throw new Error('bloqueado'); } });
    expect(() => guardarTemaEnCache(PALETAS[1].colores)).not.toThrow();
    expect(leerTemaEnCache()).toBeNull();
  });
});
