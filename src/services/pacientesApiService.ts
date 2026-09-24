/**
 * Cliente HTTP para el módulo real de pacientes (Etapa "sistema real", ver
 * server/routes/pacientes.ts). Antes, la creación/edición de pacientes en
 * ClinicContext.tsx SOLO escribía a localStorage — el backend real (probado
 * con 82+ pruebas, ya usado por el portal del paciente) nunca se enteraba.
 *
 * Este archivo es la única pieza que sabe traducir entre el formato del
 * backend (columnas en snake_case, ej. `nombre_completo`) y el tipo
 * `Patient` del frontend (camelCase en inglés, ej. `fullName`) — así el
 * resto del código de ClinicContext.tsx no tiene que conocer esa diferencia.
 *
 * Nota de alcance (honesta, no todo está migrado todavía): esto cubre
 * PACIENTES únicamente. Órdenes, resultados y el resto de módulos de
 * ClinicContext.tsx siguen en localStorage — ver comentarios en
 * ClinicContext.tsx junto a `addPatient`/`updatePatient`.
 */

import { getFirebaseAuth } from './firebaseConfig';
import { Patient } from '../types';

export class PacientesApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'PacientesApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new PacientesApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
  }
  const idToken = await user.getIdToken();
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
      ...(options.headers || {})
    }
  });
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error) return body.error;
  } catch {
    /* respuesta sin cuerpo JSON, se usa el status */
  }
  return `El servidor respondió ${res.status}.`;
}

/** Fila cruda tal como la devuelve server/routes/pacientes.ts (snake_case). */
interface PacienteApiRow {
  id_paciente: number;
  nombre_completo: string;
  dni?: string | null;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  telefono_whatsapp?: string | null;
  correo?: string | null;
  direccion?: string | null;
  es_menor_edad?: boolean | null;
  nombre_encargado_legal?: string | null;
  telefono_encargado_legal?: string | null;
  fecha_registro?: string | null;
}

/**
 * Traduce una fila real de la base de datos al tipo `Patient` del frontend.
 *
 * NOTA sobre `accessCode`/`pinCode`: la tabla `paciente` real NO tiene estas
 * columnas -a propósito, ver el comentario al inicio de pacientes.ts: el
 * diseño documentado en la tesis (cap. 4) es un único código de consulta
 * POR ORDEN (`codigo_consulta`), no un PIN por paciente. `Patient.accessCode`
 * y `Patient.pinCode` son campos heredados de una versión anterior del
 * frontend que varias pantallas todavía leen para mostrarlos en cartelitos;
 * en vez de tocar esas ~20 pantallas en este cambio, se rellenan aquí con un
 * valor local de solo-lectura visual, claramente no persistido ni usado
 * para autenticar nada real.
 */
export function mapPacienteApiToPatient(row: PacienteApiRow, existing?: Partial<Patient>): Patient {
  const id = String(row.id_paciente);
  return {
    id,
    patientCode: existing?.patientCode || `VAC-${String(row.id_paciente).padStart(6, '0')}`,
    nationalId: row.dni || '',
    accessCode: existing?.accessCode || `MED-${id.slice(-4).padStart(4, '0')}`,
    pinCode: existing?.pinCode || id.slice(-4).padStart(4, '0'),
    fullName: row.nombre_completo,
    gender: (row.genero as Patient['gender']) || 'Otro',
    birthDate: row.fecha_nacimiento || '',
    age: row.fecha_nacimiento ? calcularEdad(row.fecha_nacimiento) : (existing?.age ?? 0),
    phone: row.telefono_whatsapp || '',
    email: row.correo || '',
    bloodType: existing?.bloodType || '',
    allergies: existing?.allergies || [],
    address: row.direccion || '',
    patientType: existing?.patientType,
    defaultProgram: existing?.defaultProgram,
    emergencyContact: existing?.emergencyContact || {
      name: row.nombre_encargado_legal || '',
      phone: row.telefono_encargado_legal || '',
      relation: row.nombre_encargado_legal ? 'Encargado legal' : ''
    },
    createdAt: row.fecha_registro || new Date().toISOString()
  };
}

function calcularEdad(fechaNacimiento: string): number {
  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime())) return 0;
  const diffMs = Date.now() - nacimiento.getTime();
  return Math.max(0, Math.floor(diffMs / (365.25 * 24 * 3600 * 1000)));
}

export interface CrearPacienteInput {
  nombreCompleto: string;
  dni?: string;
  fechaNacimiento: string;
  genero?: string;
  telefonoWhatsApp: string;
  correo?: string;
  direccion?: string;
  esMenorEdad?: boolean;
  nombreEncargadoLegal?: string;
  telefonoEncargadoLegal?: string;
}

export async function createPacienteRemote(input: CrearPacienteInput): Promise<PacienteApiRow> {
  const res = await authFetch('/api/pacientes', { method: 'POST', body: JSON.stringify(input) });
  if (!res.ok) throw new PacientesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function updatePacienteRemote(idPaciente: string, updates: Partial<CrearPacienteInput>): Promise<PacienteApiRow> {
  const res = await authFetch(`/api/pacientes/${idPaciente}`, { method: 'PATCH', body: JSON.stringify(updates) });
  if (!res.ok) throw new PacientesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function fetchPacientesRemote(limite = 200): Promise<PacienteApiRow[]> {
  const res = await authFetch(`/api/pacientes?limite=${limite}`);
  if (!res.ok) throw new PacientesApiError(await parseErrorBody(res), res.status);
  return res.json();
}

/** Un id de paciente es "remoto" (existe de verdad en Postgres) si es
 *  puramente numérico -las filas de demo/localStorage anteriores usan ids
 *  tipo "pat-1234567890" o los que trae INITIAL_PATIENTS-. Antes de intentar
 *  sincronizar una actualización contra la API, hay que distinguir ambos
 *  casos: no tiene sentido mandar PATCH /api/pacientes/pat-123 (fallaría).
 */
export function esPacienteIdRemoto(id: string): boolean {
  return /^\d+$/.test(id);
}
