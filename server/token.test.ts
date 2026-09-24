import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * E10 (ACS, Fase 2) — pruebas unitarias sobre módulo crítico "Portal del
 * paciente" (server/token.ts). Sin dobles de prueba: usa la implementación
 * real de HMAC (crypto de Node), no hay red ni base de datos involucrada.
 * Técnica: análisis de valores límite sobre la expiración del token —
 * automatiza los casos diseñados como CP-14 a CP-17 en el E3.
 */
describe('signPortalToken / verifyPortalToken', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.PORTAL_TOKEN_SECRET = 'secreto-de-pruebas-largo-y-aleatorio';
  });

  it('un token recién firmado se verifica correctamente y conserva el payload', async () => {
    const { signPortalToken, verifyPortalToken } = await import('./token');
    const token = signPortalToken({ idPaciente: 7, idOrden: 42 });
    const payload = verifyPortalToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.idPaciente).toBe(7);
    expect(payload!.idOrden).toBe(42);
  });

  it('un token con firma alterada (tampering) se rechaza', async () => {
    const { signPortalToken, verifyPortalToken } = await import('./token');
    const token = signPortalToken({ idPaciente: 1, idOrden: 1 });
    const [body] = token.split('.');
    const tampered = `${body}.firmaInventada==`;
    expect(verifyPortalToken(tampered)).toBeNull();
  });

  it('un token malformado (sin punto separador) se rechaza', async () => {
    const { verifyPortalToken } = await import('./token');
    expect(verifyPortalToken('esto-no-es-un-token')).toBeNull();
  });

  it('un token vacío o nulo se rechaza sin lanzar excepción', async () => {
    const { verifyPortalToken } = await import('./token');
    expect(verifyPortalToken('')).toBeNull();
  });

  it('valor límite: un token con 1 segundo de vigencia restante todavía es válido', async () => {
    const { signPortalToken, verifyPortalToken } = await import('./token');
    const token = signPortalToken({ idPaciente: 3, idOrden: 9 }, 1);
    const payload = verifyPortalToken(token);
    expect(payload).not.toBeNull();
  });

  it('valor límite: un token firmado con ttl negativo (ya vencido) se rechaza', async () => {
    const { signPortalToken, verifyPortalToken } = await import('./token');
    const token = signPortalToken({ idPaciente: 3, idOrden: 9 }, -1);
    expect(verifyPortalToken(token)).toBeNull();
  });

  it('el ttl por defecto (900 segundos / 15 minutos) produce un token vigente', async () => {
    const { signPortalToken, verifyPortalToken } = await import('./token');
    const token = signPortalToken({ idPaciente: 5, idOrden: 5 });
    const payload = verifyPortalToken(token);
    expect(payload).not.toBeNull();
    const restante = payload!.exp - Math.floor(Date.now() / 1000);
    expect(restante).toBeGreaterThan(890);
    expect(restante).toBeLessThanOrEqual(900);
  });

  it('un token firmado con un secreto y verificado con otro (rotación de secreto) se rechaza', async () => {
    const { signPortalToken } = await import('./token');
    const token = signPortalToken({ idPaciente: 8, idOrden: 8 });
    vi.resetModules();
    process.env.PORTAL_TOKEN_SECRET = 'otro-secreto-completamente-distinto';
    const { verifyPortalToken } = await import('./token');
    expect(verifyPortalToken(token)).toBeNull();
  });
});
