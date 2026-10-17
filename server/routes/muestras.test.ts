import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Muestras (server/routes/muestras.ts). `pool` y la sesión se sustituyen por
 * dobles en memoria, igual que en ordenes.test.ts: se prueba la lógica del
 * router (validaciones, permisos, transiciones, código de barras), no
 * PostgreSQL.
 */

let currentStaffUser: any = { idUsuario: 7, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };

vi.mock('../auth-staff', () => ({
  requireStaffAuth: (req: any, _res: any, next: any) => {
    req.staffUser = currentStaffUser;
    next();
  },
}));

const queryMock = vi.fn();
vi.mock('../db', () => ({ pool: { query: (...args: any[]) => queryMock(...args) } }));
vi.mock('../bitacora', () => ({ registrarBitacora: vi.fn(async () => undefined) }));

const FILA = {
  id_muestra: 11, codigo_barras: 'TUB-2026-000005', id_orden: 3, numero_orden: 'ORD-261004-001',
  paciente_nombre: 'Ana Pérez', paciente_dni: '12345', categoria: 'tubo', estado: 'recolectada', calidad: 'optima'
};

async function buildApp() {
  const { muestrasRouter } = await import('./muestras');
  const app = express();
  app.use(express.json());
  app.use('/api/muestras', muestrasRouter);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: err.message }));
  return app;
}

const cuerpoValido = {
  idOrden: 3, categoria: 'tubo', tipoContenedor: 'lila',
  etiquetaContenedor: 'Tubo Lila (EDTA)', examenes: ['Hemograma', ' '], flebotomista: 'Lic. Demo'
};

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 7, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
});

describe('POST /api/muestras', () => {
  it('exige una orden', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/muestras').send({ ...cuerpoValido, idOrden: undefined });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/orden/i);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rechaza una categoría o una calidad inválidas', async () => {
    const app = await buildApp();
    expect((await request(app).post('/api/muestras').send({ ...cuerpoValido, categoria: 'jeringa' })).status).toBe(400);
    expect((await request(app).post('/api/muestras').send({ ...cuerpoValido, calidad: 'rara' })).status).toBe(400);
  });

  it('devuelve 404 si la orden no existe o está en la papelera', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    expect((await request(app).post('/api/muestras').send(cuerpoValido)).status).toBe(404);

    queryMock.mockReset();
    queryMock.mockResolvedValueOnce({ rows: [{ id_orden: 3, numero_orden: 'X', eliminada: true }] });
    expect((await request(app).post('/api/muestras').send(cuerpoValido)).status).toBe(404);
  });

  it('genera el código de barras en el servidor y guarda quién la registró', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_orden: 3, numero_orden: 'ORD-261004-001', eliminada: false }] })
      .mockResolvedValueOnce({ rows: [{ n: '5' }] })
      .mockResolvedValueOnce({ rows: [{ id_muestra: 11 }] })
      .mockResolvedValueOnce({ rows: [FILA] });
    const app = await buildApp();
    const res = await request(app).post('/api/muestras').send(cuerpoValido);

    expect(res.status).toBe(201);
    expect(res.body.codigo_barras).toBe('TUB-2026-000005');
    const insert = queryMock.mock.calls[2];
    expect(insert[0]).toContain('INSERT INTO muestra');
    expect(insert[1][0]).toMatch(/^TUB-\d{4}-000005$/);
    expect(insert[1][5]).toEqual(['Hemograma']); // sin vacíos
    expect(insert[1][8]).toBe(7); // id_registrador
  });

  it('usa el prefijo REC para recipientes', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_orden: 3, numero_orden: 'X', eliminada: false }] })
      .mockResolvedValueOnce({ rows: [{ n: '12' }] })
      .mockResolvedValueOnce({ rows: [{ id_muestra: 12 }] })
      .mockResolvedValueOnce({ rows: [{ ...FILA, id_muestra: 12 }] });
    const app = await buildApp();
    await request(app).post('/api/muestras').send({ ...cuerpoValido, categoria: 'recipiente' });
    expect(queryMock.mock.calls[2][1][0]).toMatch(/^REC-\d{4}-000012$/);
  });

  it('un rol sin el permiso de recolección recibe 403', async () => {
    currentStaffUser = { idUsuario: 9, roleId: 'recepcionista_sin_permiso', status: 'activo', nombreCompleto: 'X' };
    const app = await buildApp();
    const res = await request(app).post('/api/muestras').send(cuerpoValido);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/muestras/escanear', () => {
  it('un código desconocido responde 404 y no crea nada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).post('/api/muestras/escanear').send({ codigo: 'tub-2026-999999' });
    expect(res.status).toBe(404);
    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(queryMock.mock.calls[0][1]).toEqual(['TUB-2026-999999']);
  });

  it('pasa una muestra recolectada a en_proceso y registra al receptor', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_muestra: 11, estado: 'recolectada' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...FILA, estado: 'en_proceso' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/muestras/escanear').send({ codigo: 'TUB-2026-000005' });
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('en_proceso');
    expect(queryMock.mock.calls[1][0]).toContain("estado = 'en_proceso'");
    expect(queryMock.mock.calls[1][1]).toEqual([11, 7]);
  });

  it('escanear una muestra que ya avanzó no la retrocede ni la modifica', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_muestra: 11, estado: 'analizada' }] })
      .mockResolvedValueOnce({ rows: [{ ...FILA, estado: 'analizada' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/muestras/escanear').send({ codigo: 'TUB-2026-000005' });
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls.some((c) => String(c[0]).includes('UPDATE muestra'))).toBe(false);
  });
});

describe('PATCH /api/muestras/:id', () => {
  it('rechaza estados inválidos y cuerpos vacíos', async () => {
    const app = await buildApp();
    expect((await request(app).patch('/api/muestras/11').send({ estado: 'perdida' })).status).toBe(400);
    expect((await request(app).patch('/api/muestras/11').send({})).status).toBe(400);
  });

  it('404 si la muestra no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    expect((await request(app).patch('/api/muestras/99').send({ estado: 'en_proceso' })).status).toBe(404);
  });

  it('una muestra analizada no puede volver a otro estado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ codigo_barras: 'TUB-2026-000005', estado: 'analizada', calidad: 'optima' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/muestras/11').send({ estado: 'recolectada' });
    expect(res.status).toBe(409);
  });

  it('al rechazar guarda un motivo (por defecto, la calidad)', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ codigo_barras: 'TUB-2026-000005', estado: 'recolectada', calidad: 'coagulada' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...FILA, estado: 'rechazada' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/muestras/11').send({ estado: 'rechazada' });
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[1][1][3]).toBe('Calidad: coagulada');
  });
});

describe('GET /api/muestras', () => {
  it('valida ordenId', async () => {
    const app = await buildApp();
    expect((await request(app).get('/api/muestras?ordenId=abc')).status).toBe(400);
  });

  it('lista las muestras (cualquier personal autenticado)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [FILA] });
    currentStaffUser = { idUsuario: 2, roleId: 'auditor', status: 'activo', nombreCompleto: 'Auditor' };
    const app = await buildApp();
    const res = await request(app).get('/api/muestras');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
