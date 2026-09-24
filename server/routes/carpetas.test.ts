import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre "Carpetas de órdenes" (server/routes/carpetas.ts)
 * — primer módulo de los 9 que antes solo existían en localStorage (ver
 * migración 0011_modulos_restantes.sql). Mismo patrón de dobles de prueba
 * que pacientes.test.ts/ordenes.test.ts.
 */

let currentStaffUser: any = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };

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
  const { carpetasRouter } = await import('./carpetas');
  const app = express();
  app.use(express.json());
  app.use('/api/carpetas', carpetasRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
});

describe('GET /api/carpetas', () => {
  it('lista carpetas con la cantidad de órdenes por carpeta', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id_carpeta: 1, nombre: 'Sin asignar', es_sistema: true, cantidad_ordenes: 5 }]
    });
    const app = await buildApp();
    const res = await request(app).get('/api/carpetas');
    expect(res.status).toBe(200);
    expect(res.body[0].cantidad_ordenes).toBe(5);
  });
});

describe('POST /api/carpetas (creación)', () => {
  it('rechaza con 400 si falta el nombre', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/carpetas').send({});
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('crea la carpeta con valores por defecto de color/icono', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_carpeta: 8, nombre: 'Empresas Corporativas', color: 'slate', icono: 'Folder' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/carpetas').send({ nombre: 'Empresas Corporativas' });
    expect(res.status).toBe(201);
    expect(queryMock.mock.calls[0][1]).toEqual(['Empresas Corporativas', 'slate', 'Folder', null]);
  });

  it('rechaza con 403 a un rol sin admision_crear_ordenes', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    const app = await buildApp();
    const res = await request(app).post('/api/carpetas').send({ nombre: 'X' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/carpetas/:id', () => {
  it('rechaza con 400 intentar borrar una carpeta de sistema', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ es_sistema: true }] });
    const app = await buildApp();
    const res = await request(app).delete('/api/carpetas/1');
    expect(res.status).toBe(400);
  });

  it('reasigna las órdenes a "Sin asignar" antes de borrar una carpeta normal', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ es_sistema: false }] }) // SELECT
      .mockResolvedValueOnce({ rows: [] }) // UPDATE orden
      .mockResolvedValueOnce({ rows: [] }); // DELETE carpeta
    const app = await buildApp();
    const res = await request(app).delete('/api/carpetas/7');
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[1][0]).toContain('UPDATE orden SET id_carpeta = 1');
    expect(queryMock.mock.calls[2][0]).toContain('DELETE FROM carpeta_orden');
  });

  it('devuelve 404 si la carpeta no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).delete('/api/carpetas/999');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/carpetas/ordenes/:idOrden/mover', () => {
  it('mueve una orden a la carpeta indicada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_orden: 5, id_carpeta: 3 }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/carpetas/ordenes/5/mover').send({ idCarpeta: 3 });
    expect(res.status).toBe(200);
    expect(res.body.id_carpeta).toBe(3);
  });

  it('sin idCarpeta, mueve la orden a "Sin asignar" (id 1)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_orden: 5, id_carpeta: 1 }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/carpetas/ordenes/5/mover').send({});
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][1]).toEqual([1, 5]);
  });
});
