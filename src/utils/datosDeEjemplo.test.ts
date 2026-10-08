import { describe, it, expect } from 'vitest';
import { quitarRegistrosDeEjemplo, limpiarDatosDeEjemplo } from './datosDeEjemplo';

const almacenFalso = (inicial: Record<string, string>) => {
  const m = { ...inicial };
  return { getItem: (k: string) => (k in m ? m[k] : null), setItem: (k: string, v: string) => { m[k] = v; }, _m: m };
};

describe('quitarRegistrosDeEjemplo', () => {
  it('quita solo los ids de ejemplo y conserva los demás', () => {
    const r = quitarRegistrosDeEjemplo(JSON.stringify([{ id: 'pat-1' }, { id: 'pat-real-9' }]), new Set(['pat-1']));
    expect(JSON.parse(r as string)).toEqual([{ id: 'pat-real-9' }]);
  });
  it('sin coincidencias devuelve null (no reescribir)', () => {
    expect(quitarRegistrosDeEjemplo(JSON.stringify([{ id: 'x' }]), new Set(['pat-1']))).toBeNull();
  });
  it('JSON dañado, vacío o que no es arreglo no rompe', () => {
    expect(quitarRegistrosDeEjemplo('{no', new Set(['a']))).toBeNull();
    expect(quitarRegistrosDeEjemplo(null, new Set(['a']))).toBeNull();
    expect(quitarRegistrosDeEjemplo('{"id":"a"}', new Set(['a']))).toBeNull();
  });
  it('si todo era de ejemplo queda un arreglo vacío', () => {
    expect(quitarRegistrosDeEjemplo(JSON.stringify([{ id: 'a' }]), new Set(['a']))).toBe('[]');
  });
});

describe('limpiarDatosDeEjemplo', () => {
  it('limpia varias claves y cuenta lo eliminado', () => {
    const a = almacenFalso({ p: JSON.stringify([{ id: 'pat-1' }, { id: 'pat-2' }, { id: 'real' }]), r: JSON.stringify([{ id: 'rep-1' }]) });
    const n = limpiarDatosDeEjemplo([{ clave: 'p', ids: ['pat-1', 'pat-2'] }, { clave: 'r', ids: ['rep-1'] }, { clave: 'nada', ids: ['x'] }], a);
    expect(n).toBe(3);
    expect(JSON.parse(a._m.p)).toEqual([{ id: 'real' }]);
    expect(a._m.r).toBe('[]');
  });
});
