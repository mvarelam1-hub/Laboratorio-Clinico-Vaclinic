import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre "Plantillas de informes" (server/routes/plantillas.ts)
 * — séptimo módulo de los 9 migrados desde localStorage. PUT /:id es un
 * upsert real (ON CONFLICT DO UPDATE) porque id_plantilla es TEXT y lo
 * genera el frontend, igual que ya hacía addTemplate() en localStorage.
 */

let currentStaffUser: any = { idUsuario: 2, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };

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
  const { plantillasRouter } = await import('./plantillas');
  const app = express();
  app.use(express.json());
  app.use('/api/plantillas', plantillasRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 2, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
});

describe('GET /api/plantillas', () => {
  it('lista sin exigir permiso extra', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_plantilla: 'tpl-1', nombre: 'Perfil Renal' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/plantillas');
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/plantillas/:id', () => {
  it('rechaza con 400 si faltan campos obligatorios', async () => {
    const app = await buildApp();
    const res = await request(app).put('/api/plantillas/tpl-1').send({ name: 'X' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('hace upsert real (ON CONFLICT DO UPDATE) con el id que envía el cliente', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_plantilla: 'tpl-1-iso-1234', nombre: 'Perfil Renal (Alineado ISO/CLSI)' }] });
    const app = await buildApp();
    const res = await request(app).put('/api/plantillas/tpl-1-iso-1234').send({
      name: 'Perfil Renal (Alineado ISO/CLSI)', category: 'quimica_clinica',
      defaultParameters: [{ name: 'Creatinina', unit: 'mg/dL' }], defaultRecommendations: ['Ayuno de 8h'],
      complianceScore: 92, complianceStandard: 'ISO 15189:2022 & CLSI'
    });
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).toContain('ON CONFLICT (id_plantilla) DO UPDATE');
    expect(queryMock.mock.calls[0][1][0]).toBe('tpl-1-iso-1234');
  });

  it('rechaza con 403 a un rol sin validacion_redaccion (ej. recepcionista)', async () => {
    currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
    const app = await buildApp();
    const res = await request(app).put('/api/plantillas/tpl-1').send({ name: 'X', category: 'general' });
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/plantillas/:id', () => {
  it('actualiza solo el puntaje de cumplimiento sin tocar el resto', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_plantilla: 'tpl-1', puntaje_cumplimiento: 88 }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/plantillas/tpl-1').send({ complianceScore: 88, complianceStandard: 'ISO 15189:2022 & CLSI', lastAuditedAt: '2026-09-15T00:00:00.000Z' });
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][1][0]).toBeNull(); // nombre no se tocó
  });

  it('responde 404 si la plantilla no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/plantillas/tpl-inexistente').send({ complianceScore: 50 });
    expect(res.status).toBe(404);
  });

  it('rechaza con 403 a un rol sin validacion_redaccion', async () => {
    currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/plantillas/tpl-1').send({ complianceScore: 50 });
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });
});
