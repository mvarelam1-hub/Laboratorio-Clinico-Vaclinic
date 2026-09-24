import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre "Perfiles personalizados" (server/routes/perfiles.ts)
 * — cuarto módulo de los 9 migrados desde localStorage (ver migración
 * 0011_modulos_restantes.sql). Mismo patrón de dobles de prueba que
 * carpetas.test.ts / episodios.test.ts / transferencias.test.ts.
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
  const { perfilesRouter } = await import('./perfiles');
  const app = express();
  app.use(express.json());
  app.use('/api/perfiles', perfilesRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 3, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Directora Demo' };
});

describe('GET /api/perfiles', () => {
  it('lista los perfiles sin exigir permiso extra', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_perfil: 1, codigo: 'PRF-001' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/perfiles');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('POST /api/perfiles', () => {
  it('rechaza con 400 si falta code o name', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/perfiles').send({ name: 'Perfil X' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('crea el perfil con los arreglos y el JSONB de pruebas', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_perfil: 1, codigo: 'PRF-001', nombre: 'Perfil Renal' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/perfiles').send({
      code: 'PRF-001', name: 'Perfil Renal', categoryName: 'Personalizados', price: 250,
      testIds: ['t1', 't2'], testNames: ['Creatinina', 'BUN'], tests: [{ id: 'ptest-1', name: 'Creatinina', resultType: 'numerico', status: 'Activa' }]
    });
    expect(res.status).toBe(201);
    const insertArgs = queryMock.mock.calls[0][1];
    expect(insertArgs[6]).toEqual(['t1', 't2']);
    expect(JSON.parse(insertArgs[8])).toHaveLength(1);
  });

  it('responde 409 si el código de perfil ya existe (23505)', async () => {
    const errorDuplicado: any = new Error('duplicate key');
    errorDuplicado.code = '23505';
    queryMock.mockRejectedValueOnce(errorDuplicado);
    const app = await buildApp();
    const res = await request(app).post('/api/perfiles').send({ code: 'PRF-001', name: 'Perfil Renal' });
    expect(res.status).toBe(409);
  });

  it('rechaza con 403 a un rol sin catalogo_perfiles_crear (ej. bioanalista)', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    const app = await buildApp();
    const res = await request(app).post('/api/perfiles').send({ code: 'PRF-001', name: 'Perfil Renal' });
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/perfiles/:id', () => {
  it('actualiza campos parciales y responde 404 si no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/perfiles/999').send({ price: 300 });
    expect(res.status).toBe(404);
  });

  it('actualiza el estado a Inactivo', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_perfil: 1, estado: 'Inactivo' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/perfiles/1').send({ status: 'Inactivo' });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('Inactivo');
  });

  it('rechaza con 403 a un rol sin catalogo_perfiles_crear', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/perfiles/1').send({ price: 300 });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/perfiles/:id', () => {
  it('elimina un perfil que no es de fábrica', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ es_perfil_fabrica: false }] })
      .mockResolvedValueOnce({ rowCount: 1 });
    const app = await buildApp();
    const res = await request(app).delete('/api/perfiles/1');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rechaza con 400 eliminar un perfil de fábrica', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ es_perfil_fabrica: true }] });
    const app = await buildApp();
    const res = await request(app).delete('/api/perfiles/1');
    expect(res.status).toBe(400);
  });

  it('responde 404 si el perfil no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).delete('/api/perfiles/999');
    expect(res.status).toBe(404);
  });

  it('rechaza con 403 a un rol sin catalogo_perfiles_crear', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    const app = await buildApp();
    const res = await request(app).delete('/api/perfiles/1');
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
