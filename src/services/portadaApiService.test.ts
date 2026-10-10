import { describe, it, expect, vi, afterEach } from 'vitest';

let token: string | null = 'token-de-prueba';
vi.mock('./staffSessionToken', () => ({ getStaffSessionToken: () => token }));

import {
  POSICIONES_PORTADA,
  calcularTamano,
  urlImagenPortada,
  obtenerPortada,
  subirImagenPortada,
  quitarImagenPortada,
  prepararImagen
} from './portadaApiService';
import { CLAVES_PORTADA } from '../../server/routes/portada';

afterEach(() => {
  vi.unstubAllGlobals();
  token = 'token-de-prueba';
});

describe('portadaApiService', () => {
  it('las posiciones del cliente son exactamente las que acepta el servidor', () => {
    expect(POSICIONES_PORTADA.map((p) => p.clave).sort()).toEqual([...CLAVES_PORTADA].sort());
  });

  it('calcularTamano reduce conservando la proporción y nunca agranda', () => {
    expect(calcularTamano(4000, 2000, 1600)).toEqual({ ancho: 1600, alto: 800 });
    expect(calcularTamano(1000, 3000, 300)).toEqual({ ancho: 100, alto: 300 });
    expect(calcularTamano(200, 100, 600)).toEqual({ ancho: 200, alto: 100 });
  });

  it('urlImagenPortada incluye la versión para que el navegador recargue al cambiar', () => {
    expect(urlImagenPortada('logo', 123)).toBe('/api/portada/imagen/logo?v=123');
  });

  it('obtenerPortada devuelve el mapa del servidor y, si falla la red, un mapa vacío', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ imagenes: { logo: { version: 5 } } }) }));
    expect(await obtenerPortada()).toEqual({ logo: { version: 5 } });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));
    expect(await obtenerPortada()).toEqual({});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await obtenerPortada()).toEqual({});
  });

  it('subirImagenPortada manda el token y la imagen en base64', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await subirImagenPortada('logo', 'QUJD')).toEqual({ ok: true });
    const [url, op] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/portada-admin/imagen/logo');
    expect(op.method).toBe('PUT');
    expect(op.headers.Authorization).toBe('Bearer token-de-prueba');
    expect(JSON.parse(op.body)).toEqual({ base64: 'QUJD' });
  });

  it('sin sesión no intenta llamar al servidor', async () => {
    token = null;
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const r = await quitarImagenPortada('fondo');
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('un rol sin permiso recibe un mensaje claro (403) y los errores del servidor se muestran', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({ error: 'x' }) }));
    const sinPermiso = await subirImagenPortada('logo', 'QUJD');
    expect(sinPermiso.ok === false && sinPermiso.message).toMatch(/administrador de sistemas y el director/);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 413, json: async () => ({ error: 'La imagen pesa más de 1.5 MB. Elige una más ligera.' }) }));
    const grande = await subirImagenPortada('logo', 'QUJD');
    expect(grande.ok === false && grande.message).toContain('1.5 MB');
  });

  it('prepararImagen rechaza archivos que no son PNG, JPG o WebP antes de procesar nada', async () => {
    const svg = { type: 'image/svg+xml', size: 100 } as unknown as File;
    const r = await prepararImagen(svg, 300);
    expect(r.ok).toBe(false);
    const enorme = { type: 'image/png', size: 30 * 1024 * 1024 } as unknown as File;
    expect((await prepararImagen(enorme, 300)).ok).toBe(false);
  });
});
