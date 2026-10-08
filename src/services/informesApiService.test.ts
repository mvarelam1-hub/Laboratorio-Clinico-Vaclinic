import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Cliente de informes (migración 0019): el PDF oficial se pide al servidor con
 * la sesión del personal y los errores 409 de sello (INFORME_MODIFICADO /
 * INFORME_SIN_SELLO) llegan al usuario con el mensaje del servidor.
 */
vi.mock('./staffSessionToken', () => ({ getStaffSessionToken: () => 'token-de-prueba' }));

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

describe('informesApiService — PDF oficial y sello', () => {
  it('descargarInformePdfOficial pide GET /api/informes/:id/pdf con Bearer y devuelve el Blob', async () => {
    const blob = new Blob(['%PDF-'], { type: 'application/pdf' });
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, blob: async () => blob });
    const { descargarInformePdfOficial } = await import('./informesApiService');
    const out = await descargarInformePdfOficial(42);
    expect(out).toBe(blob);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/informes/42/pdf');
    expect(opts.headers.Authorization).toBe('Bearer token-de-prueba');
  });

  it('un 409 INFORME_MODIFICADO llega como InformesApiError con el mensaje del servidor', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ error: 'El contenido cambió después de publicarse', code: 'INFORME_MODIFICADO' }) });
    const { descargarInformePdfOficial, InformesApiError } = await import('./informesApiService');
    const err = await descargarInformePdfOficial(1).catch((e) => e);
    expect(err).toBeInstanceOf(InformesApiError);
    expect(err.status).toBe(409);
    expect(err.message).toMatch(/cambió después de publicarse/);
  });

  it('publicarInformeRemoto devuelve el código y la huella emitidos por el servidor', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({ id_informe: 1, numero_informe: 'X', estado: 'publicado', codigo_verificacion: 'ABCDEFGHJKMNPQRS', hash_contenido: 'a'.repeat(64) })
    });
    const { publicarInformeRemoto } = await import('./informesApiService');
    const row = await publicarInformeRemoto(1);
    expect(row.codigo_verificacion).toBe('ABCDEFGHJKMNPQRS');
    expect(row.hash_contenido).toBe('a'.repeat(64));
  });
});
