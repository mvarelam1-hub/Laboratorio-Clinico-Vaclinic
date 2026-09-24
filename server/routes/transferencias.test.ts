import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre "Transferencias de muestra" (server/routes/transferencias.ts)
 * — tercer módulo de los 9 migrados desde localStorage (ver migración
 * 0011_modulos_restantes.sql). Mismo patrón de dobles de prueba que
 * carpetas.test.ts / episodios.test.ts.
 */

let currentStaffUser: any = { idUsuario: 3, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };

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
  const { transferenciasRouter } = await import('./transferencias');
  const app = express();
  app.use(express.json());
  app.use('/api/transferencias', transferenciasRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 3, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
});

describe('GET /api/transferencias', () => {
  it('lista los manifiestos sin exigir permiso extra (solo sesión de personal)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_transferencia: 1, codigo_manifiesto: 'MAN-4D-2026-101' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/transferencias');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('POST /api/transferencias', () => {
  it('rechaza con 400 si faltan campos obligatorios', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/transferencias').send({ originBranch: 'este' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rechaza con 400 si origen y destino son la misma sede', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/transferencias').send({
      originBranch: 'este', destinationBranch: 'este', courierName: 'Mensajería X'
    });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('crea el manifiesto con estado en_transito por defecto', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_transferencia: 1, codigo_manifiesto: 'MAN-4D-2026-500', estado: 'en_transito' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/transferencias').send({
      originBranch: 'este', destinationBranch: 'central', courierName: 'Mensajería X',
      temperatureControl: '2_8_grados', temperatureLogged: 4.1, samplesCount: 3, samplesCodes: ['A1', 'A2', 'A3']
    });
    expect(res.status).toBe(201);
    expect(res.body.estado).toBe('en_transito');
  });

  it('reintenta una vez si el código de manifiesto colisiona (23505) y luego crea con éxito', async () => {
    const errorDuplicado: any = new Error('duplicate key');
    errorDuplicado.code = '23505';
    queryMock
      .mockRejectedValueOnce(errorDuplicado)
      .mockResolvedValueOnce({ rows: [{ id_transferencia: 2, codigo_manifiesto: 'MAN-4D-2026-777' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/transferencias').send({
      originBranch: 'este', destinationBranch: 'central', courierName: 'Mensajería X'
    });
    expect(res.status).toBe(201);
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it('rechaza con 403 a un rol sin flebotomia_manifiestos (ej. recepcionista)', async () => {
    currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
    const app = await buildApp();
    const res = await request(app).post('/api/transferencias').send({
      originBranch: 'este', destinationBranch: 'central', courierName: 'Mensajería X'
    });
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/transferencias/:id', () => {
  it('rechaza con 400 un estado inválido', async () => {
    const app = await buildApp();
    const res = await request(app).patch('/api/transferencias/1').send({ status: 'perdido' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('actualiza estado a entregado y estampa hora_llegada_real', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_transferencia: 1, estado: 'entregado' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/transferencias/1').send({ status: 'entregado', actualArrivalTime: '2026-09-15T15:00:00.000Z' });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('entregado');
  });

  it('responde 404 si el manifiesto no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/transferencias/999').send({ status: 'retrasado' });
    expect(res.status).toBe(404);
  });

  it('rechaza con 403 a un rol sin flebotomia_manifiestos', async () => {
    currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/transferencias/1').send({ status: 'entregado' });
    expect(res.status).toBe(403);
  });
});
