import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * E10 (ACS, Fase 2) — pruebas unitarias sobre el módulo crítico "Autenticación
 * y autorización" (server/auth-firebase.ts). Cubre la ruta DEV_AUTH_BYPASS_UID
 * (la misma que usa el propio equipo para probar sin credenciales reales de
 * Firebase, según ETAPA3_README.md) y el rechazo sin token. La ruta que
 * verifica un token real de Firebase (admin.auth().verifyIdToken) requiere
 * credenciales de servicio reales y queda fuera de esta prueba unitaria —
 * se documenta honestamente como límite de cobertura, no se simula.
 *
 * Doble de prueba usado (justificación): se sustituye `pool.query` de `../db`
 * para no depender de una base de datos real.
 */

const queryMock = vi.fn();
vi.mock('./db', () => ({ pool: { query: (...args: any[]) => queryMock(...args) } }));

async function buildApp() {
  const { requireStaffAuth } = await import('./auth-firebase');
  const app = express();
  app.get('/protegido', requireStaffAuth, (req: any, res) => res.json({ ok: true, staffUser: req.staffUser }));
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  delete process.env.DEV_AUTH_BYPASS_UID;
  process.env.NODE_ENV = 'test';
});

describe('requireStaffAuth', () => {
  it('sin encabezado Authorization responde 401 (RF-05)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/protegido');
    expect(res.status).toBe(401);
  });

  it('con DEV_AUTH_BYPASS_UID configurado y el UID registrado y activo, deja pasar la petición', async () => {
    process.env.DEV_AUTH_BYPASS_UID = 'uid-demo-activo';
    queryMock.mockResolvedValueOnce({
      rows: [{ id_usuario: 1, uid: 'uid-demo-activo', nombre_completo: 'Demo Activo', rol: 'bioanalista', estado: true, permisos_personalizados: {} }],
    });
    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', 'Bearer DEV_BYPASS');
    expect(res.status).toBe(200);
    expect(res.body.staffUser.roleId).toBe('bioanalista');
    expect(res.body.staffUser.status).toBe('activo');
  });

  it('con DEV_AUTH_BYPASS_UID pero un UID no registrado en la tabla usuario, responde 403 (RF-06)', async () => {
    process.env.DEV_AUTH_BYPASS_UID = 'uid-no-registrado';
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', 'Bearer DEV_BYPASS');
    expect(res.status).toBe(403);
  });

  it('con un usuario registrado pero con estado inactivo, responde 403', async () => {
    process.env.DEV_AUTH_BYPASS_UID = 'uid-inactivo';
    queryMock.mockResolvedValueOnce({
      rows: [{ id_usuario: 2, uid: 'uid-inactivo', nombre_completo: 'Demo Inactivo', rol: 'bioanalista', estado: false, permisos_personalizados: {} }],
    });
    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', 'Bearer DEV_BYPASS');
    expect(res.status).toBe(403);
  });

  it('el bypass NUNCA se activa si NODE_ENV=production, aunque el token sea DEV_BYPASS', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DEV_AUTH_BYPASS_UID = 'uid-demo-activo';
    const app = await buildApp();
    const res = await request(app).get('/protegido').set('Authorization', 'Bearer DEV_BYPASS');
    // Sin bypass, intenta verificar con Firebase Admin real (sin credenciales
    // configuradas en este entorno de prueba) y por lo tanto falla con 401,
    // nunca con 200 — es la garantía de seguridad que exige el código.
    expect(res.status).toBe(401);
    process.env.NODE_ENV = 'test';
  });
});
