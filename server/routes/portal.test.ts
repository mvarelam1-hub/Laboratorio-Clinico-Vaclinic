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

describe('GET /api/portal/informes', () => {
  it('rechaza sin token de portal (401)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/portal/informes');
    expect(res.status).toBe(401);
  });

  it('solo consulta informes publicados de la orden del token y no expone la explicación IA', async () => {
    const { signPortalToken } = await import('../token');
    const token = signPortalToken({ idPaciente: 1, idOrden: 10 });
    queryMock
      .mockResolvedValueOnce({ rows: [{ numero_orden: 'ORD-10', nombre_completo: 'Paciente Real' }] })
      .mockResolvedValueOnce({
        rows: [{
          id_informe: 5, numero_informe: 'INF-5', titulo: 'Hemograma', categoria: 'hematologia', estado: 'publicado',
          fecha_muestra: null, fecha_publicacion: null, conclusiones_medico: 'Conclusión firmada', recomendaciones: ['Control en 6 meses'],
          publicado_por_nombre: 'Profesional', codigo_verificacion: 'ABCD',
          datos_json: {
            explicacion_ia: 'NO DEBE SALIR',
            parameters: [{ name: 'Hemoglobina', value: 13, unit: 'g/dL', referenceRange: '12 - 16', status: 'normal' }]
          }
        }]
      })
      .mockResolvedValueOnce({ rows: [{ estado: 'publicado', fecha_creacion: '2026-10-02T12:00:00Z', fecha_publicacion: '2026-10-02T15:00:00Z' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/portal/informes').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.informes).toHaveLength(1);
    expect(res.body.informes[0].parametros[0]).toMatchObject({ nombre: 'Hemoglobina', valor: 13, estado: 'normal' });
    expect(JSON.stringify(res.body)).not.toContain('NO DEBE SALIR');
    expect(res.body.seguimiento.pasos.map((p: any) => p.clave)).toEqual(['registrado', 'solicitud', 'muestra', 'ingresados', 'validados', 'disponibles']);
    expect(res.body.seguimiento.pasos.every((p: any) => p.completado)).toBe(true);
    const sqlInformes = String(queryMock.mock.calls[1][0]);
    expect(sqlInformes).toMatch(/estado IN \('publicado', 'entregado'\)/);
    expect(queryMock.mock.calls[1][1]).toEqual([10]);
  });

  it('respeta que el laboratorio haya excluido la conclusión del informe', async () => {
    const { signPortalToken } = await import('../token');
    const token = signPortalToken({ idPaciente: 1, idOrden: 10 });
    queryMock
      .mockResolvedValueOnce({ rows: [{ numero_orden: 'ORD-10', nombre_completo: 'Paciente Real' }] })
      .mockResolvedValueOnce({
        rows: [{ id_informe: 5, numero_informe: 'INF-5', titulo: 'X', conclusiones_medico: 'Reservada', recomendaciones: ['r'], datos_json: { includeConclusionsInReport: false, includeRecommendationsInReport: false } }]
      })
      .mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).get('/api/portal/informes').set('Authorization', `Bearer ${token}`);
    expect(res.body.informes[0].conclusion).toBeNull();
    expect(res.body.informes[0].recomendaciones).toEqual([]);
  });
});

describe('GET /api/portal/informes: interpretación con IA', () => {
  async function pedir(fila: any) {
    const { signPortalToken } = await import('../token');
    const token = signPortalToken({ idPaciente: 1, idOrden: 10 });
    queryMock
      .mockResolvedValueOnce({ rows: [{ numero_orden: 'ORD-10', nombre_completo: 'Paciente Real' }] })
      .mockResolvedValueOnce({ rows: [{ id_informe: 5, numero_informe: 'INF-5', titulo: 'X', recomendaciones: [], ...fila }] })
      .mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    return request(app).get('/api/portal/informes').set('Authorization', `Bearer ${token}`);
  }

  it('muestra la interpretación cuando el personal la incluyó en el informe', async () => {
    const res = await pedir({ explicacion_paciente: ' Mide el colesterol. ', datos_json: { includeAiExplanationInReport: true } });
    expect(res.body.informes[0].interpretacion).toBe('Mide el colesterol.');
  });

  it('no la muestra si no se marcó «incluir en el informe»', async () => {
    const res = await pedir({ explicacion_paciente: 'Texto', datos_json: { includeAiExplanationInReport: false } });
    expect(res.body.informes[0].interpretacion).toBeNull();
    const res2 = await pedir({ explicacion_paciente: 'Texto', datos_json: {} });
    expect(res2.body.informes[0].interpretacion).toBeNull();
  });

  it('no la muestra si está vacía', async () => {
    const res = await pedir({ explicacion_paciente: '   ', datos_json: { includeAiExplanationInReport: true } });
    expect(res.body.informes[0].interpretacion).toBeNull();
  });
});

describe('GET /api/portal/informes/:id/pdf', () => {
  it('rechaza sin token (401)', async () => {
    const app = await buildApp();
    const res = await request(app).get('/api/portal/informes/5/pdf');
    expect(res.status).toBe(401);
  });

  it('un informe de otra orden responde 404 (no revela que existe)', async () => {
    const { signPortalToken } = await import('../token');
    const token = signPortalToken({ idPaciente: 1, idOrden: 10 });
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 5, id_orden: 99, estado: 'publicado', eliminado: false }] });
    const app = await buildApp();
    const res = await request(app).get('/api/portal/informes/5/pdf').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('un borrador de su propia orden tampoco se entrega (404)', async () => {
    const { signPortalToken } = await import('../token');
    const token = signPortalToken({ idPaciente: 1, idOrden: 10 });
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 5, id_orden: 10, estado: 'borrador', eliminado: false }] });
    const app = await buildApp();
    const res = await request(app).get('/api/portal/informes/5/pdf').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
