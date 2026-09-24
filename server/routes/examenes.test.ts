import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre el módulo "Catálogo de exámenes" (server/routes/examenes.ts),
 * agregado para que el frontend real pueda armar órdenes contra la base de datos
 * real en vez de un catálogo hardcodeado en localStorage.
 */

vi.mock('../auth-firebase', () => ({
  requireStaffAuth: (req: any, _res: any, next: any) => {
    req.staffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
    next();
  },
}));

const queryMock = vi.fn();
vi.mock('../db', () => ({
  pool: { query: (...args: any[]) => queryMock(...args) },
}));

async function buildApp() {
  const { examenesRouter } = await import('./examenes');
  const app = express();
  app.use(express.json());
  app.use('/api/examenes', examenesRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
});

describe('GET /api/examenes', () => {
  it('devuelve el catálogo ordenado por categoría, accesible a cualquier personal autenticado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_examen: 1, nombre_examen: 'Glucosa' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/examenes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('GET /api/examenes/:id', () => {
  it('devuelve 404 si el examen no existe en el catálogo', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).get('/api/examenes/999');
    expect(res.status).toBe(404);
  });

  it('devuelve el examen cuando existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_examen: 1, nombre_examen: 'Glucosa' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/examenes/1');
    expect(res.status).toBe(200);
    expect(res.body.nombre_examen).toBe('Glucosa');
  });
});
