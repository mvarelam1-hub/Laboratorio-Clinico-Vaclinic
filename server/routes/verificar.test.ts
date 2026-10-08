import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { hashContenido } from '../informeIntegridad';

/**
 * Verificación pública (migración 0019, server/routes/verificar.ts).
 * `pool` sustituido por un mock: lo que se prueba es la decisión
 * (válido / modificado / no publicado / anulado), el recorte de datos
 * públicos, el escape de HTML y el límite de tasa.
 */
const queryMock = vi.fn();
vi.mock('../db', () => ({ pool: { query: (...a: any[]) => queryMock(...a) } }));

const CODIGO = 'ABCDEFGHJKMNPQRS';

function informe(over: Record<string, any> = {}) {
  const base: any = {
    id_informe: 1, id_orden: 5, numero_informe: 'LAB-2026-0001', titulo: 'Perfil Hematológico', categoria: 'hematologia',
    estado: 'publicado', eliminado: false, hallazgos_clinicos: null, conclusiones_medico: 'Normal',
    explicacion_paciente: null, recomendaciones: ['Control'],
    datos_json: { patientName: 'María Fernanda López', patientNationalId: '2345678901234', parameters: [{ name: 'Hb', value: 14 }] },
    codigo_verificacion: CODIGO, fecha_sello: '2026-10-01T10:00:00Z', fecha_publicacion: '2026-10-01T10:00:00Z',
    publicado_por_nombre: 'Dra. Demo', publicado_por_colegiado: 'COL-1', publicado_por_especialidad: 'Bioanálisis',
    nombre_laboratorio: 'VACLINIC', nombre_legal: 'Vaclinic S.A.', registro_sanitario: 'RS-1'
  };
  const merged = { ...base, ...over };
  if (!('hash_contenido' in over)) merged.hash_contenido = hashContenido({ ...base, ...over });
  return merged;
}

async function buildApp() {
  const { verificarApiRouter, verificarPaginaRouter, _reiniciarLimite } = await import('./verificar');
  _reiniciarLimite();
  const app = express();
  app.use('/api/verificar', verificarApiRouter);
  app.use('/verificar', verificarPaginaRouter);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: err.message }));
  return app;
}

function mockInforme(i: any, firmantes: any[] = [{ validado_por_nombre: 'Lic. Validador', verificado_por_nombre: null }]) {
  queryMock.mockResolvedValueOnce({ rows: [i] }).mockResolvedValueOnce({ rows: firmantes });
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
});

describe('GET /api/verificar/:codigo', () => {
  it('informe íntegro publicado -> valido, con datos mínimos y SIN datos clínicos ni documento', async () => {
    mockInforme(informe(), [
      { validado_por_nombre: 'Lic. Validador', verificado_por_nombre: 'Lic. Verificador' },
      { validado_por_nombre: 'Lic. Validador', verificado_por_nombre: null }
    ]);
    const app = await buildApp();
    const res = await request(app).get(`/api/verificar/${CODIGO}`);
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('valido');
    expect(res.body.paciente_enmascarado).toBe('M**** F****** L****');
    expect(res.body.validado_por).toEqual(['Lic. Validador']); // sin duplicados
    expect(res.body.verificado_por).toEqual(['Lic. Verificador']);
    const texto = JSON.stringify(res.body);
    expect(texto).not.toMatch(/María|Fernanda|López|2345678901234|Hb|Normal/);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['x-robots-tag']).toMatch(/noindex/);
  });

  it('normaliza guiones y minúsculas del código escrito a mano', async () => {
    mockInforme(informe());
    const app = await buildApp();
    const res = await request(app).get('/api/verificar/abcd-efgh-jkmn-pqrs');
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][1]).toEqual([CODIGO]);
  });

  it('contenido alterado después de publicar -> modificado', async () => {
    mockInforme(informe({ hash_contenido: hashContenido(informe()) , conclusiones_medico: 'Anemia severa' }));
    const app = await buildApp();
    const res = await request(app).get(`/api/verificar/${CODIGO}`);
    expect(res.body.estado).toBe('modificado');
  });

  it('un valor de parámetro editado en BD -> modificado', async () => {
    const original = informe();
    const editado = { ...original, datos_json: { ...original.datos_json, parameters: [{ name: 'Hb', value: 7 }] } };
    mockInforme(editado);
    const app = await buildApp();
    expect((await request(app).get(`/api/verificar/${CODIGO}`)).body.estado).toBe('modificado');
  });

  it('informe en borrador -> no_publicado', async () => {
    mockInforme(informe({ estado: 'borrador' }));
    const app = await buildApp();
    expect((await request(app).get(`/api/verificar/${CODIGO}`)).body.estado).toBe('no_publicado');
  });

  it('informe eliminado -> anulado', async () => {
    mockInforme(informe({ eliminado: true }));
    const app = await buildApp();
    expect((await request(app).get(`/api/verificar/${CODIGO}`)).body.estado).toBe('anulado');
  });

  it('?h= con la huella de la versión vigente -> version_coincide true; con otra -> false', async () => {
    const i = informe();
    mockInforme(i);
    let app = await buildApp();
    let res = await request(app).get(`/api/verificar/${CODIGO}?h=${i.hash_contenido.slice(0, 16)}`);
    expect(res.body.version_coincide).toBe(true);

    queryMock.mockReset();
    mockInforme(i);
    app = await buildApp();
    res = await request(app).get(`/api/verificar/${CODIGO}?h=0123456789abcdef`);
    expect(res.body.version_coincide).toBe(false);
  });

  it('sin ?h= version_coincide es null', async () => {
    mockInforme(informe());
    const app = await buildApp();
    expect((await request(app).get(`/api/verificar/${CODIGO}`)).body.version_coincide).toBeNull();
  });

  it('código inexistente -> 404 genérico', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).get(`/api/verificar/${CODIGO}`);
    expect(res.status).toBe(404);
  });

  it('código con formato inválido -> 404 sin tocar la base de datos', async () => {
    const app = await buildApp();
    for (const c of ['corto', "ABCDEFGHJKMNPQR'--", '<script>', '0'.repeat(16)]) {
      expect((await request(app).get(`/api/verificar/${encodeURIComponent(c)}`)).status).toBe(404);
    }
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('consulta con parámetros (no concatena el código en el SQL)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    await request(app).get(`/api/verificar/${CODIGO}`);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).not.toContain(CODIGO);
    expect(params).toEqual([CODIGO]);
  });

  it('limita la tasa por IP (429 tras el cupo)', async () => {
    queryMock.mockResolvedValue({ rows: [] });
    const app = await buildApp();
    let ultimo = 0;
    for (let n = 0; n < 125; n++) ultimo = (await request(app).get(`/api/verificar/${CODIGO}`)).status;
    expect(ultimo).toBe(429);
  });

  it('es pública: no exige sesión de personal', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    expect((await request(app).get(`/api/verificar/${CODIGO}`)).status).not.toBe(401);
  });
});

describe('GET /verificar/:codigo (HTML)', () => {
  it('muestra "Informe auténtico", enmascara al paciente y fija CSP/noindex', async () => {
    mockInforme(informe());
    const app = await buildApp();
    const res = await request(app).get(`/verificar/${CODIGO}`);
    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.text).toContain('Informe auténtico');
    expect(res.text).toContain('M**** F****** L****');
    expect(res.text).toContain('ABCD-EFGH-JKMN-PQRS');
    expect(res.text).not.toMatch(/María|2345678901234/);
    expect(res.headers['content-security-policy']).toMatch(/default-src 'none'/);
    expect(res.text).toMatch(/noindex/);
    expect(res.text).not.toMatch(/<script/i);
  });

  it('escapa HTML de cualquier texto que venga de la base (anti-XSS)', async () => {
    mockInforme(informe({
      titulo: '<img src=x onerror=alert(1)>', numero_informe: '"><script>alert(2)</script>',
      publicado_por_nombre: '<b>Dr</b>', nombre_laboratorio: "Lab'<svg onload=alert(3)>"
    }), [{ validado_por_nombre: '<script>x</script>', verificado_por_nombre: null }]);
    const app = await buildApp();
    const res = await request(app).get(`/verificar/${CODIGO}`);
    expect(res.text).not.toMatch(/<img src=x|<script>alert|<svg onload|<b>Dr<\/b>|<script>x/);
    expect(res.text).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('modificado -> advertencia roja y no dice "auténtico"', async () => {
    mockInforme(informe({ hash_contenido: 'a'.repeat(64) }));
    const app = await buildApp();
    const res = await request(app).get(`/verificar/${CODIGO}`);
    expect(res.text).toContain('Contenido modificado');
    expect(res.text).not.toContain('Informe auténtico');
  });

  it('copia impresa de versión anterior -> avisa', async () => {
    mockInforme(informe());
    const app = await buildApp();
    const res = await request(app).get(`/verificar/${CODIGO}?h=0123456789abcdef`);
    expect(res.text).toContain('versión anterior');
  });

  it('código desconocido -> 404 con formulario para reintentar', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).get(`/verificar/${CODIGO}`);
    expect(res.status).toBe(404);
    expect(res.text).toContain('Código no encontrado');
    expect(res.text).toContain('<form');
  });

  it('/verificar sin código muestra el formulario, y con ?codigo= redirige a la ruta canónica', async () => {
    const app = await buildApp();
    const form = await request(app).get('/verificar');
    expect(form.status).toBe(200);
    expect(form.text).toContain('<form');
    const redir = await request(app).get('/verificar?codigo=abcd-efgh-jkmn-pqrs');
    expect(redir.status).toBe(302);
    expect(redir.headers.location).toBe(`/verificar/${CODIGO}`);
  });

  it('?codigo= con basura no permite redirección abierta', async () => {
    const app = await buildApp();
    const r = await request(app).get('/verificar?codigo=' + encodeURIComponent('//evil.com/x'));
    expect(r.headers.location).toMatch(/^\/verificar\/[A-Z0-9]+$/);
  });
});
