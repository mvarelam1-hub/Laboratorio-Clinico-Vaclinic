import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre "Episodios 4D" (server/routes/episodios.ts) —
 * segundo módulo de los 9 migrados desde localStorage (ver migración
 * 0011_modulos_restantes.sql). Mismo patrón de dobles de prueba que
 * carpetas.test.ts.
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
  const { episodiosRouter } = await import('./episodios');
  const app = express();
  app.use(express.json());
  app.use('/api/episodios', episodiosRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
});

describe('POST /api/episodios (creación y detección de duplicidad)', () => {
  it('rechaza con 400 si faltan pruebasSolicitadas', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/episodios').send({ idPaciente: 1, pruebasSolicitadas: [] });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('crea el episodio SIN marca de duplicidad cuando no hay episodios recientes con pruebas en común', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] }) // sin episodios recientes
      .mockResolvedValueOnce({ rows: [{ id_episodio: 1, marca_duplicidad: false }] }); // INSERT
    const app = await buildApp();
    const res = await request(app).post('/api/episodios').send({ idPaciente: 1, pruebasSolicitadas: ['Glucosa'] });
    expect(res.status).toBe(201);
    expect(queryMock.mock.calls[1][1][14]).toBe(false); // marca_duplicidad
  });

  it('marca duplicidad real cuando otro episodio del mismo paciente (72h) comparte una prueba', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_episodio: 9, numero_episodio: '4D-2026-EP001', pruebas_solicitadas: ['Glucosa', 'Perfil Lipídico'] }] })
      .mockResolvedValueOnce({ rows: [{ id_episodio: 2, marca_duplicidad: true }] });
    const app = await buildApp();
    const res = await request(app).post('/api/episodios').send({ idPaciente: 1, pruebasSolicitadas: ['Glucosa'] });
    expect(res.status).toBe(201);
    expect(queryMock.mock.calls[1][1][14]).toBe(true);
    expect(queryMock.mock.calls[1][1][15]).toContain('4D-2026-EP001');
  });

  it('rechaza con 403 a un rol sin admision_crear_ordenes', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    const app = await buildApp();
    const res = await request(app).post('/api/episodios').send({ idPaciente: 1, pruebasSolicitadas: ['Glucosa'] });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/episodios/:id/avanzar', () => {
  it('rechaza con 400 una dimensión inválida', async () => {
    const app = await buildApp();
    const res = await request(app).patch('/api/episodios/1/avanzar').send({ siguienteDimension: 'D9_inventada' });
    expect(res.status).toBe(400);
  });

  it('rechaza con 403 avanzar a D4_validacion sin el permiso validacion_redaccion', async () => {
    currentStaffUser = { idUsuario: 3, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/episodios/1/avanzar').send({ siguienteDimension: 'D4_validacion' });
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('avanza a D2_flebotomia y estampa hora_flebotomia cuando el rol sí tiene el permiso', async () => {
    currentStaffUser = { idUsuario: 3, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    queryMock.mockResolvedValueOnce({ rows: [{ id_episodio: 1, dimension_actual: 'D2_flebotomia' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/episodios/1/avanzar').send({ siguienteDimension: 'D2_flebotomia' });
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).toContain('hora_flebotomia');
  });
});

describe('PATCH /api/episodios/:id/duplicidad', () => {
  beforeEach(() => {
    // Solo director_laboratorio tiene admision_duplicidad en INITIAL_ROLES_CONFIG.
    currentStaffUser = { idUsuario: 5, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Directora Demo' };
  });

  it('"cancel" elimina el episodio', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const app = await buildApp();
    const res = await request(app).patch('/api/episodios/1/duplicidad').send({ accion: 'cancel' });
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).toContain('DELETE FROM episodio_4d');
  });

  it('"keep" limpia la marca de duplicidad sin borrar el episodio', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_episodio: 1, marca_duplicidad: false }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/episodios/1/duplicidad').send({ accion: 'keep' });
    expect(res.status).toBe(200);
    expect(res.body.marca_duplicidad).toBe(false);
  });

  it('rechaza con 400 una acción desconocida', async () => {
    const app = await buildApp();
    const res = await request(app).patch('/api/episodios/1/duplicidad').send({ accion: 'otra_cosa' });
    expect(res.status).toBe(400);
  });

  it('rechaza con 403 a un rol sin admision_duplicidad (ej. recepcionista)', async () => {
    currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/episodios/1/duplicidad').send({ accion: 'cancel' });
    expect(res.status).toBe(403);
  });
});
