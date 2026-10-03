import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre server/routes/configLab.ts (migración 0015,
 * persistencia real de configuración del laboratorio / LabSettings).
 *
 * Mismo patrón que informes.test.ts: `pool` de `../db` sustituido por
 * un mock en memoria, `requireStaffAuth` reemplazado por middleware que
 * inyecta directamente el usuario de prueba.
 */

let currentStaffUser: any = { idUsuario: 1, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin Demo' };

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
  const { configLabRouter } = await import('./configLab');
  const app = express();
  app.use(express.json());
  app.use('/api/config-lab', configLabRouter);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: err.message }));
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 1, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin Demo' };
});

describe('GET /api/config-lab', () => {
  it('retorna configuración existente', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id_configuracion: 1,
        id_laboratorio: 1,
        nombre_laboratorio: 'VACLINIC',
        email: 'lab@vaclinic.com',
        color_primario: '#0d9488',
        tamaño_papel: 'letter',
        familia_tipografia: 'sans',
        datos_adicionales: { watermarkPreset: 'none', margins: { top: 20, bottom: 20 } }
      }]
    });
    const app = await buildApp();
    const res = await request(app).get('/api/config-lab');
    expect(res.status).toBe(200);
    expect(res.body.nombre_laboratorio).toBe('VACLINIC');
    expect(res.body.email).toBe('lab@vaclinic.com');
  });

  it('crea configuración con defaults si no existe', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] }) // First query: no existe
      .mockResolvedValueOnce({
        rows: [{
          id_configuracion: 1,
          id_laboratorio: 1,
          nombre_laboratorio: 'VACLINIC',
          email: 'laboratoriovaclinic@gmail.com',
          color_primario: '#0d9488',
          tamaño_papel: 'letter',
          familia_tipografia: 'sans',
          datos_adicionales: {}
        }]
      }); // Second query: INSERT RETURNING
    const app = await buildApp();
    const res = await request(app).get('/api/config-lab');
    expect(res.status).toBe(200);
    expect(res.body.nombre_laboratorio).toBe('VACLINIC');
  });
});

describe('PATCH /api/config-lab', () => {
  it('actualiza columnas reales y fusiona datos_adicionales con ||', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id_configuracion: 1,
        id_laboratorio: 1,
        nombre_laboratorio: 'VACLINIC ACTUALIZADO',
        email: 'newemail@vaclinic.com',
        color_primario: '#0d9488',
        tamaño_papel: 'a4',
        familia_tipografia: 'serif',
        datos_adicionales: { watermarkPreset: 'CONFIDENCIAL', margins: { top: 25, bottom: 25 } }
      }]
    });
    const app = await buildApp();
    const res = await request(app).patch('/api/config-lab').send({
      nombre_laboratorio: 'VACLINIC ACTUALIZADO',
      email: 'newemail@vaclinic.com',
      tamaño_papel: 'a4',
      familia_tipografia: 'serif',
      watermarkPreset: 'CONFIDENCIAL'
    });
    expect(res.status).toBe(200);
    expect(res.body.nombre_laboratorio).toBe('VACLINIC ACTUALIZADO');
    expect(res.body.tamaño_papel).toBe('a4');
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/UPDATE configuracion_laboratorio/);
    expect(sql).toMatch(/datos_adicionales = datos_adicionales \|\| /);
    expect(sql).toMatch(/id_usuario_ultima_mod/);
  });

  it('preserva datos_adicionales existentes cuando se actualiza datos_adicionales sin datos_json en body', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id_configuracion: 1,
        id_laboratorio: 1,
        nombre_laboratorio: 'VACLINIC',
        email: 'lab@vaclinic.com',
        color_primario: '#0d9488',
        tamaño_papel: 'letter',
        familia_tipografia: 'sans',
        datos_adicionales: {
          watermarkPreset: 'OFICIAL VALIDADO',
          marginTopMm: 20,
          signers: [{ id: 's1', name: 'Dr. Demo' }]
        }
      }]
    });
    const app = await buildApp();
    // Actualizar solo watermarkOpacity (in datos_adicionales) sin tocar signers
    const res = await request(app).patch('/api/config-lab').send({
      watermarkOpacity: 0.5
    });
    expect(res.status).toBe(200);
    const [sql] = queryMock.mock.calls[0];
    // Debe usar JSONB merge (||) para preservar otros campos de datos_adicionales
    expect(sql).toMatch(/datos_adicionales = datos_adicionales \|\|/);
  });

  it('crea configuración con defaults si no existe al hacer PATCH', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] }) // UPDATE retorna vacío
      .mockResolvedValueOnce({
        rows: [{
          id_configuracion: 1,
          id_laboratorio: 1,
          nombre_laboratorio: 'VACLINIC',
          email: 'lab@vaclinic.com',
          color_primario: '#0d9488',
          tamaño_papel: 'letter',
          familia_tipografia: 'sans',
          datos_adicionales: {}
        }]
      }); // INSERT RETURNING
    const app = await buildApp();
    const res = await request(app).patch('/api/config-lab').send({
      nombre_laboratorio: 'VACLINIC'
    });
    expect(res.status).toBe(200);
    expect(res.body.nombre_laboratorio).toBe('VACLINIC');
  });

  it('registra id_usuario_ultima_mod en cada update', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{
        id_configuracion: 1,
        id_laboratorio: 1,
        nombre_laboratorio: 'VACLINIC',
        email: 'lab@vaclinic.com',
        color_primario: '#0d9488',
        tamaño_papel: 'letter',
        familia_tipografia: 'sans',
        datos_adicionales: {}
      }]
    });
    const app = await buildApp();
    const res = await request(app).patch('/api/config-lab').send({
      email: 'updated@vaclinic.com'
    });
    expect(res.status).toBe(200);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/id_usuario_ultima_mod/);
    // Verificar que el idUsuario del currentStaffUser fue registrado
    expect(params).toContain(1); // currentStaffUser.idUsuario
  });

  it('retorna sin cambios si no hay datos para actualizar', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/config-lab').send({});
    expect(res.status).toBe(200);
    expect(res.body.updated).toBe(false);
  });
});
