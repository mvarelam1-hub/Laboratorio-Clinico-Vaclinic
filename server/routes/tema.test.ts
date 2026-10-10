import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/** Paleta de colores: lectura pública, guardado con permiso y solo códigos #rrggbb. */
let currentStaffUser: any = { idUsuario: 2, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin' };
vi.mock('../auth-staff', () => ({ requireStaffAuth: (req: any, _res: any, next: any) => { req.staffUser = currentStaffUser; next(); } }));
const queryMock = vi.fn();
vi.mock('../db', () => ({ pool: { query: (...a: any[]) => queryMock(...a) } }));
const bitacoraMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../bitacora', () => ({ registrarBitacora: (...a: any[]) => bitacoraMock(...a) }));

const COLORES = { menu: '#0b2e4a', acento: '#2bb3e0', boton: '#ff8a3d', fondo: '#e3f0fb' };

async function buildApp() {
  const { temaPublicoRouter, temaAdminRouter } = await import('./tema');
  const app = express();
  app.use(express.json());
  app.use('/api/tema', temaPublicoRouter);
  app.use('/api/tema-admin', temaAdminRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  bitacoraMock.mockClear();
  currentStaffUser = { idUsuario: 2, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin' };
});

describe('validarColores', () => {
  it('acepta los cuatro colores #rrggbb y los pasa a minúsculas', async () => {
    const { validarColores } = await import('./tema');
    expect(validarColores({ menu: '#0B2E4A', acento: '#2bb3e0', boton: '#FF8A3D', fondo: '#e3f0fb' })).toEqual(COLORES);
  });

  it('rechaza faltantes, formatos raros y valores con intentos de inyección', async () => {
    const { validarColores } = await import('./tema');
    expect(validarColores(null)).toBeNull();
    expect(validarColores({ menu: '#000000' })).toBeNull();
    expect(validarColores({ ...COLORES, fondo: 'red' })).toBeNull();
    expect(validarColores({ ...COLORES, fondo: '#fff' })).toBeNull();
    expect(validarColores({ ...COLORES, boton: '#ff8a3d; background:url(x)' })).toBeNull();
    expect(validarColores({ ...COLORES, menu: 'url(javascript:alert(1))' })).toBeNull();
    expect(validarColores({ ...COLORES, acento: 123456 })).toBeNull();
  });
});

describe('lectura pública', () => {
  it('devuelve null si el laboratorio no eligió paleta', async () => {
    queryMock.mockResolvedValue({ rows: [] });
    const app = await buildApp();
    const res = await request(app).get('/api/tema');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tema: null });
  });

  it('devuelve la paleta guardada con su versión', async () => {
    queryMock.mockResolvedValue({ rows: [{ paleta: 'oceano', colores: COLORES, actualizado_en: '2026-10-10T12:00:00Z' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/tema');
    expect(res.body.tema.paleta).toBe('oceano');
    expect(res.body.tema.colores).toEqual(COLORES);
    expect(res.body.tema.version).toBe(new Date('2026-10-10T12:00:00Z').getTime());
  });

  it('devuelve el estilo guardado y usa "bosque" si falta o es desconocido', async () => {
    const app = await buildApp();
    queryMock.mockResolvedValueOnce({ rows: [{ paleta: null, colores: COLORES, estilo: 'monad', actualizado_en: '2026-10-10T12:00:00Z' }] });
    expect((await request(app).get('/api/tema')).body.tema.estilo).toBe('monad');
    queryMock.mockResolvedValueOnce({ rows: [{ paleta: null, colores: COLORES, actualizado_en: '2026-10-10T12:00:00Z' }] });
    expect((await request(app).get('/api/tema')).body.tema.estilo).toBe('bosque');
    queryMock.mockResolvedValueOnce({ rows: [{ paleta: null, colores: COLORES, estilo: '<x>', actualizado_en: '2026-10-10T12:00:00Z' }] });
    expect((await request(app).get('/api/tema')).body.tema.estilo).toBe('bosque');
  });

  it('si lo guardado estuviera dañado, responde null en vez de mandarlo al navegador', async () => {
    queryMock.mockResolvedValue({ rows: [{ paleta: 'x', colores: { menu: 'url(x)' }, actualizado_en: '2026-10-10T12:00:00Z' }] });
    const app = await buildApp();
    expect((await request(app).get('/api/tema')).body).toEqual({ tema: null });
  });
});

describe('administración', () => {
  it('rechaza a un rol sin el permiso (403)', async () => {
    currentStaffUser = { idUsuario: 5, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Rec' };
    const app = await buildApp();
    expect((await request(app).put('/api/tema-admin').send({ paleta: 'oceano', colores: COLORES })).status).toBe(403);
    expect((await request(app).delete('/api/tema-admin')).status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('guarda una paleta válida y audita', async () => {
    queryMock.mockResolvedValue({ rows: [], rowCount: 1 });
    const app = await buildApp();
    const res = await request(app).put('/api/tema-admin').send({ paleta: 'oceano', colores: COLORES });
    expect(res.status).toBe(200);
    const insert = queryMock.mock.calls[0];
    expect(String(insert[0])).toContain('INSERT INTO tema_laboratorio');
    expect(insert[1][0]).toBe('oceano');
    expect(JSON.parse(insert[1][1])).toEqual(COLORES);
    expect(insert[1][2]).toBe(2);
    expect(bitacoraMock).toHaveBeenCalledTimes(1);
  });

  it('guarda el estilo elegido (por omisión "bosque") y rechaza uno desconocido', async () => {
    queryMock.mockResolvedValue({ rows: [], rowCount: 1 });
    const app = await buildApp();
    expect((await request(app).put('/api/tema-admin').send({ paleta: null, colores: COLORES, estilo: 'monad' })).status).toBe(200);
    expect(queryMock.mock.calls[0][1][3]).toBe('monad');
    expect(String(queryMock.mock.calls[0][0])).toContain('estilo');
    expect((await request(app).put('/api/tema-admin').send({ paleta: null, colores: COLORES })).status).toBe(200);
    expect(queryMock.mock.calls[1][1][3]).toBe('bosque');
    queryMock.mockClear();
    expect((await request(app).put('/api/tema-admin').send({ paleta: null, colores: COLORES, estilo: 'rojo' })).status).toBe(400);
    expect((await request(app).put('/api/tema-admin').send({ paleta: null, colores: COLORES, estilo: { x: 1 } })).status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('acepta una paleta personalizada (sin nombre)', async () => {
    queryMock.mockResolvedValue({ rows: [], rowCount: 1 });
    const app = await buildApp();
    expect((await request(app).put('/api/tema-admin').send({ paleta: null, colores: COLORES })).status).toBe(200);
    expect(queryMock.mock.calls[0][1][0]).toBeNull();
  });

  it('rechaza colores inválidos y nombres de paleta raros sin tocar la base', async () => {
    const app = await buildApp();
    expect((await request(app).put('/api/tema-admin').send({ paleta: 'oceano', colores: { ...COLORES, fondo: 'rojo' } })).status).toBe(400);
    expect((await request(app).put('/api/tema-admin').send({ paleta: 'oceano' })).status).toBe(400);
    expect((await request(app).put('/api/tema-admin').send({ paleta: '<script>', colores: COLORES })).status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('restablece el diseño original y audita solo si había una paleta guardada', async () => {
    const app = await buildApp();
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    expect((await request(app).delete('/api/tema-admin')).status).toBe(200);
    expect(bitacoraMock).toHaveBeenCalledTimes(1);
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    expect((await request(app).delete('/api/tema-admin')).status).toBe(200);
    expect(bitacoraMock).toHaveBeenCalledTimes(1);
  });
});
