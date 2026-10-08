import { LabSettings } from '../types/labSettings';
import { LabStaffUser } from '../types';
import { esUsuarioSinSesion } from './staffProfile';

export interface DatosFirmante {
  name: string;
  specialty: string;
  license: string;
}

const VACIO: DatosFirmante = { name: '', specialty: '', license: '' };

/**
 * Firmantes por defecto de un informe, SIEMPRE de personas reales:
 *  - Los firmantes habilitados en Ajustes (el laboratorio los configuró), o
 *  - el usuario con sesión iniciada como responsable (bioanalista).
 * Nunca se inventan nombres ni números de colegiado: si no hay dato, queda vacío
 * y el informe no muestra una firma que no existe.
 */
export function firmantesPorDefecto(
  labSettings: Pick<LabSettings, 'signers'> | null | undefined,
  usuario: LabStaffUser | null | undefined
): { bioanalista: DatosFirmante; medico: DatosFirmante } {
  const habilitados = (labSettings?.signers || []).filter((s) => s.enabled && s.name && s.name.trim());
  const aDatos = (s: { name: string; specialty?: string; licenseNumber?: string }): DatosFirmante => ({
    name: s.name.trim(), specialty: s.specialty?.trim() || '', license: s.licenseNumber?.trim() || ''
  });

  const bioanalista = habilitados[0]
    ? aDatos(habilitados[0])
    : usuario && !esUsuarioSinSesion(usuario)
      ? { name: usuario.fullName, specialty: usuario.specialty || '', license: usuario.licenseNumber || '' }
      : VACIO;
  const medico = habilitados[1] ? aDatos(habilitados[1]) : VACIO;
  return { bioanalista, medico };
}
