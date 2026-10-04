import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre server/routes/informes.ts (migración 0014,
 * persistencia real del informe clínico / MedicalReport). Mismo patrón de
 * dobles de prueba que ordenes.test.ts: `pool` de `../db` sustituido por un
 * mock en memoria, `requireStaffAuth` reemplazado por un middleware que
 * inyecta directamente el usuario de prueba.
 */

let currentStaffUser: any = { idUsuario: 1, roleId: 'bioanalista_senior', status: 'activo', nombreCompleto: 'Bioanalista Demo' };

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
  const { informesRouter } = await import('./informes');
  const app = express();
  app.use(express.json());
  app.use('/api/informes', informesRouter);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: err.message }));
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 1, roleId: 'bioanalista_senior', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
});

describe('POST /api/informes', () => {
  it('crea el informe con las columnas reales + datos_json (clase válida)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 10, numero_informe: 'LAB-2026-0001', estado: 'borrador' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/informes').send({
      numeroInforme: 'LAB-2026-0001',
      titulo: 'Perfil Hematológico Completo',
      categoria: 'hematologia',
      hallazgosClinicos: 'Sin hallazgos relevantes',
      parameters: [{ id: 'p1', name: 'Hemoglobina', value: 14, examCode: 'PAN-02' }],
      recomendaciones: ['Control en 6 meses']
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id_informe: 10, numero_informe: 'LAB-2026-0001' });
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO informe_clinico/);
    expect(params[1]).toBe('LAB-2026-0001');
    expect(params[3]).toBe('Perfil Hematológico Completo');
    expect(params[4]).toBe('borrador');
    const datosJson = JSON.parse(params[12]);
    expect(datosJson.parameters).toHaveLength(1);
  });

  it('rechaza con 400 si falta numeroInforme o titulo', async () => {
    const app = await buildApp();
    const res1 = await request(app).post('/api/informes').send({ titulo: 'Sin número' });
    expect(res1.status).toBe(400);
    const res2 = await request(app).post('/api/informes').send({ numeroInforme: 'LAB-2026-0002' });
    expect(res2.status).toBe(400);
  });

  it('rechaza con 400 un estado fuera del enum permitido', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/informes').send({ numeroInforme: 'LAB-2026-0003', titulo: 'Test', estado: 'inventado' });
    expect(res.status).toBe(400);
  });

  it('rechaza con 403 a un rol sin validacion_redaccion', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    const app = await buildApp();
    const res = await request(app).post('/api/informes').send({ numeroInforme: 'LAB-2026-0004', titulo: 'Test' });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/informes y GET /api/informes/:id', () => {
  it('el listado excluye eliminado=TRUE en el WHERE', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 1, numero_informe: 'LAB-2026-0001' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/informes');
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).toMatch(/eliminado = FALSE/);
  });

  it('GET /:id devuelve 404 si no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).get('/api/informes/999');
    expect(res.status).toBe(404);
  });

  it('GET /:id no filtra por eliminado (sigue consultable para auditoría)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 1, eliminado: true }] });
    const app = await buildApp();
    const res = await request(app).get('/api/informes/1');
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).not.toMatch(/eliminado = FALSE/);
  });
});

describe('PATCH /api/informes/:id', () => {
  it('actualiza columnas reales y fusiona datos_json con el operador ||', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 1, titulo: 'Actualizado' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/1').send({ titulo: 'Actualizado', patientExplanation: undefined, urgentAlert: true });
    expect(res.status).toBe(200);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/datos_json = datos_json \|\| /);
    expect(sql).toMatch(/eliminado = FALSE/);
    expect(params[1]).toBe('Actualizado');
    const datosJson = JSON.parse(params[11]);
    expect(datosJson.urgentAlert).toBe(true);
    expect('patientExplanation' in datosJson).toBe(false); // undefined se filtra, no sobreescribe
  });

  it('devuelve 404 si el informe no existe o ya fue eliminado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/999').send({ titulo: 'X' });
    expect(res.status).toBe(404);
  });

  it('rechaza con 403 a un rol sin validacion_redaccion', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/1').send({ titulo: 'X' });
    expect(res.status).toBe(403);
  });
});

describe('PATCH /api/informes/:id/publicar', () => {
  const informeActual = {
    id_informe: 1, numero_informe: 'LAB-2026-0001', titulo: 'Perfil', categoria: 'hematologia', id_orden: 5,
    hallazgos_clinicos: null, conclusiones_medico: 'Normal', explicacion_paciente: null, recomendaciones: [],
    datos_json: { patientName: 'Ana Pérez', parameters: [{ name: 'Hb', value: 14 }] },
    codigo_verificacion: null, pub_colegiado: 'COL-123', pub_especialidad: 'Bioanálisis'
  };

  it('transiciona a publicado con usuario y fecha de publicación, y sella el informe', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] }) // sin críticos pendientes de verificación
      .mockResolvedValueOnce({ rows: [informeActual] }) // informe actual + colegiado del publicador
      .mockResolvedValueOnce({ rows: [{ id_informe: 1, estado: 'publicado' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/1/publicar').send({ signature: { doctorName: 'Dr. Demo' } });
    expect(res.status).toBe(200);
    const [sql, params] = queryMock.mock.calls[2];
    expect(sql).toMatch(/estado = 'publicado'/);
    expect(sql).toMatch(/id_usuario_publicacion = \$1/);
    expect(params[0]).toBe(1); // idUsuario del staffUser autenticado
    // Sello emitido por el servidor: código, huella SHA-256 e identidad del publicador de la sesión.
    expect(params[3]).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{16}$/);
    expect(params[4]).toMatch(/^[0-9a-f]{64}$/);
    expect(params[5]).toBe('Bioanalista Demo');
    expect(params[6]).toBe('COL-123');
    expect(params[7]).toBe('Bioanálisis');
  });

  it('ignora un código/hash/publicador que mande el cliente en el body', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [informeActual] })
      .mockResolvedValueOnce({ rows: [{ id_informe: 1 }] });
    const app = await buildApp();
    await request(app).patch('/api/informes/1/publicar').send({
      codigo_verificacion: 'AAAAAAAAAAAAAAAA', codigoVerificacion: 'AAAAAAAAAAAAAAAA',
      hash_contenido: 'x', publicado_por_nombre: 'Dr. Falso', signature: { doctorName: 'Dr. Falso' }
    });
    const params = queryMock.mock.calls[2][1];
    expect(params[3]).not.toBe('AAAAAAAAAAAAAAAA');
    expect(params[4]).not.toBe('x');
    expect(params[5]).toBe('Bioanalista Demo');
  });

  it('conserva el código de verificación si el informe ya estaba sellado (republicación)', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ ...informeActual, codigo_verificacion: 'ABCDEFGHJKMNPQRS' }] })
      .mockResolvedValueOnce({ rows: [{ id_informe: 1 }] });
    const app = await buildApp();
    await request(app).patch('/api/informes/1/publicar').send({});
    expect(queryMock.mock.calls[2][1][3]).toBe('ABCDEFGHJKMNPQRS');
  });

  it('la huella cambia si cambia el contenido que se publica', async () => {
    const huellas: string[] = [];
    for (const conclusiones of ['Normal', 'Anemia leve']) {
      queryMock.mockReset();
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ ...informeActual, conclusiones_medico: conclusiones }] })
        .mockResolvedValueOnce({ rows: [{ id_informe: 1 }] });
      const app = await buildApp();
      await request(app).patch('/api/informes/1/publicar').send({});
      huellas.push(queryMock.mock.calls[2][1][4]);
    }
    expect(huellas[0]).not.toBe(huellas[1]);
  });

  it('rechaza con 403 a un rol sin validacion_publicacion', async () => {
    currentStaffUser = { idUsuario: 3, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/1/publicar');
    expect(res.status).toBe(403);
  });

  it('devuelve 404 si el informe no existe o ya fue eliminado (y no intenta el UPDATE)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/999/publicar');
    expect(res.status).toBe(404);
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it('rechaza con 409 (DOBLE_VERIFICACION_PENDIENTE) si la orden tiene un resultado crítico sin verificar, y NO publica', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }); // hay un crítico pendiente
    const app = await buildApp();
    const res = await request(app).patch('/api/informes/1/publicar').send({ signature: { doctorName: 'Dr. Demo' } });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DOBLE_VERIFICACION_PENDIENTE');
    // Solo se hizo la consulta de verificación; jamás el UPDATE a 'publicado'.
    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(queryMock.mock.calls[0][0]).not.toMatch(/UPDATE informe_clinico/);
  });
});

describe('DELETE /api/informes/:id', () => {
  it('elimina lógicamente (nunca borra la fila) y guarda el motivo', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_informe: 1, eliminado: true, fecha_eliminacion: '2026-01-01' }] });
    const app = await buildApp();
    const res = await request(app).delete('/api/informes/1').send({ motivo: 'Duplicado' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, id_informe: 1, eliminado: true });
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).not.toMatch(/DELETE FROM informe_clinico/);
    expect(sql).toMatch(/eliminado = TRUE/);
    expect(params).toEqual([1, 'Duplicado', 1]);
  });

  it('devuelve 404 si ya estaba eliminado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).delete('/api/informes/999');
    expect(res.status).toBe(404);
  });

  it('rechaza con 403 a un rol sin validacion_redaccion', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'tecnico_flebotomista', status: 'activo', nombreCompleto: 'Técnico Demo' };
    const app = await buildApp();
    const res = await request(app).delete('/api/informes/1');
    expect(res.status).toBe(403);
  });
});

describe('GET /api/informes/:id/pdf', () => {
  const lab = { nombre_laboratorio: 'VACLINIC', nombre_legal: 'Vaclinic S.A.', lab_papel: 'letter', color_primario: '#0d9488' };
  const filaBase: any = {
    id_informe: 1, id_orden: 5, numero_informe: 'LAB-2026-0001', titulo: 'Perfil', categoria: 'hematologia',
    estado: 'publicado', eliminado: false, hallazgos_clinicos: null, conclusiones_medico: 'Normal',
    explicacion_paciente: null, recomendaciones: ['Control'],
    datos_json: { patientName: 'Ana Pérez', parameters: [{ name: 'Hb', value: 14, unit: 'g/dL', referenceRange: '12-16', status: 'normal' }] },
    codigo_verificacion: null, hash_contenido: null, fecha_publicacion: '2026-10-01T10:00:00Z',
    publicado_por_nombre: 'Dra. Demo', publicado_por_colegiado: 'COL-1', publicado_por_especialidad: 'Bioanálisis', ...lab
  };
  async function sellada(over: Record<string, any> = {}) {
    const { hashContenido } = await import('../informeIntegridad');
    const fila = { ...filaBase, codigo_verificacion: 'ABCDEFGHJKMNPQRS', ...over };
    return { ...fila, hash_contenido: over.hash_contenido ?? hashContenido(fila) };
  }

  it('informe publicado e íntegro -> 200 application/pdf con QR de verificación', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [await sellada()] })
      .mockResolvedValueOnce({ rows: [{ validado_por_nombre: 'Lic. A', verificado_por_nombre: null }] });
    const app = await buildApp();
    const res = await request(app).get('/api/informes/1/pdf').buffer(true).parse((r, cb) => {
      const chunks: Buffer[] = []; r.on('data', (c: Buffer) => chunks.push(c)); r.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toMatch(/Informe-LAB-2026-0001\.pdf/);
    expect(res.headers['cache-control']).toBe('no-store');
    expect((res.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('PUBLIC_BASE_URL manda sobre el Host para armar la URL del QR', async () => {
    process.env.PUBLIC_BASE_URL = 'https://lab.example.com/';
    try {
      queryMock.mockResolvedValueOnce({ rows: [await sellada()] }).mockResolvedValueOnce({ rows: [] });
      const app = await buildApp();
      const res = await request(app).get('/api/informes/1/pdf').set('Host', 'evil.test');
      expect(res.status).toBe(200);
    } finally {
      delete process.env.PUBLIC_BASE_URL;
    }
  });

  it('informe en borrador -> 200 (con marca de agua), sin exigir sello', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ ...filaBase, estado: 'borrador' }] }).mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).get('/api/informes/1/pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/BORRADOR/);
  });

  it('publicado pero el contenido cambió tras el sello -> 409 INFORME_MODIFICADO (no emite PDF)', async () => {
    const fila = await sellada();
    queryMock.mockResolvedValueOnce({ rows: [{ ...fila, conclusiones_medico: 'Editado después de publicar' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/informes/1/pdf');
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INFORME_MODIFICADO');
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it('publicado sin sello (anterior a la migración) -> 409 INFORME_SIN_SELLO', async () => {
    queryMock.mockResolvedValueOnce({ rows: [filaBase] });
    const app = await buildApp();
    const res = await request(app).get('/api/informes/1/pdf');
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INFORME_SIN_SELLO');
  });

  it('404 si no existe / eliminado, 400 si el id no es válido', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    expect((await request(app).get('/api/informes/999/pdf')).status).toBe(404);
    expect((await request(app).get('/api/informes/abc/pdf')).status).toBe(400);
  });
});
