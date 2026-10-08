import { describe, it, expect } from 'vitest';
import { mensajeResultadosListos, enlaceWhatsApp } from './mensajeResultados';

describe('mensajeResultadosListos', () => {
  it('incluye código y portal reales', () => {
    const m = mensajeResultadosListos({ paciente: ' Ana ', codigoConsulta: 'AB12', urlPortal: 'https://lab.example', laboratorio: 'VACLINIC', telefonoLab: '5555' });
    expect(m).toContain('Hola Ana');
    expect(m).toContain('Código de consulta: AB12');
    expect(m).toContain('https://lab.example');
  });
  it('sin código no inventa uno: pide solicitarlo en recepción', () => {
    const m = mensajeResultadosListos({ paciente: 'Ana', urlPortal: 'u', laboratorio: 'L' });
    expect(m).toContain('Solicite su código de consulta en recepción.');
    expect(m).not.toMatch(/Código de consulta:/);
  });
});

describe('enlaceWhatsApp', () => {
  it('sin teléfono válido devuelve null', () => {
    expect(enlaceWhatsApp('', 'x')).toBeNull();
    expect(enlaceWhatsApp('123', 'x')).toBeNull();
  });
  it('8 dígitos locales llevan prefijo 502; con prefijo se respeta', () => {
    expect(enlaceWhatsApp('5612-5563', 'hola')).toBe('https://wa.me/50256125563?text=hola');
    expect(enlaceWhatsApp('+502 5612 5563', 'hola')).toBe('https://wa.me/50256125563?text=hola');
  });
});
