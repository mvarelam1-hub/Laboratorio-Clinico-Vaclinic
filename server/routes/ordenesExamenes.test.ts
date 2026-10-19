import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas de POST /api/ordenes/:id/examenes: agregar exámenes a una orden ya
 * creada. El número de orden no cambia; si el examen tiene costo hay que dar
 * el número de pago; un examen no se agrega dos veces.
 */

let currentStaffUser: any = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };

vi.mock('../auth-staff', () => ({
  requireStaffAuth: (req: any, _res: any, next: any) => {
    req.staffUser = currentStaffUser;
    next();
  },
}));

let lastClient: { query: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> } | null = null;
vi.mock('../db', () => ({
  pool: {
    connect: vi.fn(async () => {
      lastClient = { query: vi.fn(), release: vi.fn() };
      return lastClient;
    }),
    query: vi.fn(async () => ({ rows: [] })),
  },
  withAuditContext: vi.fn(),
}));
vi.mock('../bitacora', () => ({ registrarBitacora: vi.fn(async () => undefined) }));

const PRECIOS: Record<number, number> = { 1: 45, 2: 120.5, 3: 0 };
let ordenExiste = true;
let yaEnOrden: number[] = [];
let pagoDuplicado = false;

function programar(client: { query: ReturnType<typeof vi.fn> }) {
  client.query.mockImplementation(async (sql: string, params: any[] = []) => {
    if (sql.startsWith('BEGIN') || sql.startsWith('COMMIT') || sql.startsWith('ROLLBACK')) return {};
    if (sql.includes('FROM orden WHERE id_orden')) {
      return ordenExiste ? { rows: [{ id_orden: 7, numero_orden: 'ORD-261019-001' }] } : { rows: [] };
    }
    if (sql.includes('SELECT id_examen FROM detalle_orden')) return { rows: yaEnOrden.map((id) => ({ id_examen: id })) };
    if (sql.includes('FROM examen WHERE')) {
      return params[0] in PRECIOS ? { rows: [{ precio: PRECIOS[params[0]] }] } : { rows: [] };
    }
    if (sql.includes('INSERT INTO detalle_orden')) return { rows: [] };
    if (sql.includes('UPDATE orden')) return { rows: [{ total_cobrado: 200, saldo_pendiente: 0, estado_flujo: 'En Proceso' }] };
    if (sql.includes('INSERT INTO orden_pago')) {
      if (pagoDuplicado) throw Object.assign(new Error('duplicate key'), { code: '23505' });
      return { rows: [] };
    }
    if (sql.includes('FROM detalle_orden d JOIN examen')) {
      return { rows: [{ id_detalle: 11, id_examen: 9, codigo_examen: 'AAA' }, { id_detalle: 12, id_examen: 1, codigo_examen: 'GLU-001' }] };
    }
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

async function enviar(body: any, id = '7') {
  const app = await buildApp();
  const { pool } = await import('../db');
  (pool.connect as any).mockImplementationOnce(async () => {
    lastClient = { query: vi.fn(), release: vi.fn() };
    programar(lastClient);
    return lastClient;
  });
  return request(app).post(`/api/ordenes/${id}/examenes`).send(body);
}

const sqls = () => (lastClient?.query.mock.calls || []).map((c) => String(c[0]));

beforeEach(() => {
  vi.resetModules();
  ordenExiste = true;
  yaEnOrden = [9];
  pagoDuplicado = false;
  currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
});

describe('POST /api/ordenes/:id/examenes', () => {
  it('agrega el examen, suma el monto y guarda el número de pago', async () => {
    const res = await enviar({ examenesIds: [1], numeroPago: 'B-1024' });
    expect(res.status).toBe(201);
    expect(res.body.numero_orden).toBe('ORD-261019-001');
    expect(res.body.monto_agregado).toBe(45);
    expect(res.body.detalle).toHaveLength(2);
    expect(sqls().some((s) => s.includes('INSERT INTO detalle_orden'))).toBe(true);
    const pago = lastClient!.query.mock.calls.find((c) => String(c[0]).includes('INSERT INTO orden_pago'));
    expect(pago?.[1]).toEqual([7, 'B-1024', 45, 1]);
    expect(sqls().some((s) => s.startsWith('COMMIT'))).toBe(true);
  });

  it('exige el número de pago cuando el examen tiene costo', async () => {
    const res = await enviar({ examenesIds: [2] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/número de pago/);
    expect(sqls().some((s) => s.includes('INSERT INTO detalle_orden'))).toBe(false);
    expect(sqls().some((s) => s.startsWith('ROLLBACK'))).toBe(true);
  });

  it('no pide número de pago si el examen no tiene costo', async () => {
    const res = await enviar({ examenesIds: [3] });
    expect(res.status).toBe(201);
    expect(sqls().some((s) => s.includes('INSERT INTO orden_pago'))).toBe(false);
  });

  it('rechaza un examen que la orden ya tiene', async () => {
    const res = await enviar({ examenesIds: [9], numeroPago: 'B-1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/ya incluye/);
  });

  it('rechaza un examen que no existe en el catálogo', async () => {
    const res = await enviar({ examenesIds: [99], numeroPago: 'B-1' });
    expect(res.status).toBe(400);
  });

  it('rechaza un número de pago con caracteres raros', async () => {
    const res = await enviar({ examenesIds: [1], numeroPago: "x'; DROP TABLE orden;--" });
    expect(res.status).toBe(400);
  });

  it('rechaza una lista de exámenes vacía o inválida', async () => {
    expect((await enviar({ examenesIds: [] })).status).toBe(400);
    expect((await enviar({ examenesIds: ['a'] })).status).toBe(400);
  });

  it('devuelve 404 si la orden no existe o fue eliminada', async () => {
    ordenExiste = false;
    const res = await enviar({ examenesIds: [1], numeroPago: 'B-1' });
    expect(res.status).toBe(404);
  });

  it('devuelve 409 si el número de pago ya se usó en otra orden', async () => {
    pagoDuplicado = true;
    const res = await enviar({ examenesIds: [1], numeroPago: 'B-1' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/ya se usó/);
    expect(sqls().some((s) => s.startsWith('ROLLBACK'))).toBe(true);
  });

  it('rechaza con 403 a un rol sin admision_crear_ordenes', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'auditor', status: 'activo', nombreCompleto: 'Auditor' };
    const res = await enviar({ examenesIds: [1], numeroPago: 'B-1' });
    expect(res.status).toBe(403);
  });
});
