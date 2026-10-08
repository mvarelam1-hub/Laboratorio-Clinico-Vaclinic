import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

let currentStaffUser: any = { idUsuario: 1, roleId: 'bioanalista_senior', status: 'activo' };
vi.mock('../auth-staff', () => ({
  requireStaffAuth: (req: any, _res: any, next: any) => { req.staffUser = currentStaffUser; next(); },
}));
const queryMock = vi.fn();
vi.mock('../db', () => ({ pool: { query: (...a: any[]) => queryMock(...a) } }));

const generateMock = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: class { models = { generateContent: (...a: any[]) => generateMock(...a) }; },
}));

async function buildApp() {
  const { iaRouter } = await import('./ia');
  const app = express();
  app.use(express.json());
  app.use('/api/ia', iaRouter);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: any, _req: any, res: any, _next: any) => res.status(500).json({ error: err.message }));
  return app;
}

const cuerpo = { edad: 30, genero: 'F', parametros: [{ name: 'Glucosa', value: '92', unit: 'mg/dL', referenceRange: '70-100', status: 'normal' }] };
const buena = { resumen: 'Se midió la glucosa y está dentro del rango de referencia.', valores: [{ nombre: 'Glucosa', significado: 'Mide el azúcar en sangre; este valor está dentro del rango.' }], recordatorio: 'Texto informativo; su médico debe interpretar los resultados.' };

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  generateMock.mockReset();
  queryMock.mockResolvedValue({ rows: [] });
  currentStaffUser = { idUsuario: 1, roleId: 'bioanalista_senior', status: 'activo' };
  process.env.GEMINI_API_KEY = 'clave-de-prueba';
});

describe('POST /api/ia/interpretacion', () => {
  it('responde 503 si la IA no está configurada (sin inventar texto)', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await request(await buildApp()).post('/api/ia/interpretacion').send(cuerpo);
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('IA_NO_CONFIGURADA');
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('responde 403 si el rol no tiene el permiso de redacción', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'recepcion', status: 'activo' };
    const res = await request(await buildApp()).post('/api/ia/interpretacion').send(cuerpo);
    expect(res.status).toBe(403);
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('400 si no hay resultados capturados', async () => {
    const res = await request(await buildApp()).post('/api/ia/interpretacion').send({ parametros: [] });
    expect(res.status).toBe(400);
  });

  it('devuelve la explicación y registra bitácora, sin enviar identificación a la IA', async () => {
    generateMock.mockResolvedValueOnce({ text: JSON.stringify(buena) });
    const res = await request(await buildApp()).post('/api/ia/interpretacion').send({ ...cuerpo, patientName: 'Ana Pérez', nationalId: '999' });
    expect(res.status).toBe(200);
    expect(res.body.texto).toContain('Glucosa');
    const prompt = generateMock.mock.calls[0][0].contents as string;
    expect(prompt).not.toMatch(/Ana|999/);
    expect(queryMock.mock.calls[0][0]).toMatch(/historial_auditoria/);
  });

  it('rechaza (422) una salida con diagnóstico', async () => {
    generateMock.mockResolvedValueOnce({ text: JSON.stringify({ ...buena, resumen: 'La persona padece diabetes.' }) });
    const res = await request(await buildApp()).post('/api/ia/interpretacion').send(cuerpo);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('IA_SALIDA_RECHAZADA');
  });

  it('502 si la IA falla', async () => {
    generateMock.mockRejectedValueOnce(new Error('boom'));
    const res = await request(await buildApp()).post('/api/ia/interpretacion').send(cuerpo);
    expect(res.status).toBe(502);
  });
});
