import type { LaboratorioPublico } from '../services/publicoApiService';

/**
 * Datos de contacto que el laboratorio ya muestra en el encabezado y pie de
 * página del sistema. El portal los usa solo cuando en Ajustes todavía no se
 * han llenado los equivalentes; lo que se configure en Ajustes siempre manda.
 */
export const CONTACTO_PREDETERMINADO: LaboratorioPublico = {
  nombre: 'VACLINIC - Laboratorio Clínico',
  eslogan: 'Precisión que diagnostica, confianza que cuida',
  direccion: 'Entrada de Pineda, Oratorio, Santa Rosa km 79.5',
  ciudad: null,
  departamento: null,
  telefono: '56125563',
  telefonoSecundario: null,
  whatsapp: '56125563',
  email: null,
  website: null,
};

/** Combina lo configurado en Ajustes (si no está vacío) sobre los datos predeterminados. */
export function contactoFinal(configurado: LaboratorioPublico | null): LaboratorioPublico {
  const salida: LaboratorioPublico = { ...CONTACTO_PREDETERMINADO };
  if (configurado) {
    (Object.keys(salida) as (keyof LaboratorioPublico)[]).forEach((k) => {
      if (configurado[k]) salida[k] = configurado[k];
    });
  }
  return salida;
}
