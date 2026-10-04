import { describe, it, expect } from 'vitest';
import { lineaContactoLab } from './lineaContactoLab';

describe('lineaContactoLab', () => {
  it('usa solo lo configurado', () => {
    expect(lineaContactoLab({ city: 'Guatemala', phone: '2222-3333', sanitaryLicense: 'LS-1' })).toBe('Guatemala • Tel. 2222-3333 • Registro sanitario: LS-1');
  });
  it('sin datos devuelve vacío (no inventa nada)', () => {
    expect(lineaContactoLab({})).toBe('');
    expect(lineaContactoLab(undefined)).toBe('');
  });
  it('usa WhatsApp si no hay teléfono y puede omitir el registro', () => {
    expect(lineaContactoLab({ whatsappNumber: '5555-1111', sanitaryLicense: 'X' }, false)).toBe('Tel. 5555-1111');
  });
});
