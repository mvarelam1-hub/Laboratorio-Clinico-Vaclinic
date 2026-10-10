import { describe, it, expect, vi, afterEach } from 'vitest';
import { solicitarRecuperacion, restablecerConToken } from './staffAuthService';

afterEach(() => vi.unstubAllGlobals());

describe('servicios de recuperación de contraseña', () => {
  it('solicitarRecuperacion manda el correo y devuelve el mensaje del servidor', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, mensaje: 'Revisa tu correo.' }) });
    vi.stubGlobal('fetch', fetchMock);
    const r = await solicitarRecuperacion('persona@ejemplo.com');
    expect(r).toEqual({ ok: true, mensaje: 'Revisa tu correo.' });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/forgot-password');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ correo: 'persona@ejemplo.com' });
  });

  it('solicitarRecuperacion informa el error del servidor (por ejemplo, correo faltante)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'El correo es obligatorio.' }) }));
    const r = await solicitarRecuperacion('');
    expect(r).toEqual({ ok: false, message: 'El correo es obligatorio.' });
  });

  it('restablecerConToken envía token y contraseña nueva', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const r = await restablecerConToken('abc', 'contrasena-nueva-123');
    expect(r).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/auth/reset-password');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ token: 'abc', nuevaContrasena: 'contrasena-nueva-123' });
  });

  it('restablecerConToken devuelve el mensaje de enlace vencido', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'El enlace es inválido o ya venció. Solicita uno nuevo.' }) }));
    const r = await restablecerConToken('abc', 'contrasena-nueva-123');
    expect(r.ok).toBe(false);
  });

  it('si no hay red, avisa sin lanzar errores', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('sin red')));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = await solicitarRecuperacion('persona@ejemplo.com');
    expect(r.ok).toBe(false);
  });
});
