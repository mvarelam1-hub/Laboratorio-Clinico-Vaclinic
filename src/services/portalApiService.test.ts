import { describe, it, expect, vi, afterEach } from 'vitest';
import { etiquetaEstado, iniciarSesionPortal, obtenerInformesPortal, PortalApiError } from './portalApiService';

afterEach(() => { vi.unstubAllGlobals(); });

describe('etiquetaEstado', () => {
  it('traduce los estados a texto claro', () => {
    expect(etiquetaEstado('normal')).toEqual({ texto: 'Normal', anormal: false, critico: false });
    expect(etiquetaEstado('high').texto).toBe('Alto ↑');
    expect(etiquetaEstado('low').texto).toBe('Bajo ↓');
    expect(etiquetaEstado('critical').critico).toBe(true);
  });
  it('un estado desconocido se muestra como anormal, nunca como normal', () => {
    expect(etiquetaEstado('raro').anormal).toBe(true);
  });
  it('estado vacío cuenta como normal (valor por defecto del informe)', () => {
    expect(etiquetaEstado('').anormal).toBe(false);
  });
});

describe('portal API', () => {
  it('login: envía el código sin espacios y devuelve el token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token: 't', expiresInSeconds: 900 }) });
    vi.stubGlobal('fetch', fetchMock);
    const r = await iniciarSesionPortal('  ABC123 ');
    expect(r.token).toBe('t');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ codigo: 'ABC123' });
  });

  it('401 del servidor → error con sesionVencida y mensaje del servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: 'Sesión de portal inválida o expirada.' }) }));
    const e = await obtenerInformesPortal('x').catch((err) => err);
    expect(e).toBeInstanceOf(PortalApiError);
    expect(e.sesionVencida).toBe(true);
    expect(e.message).toMatch(/expirada/);
  });

  it('sin red → mensaje en español, no un error técnico', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const e = await iniciarSesionPortal('A').catch((err) => err);
    expect(e.message).toMatch(/conexión/i);
  });
});
