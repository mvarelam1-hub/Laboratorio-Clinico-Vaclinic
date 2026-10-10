import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { hashToken } from '../passwordReset';

/**
 * Pruebas de la recuperación de contraseña por correo
 * (POST /api/auth/forgot-password y /api/auth/reset-password).
 * Se sustituyen `pool`, la bitácora y el envío de correo.
 */

vi.mock('../auth-staff', () => ({
  requireStaffAuth: (_req: any, _res: any, next: any) => next()
}));

const queryMock = vi.fn();
vi.mock('../db', () => ({
  pool: { query: (...args: any[]) => queryMock(...args) }
}));

const bitacoraMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../bitacora', () => ({
  registrarBitacora: (...args: any[]) => bitacoraMock(...args)
}));

const enviarMock = vi.fn();
vi.mock('../mailer', async () => {
  const real = await vi.importActual<typeof import('../mailer')>('../mailer');
  return { ...real, enviarCorreo: (...args: any[]) => enviarMock(...args) };
});

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
  bitacoraMock.mockClear();
  enviarMock.mockReset();
  process.env.SESSION_SECRET = 'secreto-de-prueba-no-usar-en-produccion';
  process.env.BACKUP_ENCRYPTION_KEY = 'a'.repeat(64);
  process.env.APP_BASE_URL = 'https://sistema.ejemplo.com';
});

describe('POST /api/auth/forgot-password', () => {
  it('exige el correo', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/auth/forgot-password').send({});
    expect(res.status).toBe(400);
  });

  it('con cuenta activa y correo real: guarda el hash, envía el enlace y audita', async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM usuario WHERE correo')) {
        return { rows: [{ id_usuario: 7, nombre_completo: 'Josué', correo: 'jnavasn@miumg.edu.gt', estado: true }] };
      }
      return { rows: [], rowCount: 1 };
    });
    enviarMock.mockResolvedValue({ enviado: true });
    const app = await buildApp();
    const res = await request(app).post('/api/auth/forgot-password').send({ correo: 'jnavasn@miumg.edu.gt' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const insert = queryMock.mock.calls.find((c) => String(c[0]).includes('INSERT INTO recuperacion_contrasena'));
    expect(insert).toBeTruthy();
    const hashGuardado = insert![1][1];
    expect(insert![1][2]).toBe(5);

    const correo = enviarMock.mock.calls[0][0];
    expect(correo.para).toBe('jnavasn@miumg.edu.gt');
    const token = /\?reset=([0-9a-f]{64})/.exec(correo.texto)![1];
    expect(hashToken(token)).toBe(hashGuardado);
    expect(correo.texto).toContain('https://sistema.ejemplo.com/?reset=');
    expect(token).not.toBe(hashGuardado);
    expect(bitacoraMock).toHaveBeenCalledTimes(1);
  });

  it('responde igual y no envía nada si la cuenta no existe', async () => {
    queryMock.mockResolvedValue({ rows: [] });
    const app = await buildApp();
    const res = await request(app).post('/api/auth/forgot-password').send({ correo: 'nadie@ejemplo.com' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('no envía correo a cuentas con dominio .local', async () => {
    queryMock.mockResolvedValue({
      rows: [{ id_usuario: 1, nombre_completo: 'Admin', correo: 'admin.sistemas@vaclinic.local', estado: true }]
    });
    const app = await buildApp();
    const res = await request(app).post('/api/auth/forgot-password').send({ correo: 'admin.sistemas@vaclinic.local' });
    expect(res.status).toBe(200);
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('no envía correo a cuentas inactivas', async () => {
    queryMock.mockResolvedValue({
      rows: [{ id_usuario: 2, nombre_completo: 'X', correo: 'x@ejemplo.com', estado: false }]
    });
    const app = await buildApp();
    await request(app).post('/api/auth/forgot-password').send({ correo: 'x@ejemplo.com' });
    expect(enviarMock).not.toHaveBeenCalled();
  });

  it('limita a 5 solicitudes por correo: la sexta ya no envía', async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM usuario WHERE correo')) {
        return { rows: [{ id_usuario: 7, nombre_completo: 'Josué', correo: 'jnavasn@miumg.edu.gt', estado: true }] };
      }
      return { rows: [], rowCount: 1 };
    });
    enviarMock.mockResolvedValue({ enviado: true });
    const app = await buildApp();
    for (let i = 0; i < 6; i++) {
      const res = await request(app).post('/api/auth/forgot-password').send({ correo: 'jnavasn@miumg.edu.gt' });
      expect(res.status).toBe(200);
    }
    expect(enviarMock).toHaveBeenCalledTimes(5);
  });
});

describe('POST /api/auth/reset-password', () => {
  const TOKEN = 'ab'.repeat(32);

  it('rechaza contraseñas cortas y peticiones incompletas', async () => {
    const app = await buildApp();
    expect((await request(app).post('/api/auth/reset-password').send({})).status).toBe(400);
    const corta = await request(app).post('/api/auth/reset-password').send({ token: TOKEN, nuevaContrasena: 'corta' });
    expect(corta.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rechaza un token inexistente, usado o vencido', async () => {
    queryMock.mockResolvedValue({ rows: [] });
    const app = await buildApp();
    const res = await request(app).post('/api/auth/reset-password').send({ token: TOKEN, nuevaContrasena: 'contrasena-nueva-123' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/inválido o ya venció/);
    const consulta = String(queryMock.mock.calls[0][0]);
    expect(consulta).toContain('usado_en IS NULL');
    expect(consulta).toContain('expira > NOW()');
    expect(queryMock.mock.calls[0][1][0]).toBe(hashToken(TOKEN));
  });

  it('con token válido cambia la contraseña, revoca sesiones y audita', async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM recuperacion_contrasena r')) {
        return { rows: [{ id: 3, id_usuario: 7, correo: 'jnavasn@miumg.edu.gt', estado: true }] };
      }
      if (sql.includes('RETURNING id')) return { rows: [{ id: 3 }], rowCount: 1 };
      return { rows: [], rowCount: 1 };
    });
    const app = await buildApp();
    const res = await request(app).post('/api/auth/reset-password').send({ token: TOKEN, nuevaContrasena: 'contrasena-nueva-123' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const sqls = queryMock.mock.calls.map((c) => String(c[0]));
    const iMarcar = sqls.findIndex((s) => s.includes('SET usado_en = NOW() WHERE id = $1'));
    const iCambiar = sqls.findIndex((s) => s.includes('UPDATE usuario SET contrasena_hash'));
    expect(iMarcar).toBeGreaterThan(-1);
    expect(iCambiar).toBeGreaterThan(iMarcar); // el token se consume antes de cambiar la contraseña
    expect(sqls.some((s) => s.includes('UPDATE sesion_personal SET revocado_en'))).toBe(true);
    const hashNuevo = queryMock.mock.calls[iCambiar][1][0] as string;
    expect(hashNuevo).not.toContain('contrasena-nueva-123');
    expect(bitacoraMock).toHaveBeenCalledTimes(1);
  });

  it('si otra petición ya consumió el token, no cambia nada', async () => {
    queryMock.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM recuperacion_contrasena r')) {
        return { rows: [{ id: 3, id_usuario: 7, correo: 'jnavasn@miumg.edu.gt', estado: true }] };
      }
      if (sql.includes('RETURNING id')) return { rows: [], rowCount: 0 };
      return { rows: [], rowCount: 1 };
    });
    const app = await buildApp();
    const res = await request(app).post('/api/auth/reset-password').send({ token: TOKEN, nuevaContrasena: 'contrasena-nueva-123' });
    expect(res.status).toBe(400);
    expect(queryMock.mock.calls.some((c) => String(c[0]).includes('UPDATE usuario SET contrasena_hash'))).toBe(false);
  });
});
