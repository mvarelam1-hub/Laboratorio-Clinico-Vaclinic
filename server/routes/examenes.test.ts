import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre el módulo "Catálogo de exámenes" (server/routes/examenes.ts),
 * agregado para que el frontend real pueda armar órdenes contra la base de datos
 * real en vez de un catálogo hardcodeado en localStorage.
 *
 * Migración 0017: agrega escritura (POST/PATCH) al catálogo, antes 100%
 * de solo lectura. `hasPermission`/`getEffectiveRolesConfig` NO se mockean
 * -se usan reales, igual que resultados.ts/episodios.ts- porque
 * getEffectiveRolesConfig() cae al catálogo estático (INITIAL_ROLES_CONFIG)
 * cuando no hay overrides cargados (el caso normal en estas pruebas, sin
 * acceso real a Postgres), así que los permisos por rol se verifican de
 * verdad, no con un doble.
 */

let currentStaffUser: any = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };

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
  const { examenesRouter } = await import('./examenes');
  const app = express();
  app.use(express.json());
  app.use('/api/examenes', examenesRouter);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: err.message }));
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
});

describe('GET /api/examenes', () => {
  it('devuelve el catálogo ordenado por categoría, accesible a cualquier personal autenticado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_examen: 1, nombre_examen: 'Glucosa' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/examenes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('GET /api/examenes/:id', () => {
  it('devuelve 404 si el examen no existe en el catálogo', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).get('/api/examenes/999');
    expect(res.status).toBe(404);
  });

  it('devuelve el examen cuando existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_examen: 1, nombre_examen: 'Glucosa' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/examenes/1');
    expect(res.status).toBe(200);
    expect(res.body.nombre_examen).toBe('Glucosa');
  });
});

describe('POST /api/examenes (migración 0017)', () => {
  it('crea un examen nuevo cuando el rol tiene catalogo_tarifas_editar', async () => {
    currentStaffUser = { idUsuario: 7, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin Demo' };
    queryMock.mockResolvedValueOnce({
      rows: [{ id_examen: 50, codigo_examen: 'NEW-01', nombre_examen: 'Prueba Nueva', precio: 75, estado: 'Activo' }]
    });
    const app = await buildApp();
    const res = await request(app).post('/api/examenes').send({
      codigo: 'NEW-01',
      nombre: 'Prueba Nueva',
      tipoMuestra: 'Sangre',
      precio: 75,
      description: 'Una prueba de ejemplo',
      referenceRange: '10-20'
    });
    expect(res.status).toBe(201);
    expect(res.body.id_examen).toBe(50);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO examen/);
    expect(params[1]).toBe('Prueba Nueva');
    expect(params[7]).toBe(75); // precio
    const datosAdicionales = JSON.parse(params[15]);
    expect(datosAdicionales.description).toBe('Una prueba de ejemplo');
    expect(datosAdicionales.referenceRange).toBe('10-20');
  });

  it('rechaza con 403 a un rol sin catalogo_tarifas_editar (recepcionista)', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/examenes').send({ nombre: 'X', tipoMuestra: 'Sangre' });
    expect(res.status).toBe(403);
  });

  it('rechaza con 400 si falta nombre o tipoMuestra', async () => {
    currentStaffUser = { idUsuario: 7, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin Demo' };
    const app = await buildApp();
    const res1 = await request(app).post('/api/examenes').send({ tipoMuestra: 'Sangre' });
    expect(res1.status).toBe(400);
    const res2 = await request(app).post('/api/examenes').send({ nombre: 'X' });
    expect(res2.status).toBe(400);
  });

  it('rechaza con 400 un tipoResultado fuera del enum', async () => {
    currentStaffUser = { idUsuario: 7, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin Demo' };
    const app = await buildApp();
    const res = await request(app).post('/api/examenes').send({ nombre: 'X', tipoMuestra: 'Sangre', tipoResultado: 'Inventado' });
    expect(res.status).toBe(400);
  });

  it('devuelve 409 si el código de examen ya existe (unique_violation)', async () => {
    currentStaffUser = { idUsuario: 7, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin Demo' };
    const err: any = new Error('duplicate key value violates unique constraint');
    err.code = '23505';
    queryMock.mockRejectedValueOnce(err);
    const app = await buildApp();
    const res = await request(app).post('/api/examenes').send({ codigo: 'PAN-01', nombre: 'X', tipoMuestra: 'Sangre' });
    expect(res.status).toBe(409);
  });
});

describe('PATCH /api/examenes/:id (migración 0017)', () => {
  it('actualiza columnas reales y fusiona datos_adicionales con || cuando el rol tiene catalogo_tarifas_editar (precio)', async () => {
    currentStaffUser = { idUsuario: 7, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin Demo' };
    queryMock.mockResolvedValueOnce({ rows: [{ id_examen: 1, precio: 99.5, nombre_examen: 'Glucosa' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/examenes/1').send({ precio: 99.5, description: 'Actualizada' });
    expect(res.status).toBe(200);
    expect(res.body.precio).toBe(99.5);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/UPDATE examen SET/);
    expect(sql).toMatch(/datos_adicionales = datos_adicionales \|\|/);
    expect(sql).toMatch(/fecha_actualizacion = NOW\(\)/);
    expect(params).toContain(99.5);
  });

  it('rechaza con 403 cuando se intenta cambiar precio sin catalogo_tarifas_editar (bioanalista_senior solo tiene rangos)', async () => {
    currentStaffUser = { idUsuario: 8, roleId: 'bioanalista_senior', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/examenes/1').send({ precio: 50 });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/catalogo_tarifas_editar/);
  });

  it('permite a bioanalista_senior (catalogo_rangos_editar) cambiar unidad/metodo/rango sin tocar precio', async () => {
    currentStaffUser = { idUsuario: 8, roleId: 'bioanalista_senior', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    queryMock.mockResolvedValueOnce({ rows: [{ id_examen: 1, unidad_medida: 'mg/dL' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/examenes/1').send({ unidadMedida: 'mg/dL', referenceRange: '70-100' });
    expect(res.status).toBe(200);
  });

  it('rechaza con 403 un cambio de rango/método a un rol sin catalogo_rangos_editar (recepcionista no tiene ninguno de los dos permisos)', async () => {
    const app = await buildApp(); // recepcionista por defecto
    const res = await request(app).patch('/api/examenes/1').send({ metodo: 'Espectrofotometría' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/catalogo_rangos_editar/);
  });

  it('rechaza con 403 cuando no se toca precio/rango pero el rol no tiene ningún permiso de catálogo', async () => {
    const app = await buildApp(); // recepcionista por defecto
    const res = await request(app).patch('/api/examenes/1').send({ categoria: 'nueva-categoria' });
    expect(res.status).toBe(403);
  });

  it('rechaza con 400 cuando no se envía ningún campo', async () => {
    currentStaffUser = { idUsuario: 7, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/examenes/1').send({});
    expect(res.status).toBe(400);
  });

  it('devuelve 404 si el examen no existe', async () => {
    currentStaffUser = { idUsuario: 7, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin Demo' };
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/examenes/999').send({ precio: 10 });
    expect(res.status).toBe(404);
  });

  it('permite a director_laboratorio (ambos permisos) cambiar precio y rango en la misma llamada', async () => {
    currentStaffUser = { idUsuario: 10, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Director Demo' };
    queryMock.mockResolvedValueOnce({ rows: [{ id_examen: 1, precio: 120, metodo: 'ELISA' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/examenes/1').send({ precio: 120, metodo: 'ELISA' });
    expect(res.status).toBe(200);
  });

  it('devuelve 409 si el nuevo código ya existe en otro examen (unique_violation)', async () => {
    currentStaffUser = { idUsuario: 7, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin Demo' };
    const err: any = new Error('duplicate key value violates unique constraint');
    err.code = '23505';
    queryMock.mockRejectedValueOnce(err);
    const app = await buildApp();
    const res = await request(app).patch('/api/examenes/1').send({ codigo: 'PAN-01' });
    expect(res.status).toBe(409);
  });
});
