import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSession,
  verifySessionToken,
  isSessionRevoked,
  revokeSession,
  createLoginTicket,
  verifyLoginTicket
} from './session';

/**
 * Pruebas unitarias de server/session.ts (sesiones de personal firmadas con
 * HMAC-SHA256, mismo patrón que server/token.ts). Doble de prueba: un pool
 * falso con `query` simulado (vi.fn), igual que el resto de pruebas de
 * rutas que ya evitan una base de datos real.
 */

function fakePool(impl: (sql: string, params?: any[]) => any) {
  return { query: vi.fn(impl) } as any;
}

beforeEach(() => {
  process.env.SESSION_SECRET = 'secreto-de-prueba-no-usar-en-produccion';
});

describe('createSession / verifySessionToken', () => {
  it('crea un token con el formato "vc1.<payload>.<firma>" e inserta la sesión en sesion_personal', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    const { token, sessionId } = await createSession(pool, 42);

    expect(token.startsWith('vc1.')).toBe(true);
    expect(token.split('.').length).toBe(3);
    expect(sessionId).toHaveLength(48); // randomBytes(24).toString('hex')
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO sesion_personal'), expect.any(Array));
  });

  it('al crear una sesión cierra las anteriores del mismo usuario (una sola sesión activa)', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    await createSession(pool, 42);

    const [sqlCierre, paramsCierre] = pool.query.mock.calls[0];
    expect(sqlCierre).toContain('UPDATE sesion_personal');
    expect(sqlCierre).toContain('revocado_en IS NULL');
    expect(paramsCierre).toEqual([42, 'nuevo_inicio']);
    // El cierre va ANTES de insertar la sesión nueva, para no revocar la recién creada.
    expect(pool.query.mock.calls[1][0]).toContain('INSERT INTO sesion_personal');
  });

  it('conservarOtras evita cerrar las sesiones anteriores', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    await createSession(pool, 42, { conservarOtras: true });
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query.mock.calls[0][0]).toContain('INSERT INTO sesion_personal');
  });

  it('verifySessionToken decodifica idUsuario/sessionId/exp de un token recién creado', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    const { token, sessionId } = await createSession(pool, 7, { mustChangePassword: true });

    const payload = verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.idUsuario).toBe(7);
    expect(payload!.sessionId).toBe(sessionId);
    expect(payload!.mustChangePassword).toBe(true);
  });

  it('rechaza un token con la firma alterada', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    const { token } = await createSession(pool, 1);
    const [prefijo, body] = token.split('.');
    const tokenAlterado = `${prefijo}.${body}.firma-invalida`;
    expect(verifySessionToken(tokenAlterado)).toBeNull();
  });

  it('rechaza un token expirado', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    const { token } = await createSession(pool, 1, { ttlSeconds: -1 });
    expect(verifySessionToken(token)).toBeNull();
  });

  it('rechaza basura / formato inválido sin lanzar', () => {
    expect(verifySessionToken('')).toBeNull();
    expect(verifySessionToken('no-es-un-token')).toBeNull();
    expect(verifySessionToken('otroPrefijo.abc.def')).toBeNull();
  });
});

describe('isSessionRevoked / revokeSession', () => {
  it('una sesión inexistente se trata como revocada', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    expect(await isSessionRevoked(pool, 'no-existe')).toBe(true);
  });

  it('una sesión con revocado_en = NULL no está revocada', async () => {
    const pool = fakePool(() => ({ rows: [{ revocado_en: null }] }));
    expect(await isSessionRevoked(pool, 'activa')).toBe(false);
  });

  it('una sesión con revocado_en poblado SÍ está revocada', async () => {
    const pool = fakePool(() => ({ rows: [{ revocado_en: new Date() }] }));
    expect(await isSessionRevoked(pool, 'cerrada')).toBe(true);
  });

  it('revokeSession ejecuta el UPDATE esperado', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    await revokeSession(pool, 'sid-123');
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE sesion_personal'), ['sid-123']);
  });
});

describe('createLoginTicket / verifyLoginTicket', () => {
  it('crea y verifica un ticket válido', () => {
    const ticket = createLoginTicket(99);
    expect(ticket.startsWith('vt1.')).toBe(true);
    const verificado = verifyLoginTicket(ticket);
    expect(verificado).toEqual({ idUsuario: 99 });
  });

  it('rechaza un ticket expirado', () => {
    const ticket = createLoginTicket(99, -1);
    expect(verifyLoginTicket(ticket)).toBeNull();
  });

  it('un token de sesión normal no es un login ticket válido (prefijos distintos)', async () => {
    const pool = fakePool(() => ({ rows: [] }));
    const { token } = await createSession(pool, 1);
    expect(verifyLoginTicket(token)).toBeNull();
  });
});
