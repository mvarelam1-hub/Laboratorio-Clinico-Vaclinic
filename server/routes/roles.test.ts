import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { LAB_PERMISSIONS_CATALOG } from '../../src/shared/permissions';

/**
 * Pruebas unitarias sobre "Matriz de permisos por rol"
 * (server/routes/roles.ts) — parte del quinto módulo de los 9 migrados
 * desde localStorage. La ruta PUT usa una transacción real (pool.connect())
 * porque DELETE + 19 INSERT deben verse como una sola operación atómica;
 * por eso el doble de `../db` aquí también expone `connect()`, a
 * diferencia de los demás archivos de prueba que solo mockean `query()`.
 */

let currentStaffUser: any = { idUsuario: 3, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Directora Demo' };

vi.mock('../auth-firebase', () => ({
  requireStaffAuth: (req: any, _res: any, next: any) => {
    req.staffUser = currentStaffUser;
    next();
  },
}));

const queryMock = vi.fn();
const clientQueryMock = vi.fn();
const clientReleaseMock = vi.fn();
vi.mock('../db', () => ({
  pool: {
    query: (...args: any[]) => queryMock(...args),
    connect: async () => ({ query: (...args: any[]) => clientQueryMock(...args), release: clientReleaseMock }),
  },
}));

async function buildApp() {
  const { rolesRouter } = await import('./roles');
  const app = express();
  app.use(express.json());
  app.use('/api/roles', rolesRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  clientQueryMock.mockReset().mockResolvedValue({});
  clientReleaseMock.mockReset();
  currentStaffUser = { idUsuario: 3, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Directora Demo' };
});

describe('GET /api/roles/:roleId/permisos', () => {
  it('lista las filas guardadas para el rol', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_permiso: 'admision_pacientes', habilitado: true }] });
    const app = await buildApp();
    const res = await request(app).get('/api/roles/bioanalista/permisos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('rechaza con 403 a un rol sin admin_usuarios_roles', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    const app = await buildApp();
    const res = await request(app).get('/api/roles/bioanalista/permisos');
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('PUT /api/roles/:roleId/permisos', () => {
  it('rechaza con 400 si permissions no es un arreglo', async () => {
    const app = await buildApp();
    const res = await request(app).put('/api/roles/bioanalista/permisos').send({ permissions: 'no-es-arreglo' });
    expect(res.status).toBe(400);
    expect(clientQueryMock).not.toHaveBeenCalled();
  });

  it('rechaza con 400 si incluye un id de permiso desconocido', async () => {
    const app = await buildApp();
    const res = await request(app).put('/api/roles/bioanalista/permisos').send({ permissions: ['permiso_inventado'] });
    expect(res.status).toBe(400);
    expect(clientQueryMock).not.toHaveBeenCalled();
  });

  it('reemplaza en una transacción real (BEGIN, DELETE, un INSERT por permiso del catálogo, COMMIT) y responde con el estado final', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_permiso: 'admision_pacientes', habilitado: true }] });
    const app = await buildApp();
    const res = await request(app).put('/api/roles/bioanalista/permisos').send({ permissions: ['admision_pacientes'] });
    expect(res.status).toBe(200);
    const llamadas = clientQueryMock.mock.calls.map((c) => String(c[0]));
    expect(llamadas[0]).toBe('BEGIN');
    expect(llamadas.some((sql) => sql.includes('DELETE FROM rol_permiso_default'))).toBe(true);
    // Un INSERT por cada permiso del catálogo real (LAB_PERMISSIONS_CATALOG),
    // no un número hardcodeado -así el test sigue siendo correcto si el
    // catálogo crece o se reduce más adelante-.
    expect(llamadas.filter((sql) => sql.includes('INSERT INTO rol_permiso_default'))).toHaveLength(LAB_PERMISSIONS_CATALOG.length);
    expect(llamadas[llamadas.length - 1]).toBe('COMMIT');
    expect(clientReleaseMock).toHaveBeenCalled();
  });

  it('hace ROLLBACK real si una escritura falla a medio camino', async () => {
    clientQueryMock
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({}) // DELETE
      .mockRejectedValueOnce(new Error('fallo simulado en el 3er INSERT'));
    const app = await buildApp();
    const res = await request(app).put('/api/roles/bioanalista/permisos').send({ permissions: [] });
    expect(res.status).toBe(500);
    const llamadas = clientQueryMock.mock.calls.map((c) => String(c[0]));
    expect(llamadas).toContain('ROLLBACK');
    expect(clientReleaseMock).toHaveBeenCalled();
  });

  it('rechaza con 403 a un rol sin admin_usuarios_roles', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    const app = await buildApp();
    const res = await request(app).put('/api/roles/bioanalista/permisos').send({ permissions: [] });
    expect(res.status).toBe(403);
    expect(clientQueryMock).not.toHaveBeenCalled();
  });
});
