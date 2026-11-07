/**
 * Sello de integridad del informe clínico (migración 0019).
 *
 * Qué se sella: el CONTENIDO clínico que el paciente o el médico lee
 * (identificación del informe, datos del paciente, parámetros con valor/
 * unidad/rango/estado, hallazgos, conclusiones, explicación, recomendaciones)
 * y quién lo publicó. NO se sellan marcas de tiempo ni ids internos: son
 * volátiles (zona horaria al leer/escribir, renumeraciones) y harían que una
 * verificación legítima fallara sin que nadie haya tocado el contenido.
 *
 * La forma canónica ordena las claves de cualquier objeto (jsonb de Postgres
 * no conserva el orden de claves) para que el mismo contenido produzca
 * SIEMPRE la misma huella.
 */
import { createHash, randomInt } from 'node:crypto';

/** Sin 0/O/1/I/L para que sea legible a mano si el QR no se puede escanear. */
const ALFABETO_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const LONGITUD_CODIGO = 16;

/** ~79 bits de entropía (31^16): no se puede adivinar por fuerza bruta. */
export function generarCodigoVerificacion(): string {
  let codigo = '';
  for (let i = 0; i < LONGITUD_CODIGO; i++) codigo += ALFABETO_CODIGO[randomInt(ALFABETO_CODIGO.length)];
  return codigo;
}

export function esCodigoVerificacionValido(codigo: unknown): codigo is string {
  return typeof codigo === 'string' && new RegExp(`^[${ALFABETO_CODIGO}]{${LONGITUD_CODIGO}}$`).test(codigo);
}

/** 16 caracteres -> "ABCD-EFGH-JKMN-PQRS" para mostrar. */
export function formatearCodigo(codigo: string): string {
  return codigo.match(/.{1,4}/g)?.join('-') ?? codigo;
}

/** Compara por unidades de codigo UTF-16: el mismo orden que Array.prototype.sort() sin argumentos. */
export function compararCodigo(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

export function canonizar(valor: unknown): string {
  if (valor === undefined) return 'null';
  if (valor === null || typeof valor !== 'object') return JSON.stringify(valor);
  if (Array.isArray(valor)) return `[${valor.map(canonizar).join(',')}]`;
  const o = valor as Record<string, unknown>;
  // Orden por unidades de codigo (igual que sort() sin argumentos) y explicito: la forma canonica
  // del sello NO debe depender del idioma del servidor, por eso no se usa localeCompare.
  return `{${Object.keys(o).sort(compararCodigo).filter((k) => o[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonizar(o[k])}`).join(',')}}`;
}

export interface InformeParaSello {
  numero_informe: string;
  titulo: string;
  categoria?: string | null;
  id_orden?: number | null;
  hallazgos_clinicos?: string | null;
  conclusiones_medico?: string | null;
  explicacion_paciente?: string | null;
  recomendaciones?: string[] | null;
  datos_json?: Record<string, any> | null;
  publicado_por_nombre?: string | null;
  publicado_por_colegiado?: string | null;
}

export function contenidoCanonico(i: InformeParaSello): string {
  const d = i.datos_json || {};
  const parametros = Array.isArray(d.parameters)
    ? d.parameters.map((p: any) => ({
        name: p?.name, value: p?.value, unit: p?.unit, referenceRange: p?.referenceRange,
        status: p?.status, notes: p?.notes, section: p?.section
      }))
    : [];
  return canonizar({
    v: 1,
    numero_informe: i.numero_informe,
    titulo: i.titulo,
    categoria: i.categoria ?? null,
    id_orden: i.id_orden ?? null,
    paciente: {
      nombre: d.patientName ?? null, documento: d.patientNationalId ?? null,
      edad: d.patientAge ?? null, genero: d.patientGender ?? null
    },
    parametros,
    hallazgos: i.hallazgos_clinicos ?? null,
    conclusiones: i.conclusiones_medico ?? null,
    explicacion: i.explicacion_paciente ?? null,
    recomendaciones: i.recomendaciones ?? [],
    publicado_por: { nombre: i.publicado_por_nombre ?? null, colegiado: i.publicado_por_colegiado ?? null }
  });
}

export function hashContenido(i: InformeParaSello): string {
  return createHash('sha256').update(contenidoCanonico(i), 'utf8').digest('hex');
}

/** Huella legible: primeros 16 hex en mayúsculas, "A1B2-C3D4-E5F6-0718". */
export function huellaCorta(hash: string): string {
  return (hash.slice(0, 16).toUpperCase().match(/.{1,4}/g) ?? []).join('-');
}

/** "María Fernanda López" -> "M***** F******* L****" (la verificación es pública). */
export function enmascararNombre(nombre: string | null | undefined): string {
  if (!nombre) return '—';
  return nombre.trim().split(/\s+/).map((p) => p[0] + '*'.repeat(Math.max(1, Math.min(p.length - 1, 6)))).join(' ');
}
