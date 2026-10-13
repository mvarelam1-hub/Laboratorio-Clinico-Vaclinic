import { describe, it, expect } from 'vitest';
import { normalizarNosotros, combinarNosotros, NOSOTROS_POR_DEFECTO, MAX_EQUIPO } from './nosotros';

const valido = () => ({
  intro: 'Hola', vision: 'Visión', mision: 'Misión',
  valores: [{ titulo: 'Precisión', texto: 'Detalle' }],
  equipo: [{ nombre: 'Ana', cargo: 'Q.B.' }],
});

describe('normalizarNosotros', () => {
  it('acepta datos válidos y completa el equipo a 4 posiciones', () => {
    const r = normalizarNosotros(valido());
    expect('datos' in r).toBe(true);
    if ('datos' in r) {
      expect(r.datos.equipo).toHaveLength(MAX_EQUIPO);
      expect(r.datos.equipo[0]).toEqual({ nombre: 'Ana', cargo: 'Q.B.' });
      expect(r.datos.equipo[3]).toEqual({ nombre: '', cargo: '' });
    }
  });
  it('exige presentación, visión y misión', () => {
    for (const campo of ['intro', 'vision', 'mision']) {
      const b: any = valido(); b[campo] = '   ';
      expect(normalizarNosotros(b)).toHaveProperty('error');
    }
  });
  it('rechaza textos demasiado largos', () => {
    const b = valido(); b.vision = 'a'.repeat(601);
    expect(normalizarNosotros(b)).toHaveProperty('error');
  });
  it('rechaza más de 4 valores, valor sin título y cargo sin nombre', () => {
    const muchos: any = valido(); muchos.valores = Array.from({ length: 5 }, (_, i) => ({ titulo: `V${i}`, texto: '' }));
    expect(normalizarNosotros(muchos)).toHaveProperty('error');
    const sinTitulo: any = valido(); sinTitulo.valores = [{ titulo: '', texto: 'algo' }];
    expect(normalizarNosotros(sinTitulo)).toHaveProperty('error');
    const cargoSolo: any = valido(); cargoSolo.equipo = [{ nombre: '', cargo: 'Director' }];
    expect(normalizarNosotros(cargoSolo)).toHaveProperty('error');
  });
  it('ignora valores totalmente vacíos y colapsa espacios', () => {
    const b: any = valido(); b.valores = [{ titulo: '', texto: '' }, { titulo: '  Calidez  ', texto: 'a   b' }]; b.intro = ' Hola   mundo ';
    const r = normalizarNosotros(b);
    expect('datos' in r && r.datos.valores).toEqual([{ titulo: 'Calidez', texto: 'a b' }]);
    expect('datos' in r && r.datos.intro).toBe('Hola mundo');
  });
  it('rechaza cuerpos que no son objetos con listas', () => {
    expect(normalizarNosotros(null)).toHaveProperty('error');
    const b: any = valido(); b.valores = 'x';
    expect(normalizarNosotros(b)).toHaveProperty('error');
    const c: any = valido(); c.equipo = [1, 2, 3, 4, 5];
    expect(normalizarNosotros(c)).toHaveProperty('error');
  });
});

describe('combinarNosotros', () => {
  it('sin datos guardados devuelve los valores por defecto', () => {
    expect(combinarNosotros(null)).toEqual(NOSOTROS_POR_DEFECTO);
  });
  it('usa lo guardado cuando es válido', () => {
    expect(combinarNosotros(valido()).vision).toBe('Visión');
  });
  it('si lo guardado está dañado conserva lo útil y completa con lo predeterminado', () => {
    const r = combinarNosotros({ vision: 'Mi visión', mision: '', valores: 'roto' });
    expect(r.vision).toBe('Mi visión');
    expect(r.mision).toBe(NOSOTROS_POR_DEFECTO.mision);
    expect(r.valores).toEqual(NOSOTROS_POR_DEFECTO.valores);
  });
});
