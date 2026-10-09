import { describe, it, expect, beforeEach } from 'vitest';
import {
  MAX_INTENTOS,
  BLOQUEO_MS,
  VENTANA_MS,
  registrarFallo,
  segundosDeBloqueo,
  limpiarFallos,
  reiniciarLimitador,
  mensajeBloqueo
} from './loginLimiter';

beforeEach(() => reiniciarLimitador());

describe('loginLimiter', () => {
  it('no bloquea antes de llegar al máximo de intentos', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_INTENTOS - 1; i++) {
      expect(registrarFallo('a@b.com', t0 + i).bloqueadoAhora).toBe(false);
    }
    expect(segundosDeBloqueo('a@b.com', t0 + 10)).toBe(0);
  });

  it('bloquea en el fallo número MAX_INTENTOS y avisa solo una vez', () => {
    const t0 = 1_000_000;
    let ultimo = { bloqueadoAhora: false, intentosRestantes: 0 };
    for (let i = 0; i < MAX_INTENTOS; i++) ultimo = registrarFallo('a@b.com', t0 + i);
    expect(ultimo.bloqueadoAhora).toBe(true);
    expect(segundosDeBloqueo('a@b.com', t0 + MAX_INTENTOS)).toBeGreaterThan(0);
    // un fallo más mientras está bloqueado no vuelve a "disparar" el bloqueo
    expect(registrarFallo('a@b.com', t0 + MAX_INTENTOS + 1).bloqueadoAhora).toBe(false);
  });

  it('el bloqueo termina después de BLOQUEO_MS', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_INTENTOS; i++) registrarFallo('a@b.com', t0);
    expect(segundosDeBloqueo('a@b.com', t0 + BLOQUEO_MS - 1)).toBeGreaterThan(0);
    expect(segundosDeBloqueo('a@b.com', t0 + BLOQUEO_MS + 1)).toBe(0);
  });

  it('los fallos viejos (fuera de la ventana) no cuentan', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_INTENTOS - 1; i++) registrarFallo('a@b.com', t0);
    const r = registrarFallo('a@b.com', t0 + VENTANA_MS + 1);
    expect(r.bloqueadoAhora).toBe(false);
  });

  it('limpiarFallos reinicia el contador tras un inicio de sesión correcto', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_INTENTOS - 1; i++) registrarFallo('a@b.com', t0);
    limpiarFallos('a@b.com');
    expect(registrarFallo('a@b.com', t0 + 1).intentosRestantes).toBe(MAX_INTENTOS - 1);
  });

  it('ignora mayúsculas y espacios en la clave y no mezcla claves distintas', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_INTENTOS; i++) registrarFallo('  A@B.com ', t0);
    expect(segundosDeBloqueo('a@b.com', t0 + 1)).toBeGreaterThan(0);
    expect(segundosDeBloqueo('otro@b.com', t0 + 1)).toBe(0);
  });

  it('mensajeBloqueo habla en minutos', () => {
    expect(mensajeBloqueo(30)).toContain('1 minuto');
    expect(mensajeBloqueo(15 * 60)).toContain('15 minutos');
  });
});
