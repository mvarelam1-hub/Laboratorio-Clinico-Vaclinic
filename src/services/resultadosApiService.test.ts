import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Pruebas del cliente de resultados (doble verificación de críticos,
 * migración 0018): que el código de negocio del servidor llegue intacto al
 * frontend (ClinicContext.publishReport lo usa para NO publicar un informe
 * con un crítico sin verificar) y que las llamadas apunten a las rutas
 * correctas.
 */
vi.mock('./staffSessionToken', () => ({ getStaffSessionToken: () => 'token-de-prueba' }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
afterEach(() => vi.unstubAllGlobals());

const respuesta = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe('resultadosApiService — doble verificación', () => {
  it('publicarResultadoRemoto propaga el código DOBLE_VERIFICACION_PENDIENTE y el status 409', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(409, { error: 'requiere un segundo bioanalista', code: 'DOBLE_VERIFICACION_PENDIENTE' }));
    const { publicarResultadoRemoto, ResultadosApiError } = await import('./resultadosApiService');
    const err = await publicarResultadoRemoto(5).catch((e) => e);
    expect(err).toBeInstanceOf(ResultadosApiError);
    expect(err.status).toBe(409);
    expect(err.code).toBe('DOBLE_VERIFICACION_PENDIENTE');
    expect(err.message).toMatch(/segundo bioanalista/);
  });

  it('verificarResultadoRemoto propaga SEPARACION_DE_FUNCIONES', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(409, { error: 'distinto de quien capturó', code: 'SEPARACION_DE_FUNCIONES' }));
    const { verificarResultadoRemoto } = await import('./resultadosApiService');
    const err = await verificarResultadoRemoto(5).catch((e) => e);
    expect(err.code).toBe('SEPARACION_DE_FUNCIONES');
  });

  it('un código desconocido del servidor se ignora (no se inventa un code)', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(409, { error: 'x', code: 'OTRA_COSA' }));
    const { publicarResultadoRemoto } = await import('./resultadosApiService');
    const err = await publicarResultadoRemoto(5).catch((e) => e);
    expect(err.code).toBeUndefined();
  });

  it('un error sin cuerpo JSON cae al mensaje genérico con el status', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => { throw new Error('sin json'); } });
    const { validarResultadoRemoto } = await import('./resultadosApiService');
    const err = await validarResultadoRemoto(1).catch((e) => e);
    expect(err.message).toBe('El servidor respondió 500.');
  });

  it('verificarResultadoRemoto llama PATCH /api/resultados/:id/verificar con el token de sesión', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(200, { ok: true, idResultado: 9, estadoAnterior: 'Validado', estadoNuevo: 'Validado' }));
    const { verificarResultadoRemoto } = await import('./resultadosApiService');
    await verificarResultadoRemoto(9);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/resultados/9/verificar');
    expect(opts.method).toBe('PATCH');
    expect(opts.headers.Authorization).toBe('Bearer token-de-prueba');
  });

  it('obtenerPendientesVerificacionRemoto hace GET a la cola y devuelve las filas', async () => {
    fetchMock.mockResolvedValueOnce(respuesta(200, [{ id_resultado: 7, puede_verificar: false }]));
    const { obtenerPendientesVerificacionRemoto } = await import('./resultadosApiService');
    const filas = await obtenerPendientesVerificacionRemoto();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/resultados/pendientes-verificacion');
    expect(filas[0].puede_verificar).toBe(false);
  });
});
