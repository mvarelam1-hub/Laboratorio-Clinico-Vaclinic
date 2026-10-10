import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { correoConfigurado, urlBase, enviarCorreo, plantillaRecuperacion, plantillaUsuario } from './mailer';

const ENTORNO = { ...process.env };

beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.MAIL_FROM;
  delete process.env.APP_BASE_URL;
});

afterEach(() => {
  process.env = { ...ENTORNO };
  vi.unstubAllGlobals();
});

describe('mailer', () => {
  it('sin configuración no envía y no falla', async () => {
    expect(correoConfigurado()).toBe(false);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const r = await enviarCorreo({ para: 'a@b.com', asunto: 'x', texto: 'x', html: 'x' });
    expect(r.enviado).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envía por la API de Resend cuando está configurado', async () => {
    process.env.RESEND_API_KEY = 're_clave_de_prueba';
    process.env.MAIL_FROM = 'VACLINIC <no-responder@ejemplo.com>';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    const r = await enviarCorreo({ para: 'persona@ejemplo.com', asunto: 'Hola', texto: 't', html: '<p>t</p>' });
    expect(r.enviado).toBe(true);
    const [url, opciones] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(opciones.headers.Authorization).toBe('Bearer re_clave_de_prueba');
    expect(JSON.parse(opciones.body).to).toEqual(['persona@ejemplo.com']);
  });

  it('informa el motivo cuando el proveedor rechaza el envío', async () => {
    process.env.RESEND_API_KEY = 're_clave_de_prueba';
    process.env.MAIL_FROM = 'VACLINIC <no-responder@ejemplo.com>';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    const r = await enviarCorreo({ para: 'a@b.com', asunto: 'x', texto: 'x', html: 'x' });
    expect(r.enviado).toBe(false);
    expect(r.motivo).toContain('403');
  });

  it('la URL base sale del entorno, sin barra final', () => {
    process.env.APP_BASE_URL = 'https://mi-sistema.example.com/';
    expect(urlBase()).toBe('https://mi-sistema.example.com');
  });

  it('la plantilla incluye el enlace, los minutos y escapa el nombre', () => {
    const p = plantillaRecuperacion({ nombre: '<b>Ana</b>', enlace: 'https://x.test/?reset=abc', minutos: 5 });
    expect(p.texto).toContain('https://x.test/?reset=abc');
    expect(p.texto).toContain('5 minutos');
    expect(p.html).toContain('&lt;b&gt;Ana&lt;/b&gt;');
    expect(p.html).not.toContain('<b>Ana</b>');
  });

  it('la plantilla de usuario muestra el usuario, el enlace y escapa el nombre', () => {
    const p = plantillaUsuario({ nombre: '<i>Ana</i>', usuario: 'ana@ejemplo.com', enlace: 'https://x.test' });
    expect(p.texto).toContain('ana@ejemplo.com');
    expect(p.texto).toContain('https://x.test');
    expect(p.html).toContain('&lt;i&gt;Ana&lt;/i&gt;');
    expect(p.html).not.toContain('<i>Ana</i>');
  });
});
