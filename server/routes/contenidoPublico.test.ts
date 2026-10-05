import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/** Gestión de noticias/promociones: validación y permiso catalogo_tarifas_editar. */
let currentStaffUser: any = { idUsuario: 2, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Dir' };
vi.mock('../auth-staff', () => ({ requireStaffAuth: (req: any, _res: any, next: any) => { req.staffUser = currentStaffUser; next(); } }));
const queryMock = vi.fn();
vi.mock('../db', () => ({ pool: { query: (...a: any[]) => queryMock(...a) } }));

async function buildApp() {
  const { contenidoPublicoRouter } = await import('./contenidoPublico');
  const app = express();
  app.use(express.json());
  app.use('/api/contenido-publico', contenidoPublicoRouter);
  return app;
}
beforeEach(() => {
  vi.resetModules(); queryMock.mockReset();
  currentStaffUser = { idUsuario: 2, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Dir' };
});

const valido = { tipo: 'noticia', titulo: 'Hidrátate', resumen: 'Toma agua', publicado: true };

describe('normalizarContenido', () => {
  it('rechaza título vacío, tipo raro, enlace no http, vigencia antes de la publicación y noticia con vigencia', async () => {
    const { normalizarContenido } = await import('./contenidoPublico');
    expect(normalizarContenido({ ...valido, titulo: ' ' })).toHaveProperty('error');
    expect(normalizarContenido({ ...valido, tipo: 'otro' })).toHaveProperty('error');
    expect(normalizarContenido({ ...valido, enlace: 'javascript:alert(1)' })).toHaveProperty('error');
    expect(normalizarContenido({ tipo: 'promocion', titulo: 'P', resumen: 'x', fechaPublicacion: '2026-10-10', vigenteHasta: '2026-10-01' })).toHaveProperty('error');
    expect(normalizarContenido({ ...valido, vigenteHasta: '2026-12-01' })).toHaveProperty('error');
    expect(normalizarContenido({ tipo: 'noticia', titulo: 'T' })).toHaveProperty('error');
  });
  it('acepta un contenido válido y no publica si no se pide expresamente', async () => {
    const { normalizarContenido } = await import('./contenidoPublico');
    const r: any = normalizarContenido({ tipo: 'promocion', titulo: 'P', resumen: 'x', vigenteHasta: '2026-12-31', enlace: 'https://ejemplo.com' });
    expect(r.datos.publicado).toBe(false);
    expect(r.datos.enlace).toBe('https://ejemplo.com');
  });
});

describe('/api/contenido-publico', () => {
  it('GET lista para cualquier personal', async () => {
    currentStaffUser = { idUsuario: 3, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Rec' };
    queryMock.mockResolvedValueOnce({ rows: [{ id_contenido: 1 }] });
    const res = await request(await buildApp()).get('/api/contenido-publico');
    expect(res.status).toBe(200);
  });
  it('POST sin permiso → 403 y no escribe', async () => {
    currentStaffUser = { idUsuario: 3, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Rec' };
    const res = await request(await buildApp()).post('/api/contenido-publico').send(valido);
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });
  it('POST válido crea (201) y deja bitácora', async () => {
    queryMock.mockResolvedValue({ rows: [{ id_contenido: 5, titulo: 'Hidrátate' }] });
    const res = await request(await buildApp()).post('/api/contenido-publico').send(valido);
    expect(res.status).toBe(201);
    expect(queryMock.mock.calls[0][0]).toMatch(/INSERT INTO contenido_publico/);
    expect(queryMock.mock.calls[1][0]).toMatch(/historial_auditoria/);
  });
  it('POST inválido → 400', async () => {
    const res = await request(await buildApp()).post('/api/contenido-publico').send({ tipo: 'noticia', titulo: '' });
    expect(res.status).toBe(400);
  });
  it('PUT inexistente → 404 y DELETE inexistente → 404', async () => {
    queryMock.mockResolvedValue({ rows: [] });
    const app = await buildApp();
    expect((await request(app).put('/api/contenido-publico/9').send(valido)).status).toBe(404);
    expect((await request(app).delete('/api/contenido-publico/9')).status).toBe(404);
  });
  it('DELETE existente → ok', async () => {
    queryMock.mockResolvedValue({ rows: [{ titulo: 'T', tipo: 'noticia' }] });
    const res = await request(await buildApp()).delete('/api/contenido-publico/4');
    expect(res.body.ok).toBe(true);
  });
});
