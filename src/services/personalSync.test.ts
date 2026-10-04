import { describe, it, expect } from 'vitest';
import { mapPersonalApiToStaffUser, combinarPersonalRemoto, PersonalApiRow } from './personalApiService';
import type { LabStaffUser } from '../types';

const fila = (id: number, extra: Record<string, unknown> = {}): PersonalApiRow => ({
  id_usuario: id, nombre_completo: `Persona ${id}`, rol: 'bioanalista', estado: true, pin_code: '1234',
  correo: `p${id}@x.com`, numero_colegiado: 'Col 9', fecha_creacion: '2026-01-01T00:00:00Z', ...extra
});

describe('mapPersonalApiToStaffUser', () => {
  it('toma todo de la base, sin inventar datos', () => {
    const u = mapPersonalApiToStaffUser(fila(4), { bioanalista: 'Bioanalista' });
    expect(u).toMatchObject({ id: 'usr-remote-4', remoteId: 4, fullName: 'Persona 4', email: 'p4@x.com', licenseNumber: 'Col 9', roleName: 'Bioanalista', status: 'activo', phone: '', specialty: '' });
  });
  it('estado false → inactivo', () => {
    expect(mapPersonalApiToStaffUser(fila(5, { estado: false })).status).toBe('inactivo');
  });
});

describe('combinarPersonalRemoto', () => {
  it('conserva la biometría local y los usuarios solo-locales', () => {
    const l = [{ id: 'usr-remote-1', remoteId: 1, biometricEnrolled: true } as LabStaffUser, { id: 'usr-x', fullName: 'Solo local' } as LabStaffUser];
    const r = combinarPersonalRemoto(l, [fila(1)]);
    expect(r[0].biometricEnrolled).toBe(true);
    expect(r[0].fullName).toBe('Persona 1');
    expect(r.map((u) => u.id)).toEqual(['usr-remote-1', 'usr-x']);
  });
  it('sin filas devuelve lo local', () => {
    const l = [{ id: 'a' } as LabStaffUser];
    expect(combinarPersonalRemoto(l, [])).toBe(l);
  });
});
