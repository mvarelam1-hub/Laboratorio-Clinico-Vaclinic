/**
 * Reglas de datos mínimos para registrar un paciente (las mismas que aplica
 * el servidor en server/routes/pacientes.ts; aquí se validan antes de enviar
 * para mostrar el error junto al campo y no perder tiempo en el mostrador).
 *
 * Nada de esto inventa datos: lo que falta se pide, no se rellena.
 */

export type CampoPaciente = 'nombre' | 'sexo' | 'nacimiento' | 'contacto' | 'correo' | 'encargadoNombre' | 'encargadoTelefono';

export interface DatosPacienteForm {
  nombre: string;
  sexo: string; // '' = sin elegir
  fechaNacimiento: string; // 'YYYY-MM-DD' o ''
  telefono: string;
  correo: string;
  encargadoNombre?: string;
  encargadoTelefono?: string;
}

export interface ResultadoValidacionPaciente {
  errores: Partial<Record<CampoPaciente, string>>;
  edad: number | null;
  esMenor: boolean;
  valido: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Años cumplidos a `hoy`; null si la fecha es inválida, futura o de más de 120 años. */
export function edadDesdeFecha(fechaISO: string, hoy: Date = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaISO || '')) return null;
  const [y, m, d] = fechaISO.split('-').map(Number);
  const nac = new Date(Date.UTC(y, m - 1, d));
  if (nac.getUTCMonth() !== m - 1) return null;
  const hy = hoy.getFullYear();
  const hm = hoy.getMonth() + 1;
  const hd = hoy.getDate();
  let edad = hy - y;
  if (hm < m || (hm === m && hd < d)) edad--;
  if (edad < 0 || edad > 120) return null;
  return edad;
}

/** Fecha de nacimiento aproximada (1 de julio del año) para quien solo conoce la edad. */
export function fechaDesdeEdadAproximada(edad: number, hoy: Date = new Date()): string {
  const anio = hoy.getFullYear() - Math.max(0, Math.floor(edad));
  return `${anio}-07-01`;
}

export function validarDatosPaciente(d: DatosPacienteForm, hoy: Date = new Date()): ResultadoValidacionPaciente {
  const errores: ResultadoValidacionPaciente['errores'] = {};
  if (!d.nombre.trim()) errores.nombre = 'Escribe el nombre completo.';
  if (d.sexo !== 'M' && d.sexo !== 'F' && d.sexo !== 'Otro') {
    errores.sexo = 'Elige el sexo: define los rangos de referencia del informe.';
  }
  const edad = edadDesdeFecha(d.fechaNacimiento, hoy);
  if (edad === null) {
    errores.nacimiento = d.fechaNacimiento
      ? 'La fecha de nacimiento no es válida.'
      : 'Indica la fecha de nacimiento o la edad.';
  }
  const tel = d.telefono.trim();
  const correo = d.correo.trim();
  if (!tel && !correo) errores.contacto = 'Registra un teléfono o un correo (al menos uno).';
  if (correo && !EMAIL_RE.test(correo)) errores.correo = 'El correo no tiene un formato válido.';
  const esMenor = edad !== null && edad < 18;
  if (esMenor) {
    if (!(d.encargadoNombre || '').trim()) errores.encargadoNombre = 'Menor de edad: indica el nombre del encargado legal.';
    if (!(d.encargadoTelefono || '').trim()) errores.encargadoTelefono = 'Menor de edad: indica el teléfono del encargado legal.';
  }
  return { errores, edad, esMenor, valido: Object.keys(errores).length === 0 };
}
