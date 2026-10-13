import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parsearRss, combinarNoticias, limpiarTexto, obtenerNoticiasExternas,
  reiniciarCacheNoticiasExternas, FEEDS_EXTERNOS, VIGENCIA_CACHE_MS,
} from './noticiasExternas';

const rss = (items: string) => `<?xml version="1.0" encoding="utf-8"?><rss version="2.0"><channel><title>x</title>${items}</channel></rss>`;
const item = (t: string, l: string, d = 'Resumen &amp; más', f = 'Mon, 12 Oct 2026 20:00:00 +0100') =>
  `<item><title>${t}</title><link>${l}</link><description>${d}</description><pubDate>${f}</pubDate></item>`;

describe('limpiarTexto', () => {
  it('quita etiquetas, CDATA y entidades', () => {
    expect(limpiarTexto('<![CDATA[<b>Hola</b> &amp; adiós&nbsp;mundo]]>', 100)).toBe('Hola & adiós mundo');
  });
  it('recorta con puntos suspensivos', () => {
    const r = limpiarTexto('a'.repeat(50), 10);
    expect(r.length).toBe(10);
    expect(r.endsWith('…')).toBe(true);
  });
  it('no deja pasar etiquetas escapadas', () => {
    expect(limpiarTexto('&lt;script&gt;alert(1)&lt;/script&gt;Texto', 100)).toBe('alert(1) Texto');
  });
});

describe('parsearRss', () => {
  it('lee titular, enlace, resumen y fecha', () => {
    const n = parsearRss(rss(item('Título uno', 'https://www.labmedica.es/quimica-clinica/articles/1/a.html')), 'Química clínica');
    expect(n).toEqual([{
      titulo: 'Título uno', resumen: 'Resumen & más',
      enlace: 'https://www.labmedica.es/quimica-clinica/articles/1/a.html',
      fecha: '2026-10-12', fuente: 'LabMedica en Español', tema: 'Química clínica',
    }]);
  });
  it('descarta enlaces de otro dominio, http o inválidos', () => {
    const xml = rss(
      item('Malo 1', 'https://evil.example.com/x') +
      item('Malo 2', 'http://www.labmedica.es/x') +
      item('Malo 3', 'javascript:alert(1)') +
      item('Malo 4', 'https://labmedica.es.evil.com/x') +
      item('Bueno', 'https://www.labmedica.es/x')
    );
    expect(parsearRss(xml, 't').map((n) => n.titulo)).toEqual(['Bueno']);
  });
  it('descarta items sin título y tolera fecha inválida', () => {
    const xml = rss(item('', 'https://www.labmedica.es/a') + item('Ok', 'https://www.labmedica.es/b', 'r', 'no es fecha'));
    const n = parsearRss(xml, 't');
    expect(n).toHaveLength(1);
    expect(n[0].fecha).toBeNull();
  });
  it('devuelve vacío con XML basura', () => {
    expect(parsearRss('<html>nada</html>', 't')).toEqual([]);
  });
});

describe('combinarNoticias', () => {
  const n = (enlace: string, fecha: string | null) => ({ titulo: enlace, resumen: '', enlace, fecha, fuente: 'f', tema: 't' });
  it('quita repetidas, ordena por fecha y limita', () => {
    const r = combinarNoticias([[n('a', '2026-10-01'), n('b', '2026-10-03')], [n('a', '2026-10-01'), n('c', null)]], 2);
    expect(r.map((x) => x.enlace)).toEqual(['b', 'a']);
  });
});

describe('obtenerNoticiasExternas', () => {
  beforeEach(() => { reiniciarCacheNoticiasExternas(); vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('usa la caché y se actualiza tras 30 minutos', async () => {
    const f = vi.fn(async () => new Response(rss(item('T', 'https://www.labmedica.es/a')), { status: 200 }));
    vi.stubGlobal('fetch', f);
    const a = await obtenerNoticiasExternas();
    expect(a).toHaveLength(1);
    expect(f).toHaveBeenCalledTimes(FEEDS_EXTERNOS.length);
    await obtenerNoticiasExternas();
    expect(f).toHaveBeenCalledTimes(FEEDS_EXTERNOS.length);
    vi.advanceTimersByTime(VIGENCIA_CACHE_MS + 1000);
    await obtenerNoticiasExternas();
    expect(f).toHaveBeenCalledTimes(FEEDS_EXTERNOS.length * 2);
  });

  it('si la fuente falla devuelve [] sin lanzar error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sin red'); }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await obtenerNoticiasExternas()).toEqual([]);
  });

  it('si falla después de funcionar conserva lo último', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(rss(item('T', 'https://www.labmedica.es/a')), { status: 200 })));
    expect(await obtenerNoticiasExternas()).toHaveLength(1);
    vi.advanceTimersByTime(VIGENCIA_CACHE_MS + 1000);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500 })));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await obtenerNoticiasExternas()).toHaveLength(1);
  });
});
