import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { hashPassword } from '../password';
import { generateTotpSecret, generateTotpToken } from '../totp';
import { encryptSecret } from '../crypto-aes';

/**
 * Pruebas unitarias sobre server/routes/auth.ts (login propio, TOTP,
 * cambio de contraseña, logout y whoami de personal — reemplaza el flujo
 * de Firebase Authentication).
 *
 * Dobles de prueba: se sustituye `pool` (PostgreSQL real) igual que el
 * resto de los routers, y `requireStaffAuth` (../auth-staff) SOLO para las
 * rutas que lo exigen (/change-password, /totp/*, /logout, /whoami) —
 * /login y /verify-totp se prueban contra su lógica real, sin ese doble,
 * porque son justamente las rutas que NO dependen de una sesión previa.
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

const queryMock = vi.fn();
vi.mock('../db', () => ({
  pool: { query: (...args: any[]) => queryMock(...args) },
}));

async function buildApp() {
  const { authRouter } = await import('./auth');
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  process.env.SESSION_SECRET = 'secreto-de-prueba-no-usar-en-produccion';
  process.env.BACKUP_ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes en hex
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

describe('POST /api/auth/login', () => {
  it('con correo/contraseña correctos y sin TOTP, emite una sesión directamente', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id_usuario: 1, nombre_completo: 'Demo Activo', correo: 'demo@vaclinic.test',
        contrasena_hash: hashPassword('Demo12345!'), rol: 'bioanalista', estado: true,
        totp_secret: null, totp_enabled: false, must_change_password: false
      }]
    });
    queryMock.mockResolvedValueOnce({ rows: [] }); // INSERT INTO sesion_personal

    queryMock.mockResolvedValueOnce({ rows: [] }); // INSERT INTO historial_auditoria (bitácora, migración 0011/convergencia)

    const app = await buildApp();
    const res = await request(app).post('/api/auth/login').send({ correo: 'demo@vaclinic.test', contrasena: 'Demo12345!' });

    expect(res.status).toBe(200);
    expect(res.body.requiresTotp).toBe(false);
    expect(res.body.token.startsWith('vc1.')).toBe(true);
    const [sqlBitacora, paramsBitacora] = queryMock.mock.calls[2];
    expect(sqlBitacora).toMatch(/INSERT INTO historial_auditoria/);
    expect(paramsBitacora[0]).toBe(1);
    expect(paramsBitacora[2]).toBe('autenticacion');
  });

  it('con TOTP habilitado, NO emite sesión: devuelve requiresTotp + loginTicket', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id_usuario: 1, nombre_completo: 'Demo Activo', correo: 'demo@vaclinic.test',
        contrasena_hash: hashPassword('Demo12345!'), rol: 'director_laboratorio', estado: true,
        totp_secret: 'cifrado', totp_enabled: true, must_change_password: false
      }]
    });

    const app = await buildApp();
    const res = await request(app).post('/api/auth/login').send({ correo: 'demo@vaclinic.test', contrasena: 'Demo12345!' });

    expect(res.status).toBe(200);
    expect(res.body.requiresTotp).toBe(true);
    expect(res.body.loginTicket.startsWith('vt1.')).toBe(true);
    expect(res.body.token).toBeUndefined();
  });

  it('con contraseña incorrecta responde 401 genérico (no revela si el correo existe)', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id_usuario: 1, nombre_completo: 'Demo', correo: 'demo@vaclinic.test',
        contrasena_hash: hashPassword('Demo12345!'), rol: 'bioanalista', estado: true,
        totp_secret: null, totp_enabled: false, must_change_password: false
      }]
    });
    const app = await buildApp();
    const res = await request(app).post('/api/auth/login').send({ correo: 'demo@vaclinic.test', contrasena: 'incorrecta' });
    expect(res.status).toBe(401);
  });

  it('con correo inexistente responde 401 (mismo mensaje genérico)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).post('/api/auth/login').send({ correo: 'no-existe@vaclinic.test', contrasena: 'cualquiera' });
    expect(res.status).toBe(401);
  });

  it('con usuario inactivo responde 403', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id_usuario: 1, nombre_completo: 'Demo', correo: 'demo@vaclinic.test',
        contrasena_hash: hashPassword('Demo12345!'), rol: 'bioanalista', estado: false,
        totp_secret: null, totp_enabled: false, must_change_password: false
      }]
    });
    const app = await buildApp();
    const res = await request(app).post('/api/auth/login').send({ correo: 'demo@vaclinic.test', contrasena: 'Demo12345!' });
    expect(res.status).toBe(403);
  });

  it('rechaza con 400 si faltan correo o contrasena', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/auth/login').send({ correo: 'demo@vaclinic.test' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/verify-totp', () => {
  it('con un código TOTP correcto, emite la sesión real', async () => {
    const secret = generateTotpSecret();
    const { createLoginTicket } = await import('../session');
    const loginTicket = createLoginTicket(1);

    queryMock.mockResolvedValueOnce({
      rows: [{
        id_usuario: 1, nombre_completo: 'Demo Activo', correo: 'demo@vaclinic.test',
        contrasena_hash: hashPassword('Demo12345!'), rol: 'director_laboratorio', estado: true,
        totp_secret: encryptSecret(secret), totp_enabled: true, must_change_password: false
      }]
    });
    queryMock.mockResolvedValueOnce({ rows: [] }); // INSERT INTO sesion_personal
    queryMock.mockResolvedValueOnce({ rows: [] }); // INSERT INTO historial_auditoria (bitácora)

    const app = await buildApp();
    const res = await request(app).post('/api/auth/verify-totp').send({ loginTicket, code: generateTotpToken(secret) });

    expect(res.status).toBe(200);
    expect(res.body.token.startsWith('vc1.')).toBe(true);
    const [sqlBitacora] = queryMock.mock.calls[2];
    expect(sqlBitacora).toMatch(/INSERT INTO historial_auditoria/);
  });

  it('con un código TOTP incorrecto responde 401', async () => {
    const secret = generateTotpSecret();
    const { createLoginTicket } = await import('../session');
    const loginTicket = createLoginTicket(1);

    queryMock.mockResolvedValueOnce({
      rows: [{
        id_usuario: 1, nombre_completo: 'Demo', correo: 'demo@vaclinic.test',
        contrasena_hash: hashPassword('Demo12345!'), rol: 'director_laboratorio', estado: true,
        totp_secret: encryptSecret(secret), totp_enabled: true, must_change_password: false
      }]
    });

    const app = await buildApp();
    const res = await request(app).post('/api/auth/verify-totp').send({ loginTicket, code: '000000' });
    expect(res.status).toBe(401);
  });

  it('con un loginTicket inválido/expirado responde 401', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/auth/verify-totp').send({ loginTicket: 'vt1.basura.firma', code: '123456' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/change-password', () => {
  it('con la contraseña actual correcta, actualiza el hash y limpia must_change_password', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ contrasena_hash: hashPassword('Actual123!') }] });
    queryMock.mockResolvedValueOnce({ rows: [] }); // UPDATE

    const app = await buildApp();
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', 'Bearer cualquiera')
      .send({ currentPassword: 'Actual123!', newPassword: 'NuevaClave123!' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(queryMock).toHaveBeenLastCalledWith(expect.stringContaining('UPDATE usuario'), expect.any(Array));
  });

  it('con la contraseña actual incorrecta responde 401', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ contrasena_hash: hashPassword('Actual123!') }] });
    const app = await buildApp();
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', 'Bearer cualquiera')
      .send({ currentPassword: 'otra-cosa', newPassword: 'NuevaClave123!' });
    expect(res.status).toBe(401);
  });

  it('rechaza una contraseña nueva demasiado corta con 400', async () => {
    const app = await buildApp();
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', 'Bearer cualquiera')
      .send({ currentPassword: 'Actual123!', newPassword: '123' });
    expect(res.status).toBe(400);
  });
});

describe('TOTP enroll/confirm', () => {
  it('POST /totp/enroll genera y guarda un secreto cifrado, y devuelve la URI otpauth://', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] }); // UPDATE usuario SET totp_secret
    queryMock.mockResolvedValueOnce({ rows: [{ correo: 'demo@vaclinic.test' }] }); // SELECT correo

    const app = await buildApp();
    const res = await request(app).post('/api/auth/totp/enroll').set('Authorization', 'Bearer cualquiera');

    expect(res.status).toBe(200);
    expect(res.body.secret).toMatch(/^[A-Z2-7]+$/);
    expect(res.body.otpauthUri.startsWith('otpauth://totp/')).toBe(true);
  });

  it('POST /totp/enroll responde 403 si la sesión es de cambio de contraseña obligatorio', async () => {
    currentStaffUser = { ...currentStaffUser, mustChangePassword: true };
    const app = await buildApp();
    const res = await request(app).post('/api/auth/totp/enroll').set('Authorization', 'Bearer cualquiera');
    expect(res.status).toBe(403);
  });

  it('POST /totp/confirm con el código correcto activa totp_enabled', async () => {
    const secret = generateTotpSecret();
    queryMock.mockResolvedValueOnce({ rows: [{ totp_secret: encryptSecret(secret) }] });
    queryMock.mockResolvedValueOnce({ rows: [] }); // UPDATE totp_enabled = TRUE

    const app = await buildApp();
    const res = await request(app)
      .post('/api/auth/totp/confirm')
      .set('Authorization', 'Bearer cualquiera')
      .send({ code: generateTotpToken(secret) });

    expect(res.status).toBe(200);
    expect(queryMock).toHaveBeenLastCalledWith(expect.stringContaining('totp_enabled = TRUE'), expect.any(Array));
  });

  it('POST /totp/confirm sin enrolamiento previo responde 400', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ totp_secret: null }] });
    const app = await buildApp();
    const res = await request(app)
      .post('/api/auth/totp/confirm')
      .set('Authorization', 'Bearer cualquiera')
      .send({ code: '123456' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/whoami', () => {
  it('devuelve el contrato esperado por el frontend (staffAuthService.ts)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/auth/whoami').set('Authorization', 'Bearer cualquiera');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      idUsuario: 1,
      nombreCompleto: 'Demo Activo',
      roleId: 'bioanalista',
      status: 'activo',
      mustChangePassword: false,
      totpEnabled: false
    });
  });
});

describe('POST /api/auth/logout', () => {
  it('revoca la sesión (UPDATE sesion_personal) cuando el token es una sesión real', async () => {
    const { createSession } = await import('../session');
    const { token } = await createSession({ query: vi.fn().mockResolvedValue({ rows: [] }) } as any, 1);
    queryMock.mockResolvedValueOnce({ rows: [] }); // UPDATE sesion_personal (revokeSession)

    const app = await buildApp();
    const res = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('UPDATE sesion_personal'), [expect.any(String)]);
  });
});
