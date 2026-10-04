import { describe, it, expect } from 'vitest';
import { edadDesdeFecha, fechaDesdeEdadAproximada, validarDatosPaciente } from './validacionPaciente';

const HOY = new Date(2026, 9, 4); // 4-oct-2026
const BASE = { nombre: 'Ana López', sexo: 'F', fechaNacimiento: '1990-05-01', telefono: '42940636', correo: '' };

describe('edadDesdeFecha', () => {
  it('cuenta años cumplidos', () => {
    expect(edadDesdeFecha('2000-10-04', HOY)).toBe(26);
    expect(edadDesdeFecha('2000-10-05', HOY)).toBe(25);
  });
  it('rechaza vacío, imposible, futuro y > 120 años', () => {
    expect(edadDesdeFecha('', HOY)).toBeNull();
    expect(edadDesdeFecha('2026-02-31', HOY)).toBeNull();
    expect(edadDesdeFecha('2030-01-01', HOY)).toBeNull();
    expect(edadDesdeFecha('1800-01-01', HOY)).toBeNull();
  });
});

describe('fechaDesdeEdadAproximada', () => {
  it('devuelve una fecha cuya edad coincide con la indicada', () => {
    const f = fechaDesdeEdadAproximada(35, HOY);
    expect(edadDesdeFecha(f, HOY)).toBe(35);
  });
});

describe('validarDatosPaciente', () => {
  it('acepta un adulto completo', () => {
    const r = validarDatosPaciente(BASE, HOY);
    expect(r.valido).toBe(true);
    expect(r.esMenor).toBe(false);
  });
  it('no deja pasar sexo sin elegir', () => {
    expect(validarDatosPaciente({ ...BASE, sexo: '' }, HOY).errores.sexo).toBeTruthy();
  });
  it('exige nacimiento o edad', () => {
    expect(validarDatosPaciente({ ...BASE, fechaNacimiento: '' }, HOY).errores.nacimiento).toMatch(/fecha de nacimiento o la edad/);
  });
  it('exige teléfono o correo, pero basta uno', () => {
    expect(validarDatosPaciente({ ...BASE, telefono: '', correo: '' }, HOY).errores.contacto).toBeTruthy();
    expect(validarDatosPaciente({ ...BASE, telefono: '', correo: 'a@b.com' }, HOY).valido).toBe(true);
  });
  it('valida el formato del correo', () => {
    expect(validarDatosPaciente({ ...BASE, correo: 'xx' }, HOY).errores.correo).toBeTruthy();
  });
  it('menor de edad requiere encargado legal con nombre y teléfono', () => {
    const menor = { ...BASE, fechaNacimiento: '2020-01-01' };
    const r = validarDatosPaciente(menor, HOY);
    expect(r.esMenor).toBe(true);
    expect(r.errores.encargadoNombre).toBeTruthy();
    expect(r.errores.encargadoTelefono).toBeTruthy();
    expect(validarDatosPaciente({ ...menor, encargadoNombre: 'Marta', encargadoTelefono: '5555' }, HOY).valido).toBe(true);
  });
});
