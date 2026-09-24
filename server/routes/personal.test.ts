import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre "Personal / usuarios" (server/routes/personal.ts)
 * — quinto módulo de los 9 migrados desde localStorage. Mismo patrón de
 * dobles de prueba que carpetas.test.ts / episodios.test.ts.
 */

let currentStaffUser: any = { idUsuario: 3, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Directora Demo' };

vi.mock('../auth-firebase', () => ({
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
  const { personalRouter } = await import('./personal');
  const app = express();
  app.use(express.json());
  app.use('/api/personal', personalRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 3, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Directora Demo' };
});

describe('Toda la ruta requiere admin_usuarios_roles', () => {
  it('rechaza con 403 a un rol sin admin_usuarios_roles (ej. bioanalista) en cualquier verbo', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    const app = await buildApp();
    const resGet = await request(app).get('/api/personal');
    expect(resGet.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('GET /api/personal', () => {
  it('lista el personal excluyendo la cuenta de sistema', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 2, rol: 'bioanalista' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/personal');
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).toContain("rol != 'sistema'");
  });
});

describe('POST /api/personal', () => {
  it('rechaza con 400 si faltan campos obligatorios', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/personal').send({ fullName: 'Nuevo' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('crea el usuario con estado=TRUE por defecto', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 10, nombre_completo: 'Nuevo Bioanalista', estado: true }] });
    const app = await buildApp();
    const res = await request(app).post('/api/personal').send({
      fullName: 'Nuevo Bioanalista', email: 'nuevo@vaclinic.test', roleId: 'bioanalista', phone: '5555-5555'
    });
    expect(res.status).toBe(201);
    expect(queryMock.mock.calls[0][0]).toContain('TRUE');
  });

  it('responde 409 si el correo o nombre de usuario ya existe (23505)', async () => {
    const errorDuplicado: any = new Error('duplicate key');
    errorDuplicado.code = '23505';
    queryMock.mockRejectedValueOnce(errorDuplicado);
    const app = await buildApp();
    const res = await request(app).post('/api/personal').send({ fullName: 'X', email: 'x@vaclinic.test', roleId: 'bioanalista' });
    expect(res.status).toBe(409);
  });

  it('responde 400 si el rol viola el CHECK constraint (23514)', async () => {
    const errorCheck: any = new Error('check violation');
    errorCheck.code = '23514';
    queryMock.mockRejectedValueOnce(errorCheck);
    const app = await buildApp();
    const res = await request(app).post('/api/personal').send({ fullName: 'X', email: 'x@vaclinic.test', roleId: 'rol_inventado' });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/personal/:id/estado', () => {
  it('rechaza con 400 un estado desconocido', async () => {
    const app = await buildApp();
    const res = await request(app).patch('/api/personal/2/estado').send({ status: 'de_vacaciones_forzadas' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('guarda estado=FALSE para "suspendido" (colapsado, igual que el login real)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 2, estado: false }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/personal/2/estado').send({ status: 'suspendido' });
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][1]).toEqual([false, 2]);
    expect(res.body.status_solicitado).toBe('suspendido');
  });

  it('responde 404 si el usuario no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/personal/999/estado').send({ status: 'activo' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/personal/:id/pin', () => {
  it('rechaza con 400 un PIN no numérico', async () => {
    const app = await buildApp();
    const res = await request(app).patch('/api/personal/2/pin').send({ pinCode: 'abcd' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('actualiza el PIN', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 2, pin_code: '4321' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/personal/2/pin').send({ pinCode: '4321' });
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/personal/:id', () => {
  it('rechaza con 400 que el usuario se elimine a sí mismo', async () => {
    const app = await buildApp();
    const res = await request(app).delete('/api/personal/3'); // currentStaffUser.idUsuario === 3
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('elimina a otro usuario', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const app = await buildApp();
    const res = await request(app).delete('/api/personal/2');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('responde 409 si el usuario tiene historial de auditoría asociado (23503)', async () => {
    const errorFk: any = new Error('foreign key violation');
    errorFk.code = '23503';
    queryMock.mockRejectedValueOnce(errorFk);
    const app = await buildApp();
    const res = await request(app).delete('/api/personal/2');
    expect(res.status).toBe(409);
  });

  it('responde 404 si el usuario no existe', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    const app = await buildApp();
    const res = await request(app).delete('/api/personal/999');
    expect(res.status).toBe(404);
  });
});
