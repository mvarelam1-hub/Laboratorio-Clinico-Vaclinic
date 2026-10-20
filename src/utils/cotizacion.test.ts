import { describe, it, expect } from 'vitest';
import { calcularCotizacion, pruebasYaIncluidas, textoCotizacion, enlaceCotizacion } from './cotizacion';
import type { ExamenPublico } from '../services/publicoApiService';

const ex = (o: Partial<ExamenPublico>): ExamenPublico => ({
  codigo: 'X-1', nombre: 'Examen', categoria: '03_quimica_sanguinea', categoriaNombre: null, tipoMuestra: null,
  precio: 50, entregaHoras: 24, esPerfil: false, descripcion: null, ayuno: null, requiereAyuno: null,
  instrucciones: null, parametros: [], ...o
});

describe('calcularCotizacion', () => {
  it('suma los precios cuando son visibles', () => {
    const c = calcularCotizacion([ex({ precio: 35.5 }), ex({ codigo: 'X-2', precio: 64.5 })], true);
    expect(c.total).toBe(100);
    expect(c.sinPrecio).toBe(0);
  });
  it('sin precios visibles no hay total (los precios no son públicos)', () => {
    const c = calcularCotizacion([ex({ precio: 50 })], false);
    expect(c.total).toBeNull();
  });
  it('una prueba sin precio no cuenta como Q0: se marca por confirmar', () => {
    const c = calcularCotizacion([ex({ precio: 40 }), ex({ codigo: 'X-2', precio: null })], true);
    expect(c.total).toBe(40);
    expect(c.sinPrecio).toBe(1);
  });
  it('evita errores de punto flotante', () => {
    const c = calcularCotizacion([ex({ precio: 0.1 }), ex({ codigo: 'X-2', precio: 0.2 })], true);
    expect(c.total).toBe(0.3);
  });
});

describe('pruebasYaIncluidas', () => {
  const hemograma = ex({ codigo: 'HEM-10', nombre: 'Hemograma completo (BHC)', esPerfil: true, categoria: '01_perfiles_paneles' });
  const hemoglobina = ex({ codigo: 'HEM-06', nombre: 'Hemoglobina' });
  const glucosa = ex({ codigo: 'QUI-01', nombre: 'Glucosa' });
  it('detecta una prueba que ya viene dentro de un perfil seleccionado', () => {
    const r = pruebasYaIncluidas([hemograma, hemoglobina, glucosa], [hemograma, hemoglobina, glucosa]);
    expect(r.get('HEM-06')).toBe('Hemograma completo (BHC)');
    expect(r.has('QUI-01')).toBe(false);
  });
  it('detecta por nombre de parámetro en paquetes que listan parámetros', () => {
    const panel = ex({ codigo: 'PAN-99', nombre: 'Perfil X', esPerfil: true, parametros: ['Glucosa', 'Urea'] });
    const r = pruebasYaIncluidas([panel, glucosa], [panel, glucosa]);
    expect(r.get('QUI-01')).toBe('Perfil X');
  });
  it('sin perfil seleccionado no hay duplicados', () => {
    expect(pruebasYaIncluidas([hemoglobina, glucosa], [hemoglobina, glucosa]).size).toBe(0);
  });
});

describe('textoCotizacion', () => {
  it('con precios: líneas con precio, total y aviso de que son referenciales', () => {
    const c = calcularCotizacion([ex({ nombre: 'Glucosa', precio: 30 }), ex({ codigo: 'X-2', nombre: 'Urea', precio: 25 })], true);
    const t = textoCotizacion(c, 'VACLINIC');
    expect(t).toContain('1. Glucosa - Q30');
    expect(t).toContain('2. Urea - Q25');
    expect(t).toContain('Total: Q55');
    expect(t).toContain('referenciales');
  });
  it('sin precios visibles NO filtra ningún precio y pide cotización', () => {
    const c = calcularCotizacion([ex({ nombre: 'Glucosa', precio: 30 })], false);
    const t = textoCotizacion(c, 'VACLINIC');
    expect(t).toContain('1. Glucosa');
    expect(t).not.toMatch(/Q\d|Total/);
    expect(t).toContain('paquetes u ofertas');
  });
  it('indica las pruebas con precio por confirmar', () => {
    const c = calcularCotizacion([ex({ nombre: 'A', precio: 10 }), ex({ codigo: 'X-2', nombre: 'B', precio: null })], true);
    expect(textoCotizacion(c, 'L')).toContain('1 prueba con precio por confirmar');
  });
});

describe('enlaceCotizacion', () => {
  it('arma el enlace con el texto codificado y prefijo +502 para 8 dígitos', () => {
    const url = enlaceCotizacion('5612 5563', 'Hola ñ');
    expect(url).toBe(`https://wa.me/50256125563?text=${encodeURIComponent('Hola ñ')}`);
  });
  it('null si no hay número', () => {
    expect(enlaceCotizacion(null, 'x')).toBeNull();
    expect(enlaceCotizacion('123', 'x')).toBeNull();
  });
});
