import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createSession } from './session';

/**
 * Pruebas unitarias sobre el módulo crítico "Autenticación y autorización"
 * de personal (server/auth-staff.ts, reemplaza a server/auth-firebase.ts —
 * ver su test anterior, server/auth-firebase.test.ts, ya eliminado).
 *
 * Cubre: sin token (401), sesión válida (200, con el `staffUser` esperado),
 * sesión revocada o inexistente (403), usuario inactivo (403), usuario no
 * encontrado (403), token con firma inválida/expirado (401), y el bypass
 * DEV_AUTH_BYPASS_ID_USUARIO (equivalente al DEV_AUTH_BYPASS_UID que ya
 * probaba auth-firebase.test.ts).
 *
 * Doble de prueba usado (justificación): se sustituye `pool.query` de
 * `./db` para no depender de una base de datos real. `server/session.ts`
 * (firma HMAC) y `server/totp.ts` NO se simulan: son funciones puras que
 * conviene probar de verdad, igual que ya hacía auth-firebase.test.ts con
 * la ruta DEV_AUTH_BYPASS_UID en vez de simular Firebase Admin.
 */

const queryMock = vi.fn();
vi.mock('./db', () => ({ pool: { query: (...args: any[]) => queryMock(...args) } }));

// Pool "de sesiones" independiente del mock de arriba: solo se usa para
// fabricar tokens válidos con la función real createSession(), nunca lo ve
// el middleware bajo prueba (que siempre usa el pool mockeado de ./db).
const poolDeFabricacion = { query: vi.fn().mockResolvedValue({ rows: [] }) } as any;

async function buildApp() {
  const { requireStaffAuth } = await import('./auth-staff');
  const app = express();
  app.get('/protegido', requireStaffAuth, (req: any, res) => res.json({ ok: true, staffUser: req.staffUser }));
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  poolDeFabricacion.query.mockClear();
  delete process.env.DEV_AUTH_BYPASS_ID_USUARIO;
  process.env.NODE_ENV = 'test';
  process.env.SESSION_SECRET = 'secreto-de-prueba-no-usar-en-produccion';
});

const FILA_ACTIVA = {
  id_usuario: 1,
  uid: '',
  nombre_completo: 'Demo Activo',
  rol: 'bioanalista',
  estado: true,
  permisos_personalizados: {},
  totp_enabled: false
};

describe('requireStaffAuth', () => {
  it('sin encabezado Authorization responde 401 (RF-05)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/protegido');
    expect(res.status).toBe(401);
  });

  it('con un token con formato inválido responde 401', async () => {
    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', 'Bearer esto-no-es-un-token-valido');
    expect(res.status).toBe(401);
  });

  it('con una sesión válida y el usuario registrado y activo, deja pasar la petición', async () => {
    const { token } = await createSession(poolDeFabricacion, 1, { mustChangePassword: false });
    // 1ra consulta dentro de requireStaffAuth: isSessionRevoked. 2da: el SELECT del usuario.
    queryMock.mockResolvedValueOnce({ rows: [{ revocado_en: null }] });
    queryMock.mockResolvedValueOnce({ rows: [FILA_ACTIVA] });

    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.staffUser.idUsuario).toBe(1);
    expect(res.body.staffUser.roleId).toBe('bioanalista');
    expect(res.body.staffUser.status).toBe('activo');
    expect(res.body.staffUser.mustChangePassword).toBe(false);
  });

  it('con una sesión REVOCADA responde 403', async () => {
    const { token } = await createSession(poolDeFabricacion, 1);
    queryMock.mockResolvedValueOnce({ rows: [{ revocado_en: new Date().toISOString() }] });
    queryMock.mockResolvedValueOnce({ rows: [{ revocado_motivo: null }] }); // motivo de la revocación

    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('La sesión fue cerrada');
  });

  it('con una sesión cerrada porque el mismo usuario inició sesión en otro lugar, lo explica', async () => {
    const { token } = await createSession(poolDeFabricacion, 1);
    queryMock.mockResolvedValueOnce({ rows: [{ revocado_en: new Date().toISOString() }] });
    queryMock.mockResolvedValueOnce({ rows: [{ revocado_motivo: 'nuevo_inicio' }] });

    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toContain('inició sesión en otro lugar');
  });

  it('con una sesión que ya no existe en sesion_personal responde 403', async () => {
    const { token } = await createSession(poolDeFabricacion, 1);
    queryMock.mockResolvedValueOnce({ rows: [] }); // sesion_personal: sin filas
    queryMock.mockResolvedValueOnce({ rows: [] }); // motivo: tampoco existe

    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('con una sesión válida pero un usuario no encontrado en la tabla usuario, responde 403 (RF-06)', async () => {
    const { token } = await createSession(poolDeFabricacion, 999);
    queryMock.mockResolvedValueOnce({ rows: [{ revocado_en: null }] });
    queryMock.mockResolvedValueOnce({ rows: [] });

    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('con un usuario registrado pero con estado inactivo, responde 403', async () => {
    const { token } = await createSession(poolDeFabricacion, 2);
    queryMock.mockResolvedValueOnce({ rows: [{ revocado_en: null }] });
    queryMock.mockResolvedValueOnce({ rows: [{ ...FILA_ACTIVA, id_usuario: 2, estado: false }] });

    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('con un token expirado responde 401', async () => {
    const { token } = await createSession(poolDeFabricacion, 1, { ttlSeconds: -10 });
    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('con DEV_AUTH_BYPASS_ID_USUARIO configurado y el usuario registrado y activo, deja pasar la petición', async () => {
    process.env.DEV_AUTH_BYPASS_ID_USUARIO = '1';
    queryMock.mockResolvedValueOnce({ rows: [FILA_ACTIVA] });

    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', 'Bearer DEV_BYPASS');
    expect(res.status).toBe(200);
    expect(res.body.staffUser.idUsuario).toBe(1);
  });

  it('el bypass NUNCA se activa si NODE_ENV=production, aunque el token sea DEV_BYPASS', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DEV_AUTH_BYPASS_ID_USUARIO = '1';
    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', 'Bearer DEV_BYPASS');
    // Sin bypass, "DEV_BYPASS" se trata como un token de sesión normal: no
    // tiene el formato "vc1.<payload>.<firma>", así que falla con 401, nunca
    // con 200 — es la garantía de seguridad que exige el código.
    expect(res.status).toBe(401);
    process.env.NODE_ENV = 'test';
  });

  it('marca totpSetupRequired=true para un rol con TOTP obligatorio que aún no lo activó', async () => {
    const { token } = await createSession(poolDeFabricacion, 3);
    queryMock.mockResolvedValueOnce({ rows: [{ revocado_en: null }] });
    queryMock.mockResolvedValueOnce({
      rows: [{ ...FILA_ACTIVA, id_usuario: 3, rol: 'director_laboratorio', totp_enabled: false }]
    });

    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.staffUser.totpSetupRequired).toBe(true);
  });
});
