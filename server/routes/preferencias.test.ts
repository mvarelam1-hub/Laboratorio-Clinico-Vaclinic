import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre "Preferencias de notificación por paciente"
 * (server/routes/preferencias.ts) — noveno y último de los 9 módulos
 * migrados desde localStorage. Mismo patrón que portal.test.ts: se
 * mockea `../db` pero NO `../token` -corre con su HMAC real-, así que el
 * token de portal usado en cada prueba es genuino.
 */

const queryMock = vi.fn();
vi.mock('../db', () => ({ pool: { query: (...args: any[]) => queryMock(...args) } }));

process.env.PORTAL_TOKEN_SECRET = 'secreto-de-pruebas-preferencias';

async function buildApp() {
  const { preferenciasRouter } = await import('./preferencias');
  const app = express();
  app.use(express.json());
  app.use('/api/preferencias', preferenciasRouter);
  return app;
}

async function tokenValido(idPaciente = 1) {
  const { signPortalToken } = await import('../token');
  return signPortalToken({ idPaciente, idOrden: 10 });
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
});

describe('GET /api/preferencias', () => {
  it('rechaza sin token con 401', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/preferencias');
    expect(res.status).toBe(401);
  });

  it('devuelve los valores por defecto (sin crear fila) si el paciente nunca las personalizó', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const token = await tokenValido();
    const app = await buildApp();
    const res = await request(app).get('/api/preferencias').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id_paciente: 1, push_web_habilitado: true, push_firebase_habilitado: false,
      alertas_whatsapp: true, alertas_correo: false, solo_alertas_criticas: false, consejos_salud_habilitado: true
    });
    // GET no debe insertar nada: solo una consulta SELECT.
    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(queryMock.mock.calls[0][0]).toContain('SELECT');
  });

  it('devuelve la fila real si el paciente ya las personalizó', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 1, push_web_habilitado: false, alertas_correo: true }] });
    const token = await tokenValido();
    const app = await buildApp();
    const res = await request(app).get('/api/preferencias').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.push_web_habilitado).toBe(false);
    expect(res.body.alertas_correo).toBe(true);
  });

  it('un token válido para OTRO paciente no puede leer las preferencias de este', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const token = await tokenValido(2);
    const app = await buildApp();
    await request(app).get('/api/preferencias').set('Authorization', `Bearer ${token}`);
    expect(queryMock.mock.calls[0][1]).toEqual([2]);
  });
});

describe('PUT /api/preferencias', () => {
  it('responde 401 sin token', async () => {
    const app = await buildApp();
    const res = await request(app).put('/api/preferencias').send({});
    expect(res.status).toBe(401);
  });

  it('hace upsert real: inserta con defaults para los campos no enviados', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 1, push_web_habilitado: false, alertas_whatsapp: true }] });
    const token = await tokenValido();
    const app = await buildApp();
    const res = await request(app).put('/api/preferencias').set('Authorization', `Bearer ${token}`).send({ webPushEnabled: false });
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).toContain('ON CONFLICT (id_paciente) DO UPDATE');
    expect(queryMock.mock.calls[0][1]).toEqual([1, false, undefined, undefined, undefined, undefined, undefined]);
    expect(res.body.push_web_habilitado).toBe(false);
  });

  it('conserva (vía COALESCE) los campos que no se envían en un PUT parcial', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 1, alertas_correo: true, solo_alertas_criticas: true }] });
    const token = await tokenValido();
    const app = await buildApp();
    const res = await request(app).put('/api/preferencias').set('Authorization', `Bearer ${token}`).send({ emailAlerts: true, criticalAlertsOnly: true });
    expect(res.status).toBe(200);
    const params = queryMock.mock.calls[0][1];
    expect(params).toEqual([1, undefined, undefined, undefined, true, true, undefined]);
  });

  it('usa el id_paciente real del token, nunca uno que venga en el cuerpo', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 1 }] });
    const token = await tokenValido(1);
    const app = await buildApp();
    await request(app).put('/api/preferencias').set('Authorization', `Bearer ${token}`).send({ webPushEnabled: true, idPaciente: 999 });
    expect(queryMock.mock.calls[0][1][0]).toBe(1);
  });
});
