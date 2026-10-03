import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre server/routes/informes.ts (migración 0014,
 * persistencia real del informe clínico / MedicalReport). Mismo patrón de
 * dobles de prueba que ordenes.test.ts: `pool` de `../db` sustituido por un
 * mock en memoria, `requireStaffAuth` reemplazado por un middleware que
 * inyecta directamente el usuario de prueba.
 */

let currentStaffUser: any = { idUsuario: 1, roleId: 'bioanalista_senior', status: 'activo', nombreCompleto: 'Bioanalista Demo' };

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
  const { informesRouter } = await import('./informes');
  const app = express();
  app.use(express.json());
  app.use('/api/informes', informesRouter);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: err.message }));
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 1, roleId: 'bioanalista_senior', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
});

describe('POST /api/informes', () => {
  it('crea el informe con las columnas reales + datos_json (clase válida)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 10, numero_informe: 'LAB-2026-0001', estado: 'borrador' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/informes').send({
      numeroInforme: 'LAB-2026-0001',
      titulo: 'Perfil Hematológico Completo',
      categoria: 'hematologia',
      hallazgosClinicos: 'Sin hallazgos relevantes',
      parameters: [{ id: 'p1', name: 'Hemoglobina', value: 14, examCode: 'PAN-02' }],
      recomendaciones: ['Control en 6 meses']
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id_informe: 10, numero_informe: 'LAB-2026-0001' });
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO informe_clinico/);
    expect(params[1]).toBe('LAB-2026-0001');
    expect(params[3]).toBe('Perfil Hematológico Completo');
    expect(params[4]).toBe('borrador');
    const datosJson = JSON.parse(params[12]);
    expect(datosJson.parameters).toHaveLength(1);
  });

  it('rechaza con 400 si falta numeroInforme o titulo', async () => {
    const app = await buildApp();
    const res1 = await request(app).post('/api/informes').send({ titulo: 'Sin número' });
    expect(res1.status).toBe(400);
    const res2 = await request(app).post('/api/informes').send({ numeroInforme: 'LAB-2026-0002' });
    expect(res2.status).toBe(400);
  });

  it('rechaza con 400 un estado fuera del enum permitido', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/informes').send({ numeroInforme: 'LAB-2026-0003', titulo: 'Test', estado: 'inventado' });
    expect(res.status).toBe(400);
  });

  it('rechaza con 403 a un rol sin validacion_redaccion', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    const app = await buildApp();
    const res = await request(app).post('/api/informes').send({ numeroInforme: 'LAB-2026-0004', titulo: 'Test' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/informes y GET /api/informes/:id', () => {
  it('el listado excluye eliminado=TRUE en el WHERE', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 1, numero_informe: 'LAB-2026-0001' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/informes');
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).toMatch(/eliminado = FALSE/);
  });

  it('GET /:id devuelve 404 si no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).get('/api/informes/999');
    expect(res.status).toBe(404);
  });

  it('GET /:id no filtra por eliminado (sigue consultable para auditoría)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 1, eliminado: true }] });
    const app = await buildApp();
    const res = await request(app).get('/api/informes/1');
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).not.toMatch(/eliminado = FALSE/);
  });
});

describe('PATCH /api/informes/:id', () => {
  it('actualiza columnas reales y fusiona datos_json con el operador ||', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 1, titulo: 'Actualizado' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/1').send({ titulo: 'Actualizado', patientExplanation: undefined, urgentAlert: true });
    expect(res.status).toBe(200);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/datos_json = datos_json \|\| /);
    expect(sql).toMatch(/eliminado = FALSE/);
    expect(params[1]).toBe('Actualizado');
    const datosJson = JSON.parse(params[11]);
    expect(datosJson.urgentAlert).toBe(true);
    expect('patientExplanation' in datosJson).toBe(false); // undefined se filtra, no sobreescribe
  });

  it('devuelve 404 si el informe no existe o ya fue eliminado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/999').send({ titulo: 'X' });
    expect(res.status).toBe(404);
  });

  it('rechaza con 403 a un rol sin validacion_redaccion', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/1').send({ titulo: 'X' });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/informes/:id/publicar', () => {
  it('transiciona a publicado con usuario y fecha de publicación', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 1, estado: 'publicado' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/1/publicar').send({ signature: { doctorName: 'Dr. Demo' } });
    expect(res.status).toBe(200);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/estado = 'publicado'/);
    expect(sql).toMatch(/id_usuario_publicacion = \$1/);
    expect(params[0]).toBe(1); // idUsuario del staffUser autenticado
  });

  it('rechaza con 403 a un rol sin validacion_publicacion', async () => {
    currentStaffUser = { idUsuario: 3, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/1/publicar');
    expect(res.status).toBe(403);
  });

  it('devuelve 404 si el informe no existe o ya fue eliminado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/999/publicar');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/informes/:id', () => {
  it('elimina lógicamente (nunca borra la fila) y guarda el motivo', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 1, eliminado: true, fecha_eliminacion: '2026-01-01' }] });
    const app = await buildApp();
    const res = await request(app).delete('/api/informes/1').send({ motivo: 'Duplicado' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, id_informe: 1, eliminado: true });
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).not.toMatch(/DELETE FROM informe_clinico/);
    expect(sql).toMatch(/eliminado = TRUE/);
    expect(params).toEqual([1, 'Duplicado', 1]);
  });

  it('devuelve 404 si ya estaba eliminado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).delete('/api/informes/999');
    expect(res.status).toBe(404);
  });

  it('rechaza con 403 a un rol sin validacion_redaccion', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    const app = await buildApp();
    const res = await request(app).delete('/api/informes/1');
    expect(res.status).toBe(403);
  });
});
