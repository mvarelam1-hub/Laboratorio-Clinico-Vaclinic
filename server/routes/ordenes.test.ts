import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * E10 (ACS, Fase 2) — pruebas unitarias sobre el módulo crítico "Creación de
 * órdenes" (server/routes/ordenes.ts). Automatiza CP-05, CP-06 y CP-07 del
 * E3 (partición de equivalencia) y agrega verificación real de ROLLBACK/COMMIT.
 *
 * Dobles de prueba usados (justificación): se sustituye `pool` de `../db`
 * (PostgreSQL real) por un cliente falso en memoria, y `requireStaffAuth` de
 * `../auth-staff` (que llamaría a la base de datos) por
 * un middleware que inyecta directamente el usuario de prueba. Esto aísla la
 * lógica de negocio del router de dos dependencias externas reales (red y
 * base de datos), que es exactamente lo que debe hacer una prueba UNITARIA
 * (a diferencia de una prueba de integración, que sí las ejercitaría).
 */

let currentStaffUser: any = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };

vi.mock('../auth-staff', () => ({
  requireStaffAuth: (req: any, _res: any, next: any) => {
    req.staffUser = currentStaffUser;
    next();
  },
}));

const queryMock = vi.fn();
let lastClient: { query: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> } | null = null;

vi.mock('../db', () => ({
  pool: {
    connect: vi.fn(async () => {
      lastClient = { query: vi.fn(), release: vi.fn() };
      return lastClient;
    }),
    query: (...args: any[]) => queryMock(...args),
  },
  withAuditContext: vi.fn(),
}));

// EXAM_PRICES: id_examen -> precio, simulando el catálogo real.
const EXAM_PRICES: Record<number, number> = { 1: 45.0, 2: 120.5 };
// EXAM_CODES: id_examen -> codigo_examen, simulando el catálogo real (ver
// migración 0010_catalogo_examenes_real.sql).
const EXAM_CODES: Record<number, string> = { 1: 'GLU-001', 2: 'PAN-01' };
let detalleAutoId = 900;

function programClient(client: { query: ReturnType<typeof vi.fn> }) {
  client.query.mockImplementation(async (sql: string, params: any[] = []) => {
    if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) return {};
    if (sql.includes('INSERT INTO orden')) return { rows: [{ id_orden: 100, numero_orden: params[0] }] };
    if (sql.includes('FROM examen')) {
      const idExamen = params[0];
      return idExamen in EXAM_PRICES
        ? { rows: [{ precio: EXAM_PRICES[idExamen], codigo_examen: EXAM_CODES[idExamen] ?? null }] }
        : { rows: [] };
    }
    if (sql.includes('INSERT INTO detalle_orden')) return { rows: [{ id_detalle: detalleAutoId++ }] };
    if (sql.includes('fn_generar_codigo_consulta')) return { rows: [{ codigo: 'ABCD1234' }] };
    return { rows: [] };
  });
}

async function buildApp() {
  const { ordenesRouter } = await import('./ordenes');
  const app = express();
  app.use(express.json());
  app.use('/api/ordenes', ordenesRouter);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: err.message }));
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
});

describe('POST /api/ordenes (partición de equivalencia)', () => {
  it('crea la orden y su detalle cuando todos los exámenes existen en el catálogo (clase válida)', async () => {
    const app = await buildApp();
    // El cliente se crea dentro del handler; programamos su comportamiento
    // interceptando pool.connect a través de una promesa ya resuelta arriba,
    // así que reprogramamos el mock justo antes de la petición.
    const dbModule: any = await import('../db');
    dbModule.pool.connect.mockImplementation(async () => {
      lastClient = { query: vi.fn(), release: vi.fn() };
      programClient(lastClient);
      return lastClient;
    });

    const res = await request(app)
      .post('/api/ordenes')
      .send({ idPaciente: 1, examenesIds: [1, 2] });

    expect(res.status).toBe(201);
    expect(res.body.id_orden).toBe(100);
    // La orden debe salir con su código único de consulta ya generado
    // (fn_generar_codigo_consulta, migración 0004) — antes de este cambio
    // esta función nunca se llamaba desde la ruta y la orden quedaba sin
    // forma de que el paciente la consultara en el Portal.
    expect(res.body.codigo_consulta).toBe('ABCD1234');
    // El detalle real (un elemento por examen, con su id_detalle y
    // codigo_examen del catálogo) debe volver en la respuesta — el frontend
    // lo necesita para enlazar después cada resultado capturado con su
    // detalle_orden exacto (ver src/types.ts `LabOrder.detalleRemoto`).
    expect(res.body.detalle).toHaveLength(2);
    expect(res.body.detalle[0]).toMatchObject({ idExamen: 1, codigoExamen: 'GLU-001' });
    expect(res.body.detalle[1]).toMatchObject({ idExamen: 2, codigoExamen: 'PAN-01' });
    expect(typeof res.body.detalle[0].idDetalle).toBe('number');
    const calledSql = lastClient!.query.mock.calls.map((c) => c[0]);
    expect(calledSql).toContain('COMMIT');
    expect(calledSql).not.toContain('ROLLBACK');
    expect(calledSql.some((sql: string) => sql.includes('fn_generar_codigo_consulta'))).toBe(true);
  });

  it('rechaza con 400 cuando examenesIds está vacío (clase inválida)', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/ordenes').send({ idPaciente: 1, examenesIds: [] });
    expect(res.status).toBe(400);
  });

  it('rechaza con 400 cuando falta idPaciente (clase inválida)', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/ordenes').send({ examenesIds: [1] });
    expect(res.status).toBe(400);
  });

  it('revierte (ROLLBACK) toda la transacción si un examen no existe en el catálogo (CP-07)', async () => {
    const app = await buildApp();
    const dbModule: any = await import('../db');
    dbModule.pool.connect.mockImplementation(async () => {
      lastClient = { query: vi.fn(), release: vi.fn() };
      programClient(lastClient);
      return lastClient;
    });

    const res = await request(app)
      .post('/api/ordenes')
      .send({ idPaciente: 1, examenesIds: [1, 999999] });

    expect(res.status).toBe(400);
    const calledSql = lastClient!.query.mock.calls.map((c) => c[0]);
    expect(calledSql).toContain('ROLLBACK');
    expect(calledSql).not.toContain('COMMIT');
  });

  it('rechaza con 403 si el rol autenticado no tiene el permiso admision_crear_ordenes', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    const app = await buildApp();
    const res = await request(app).post('/api/ordenes').send({ idPaciente: 1, examenesIds: [1] });
    expect(res.status).toBe(403);
  });
});

describe('POST /api/ordenes — metadata de pago/prioridad/biometría (migración 0016)', () => {
  it('calcula total_cobrado como la suma de los precios de los exámenes y guarda la metadata recibida', async () => {
    const app = await buildApp();
    const dbModule: any = await import('../db');
    dbModule.pool.connect.mockImplementation(async () => {
      lastClient = { query: vi.fn(), release: vi.fn() };
      programClient(lastClient);
      return lastClient;
    });

    const res = await request(app).post('/api/ordenes').send({
      idPaciente: 1,
      examenesIds: [1, 2], // precios 45.0 + 120.5 = 165.5
      prioridad: 'urgente',
      metodoPago: 'tarjeta',
      sedeCama: 'Hab. 204',
      esAltoRiesgo: true,
      biometriaAutorizada: true,
      datosBiometricos: { method: 'fingerprint', authorizedBy: 'Dra. Pérez', staffRole: 'bioanalista_senior', timestamp: '2026-01-01T10:00:00Z' }
    });

    expect(res.status).toBe(201);
    const insertCall = lastClient!.query.mock.calls.find((c: any) => String(c[0]).includes('INSERT INTO orden'));
    expect(insertCall).toBeDefined();
    const [, params] = insertCall;
    // numeroOrden, idPaciente, idRecepcionista, totalCobrado, prioridad, metodoPago, saldoPendiente, promoAplicada, sedeCama, esAltoRiesgo, biometriaAutorizada, datosBiometricos
    expect(params[3]).toBe(165.5); // total_cobrado
    expect(params[4]).toBe('urgente'); // prioridad
    expect(params[5]).toBe('tarjeta'); // metodo_pago
    expect(params[8]).toBe('Hab. 204'); // sede_cama
    expect(params[9]).toBe(true); // es_alto_riesgo
    expect(params[10]).toBe(true); // biometria_autorizada
    expect(JSON.parse(params[11]).method).toBe('fingerprint');
  });

  it('usa prioridad "rutina" por defecto cuando no se envía', async () => {
    const app = await buildApp();
    const dbModule: any = await import('../db');
    dbModule.pool.connect.mockImplementation(async () => {
      lastClient = { query: vi.fn(), release: vi.fn() };
      programClient(lastClient);
      return lastClient;
    });
    const res = await request(app).post('/api/ordenes').send({ idPaciente: 1, examenesIds: [1] });
    expect(res.status).toBe(201);
    const insertCall = lastClient!.query.mock.calls.find((c: any) => String(c[0]).includes('INSERT INTO orden'));
    expect(insertCall[1][4]).toBe('rutina');
  });

  it('fija saldo_pendiente = total_cobrado cuando metodoPago es "por_cobrar"', async () => {
    const app = await buildApp();
    const dbModule: any = await import('../db');
    dbModule.pool.connect.mockImplementation(async () => {
      lastClient = { query: vi.fn(), release: vi.fn() };
      programClient(lastClient);
      return lastClient;
    });
    const res = await request(app).post('/api/ordenes').send({ idPaciente: 1, examenesIds: [1], metodoPago: 'por_cobrar' });
    expect(res.status).toBe(201);
    const insertCall = lastClient!.query.mock.calls.find((c: any) => String(c[0]).includes('INSERT INTO orden'));
    const params = insertCall[1];
    expect(params[3]).toBe(45.0); // total_cobrado
    expect(params[6]).toBe(45.0); // saldo_pendiente = total_cobrado
  });

  it('rechaza con 400 una prioridad fuera del enum permitido', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/ordenes').send({ idPaciente: 1, examenesIds: [1], prioridad: 'inventada' });
    expect(res.status).toBe(400);
  });

  it('rechaza con 400 un metodoPago fuera del enum permitido', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/ordenes').send({ idPaciente: 1, examenesIds: [1], metodoPago: 'bitcoin' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/ordenes (listado) y GET /api/ordenes/:id (detalle)', () => {
  it('lista órdenes recientes con el nombre del paciente ya resuelto (JOIN)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_orden: 1, numero_orden: 'ORD-1', paciente_nombre: 'María López' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/ordenes');
    expect(res.status).toBe(200);
    expect(res.body[0].paciente_nombre).toBe('María López');
  });

  it('GET /:id devuelve 404 si la orden no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).get('/api/ordenes/999');
    expect(res.status).toBe(404);
  });

  it('GET /:id devuelve la orden con su detalle (exámenes + resultado si existe)', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_orden: 1, numero_orden: 'ORD-1', paciente_nombre: 'María López' }] })
      .mockResolvedValueOnce({ rows: [{ id_detalle: 10, nombre_examen: 'Glucosa', estado_resultado: null }] });
    const app = await buildApp();
    const res = await request(app).get('/api/ordenes/1');
    expect(res.status).toBe(200);
    expect(res.body.detalle).toHaveLength(1);
    expect(res.body.detalle[0].nombre_examen).toBe('Glucosa');
  });

  it('"pendientes-validacion" y "resultados-criticos" no son interceptadas por la ruta genérica /:id', async () => {
    // Esta prueba existe porque invertir el orden de registro de rutas en
    // Express haría que "/:id" capturara "pendientes-validacion" como un id
    // literal — ver el comentario en ordenes.ts.
    currentStaffUser = { idUsuario: 3, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    queryMock.mockResolvedValueOnce({ rows: [{ id_orden: 5 }] });
    const app = await buildApp();
    const res = await request(app).get('/api/ordenes/pendientes-validacion');
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).toMatch(/vw_ordenes_pendientes_validacion/);
  });
});

describe('Ciclo de vida de la orden: archivar / restaurar / eliminar (migración 0013)', () => {
  it('PATCH /:id/archivar marca archivada=true y devuelve 404 si la orden no existe o ya fue eliminada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_orden: 1, archivada: true, fecha_archivo: '2026-01-01', id_usuario_archivo: 1 }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/ordenes/1/archivar');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id_orden: 1, archivada: true });
    expect(queryMock.mock.calls[0][0]).toMatch(/UPDATE orden/);
    expect(queryMock.mock.calls[0][0]).toMatch(/archivada = TRUE/);
    expect(queryMock.mock.calls[0][1]).toEqual([1, 1]);

    queryMock.mockResolvedValueOnce({ rows: [] });
    const res404 = await request(app).patch('/api/ordenes/999/archivar');
    expect(res404.status).toBe(404);
  });

  it('PATCH /:id/restaurar limpia archivada/fecha_archivo/id_usuario_archivo', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_orden: 1, archivada: false }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/ordenes/1/restaurar');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id_orden: 1, archivada: false });
    expect(queryMock.mock.calls[0][0]).toMatch(/archivada = FALSE/);
  });

  it('DELETE /:id elimina lógicamente (nunca borra la fila) y guarda el motivo recibido', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id_orden: 1, eliminada: true, fecha_eliminacion: '2026-01-01' }]
    });
    const app = await buildApp();
    const res = await request(app).delete('/api/ordenes/1').send({ motivo: 'Duplicada por error de captura' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, id_orden: 1, eliminada: true });
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/UPDATE orden/);
    expect(sql).not.toMatch(/DELETE FROM orden/);
    expect(sql).toMatch(/eliminada = TRUE/);
    expect(params).toEqual([1, 'Duplicada por error de captura', 1]);
  });

  it('DELETE /:id devuelve 404 si la orden no existe o ya estaba eliminada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).delete('/api/ordenes/999');
    expect(res.status).toBe(404);
  });

  it('las rutas de archivar/restaurar/eliminar rechazan con 403 a un rol sin admision_crear_ordenes', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/ordenes/1/archivar');
    expect(res.status).toBe(403);
  });

  it('PATCH /archivar-varias, /restaurar-varias y /eliminar-varias validan idsOrdenes y aplican el UPDATE masivo', async () => {
    const app = await buildApp();

    const res400 = await request(app).patch('/api/ordenes/archivar-varias').send({ idsOrdenes: [] });
    expect(res400.status).toBe(400);

    queryMock.mockResolvedValueOnce({ rowCount: 2 });
    const resArchivar = await request(app).patch('/api/ordenes/archivar-varias').send({ idsOrdenes: [1, 2] });
    expect(resArchivar.status).toBe(200);
    expect(resArchivar.body).toEqual({ ok: true, actualizadas: 2 });
    expect(queryMock.mock.calls[0][1]).toEqual([1, [1, 2]]);

    queryMock.mockResolvedValueOnce({ rowCount: 2 });
    const resRestaurar = await request(app).patch('/api/ordenes/restaurar-varias').send({ idsOrdenes: [1, 2] });
    expect(resRestaurar.status).toBe(200);
    expect(resRestaurar.body).toEqual({ ok: true, actualizadas: 2 });

    queryMock.mockResolvedValueOnce({ rowCount: 2 });
    const resEliminar = await request(app)
      .patch('/api/ordenes/eliminar-varias')
      .send({ idsOrdenes: [1, 2], motivo: 'Limpieza masiva de prueba' });
    expect(resEliminar.status).toBe(200);
    expect(resEliminar.body).toEqual({ ok: true, actualizadas: 2 });
    const [sqlEliminar, paramsEliminar] = queryMock.mock.calls[2];
    expect(sqlEliminar).toMatch(/eliminada = TRUE/);
    expect(paramsEliminar).toEqual([1, 'Limpieza masiva de prueba', [1, 2]]);
  });
});

describe('PATCH /api/ordenes/:id — edición general (migración 0016)', () => {
  it('actualiza status, prioridad, metodoPago y datosBiometricos en una sola llamada', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id_orden: 1, numero_orden: 'ORD-1', estado_flujo: 'Listo', prioridad: 'stat_panico',
        metodo_pago: 'efectivo', saldo_pendiente: 0, promo_aplicada: null, sede_cama: null,
        sede: 'Sede Central', es_alto_riesgo: true, biometria_autorizada: true,
        datos_biometricos: { method: 'facial', authorizedBy: 'Dr. Gómez' }
      }]
    });
    const app = await buildApp();
    const res = await request(app).patch('/api/ordenes/1').send({
      status: 'Listo',
      prioridad: 'stat_panico',
      esAltoRiesgo: true,
      biometriaAutorizada: true,
      datosBiometricos: { method: 'facial', authorizedBy: 'Dr. Gómez' }
    });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ estado_flujo: 'Listo', prioridad: 'stat_panico' });
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/UPDATE orden SET/);
    expect(sql).toMatch(/estado_flujo = \$1/);
    expect(sql).toMatch(/datos_biometricos = \$\d+::jsonb/);
    expect(sql).toMatch(/eliminada = FALSE/);
    expect(JSON.parse(params[params.length - 2]).method).toBe('facial');
  });

  it('rechaza con 400 un status fuera del enum (Pendiente/En Proceso/Listo/Entregado)', async () => {
    const app = await buildApp();
    const res = await request(app).patch('/api/ordenes/1').send({ status: 'Cancelada' });
    expect(res.status).toBe(400);
  });

  it('rechaza con 400 cuando no se envía ningún campo', async () => {
    const app = await buildApp();
    const res = await request(app).patch('/api/ordenes/1').send({});
    expect(res.status).toBe(400);
  });

  it('devuelve 404 si la orden no existe o ya fue eliminada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/ordenes/999').send({ status: 'En Proceso' });
    expect(res.status).toBe(404);
  });

  it('rechaza con 403 a un rol sin admision_crear_ordenes', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/ordenes/1').send({ status: 'En Proceso' });
    expect(res.status).toBe(403);
  });

  it('no intercepta /archivar-varias, /restaurar-varias ni /eliminar-varias (orden de registro de rutas)', async () => {
    // Esta prueba existe porque PATCH /:id se registró DELIBERADAMENTE al
    // final del router — de haberse registrado antes, estas tres rutas de
    // segmento fijo habrían caído en /:id tratando su path como un id
    // literal. Reutiliza el mismo escenario que ya cubre el bloque de
    // ciclo de vida (archivar/restaurar/eliminar-varias) para confirmarlo
    // también desde el lado de /:id.
    const app = await buildApp();
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const res = await request(app).patch('/api/ordenes/archivar-varias').send({ idsOrdenes: [1] });
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).toMatch(/archivada = TRUE/);
  });
});

describe('GET /api/ordenes/pendientes-validacion y /resultados-criticos', () => {
  it('devuelve las filas de vw_ordenes_pendientes_validacion para un rol autorizado', async () => {
    currentStaffUser = { idUsuario: 3, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    queryMock.mockResolvedValueOnce({ rows: [{ id_orden: 5, numero_orden: 'ORD-0005' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/ordenes/pendientes-validacion');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id_orden: 5, numero_orden: 'ORD-0005' }]);
  });

  it('rechaza con 403 la consulta de resultados críticos a un rol sin el permiso analizadores_panico', async () => {
    currentStaffUser = { idUsuario: 4, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
    const app = await buildApp();
    const res = await request(app).get('/api/ordenes/resultados-criticos');
    expect(res.status).toBe(403);
  });
});
