import { describe, it, expect } from 'vitest';
import { combinarPacientesRemotos, PacienteApiRow } from './pacientesApiService';
import type { Patient } from '../types';

const fila = (id: number, nombre: string, extra: Partial<PacienteApiRow> = {}): PacienteApiRow => ({
  id_paciente: id, nombre_completo: nombre, dni: `D${id}`, fecha_nacimiento: '1990-01-01', genero: 'F', ...extra
});
const local = (id: string, nombre: string, extra: Partial<Patient> = {}) => ({ id, fullName: nombre, nationalId: '', ...extra } as Patient);

describe('combinarPacientesRemotos', () => {
  it('sin filas remotas no toca lo local', () => {
    const l = [local('pat-9', 'Local')];
    expect(combinarPacientesRemotos(l, [])).toBe(l);
  });
  it('los remotos van primero y reemplazan a su par local, conservando alergias', () => {
    const l = [local('5', 'Nombre viejo', { allergies: ['Penicilina'] } as Partial<Patient>)];
    const r = combinarPacientesRemotos(l, [fila(5, 'Nombre nuevo'), fila(6, 'Otro')]);
    expect(r.map((p) => p.id)).toEqual(['5', '6']);
    expect(r[0].fullName).toBe('Nombre nuevo');
    expect(r[0].allergies).toEqual(['Penicilina']);
  });
  it('conserva los pacientes que solo existen en este equipo', () => {
    const r = combinarPacientesRemotosPrueba();
    expect(r.map((p) => p.id)).toEqual(['1', 'pat-offline']);
  });
});

function combinarPacientesRemotosPrueba() {
  return combinarPacientesRemotos([local('pat-offline', 'Sin conexión')], [fila(1, 'Remoto')]);
}
