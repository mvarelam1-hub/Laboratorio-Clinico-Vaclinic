import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generarContrasenaTemporal } from './password';

/**
 * Pruebas unitarias de server/password.ts (hash de contraseñas de personal,
 * scrypt nativo). Mismo doble de prueba que server/pin.ts no necesita
 * ninguno: es una función pura, sin base de datos ni red.
 */
describe('hashPassword / verifyPassword', () => {
  it('genera un hash en formato "salt:hash" distinto cada vez (salt aleatorio)', () => {
    const h1 = hashPassword('Demo12345!');
    const h2 = hashPassword('Demo12345!');
    expect(h1).not.toBe(h2);
    expect(h1.split(':').length).toBe(2);
  });

  it('verifyPassword acepta la contraseña correcta', () => {
    const stored = hashPassword('Demo12345!');
    expect(verifyPassword('Demo12345!', stored)).toBe(true);
  });

  it('verifyPassword rechaza una contraseña incorrecta', () => {
    const stored = hashPassword('Demo12345!');
    expect(verifyPassword('otra-clave', stored)).toBe(false);
  });

  it('verifyPassword rechaza un hash vacío/nulo sin lanzar', () => {
    expect(verifyPassword('cualquier-cosa', null)).toBe(false);
    expect(verifyPassword('cualquier-cosa', undefined)).toBe(false);
    expect(verifyPassword('cualquier-cosa', '')).toBe(false);
  });

  it('verifyPassword rechaza un hash con formato corrupto (sin ":")', () => {
    expect(verifyPassword('Demo12345!', 'no-tiene-separador')).toBe(false);
  });
});

describe('generarContrasenaTemporal', () => {
  it('genera 12 caracteres con mayúscula, minúscula y dígito, sin caracteres ambiguos', () => {
    for (let i = 0; i < 200; i++) {
      const c = generarContrasenaTemporal();
      expect(c).toHaveLength(12);
      expect(c).toMatch(/[A-Z]/);
      expect(c).toMatch(/[a-z]/);
      expect(c).toMatch(/[0-9]/);
      expect(c).not.toMatch(/[01OIl]/);
    }
  });

  it('no repite valores (aleatoriedad real) y sirve con hashPassword/verifyPassword', () => {
    const vistos = new Set(Array.from({ length: 500 }, () => generarContrasenaTemporal()));
    expect(vistos.size).toBe(500);
    const c = generarContrasenaTemporal();
    expect(verifyPassword(c, hashPassword(c))).toBe(true);
  });
});
