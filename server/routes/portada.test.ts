import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/** Imágenes de la portada: lectura pública, subida con permiso, formato y tamaño. */
let currentStaffUser: any = { idUsuario: 2, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin' };
vi.mock('../auth-staff', () => ({ requireStaffAuth: (req: any, _res: any, next: any) => { req.staffUser = currentStaffUser; next(); } }));
const queryMock = vi.fn();
vi.mock('../db', () => ({ pool: { query: (...a: any[]) => queryMock(...a) } }));
const bitacoraMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../bitacora', () => ({ registrarBitacora: (...a: any[]) => bitacoraMock(...a) }));

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('datos-de-prueba')]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('datos-de-prueba')]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 2, 3, 4]), Buffer.from('WEBP'), Buffer.from('datos')]);

async function buildApp() {
  const { portadaPublicaRouter, portadaAdminRouter } = await import('./portada');
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/api/portada', portadaPublicaRouter);
  app.use('/api/portada-admin', portadaAdminRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  bitacoraMock.mockClear();
  currentStaffUser = { idUsuario: 2, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin' };
});

describe('detectarMime', () => {
  it('reconoce PNG, JPEG y WebP por sus bytes y rechaza el resto', async () => {
    const { detectarMime } = await import('./portada');
    expect(detectarMime(PNG)).toBe('image/png');
    expect(detectarMime(JPG)).toBe('image/jpeg');
    expect(detectarMime(WEBP)).toBe('image/webp');
    expect(detectarMime(Buffer.from('<svg onload="alert(1)"></svg>'))).toBeNull();
    expect(detectarMime(Buffer.from('GIF89a....'))).toBeNull();
    expect(detectarMime(Buffer.alloc(0))).toBeNull();
  });
});

describe('lectura pública', () => {
  it('lista las posiciones con imagen y su versión, sin mandar los bytes', async () => {
    queryMock.mockResolvedValue({ rows: [{ clave: 'logo', actualizado_en: '2026-10-10T12:00:00Z' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/portada');
    expect(res.status).toBe(200);
    expect(res.body.imagenes.logo.version).toBe(new Date('2026-10-10T12:00:00Z').getTime());
    expect(JSON.stringify(res.body)).not.toContain('datos');
  });

  it('sirve la imagen con cabeceras seguras', async () => {
    queryMock.mockResolvedValue({ rows: [{ tipo_mime: 'image/png', datos: PNG }] });
    const app = await buildApp();
    const res = await request(app).get('/api/portada/imagen/logo');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(Buffer.from(res.body).equals(PNG)).toBe(true);
  });

  it('responde 404 si la posición no existe o no tiene imagen, sin consultar con claves raras', async () => {
    const app = await buildApp();
    expect((await request(app).get('/api/portada/imagen/../../etc')).status).toBe(404);
    expect((await request(app).get('/api/portada/imagen/otra')).status).toBe(404);
    expect(queryMock).not.toHaveBeenCalled();
    queryMock.mockResolvedValue({ rows: [] });
    expect((await request(app).get('/api/portada/imagen/fondo')).status).toBe(404);
  });
});

describe('administración', () => {
  it('rechaza a un rol sin el permiso (403)', async () => {
    currentStaffUser = { idUsuario: 5, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Tec' };
    const app = await buildApp();
    const res = await request(app).put('/api/portada-admin/imagen/logo').send({ base64: PNG.toString('base64') });
    expect(res.status).toBe(403);
    expect((await request(app).delete('/api/portada-admin/imagen/logo')).status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('guarda una imagen válida y audita', async () => {
    queryMock.mockResolvedValue({ rows: [], rowCount: 1 });
    const app = await buildApp();
    const res = await request(app).put('/api/portada-admin/imagen/logo').send({ base64: PNG.toString('base64') });
    expect(res.status).toBe(200);
    const insert = queryMock.mock.calls[0];
    expect(String(insert[0])).toContain('INSERT INTO portada_imagen');
    expect(insert[1][0]).toBe('logo');
    expect(insert[1][1]).toBe('image/png');
    expect(Buffer.isBuffer(insert[1][2])).toBe(true);
    expect(insert[1][4]).toBe(2);
    expect(bitacoraMock).toHaveBeenCalledTimes(1);
  });

  it('usa el formato REAL de la imagen, no el que declare el cliente', async () => {
    queryMock.mockResolvedValue({ rows: [], rowCount: 1 });
    const app = await buildApp();
    await request(app).put('/api/portada-admin/imagen/fondo').send({ base64: JPG.toString('base64'), mime: 'image/png' });
    expect(queryMock.mock.calls[0][1][1]).toBe('image/jpeg');
  });

  it('rechaza SVG, archivos ajenos, vacíos y posiciones inventadas', async () => {
    const app = await buildApp();
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>').toString('base64');
    expect((await request(app).put('/api/portada-admin/imagen/logo').send({ base64: svg })).status).toBe(400);
    expect((await request(app).put('/api/portada-admin/imagen/logo').send({})).status).toBe(400);
    expect((await request(app).put('/api/portada-admin/imagen/logo').send({ base64: '' })).status).toBe(400);
    expect((await request(app).put('/api/portada-admin/imagen/otra').send({ base64: PNG.toString('base64') })).status).toBe(404);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rechaza imágenes de más de 1.5 MB (413)', async () => {
    const grande = Buffer.concat([PNG, Buffer.alloc(1.6 * 1024 * 1024)]).toString('base64');
    const app = await buildApp();
    const res = await request(app).put('/api/portada-admin/imagen/logo').send({ base64: grande });
    expect(res.status).toBe(413);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('quita una imagen y audita solo si existía', async () => {
    const app = await buildApp();
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    expect((await request(app).delete('/api/portada-admin/imagen/logo')).status).toBe(200);
    expect(bitacoraMock).toHaveBeenCalledTimes(1);
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    expect((await request(app).delete('/api/portada-admin/imagen/logo')).status).toBe(200);
    expect(bitacoraMock).toHaveBeenCalledTimes(1);
  });
});
