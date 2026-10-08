import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password';

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
