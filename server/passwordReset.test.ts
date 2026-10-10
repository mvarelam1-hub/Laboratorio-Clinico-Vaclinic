import { describe, it, expect } from 'vitest';
import {
  TTL_RECUPERACION_MS,
  MINUTOS_RECUPERACION,
  hashToken,
  generarTokenRecuperacion,
  esCorreoEntregable,
  validarNuevaContrasena
} from './passwordReset';

describe('passwordReset', () => {
  it('el enlace vence a los 5 minutos', () => {
    expect(TTL_RECUPERACION_MS).toBe(5 * 60 * 1000);
    expect(MINUTOS_RECUPERACION).toBe(5);
  });

  it('genera tokens distintos y guarda solo el hash SHA-256', () => {
    const a = generarTokenRecuperacion();
    const b = generarTokenRecuperacion();
    expect(a.token).toMatch(/^[0-9a-f]{64}$/);
    expect(a.token).not.toBe(b.token);
    expect(a.hash).toBe(hashToken(a.token));
    expect(a.hash).not.toBe(a.token);
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('acepta correos reales y rechaza dominios que no reciben mensajes', () => {
    expect(esCorreoEntregable('jnavasn@miumg.edu.gt')).toBe(true);
    expect(esCorreoEntregable('admin.sistemas@vaclinic.local')).toBe(false);
    expect(esCorreoEntregable('prueba@servidor.test')).toBe(false);
    expect(esCorreoEntregable('sin-arroba')).toBe(false);
    expect(esCorreoEntregable('a@b')).toBe(false);
    expect(esCorreoEntregable('')).toBe(false);
    expect(esCorreoEntregable(null)).toBe(false);
  });

  it('valida la nueva contraseña', () => {
    expect(validarNuevaContrasena('corta')).not.toBeNull();
    expect(validarNuevaContrasena(undefined)).not.toBeNull();
    expect(validarNuevaContrasena('x'.repeat(129))).not.toBeNull();
    expect(validarNuevaContrasena('una-contrasena-larga')).toBeNull();
  });
});
