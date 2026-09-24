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
 * `../auth-firebase` (que llamaría a Firebase Admin y a la base de datos) por
 * un middleware que inyecta directamente el usuario de prueba. Esto aísla la
 * lógica de negocio del router de dos dependencias externas reales (red y
 * base de datos), que es exactamente lo que debe hacer una prueba UNITARIA
 * (a diferencia de una prueba de integración, que sí las ejercitaría).
 */

let currentStaffUser: any = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };

vi.mock('../auth-firebase', () => ({
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
