import { describe, it, expect } from 'vitest';
import { perfilDesdeServidor, USUARIO_SIN_SESION, esUsuarioSinSesion } from './staffProfile';

describe('perfilDesdeServidor', () => {
  it('usa solo datos del servidor y deja vacío lo que no se conoce', () => {
    const u = perfilDesdeServidor({ idUsuario: 7, nombreCompleto: 'Priscila Abigail Ramirez Varela', roleId: 'director_laboratorio', email: ' P@X.com ' });
    expect(u.fullName).toBe('Priscila Abigail Ramirez Varela');
    expect(u.remoteId).toBe(7);
    expect(u.email).toBe('p@x.com');
    expect(u.licenseNumber).toBe('');
    expect(u.specialty).toBe('');
    expect(u.roleName).toMatch(/Director/);
  });
  it('un rol desconocido no rompe: usa el id como nombre', () => {
    expect(perfilDesdeServidor({ idUsuario: 1, nombreCompleto: 'X', roleId: 'otro' }).roleName).toBe('otro');
  });
});

describe('USUARIO_SIN_SESION', () => {
  it('se reconoce como sin sesión y no parece una persona real', () => {
    expect(esUsuarioSinSesion(USUARIO_SIN_SESION)).toBe(true);
    expect(esUsuarioSinSesion(perfilDesdeServidor({ idUsuario: 1, nombreCompleto: 'A', roleId: 'bioanalista' }))).toBe(false);
    expect(USUARIO_SIN_SESION.licenseNumber).toBe('');
  });
});
