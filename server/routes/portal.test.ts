import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * E10 (ACS, Fase 2) — pruebas unitarias sobre el módulo crítico "Portal del
 * paciente" (server/routes/portal.ts). Automatiza CP-12 a CP-17 del E3
 * (análisis de valores límite) y CP-42 (partición de equivalencia).
 *
 * Doble de prueba usado (justificación): se sustituye `pool.query` de `../db`
 * por una función controlada, para no depender de una base de datos real —
 * la lógica bajo prueba (vigencia del código, límite de intentos, filtrado
 * de resultados no publicados) no depende de qué motor de base de datos hay
 * detrás, solo de las filas que devuelve. server/token.ts NO se mockea:
 * corre con su implementación real de HMAC.
 */

const queryMock = vi.fn();
vi.mock('../db', () => ({ pool: { query: (...args: any[]) => queryMock(...args) } }));

process.env.PORTAL_TOKEN_SECRET = 'secreto-de-pruebas-portal';

async function buildApp() {
  const { portalRouter } = await import('./portal');
  const app = express();
  app.use(express.json());
  app.use('/api/portal', portalRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
});

describe('POST /api/portal/login', () => {
  it('acepta un código vigente y devuelve un token (clase válida)', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id_paciente: 1, id_orden: 10, estado_codigo: 'Vigente', fecha_vigencia: new Date(Date.now() + 86400000) }],
    });
    const app = await buildApp();
    const res = await request(app).post('/api/portal/login').send({ codigo: 'ABC123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rechaza un código inexistente con 401 genérico (no revela si existe)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).post('/api/portal/login').send({ codigo: 'NOEXISTE' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/incorrecto o no encontrado/i);
  });

  it('valor límite: rechaza un código con fecha_vigencia recién vencida (1 segundo en el pasado)', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id_paciente: 1, id_orden: 10, estado_codigo: 'Vigente', fecha_vigencia: new Date(Date.now() - 1000) }],
    });
    const app = await buildApp();
    const res = await request(app).post('/api/portal/login').send({ codigo: 'VENCIDO' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expiró/i);
  });

  it('rechaza un código en estado distinto de "Vigente" aunque la fecha no haya pasado', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id_paciente: 1, id_orden: 10, estado_codigo: 'Usado', fecha_vigencia: new Date(Date.now() + 86400000) }],
    });
    const app = await buildApp();
    const res = await request(app).post('/api/portal/login').send({ codigo: 'USADO' });
    expect(res.status).toBe(401);
  });

  it('rechaza con 400 si no se envía el campo codigo', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/portal/login').send({});
    expect(res.status).toBe(400);
  });

  it('valores límite (RF-14): permite el intento 20 y bloquea el 21 desde la misma IP en la ventana', async () => {
    queryMock.mockResolvedValue({ rows: [] }); // todos los intentos usan un código inexistente
    const app = await buildApp();

    let lastStatus = 0;
    for (let i = 1; i <= 21; i++) {
      const res = await request(app).post('/api/portal/login').send({ codigo: 'X' });
      lastStatus = res.status;
      if (i === 20) expect(res.status).toBe(401); // permitido, solo falla por código inexistente
    }
    expect(lastStatus).toBe(429); // el intento 21 se bloquea por límite de tasa
  });
});

describe('GET /api/portal/orden', () => {
  it('rechaza sin token con 401', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/portal/orden');
    expect(res.status).toBe(401);
  });

  it('nunca expone un resultado que no está Publicado: la fila se filtra por completo (CP-42)', async () => {
    const { signPortalToken } = await import('../token');
    const token = signPortalToken({ idPaciente: 1, idOrden: 10 });
    queryMock.mockResolvedValueOnce({
      rows: [{
        id_orden: 10, numero_orden: 'ORD-0010', estado: 'En proceso', fecha_registro: new Date(),
        nombre_examen: 'Glucosa', estado_resultado: 'Borrador', valor_capturado: '150',
        esta_fuera_de_rango: true, interpretacion_clinica: 'Fuera de rango', fecha_publicacion: null,
      }],
    });
    const app = await buildApp();
    const res = await request(app).get('/api/portal/orden').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    // portal.ts filtra (no solo oculta) las filas con estado_resultado distinto
    // de "Publicado" y distinto de null: un Borrador nunca llega al paciente.
    expect(res.body.resultados).toHaveLength(0);
  });

  it('expone el valor de un resultado que sí está Publicado', async () => {
    const { signPortalToken } = await import('../token');
    const token = signPortalToken({ idPaciente: 1, idOrden: 10 });
    queryMock.mockResolvedValueOnce({
      rows: [{
        id_orden: 10, numero_orden: 'ORD-0010', estado: 'Completada', fecha_registro: new Date(),
        nombre_examen: 'Glucosa', estado_resultado: 'Publicado', valor_capturado: '95',
        esta_fuera_de_rango: false, interpretacion_clinica: 'Normal', fecha_publicacion: new Date(),
      }],
    });
    const app = await buildApp();
    const res = await request(app).get('/api/portal/orden').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.resultados[0].valor).toBe('95');
  });
});
