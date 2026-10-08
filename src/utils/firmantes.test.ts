import { describe, it, expect } from 'vitest';
import { firmantesPorDefecto } from './firmantes';
import { perfilDesdeServidor, USUARIO_SIN_SESION } from './staffProfile';

const s = (name: string, enabled = true) => ({ id: name, enabled, name, roleTitle: '', specialty: 'Esp', licenseNumber: 'Col 1', signatureType: 'crypto_generated' as const, showStamp: false, showValidationHash: false });

describe('firmantesPorDefecto', () => {
  it('usa los firmantes habilitados en Ajustes', () => {
    const r = firmantesPorDefecto({ signers: [s('Ana'), s('Luis')] } as any, null);
    expect(r.bioanalista).toEqual({ name: 'Ana', specialty: 'Esp', license: 'Col 1' });
    expect(r.medico.name).toBe('Luis');
  });
  it('omite firmantes deshabilitados o sin nombre', () => {
    const r = firmantesPorDefecto({ signers: [s('Ana', false), s('  '), s('Luis')] } as any, null);
    expect(r.bioanalista.name).toBe('Luis');
    expect(r.medico.name).toBe('');
  });
  it('sin firmantes en Ajustes, el responsable es el usuario con sesión', () => {
    const u = perfilDesdeServidor({ idUsuario: 3, nombreCompleto: 'Marlon Varela', roleId: 'bioanalista' });
    const r = firmantesPorDefecto({ signers: [] } as any, u);
    expect(r.bioanalista.name).toBe('Marlon Varela');
    expect(r.medico).toEqual({ name: '', specialty: '', license: '' });
  });
  it('sin firmantes ni sesión, queda todo vacío (nunca un nombre inventado)', () => {
    const r = firmantesPorDefecto(undefined, USUARIO_SIN_SESION);
    expect(r.bioanalista.name).toBe('');
    expect(r.medico.name).toBe('');
  });
});
