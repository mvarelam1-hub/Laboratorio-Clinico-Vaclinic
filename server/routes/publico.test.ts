import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/** Información pública del portal: sin sesión, solo lectura, sin precios en 0. */
const queryMock = vi.fn();
vi.mock('../db', () => ({ pool: { query: (...a: any[]) => queryMock(...a) } }));

async function buildApp() {
  const { publicoRouter } = await import('./publico');
  const app = express();
  app.use('/api/publico', publicoRouter);
  return app;
}

beforeEach(() => { vi.resetModules(); queryMock.mockReset(); });

describe('GET /api/publico/laboratorio', () => {
  it('devuelve solo lo configurado y null en lo vacío', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ nombre_laboratorio: 'Lab X', eslogan: '  ', telefono: '2222-3333', whatsapp_numero: null }] });
    const res = await request(await buildApp()).get('/api/publico/laboratorio');
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Lab X');
    expect(res.body.eslogan).toBeNull();
    expect(res.body.telefono).toBe('2222-3333');
    expect(res.body.whatsapp).toBeNull();
  });

  it('sin configuración responde todo null (no inventa nombre)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const res = await request(await buildApp()).get('/api/publico/laboratorio');
    expect(res.body.nombre).toBeNull();
  });
});

describe('GET /api/publico/catalogo', () => {
  it('filtra activos y visibles, precio 0 = sin precio, e incluye ayuno/instrucciones del laboratorio', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [
        { codigo_examen: 'QUI-27', nombre_examen: 'Glucosa', categoria: '03_quimica_sanguinea', categoria_nombre: null, tipo_muestra: 'Suero', precio: '35.00', tiempo_entrega_horas: 2, es_perfil: false,
          datos_adicionales: { fasting: '8 horas de ayuno', requiresFasting: true, patientInstructions: 'Solo agua' } },
        { codigo_examen: 'HEM-19', nombre_examen: 'VCM', categoria: '02_hematologia_grupo', categoria_nombre: null, tipo_muestra: 'Sangre', precio: '0.00', tiempo_entrega_horas: 24, es_perfil: false, datos_adicionales: {} },
      ] })
      .mockResolvedValueOnce({ rows: [{ codigo: 'PRF-1', nombre: 'Perfil', nombre_categoria: null, precio: '100', descripcion: null, nombres_examenes: ['A', 'B'] }] });
    const res = await request(await buildApp()).get('/api/publico/catalogo');
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).toMatch(/estado = 'Activo' AND visible_venta = TRUE/);
    expect(queryMock.mock.calls[1][0]).toMatch(/estado = 'Activo'/);
    const [glu, vcm] = res.body.examenes;
    expect(glu.precio).toBe(35);
    expect(glu.ayuno).toBe('8 horas de ayuno');
    expect(glu.instrucciones).toBe('Solo agua');
    expect(vcm.precio).toBeNull();
    expect(vcm.ayuno).toBeNull();
    expect(res.body.perfiles[0].examenes).toEqual(['A', 'B']);
  });

  it('no expone campos internos (id, estado, datos_adicionales)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ codigo_examen: 'X', nombre_examen: 'N', categoria: 'c', tipo_muestra: null, precio: 1, es_perfil: false, datos_adicionales: { secreto: 1 } }] })
      .mockResolvedValueOnce({ rows: [] });
    const res = await request(await buildApp()).get('/api/publico/catalogo');
    expect(JSON.stringify(res.body)).not.toMatch(/secreto|id_examen|datos_adicionales/);
  });
});

describe('GET /api/publico/contenido', () => {
  it('solo pide publicados y vigentes, y separa noticias de promociones', async () => {
    queryMock.mockResolvedValueOnce({ rows: [
      { id_contenido: 1, tipo: 'noticia', titulo: 'N', resumen: 'r', cuerpo: '', etiqueta: null, fuente: null, enlace: null, fecha_publicacion: '2026-10-01', vigente_hasta: null },
      { id_contenido: 2, tipo: 'promocion', titulo: 'P', resumen: 'r', cuerpo: '', etiqueta: null, fuente: null, enlace: null, fecha_publicacion: '2026-10-02', vigente_hasta: '2026-12-31' },
    ] });
    const res = await request(await buildApp()).get('/api/publico/contenido');
    const sql = queryMock.mock.calls[0][0] as string;
    expect(sql).toMatch(/publicado = TRUE/);
    expect(sql).toMatch(/vigente_hasta IS NULL OR vigente_hasta >= CURRENT_DATE/);
    expect(res.body.noticias).toHaveLength(1);
    expect(res.body.promociones[0].titulo).toBe('P');
  });
});
