import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre "Reactivos e insumos" (server/routes/reactivos.ts)
 * — sexto módulo de los 9 migrados desde localStorage. POST /:id/movimientos
 * usa una transacción real con SELECT ... FOR UPDATE (pool.connect()), así
 * que el doble de `../db` expone `connect()` igual que en roles.test.ts.
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
  const { reactivosRouter } = await import('./reactivos');
  const app = express();
  app.use(express.json());
  app.use('/api/reactivos', reactivosRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  clientQueryMock.mockReset();
  clientReleaseMock.mockReset();
  currentStaffUser = { idUsuario: 3, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Directora Demo' };
});

describe('GET /api/reactivos', () => {
  it('lista sin exigir permiso extra', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_reactivo: 1, codigo: 'RGT-001' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/reactivos');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/reactivos/movimientos', () => {
  it('lista el histórico con joins a reactivo y usuario', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_movimiento: 1, nombre_reactivo: 'Glucosa' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/reactivos/movimientos');
    expect(res.status).toBe(200);
    expect(res.body[0].nombre_reactivo).toBe('Glucosa');
  });
});

describe('POST /api/reactivos', () => {
  it('rechaza con 400 si faltan campos obligatorios', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/reactivos').send({ name: 'X' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('crea el reactivo y registra el movimiento de entrada inicial si currentStock > 0', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_reactivo: 1, codigo: 'RGT-001', estado: 'optimo' }] })
      .mockResolvedValueOnce({ rows: [{ id_movimiento: 1 }] });
    const app = await buildApp();
    const res = await request(app).post('/api/reactivos').send({
      code: 'RGT-001', name: 'Glucosa', category: 'bioquimica', lotNumber: 'LOT-1', expirationDate: '2027-01-01',
      unit: 'Kits', currentStock: 10, minStockAlert: 5, optimalStock: 50
    });
    expect(res.status).toBe(201);
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(queryMock.mock.calls[1][0]).toContain('INSERT INTO movimiento_reactivo');
  });

  it('no registra movimiento inicial si currentStock es 0', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_reactivo: 1, codigo: 'RGT-001' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/reactivos').send({
      code: 'RGT-001', name: 'Glucosa', category: 'bioquimica', lotNumber: 'LOT-1', expirationDate: '2027-01-01', unit: 'Kits'
    });
    expect(res.status).toBe(201);
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it('responde 409 si el código ya existe (23505)', async () => {
    const errorDup: any = new Error('duplicate');
    errorDup.code = '23505';
    queryMock.mockRejectedValueOnce(errorDup);
    const app = await buildApp();
    const res = await request(app).post('/api/reactivos').send({
      code: 'RGT-001', name: 'X', category: 'bioquimica', lotNumber: 'L', expirationDate: '2027-01-01', unit: 'Kits'
    });
    expect(res.status).toBe(409);
  });

  it('rechaza con 403 a un rol sin qc_calibraciones (ej. recepcionista)', async () => {
    currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
    const app = await buildApp();
    const res = await request(app).post('/api/reactivos').send({ code: 'RGT-001', name: 'X', category: 'bioquimica', lotNumber: 'L', expirationDate: '2027-01-01', unit: 'Kits' });
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/reactivos/:id', () => {
  it('responde 404 si el reactivo no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/reactivos/999').send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('recalcula el estado a critico si el nuevo mínimo lo justifica', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ stock_actual: 5, stock_minimo_alerta: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id_reactivo: 1, estado: 'critico' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/reactivos/1').send({ minStockAlert: 20 });
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[1][1][14]).toBe('critico');
  });
});

describe('DELETE /api/reactivos/:id', () => {
  it('elimina y responde 404 si no existe', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    const app = await buildApp();
    const res = await request(app).delete('/api/reactivos/999');
    expect(res.status).toBe(404);
  });

  it('elimina un reactivo existente', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const app = await buildApp();
    const res = await request(app).delete('/api/reactivos/1');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/reactivos/:id/movimientos', () => {
  it('rechaza con 400 un type inválido', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/reactivos/1/movimientos').send({ type: 'robo', quantity: 5 });
    expect(res.status).toBe(400);
    expect(clientQueryMock).not.toHaveBeenCalled();
  });

  it('rechaza con 400 una cantidad <= 0', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/reactivos/1/movimientos').send({ type: 'entrada', quantity: 0 });
    expect(res.status).toBe(400);
  });

  it('registra una salida_consumo real: descuenta stock y recalcula estado en una transacción', async () => {
    clientQueryMock
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id_reactivo: 1, stock_actual: 10, stock_minimo_alerta: 5 }] }) // SELECT FOR UPDATE
      .mockResolvedValueOnce({ rows: [{ id_reactivo: 1, stock_actual: 4, estado: 'critico' }] }) // UPDATE reactivo
      .mockResolvedValueOnce({ rows: [{ id_movimiento: 1, cantidad: 6 }] }) // INSERT movimiento
      .mockResolvedValueOnce({}); // COMMIT
    const app = await buildApp();
    const res = await request(app).post('/api/reactivos/1/movimientos').send({ type: 'salida_consumo', quantity: 6, reason: 'Corrida matutina' });
    expect(res.status).toBe(201);
    expect(res.body.reactivo.estado).toBe('critico');
    expect(clientReleaseMock).toHaveBeenCalled();
  });

  it('responde 404 dentro de la transacción si el reactivo no existe (y hace ROLLBACK)', async () => {
    clientQueryMock
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // SELECT FOR UPDATE vacío
    const app = await buildApp();
    const res = await request(app).post('/api/reactivos/999/movimientos').send({ type: 'entrada', quantity: 5 });
    expect(res.status).toBe(404);
    expect(clientQueryMock.mock.calls.map((c) => c[0])).toContain('ROLLBACK');
  });

  it('rechaza con 403 a un rol sin qc_calibraciones', async () => {
    currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
    const app = await buildApp();
    const res = await request(app).post('/api/reactivos/1/movimientos').send({ type: 'entrada', quantity: 5 });
    expect(res.status).toBe(403);
    expect(clientQueryMock).not.toHaveBeenCalled();
  });
});
