import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * E10 (ACS, Fase 2) — pruebas unitarias sobre el módulo crítico "Ciclo de
 * vida de resultados" (server/routes/resultados.ts). Automatiza la tabla de
 * decisión y la transición de estados diseñadas en el E3 (CP-08 a CP-11,
 * CP-22 a CP-36).
 *
 * Dobles de prueba usados (justificación): se sustituyen `pool` y
 * `withAuditContext` de `../db` (que abrirían una transacción real de
 * PostgreSQL) por versiones controladas, y `requireStaffAuth` de
 * `../auth-firebase` (que llamaría a Firebase Admin) por inyección directa
 * del usuario de prueba — así se prueba la lógica de negocio del router de
 * forma aislada, sin una base de datos real.
 */

let currentStaffUser: any = { idUsuario: 1, roleId: 'bioanalista_senior', status: 'activo', nombreCompleto: 'Bioanalista Senior Demo' };

vi.mock('../auth-firebase', () => ({
  requireStaffAuth: (req: any, _res: any, next: any) => {
    req.staffUser = currentStaffUser;
    next();
  },
}));

let estadoActual: string = 'Validado';
const selectQueryMock = vi.fn(async (..._args: any[]): Promise<any> => ({
  rows: [{ estado: estadoActual, valor_capturado: '100' }],
}));
const auditQueryMock = vi.fn(async (..._args: any[]): Promise<any> => ({ rows: [] }));

vi.mock('../db', () => ({
  pool: { query: (...args: any[]) => selectQueryMock(...args) },
  withAuditContext: vi.fn(async (_params: any, fn: any) => fn({ query: auditQueryMock })),
}));

async function buildApp() {
  const { resultadosRouter } = await import('./resultados');
  const app = express();
  app.use(express.json());
  app.use('/api/resultados', resultadosRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  selectQueryMock.mockClear();
  auditQueryMock.mockClear();
  estadoActual = 'Validado';
  currentStaffUser = { idUsuario: 1, roleId: 'bioanalista_senior', status: 'activo', nombreCompleto: 'Bioanalista Senior Demo' };
});

describe('POST /api/resultados (captura inicial)', () => {
  it('rechaza con 400 si falta idDetalle o valorCapturado', async () => {
    currentStaffUser.roleId = 'bioanalista'; // tiene analizadores_manual
    const app = await buildApp();
    const res = await request(app).post('/api/resultados').send({ idDetalle: 1 });
    expect(res.status).toBe(400);
  });

  it('rechaza con 403 si el rol no tiene analizadores_manual', async () => {
    currentStaffUser.roleId = 'recepcionista';
    const app = await buildApp();
    const res = await request(app).post('/api/resultados').send({ idDetalle: 1, valorCapturado: '90' });
    expect(res.status).toBe(403);
  });

  it('rechaza con 409 si el detalle_orden ya tiene un resultado capturado', async () => {
    currentStaffUser.roleId = 'bioanalista';
    selectQueryMock.mockResolvedValueOnce({ rows: [{ id_resultado: 1 }] }); // ya existe
    const app = await buildApp();
    const res = await request(app).post('/api/resultados').send({ idDetalle: 1, valorCapturado: '90' });
    expect(res.status).toBe(409);
  });

  it('crea el resultado en Borrador y marca esta_fuera_de_rango cuando el valor excede el rango del paciente', async () => {
    currentStaffUser.roleId = 'bioanalista';
    selectQueryMock
      .mockResolvedValueOnce({ rows: [] }) // no existe resultado previo
      .mockResolvedValueOnce({ rows: [{ id_examen: 7, fecha_nacimiento: '1990-01-01', genero: 'F' }] }) // detalle_orden
      .mockResolvedValueOnce({ rows: [{ valor_minimo: '70', valor_maximo: '100' }] }) // rango_referencia
      .mockResolvedValueOnce({ rows: [{ id_resultado: 55, id_detalle: 1, valor_capturado: '150', estado: 'Borrador', esta_fuera_de_rango: true }] }); // insert
    const app = await buildApp();
    const res = await request(app).post('/api/resultados').send({ idDetalle: 1, valorCapturado: '150' });
    expect(res.status).toBe(201);
    expect(res.body.esta_fuera_de_rango).toBe(true);
  });

  it('devuelve 404 si el detalle_orden no existe', async () => {
    currentStaffUser.roleId = 'bioanalista';
    selectQueryMock
      .mockResolvedValueOnce({ rows: [] }) // no existe resultado previo
      .mockResolvedValueOnce({ rows: [] }); // detalle_orden no encontrado
    const app = await buildApp();
    const res = await request(app).post('/api/resultados').send({ idDetalle: 999, valorCapturado: '90' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/resultados/:id/validar (transición de estados)', () => {
  it('Borrador -> Validado es una transición válida (CP-30)', async () => {
    estadoActual = 'Borrador';
    currentStaffUser.roleId = 'bioanalista_senior'; // tiene validacion_firma_digital ('bioanalista' a secas no)
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/validar');
    expect(res.status).toBe(200);
    expect(res.body.estadoNuevo).toBe('Validado');
  });

  it('rechaza con 403 si el rol no tiene validacion_firma_digital', async () => {
    estadoActual = 'Borrador';
    currentStaffUser.roleId = 'recepcionista';
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/validar');
    expect(res.status).toBe(403);
  });

  it('HALLAZGO (CP-35): "validar" no exige que el estado previo sea Borrador — ' +
     'un resultado ya Publicado puede "revalidarse" a Validado sin pasar por "corregir"', async () => {
    estadoActual = 'Publicado';
    currentStaffUser.roleId = 'bioanalista_senior';
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/validar');
    // Se documenta el comportamiento real del código, no el deseable: hoy
    // responde 200 sin ninguna guarda de estado previo (a diferencia de
    // "publicar" y "corregir", que sí la tienen). Ver E1 CU-04 y E2.
    expect(res.status).toBe(200);
  });

  it('HALLAZGO (CP-36): mismo comportamiento partiendo de "En correccion"', async () => {
    estadoActual = 'En correccion';
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/validar');
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/resultados/:id/publicar (tabla de decisión: permiso x estado)', () => {
  it('R1: permiso=Sí, estado=Validado -> 200 Publicado, con fecha_publicacion', async () => {
    estadoActual = 'Validado';
    currentStaffUser.roleId = 'bioanalista_senior'; // validacion_publicacion
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/publicar');
    expect(res.status).toBe(200);
    expect(res.body.estadoNuevo).toBe('Publicado');
    const sqlCalls = auditQueryMock.mock.calls.map((c) => c[0]);
    expect(sqlCalls.some((sql: string) => sql.includes('fecha_publicacion'))).toBe(true);
  });

  it('R2: permiso=Sí, estado=Borrador -> 409 Conflict (CP-09/CP-23/CP-33)', async () => {
    estadoActual = 'Borrador';
    currentStaffUser.roleId = 'bioanalista_senior';
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/publicar');
    expect(res.status).toBe(409);
  });

  it('R3: permiso=No, estado=Validado -> 403 (el permiso se evalúa antes que el estado)', async () => {
    estadoActual = 'Validado';
    currentStaffUser.roleId = 'recepcionista';
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/publicar');
    expect(res.status).toBe(403);
    // No debió siquiera consultar el estado actual en la base de datos.
    expect(selectQueryMock).not.toHaveBeenCalled();
  });

  it('R4: permiso=No, estado=Borrador -> 403', async () => {
    estadoActual = 'Borrador';
    currentStaffUser.roleId = 'recepcionista';
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/publicar');
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/resultados/:id/corregir (tabla de decisión: permiso x estado, motivo obligatorio)', () => {
  it('R5: permiso=Sí, estado=Publicado, con motivo -> 200 En correccion (CP-10/CP-26/CP-32)', async () => {
    estadoActual = 'Publicado';
    currentStaffUser.roleId = 'bioanalista_senior'; // validacion_firma_digital
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/corregir').send({ motivo: 'Repetición de prueba', nuevoValor: '95' });
    expect(res.status).toBe(200);
    expect(res.body.estadoNuevo).toBe('En correccion');
  });

  it('sin motivo -> 400, no se aplica ningún cambio (CP-11)', async () => {
    estadoActual = 'Publicado';
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/corregir').send({});
    expect(res.status).toBe(400);
    expect(auditQueryMock).not.toHaveBeenCalled();
  });

  it('R6: permiso=Sí, estado=Validado (no Publicado) -> 409 (CP-27/CP-34)', async () => {
    estadoActual = 'Validado';
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/corregir').send({ motivo: 'x' });
    expect(res.status).toBe(409);
  });

  it('R7: permiso=No, estado=Publicado -> 403 (CP-28)', async () => {
    estadoActual = 'Publicado';
    currentStaffUser.roleId = 'recepcionista';
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/corregir').send({ motivo: 'x' });
    expect(res.status).toBe(403);
  });

  it('R8: permiso=No, estado=Validado -> 403 (CP-29)', async () => {
    estadoActual = 'Validado';
    currentStaffUser.roleId = 'recepcionista';
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/corregir').send({ motivo: 'x' });
    expect(res.status).toBe(403);
  });
});

describe('validaciones adicionales', () => {
  it('una acción no reconocida responde 400 con el listado de acciones válidas', async () => {
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/1/volar');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validar, publicar, corregir/);
  });

  it('un id_resultado inexistente responde 404', async () => {
    selectQueryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/resultados/999/validar');
    expect(res.status).toBe(404);
  });

  it('GET /:id/historial exige el permiso admin_bitacora_auditoria (CP-40/CP-41)', async () => {
    selectQueryMock.mockResolvedValueOnce({ rows: [{ version_num: 1, accion: 'actualizacion_resultado' }] });
    currentStaffUser.roleId = 'auditor_calidad';
    const app = await buildApp();
    const res = await request(app).get('/api/resultados/1/historial');
    expect(res.status).toBe(200);
    expect(res.body.versiones).toHaveLength(1);
  });

  it('GET /:id/historial rechaza con 403 a un rol sin ese permiso', async () => {
    currentStaffUser.roleId = 'recepcionista';
    const app = await buildApp();
    const res = await request(app).get('/api/resultados/1/historial');
    expect(res.status).toBe(403);
  });
});
