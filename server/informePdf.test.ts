import { describe, it, expect } from 'vitest';
import { generarInformePdf, limpiarTexto, construirUrlVerificacion, DatosInformePdf } from './informePdf';

const base: DatosInformePdf = {
  numero_informe: 'LAB-1', titulo: 'Perfil', estado: 'publicado',
  paciente: { nombre: 'Ana', documento: '1', edad: 30, genero: 'F' },
  parametros: [{ name: 'Hb', value: 14, unit: 'g/dL', referenceRange: '12-16', status: 'normal' }],
  laboratorio: { nombre: 'VACLINIC' },
  firmas: { publicado_por: 'Dra. Demo', validado_por: ['Lic. A'], verificado_por: [] }
};
const sello = { codigo: 'ABCDEFGHJKMNPQRS', hash: 'a'.repeat(64), url: 'https://x.test/verificar/ABCDEFGHJKMNPQRS?h=aaaaaaaaaaaaaaaa' };

describe('limpiarTexto', () => {
  it('conserva acentos, ñ y ü', () => {
    expect(limpiarTexto('Peña Álvarez güero ¿qué?')).toBe('Peña Álvarez güero ¿qué?');
  });
  it('transcribe los símbolos que la fuente estándar NO dibuja (salen en blanco)', () => {
    expect(limpiarTexto('10³/µL')).toBe('10^3/uL');
    expect(limpiarTexto('m²')).toBe('m^2');
    expect(limpiarTexto('≥ 5 – 10 “x” …')).toBe('>= 5 - 10 "x" ...');
  });
  it('nunca deja pasar caracteres de control ni emojis sin reemplazo', () => {
    expect(limpiarTexto('a\u0000b')).toBe('a b');
    expect(limpiarTexto('ok 🙂')).toBe('ok ?');
  });
  it('tolera null/undefined', () => {
    expect(limpiarTexto(null)).toBe('');
    expect(limpiarTexto(undefined)).toBe('');
  });
});

describe('construirUrlVerificacion', () => {
  it('une base sin barra final, código y prefijo de huella', () => {
    expect(construirUrlVerificacion('https://lab.test/', 'ABC', 'f'.repeat(64))).toBe('https://lab.test/verificar/ABC?h=ffffffffffffffff');
    expect(construirUrlVerificacion('https://lab.test', 'ABC')).toBe('https://lab.test/verificar/ABC');
  });
});

describe('generarInformePdf', () => {
  const texto = (b: Uint8Array) => Buffer.from(b).toString('latin1');

  it('genera un PDF válido, oficial y con QR (imagen incrustada)', async () => {
    const pdf = await generarInformePdf({ ...base, sello });
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe('%PDF-');
    expect(texto(pdf)).toContain('/Subtype /Image');
  });

  it('sin sello (borrador) no incluye QR', async () => {
    const pdf = await generarInformePdf({ ...base, estado: 'borrador' });
    expect(texto(pdf)).not.toContain('/Subtype /Image');
  });

  it('pagina listas largas sin lanzar errores y con textos hostiles', async () => {
    const parametros = Array.from({ length: 300 }, (_, n) => ({
      name: `Prueba ${n} ` + 'larga '.repeat(30), value: 'x'.repeat(200), unit: '≥µ³', referenceRange: '–'.repeat(120),
      status: n % 5 === 0 ? 'critical' : 'weird', section: `Sección ${Math.floor(n / 40)}`, notes: 'nota '.repeat(50)
    }));
    const pdf = await generarInformePdf({
      ...base, sello, parametros, conclusiones: 'c '.repeat(3000), recomendaciones: Array.from({ length: 50 }, (_, n) => `Rec ${n}`),
      paciente: { nombre: '<script>alert(1)</script> 🙂', documento: null, edad: undefined, genero: '' }
    });
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(5000);
  });

  it('acepta informe sin parámetros ni firmantes', async () => {
    const pdf = await generarInformePdf({ ...base, parametros: [], firmas: { validado_por: [], verificado_por: [] }, sello });
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it.each(['letter', 'a4', 'legal', 'raro', null])('papel %s no rompe', async (papel) => {
    const pdf = await generarInformePdf({ ...base, laboratorio: { nombre: 'X', papel: papel as any }, sello });
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it('color primario inválido cae al valor por defecto', async () => {
    const pdf = await generarInformePdf({ ...base, laboratorio: { nombre: 'X', color_primario: 'no-es-color' }, sello });
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it('imprime hasta 3 firmantes (Elaborado por / Visto bueno / Autorizado por) y acepta su imagen de firma', async () => {
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const firmas = {
      validado_por: [], verificado_por: [],
      firmantes: [
        { rotulo: 'Elaborado por', nombre: 'Ana Uno' },
        { rotulo: 'Visto bueno', nombre: 'Beto Dos', colegiado: '4504', imagen: png },
        { rotulo: 'Autorizado por', nombre: 'Carla Tres', imagen: 'no-es-una-imagen' }
      ]
    };
    const pdf = await generarInformePdf({ ...base, numero_orden: '105-2026', firmas, sello });
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe('%PDF-');
    expect(Buffer.from(pdf).toString('latin1')).toContain('/Subtype /Image');
    // Un borrador nunca lleva imágenes, aunque haya firmas configuradas.
    const borrador = await generarInformePdf({ ...base, estado: 'borrador', firmas });
    expect(Buffer.from(borrador).toString('latin1')).not.toContain('/Subtype /Image');
  });
});
