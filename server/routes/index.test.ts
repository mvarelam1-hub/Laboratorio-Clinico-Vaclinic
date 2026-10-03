import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas de integración sobre el middleware global de sesión "limitada" de
 * server/routes/index.ts: MUST_CHANGE_PASSWORD (cambio de contraseña
 * obligatorio) y TOTP_SETUP_REQUIRED (TOTP obligatorio por rol, ver
 * server/totp.ts::MANDATORY_TOTP_ROLES). Ninguno de los dos existía como
 * prueba directa sobre `apiRouter` — los routers individuales (pacientes,
 * ordenes, etc.) prueban su propia lógica mockeando `requireStaffAuth`
 * directamente, sin pasar por este middleware agregado.
 *
 * Importa el `apiRouter` REAL (no una reimplementación de su lógica) para
 * que esta prueba de verdad ejercite la regla de bloqueo tal como queda
 * cableada en producción.
 */

let currentStaffUser: any = {
  idUsuario: 1,
  roleId: 'bioanalista',
  status: 'activo',
  nombreCompleto: 'Demo Activo',
  mustChangePassword: false,
  totpEnabled: false,
  totpSetupRequired: false
};

vi.mock('../auth-staff', () => ({
  requireStaffAuth: (req: any, _res: any, next: any) => {
    req.staffUser = currentStaffUser;
    next();
  },
}));

// `../db` lo usan todos los sub-routers montados en apiRouter: un mock
// genérico que siempre resuelve con una fila vacía basta porque esta prueba
// solo le interesa si la petición LLEGA a la ruta protegida, no lo que esa
// ruta haga con la base de datos.
vi.mock('../db', () => ({
  pool: { query: vi.fn().mockResolvedValue({ rows: [] }) },
}));

async function buildApp() {
  const { apiRouter } = await import('./index');
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  process.env.SESSION_SECRET = 'secreto-de-prueba-no-usar-en-produccion';
  process.env.BACKUP_ENCRYPTION_KEY = 'a'.repeat(64);
  currentStaffUser = {
    idUsuario: 1,
    roleId: 'bioanalista',
    status: 'activo',
    nombreCompleto: 'Demo Activo',
    mustChangePassword: false,
    totpEnabled: false,
    totpSetupRequired: false
  };
});

describe('apiRouter — sesión limitada (MUST_CHANGE_PASSWORD)', () => {
  it('bloquea una ruta protegida cualquiera con 403 cuando mustChangePassword=true', async () => {
    currentStaffUser = { ...currentStaffUser, mustChangePassword: true };
    const app = await buildApp();
    const res = await request(app).get('/api/pacientes').set('Authorization', 'Bearer cualquiera');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('MUST_CHANGE_PASSWORD');
  });

  it('GET /api/auth/whoami sigue disponible aunque mustChangePassword=true', async () => {
    currentStaffUser = { ...currentStaffUser, mustChangePassword: true };
    const app = await buildApp();
    const res = await request(app).get('/api/auth/whoami').set('Authorization', 'Bearer cualquiera');
    expect(res.status).toBe(200);
  });
});

describe('apiRouter — TOTP obligatorio por rol (TOTP_SETUP_REQUIRED)', () => {
  it('bloquea una ruta protegida cualquiera con 403 cuando el rol exige TOTP y aún no lo activó', async () => {
    currentStaffUser = { ...currentStaffUser, roleId: 'director_laboratorio', totpSetupRequired: true };
    const app = await buildApp();
    const res = await request(app).get('/api/pacientes').set('Authorization', 'Bearer cualquiera');
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('TOTP_SETUP_REQUIRED');
  });

  it('POST /api/auth/totp/enroll sigue disponible para completar el enrolamiento', async () => {
    currentStaffUser = { ...currentStaffUser, roleId: 'director_laboratorio', totpSetupRequired: true };
    const app = await buildApp();
    const res = await request(app).post('/api/auth/totp/enroll').set('Authorization', 'Bearer cualquiera');
    expect(res.status).not.toBe(403);
  });

  it('POST /api/auth/logout sigue disponible para cerrar sesión en vez de enrolar', async () => {
    currentStaffUser = { ...currentStaffUser, roleId: 'director_laboratorio', totpSetupRequired: true };
    const app = await buildApp();
    const res = await request(app).post('/api/auth/logout').set('Authorization', 'Bearer cualquiera');
    expect(res.status).toBe(200);
  });

  it('con totpSetupRequired=false (ya lo activó, o su rol no lo exige) deja pasar a la ruta protegida', async () => {
    currentStaffUser = { ...currentStaffUser, roleId: 'director_laboratorio', totpEnabled: true, totpSetupRequired: false };
    const app = await buildApp();
    const res = await request(app).get('/api/pacientes').set('Authorization', 'Bearer cualquiera');
    expect(res.status).not.toBe(403);
  });
});
