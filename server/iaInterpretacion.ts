/**
 * Asistente de interpretación por IA (modo real).
 *
 * Reglas de diseño (laboratorio clínico real):
 *  - La IA SOLO EXPLICA qué mide cada prueba y cómo se ve el valor frente al
 *    rango de referencia. NO diagnostica, NO concluye, NO receta ni sugiere
 *    tratamiento. Lo que salga se rechaza si lo hace.
 *  - Recibe datos mínimos y SIN identificar: edad, sexo y valores. Nunca el
 *    nombre, el documento ni el teléfono del paciente.
 *  - El texto no se publica solo: el personal lo revisa y decide usarlo.
 *  - Sin GEMINI_API_KEY no se inventa nada: se responde que la IA no está
 *    configurada.
 */

export interface ParametroIA {
  name: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status?: string;
}

export interface EntradaIA {
  edad?: number | null;
  genero?: string | null;
  titulo?: string | null;
  parametros: ParametroIA[];
}

export interface SalidaIA {
  resumen: string;
  valores: { nombre: string; significado: string }[];
  recordatorio: string;
}

const MAX_PARAMETROS = 80;
const MAX_TEXTO = 120;

const limpiar = (v: unknown, max = MAX_TEXTO): string =>
  String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

/** Normaliza lo que manda el cliente: solo campos permitidos, con tope de tamaño. */
export function sanearEntrada(body: any): { ok: boolean; entrada?: EntradaIA; error?: string } {
  const lista = Array.isArray(body?.parametros) ? body.parametros : [];
  const parametros: ParametroIA[] = lista
    .slice(0, MAX_PARAMETROS)
    .map((p: any) => ({
      name: limpiar(p?.name),
      value: limpiar(p?.value, 40),
      unit: limpiar(p?.unit, 30),
      referenceRange: limpiar(p?.referenceRange, 60),
      status: ['normal', 'high', 'low', 'critical'].includes(p?.status) ? p.status : 'normal'
    }))
    .filter((p: ParametroIA) => p.name && p.value !== '');
  if (parametros.length === 0) {
    return { ok: false, error: 'Captura al menos un resultado antes de pedir la interpretación.' };
  }
  const edad = Number(body?.edad);
  return {
    ok: true,
    entrada: {
      edad: Number.isFinite(edad) && edad >= 0 && edad < 130 ? Math.round(edad) : null,
      genero: limpiar(body?.genero, 20) || null,
      titulo: limpiar(body?.titulo, 100) || null,
      parametros
    }
  };
}

const ESTADO_ES: Record<string, string> = { normal: 'dentro del rango', high: 'por encima del rango', low: 'por debajo del rango', critical: 'valor crítico' };

export function construirPrompt(e: EntradaIA): string {
  const filas = e.parametros
    .map((p) => `- ${p.name}: ${p.value} ${p.unit || ''} (referencia: ${p.referenceRange || 'no indicada'}; marcado por el laboratorio: ${ESTADO_ES[p.status || 'normal']})`)
    .join('\n');
  return `Eres un asistente de comunicación de un laboratorio clínico. Tu única tarea es EXPLICAR en lenguaje sencillo, en español, qué mide cada prueba y cómo se ve el resultado frente a su rango de referencia, para que el personal del laboratorio revise tu texto antes de entregarlo al paciente.

REGLAS ESTRICTAS (si no puedes cumplirlas, responde con resumen vacío):
- NO diagnostiques ni menciones enfermedades probables o posibles. NO concluyas nada sobre la salud de la persona.
- NO recomiendes medicamentos, dietas, suplementos ni tratamientos.
- Para cualquier valor fuera de rango o crítico, di únicamente que debe comentarlo con su médico.
- Usa un tono sereno y claro, sin causar alarma. No repitas datos personales.
- Basa todo SOLO en los datos de abajo; no inventes valores ni rangos.

DATOS (sin identificación personal):
- Estudio: ${e.titulo || 'Estudio de laboratorio'}
- Edad: ${e.edad ?? 'no indicada'} | Sexo: ${e.genero || 'no indicado'}
- Resultados:
${filas}

Devuelve ÚNICAMENTE un JSON con este formato:
{
  "resumen": "2 a 4 oraciones que expliquen en general qué se midió y cuántos valores están dentro o fuera del rango, sin concluir nada.",
  "valores": [ { "nombre": "nombre de la prueba", "significado": "1 oración: qué mide y cómo se ve este valor frente a la referencia." } ],
  "recordatorio": "Una oración recordando que este texto es informativo y que su médico debe interpretar los resultados."
}`;
}

// Frases propias de un diagnóstico/conclusión/indicación: si aparecen, se descarta la salida.
const PROHIBIDAS = [
  /\bdiagn[oó]stic/i,
  /\bpadece\b/i,
  /\bsufre\b/i,
  /\bse confirma\b/i,
  /\bconfirma (?:la|el|que)\b/i,
  /\bindica (?:la )?presencia de\b/i,
  /\b(?:es|son) compatible[s]? con\b/i,
  /\bsugiere (?:la )?(?:presencia|existencia) de\b/i,
  /\b(?:tiene|presenta) (?:diabetes|anemia|infecci[oó]n|c[aá]ncer|insuficiencia|hepatitis|leucemia)\b/i,
  /\b(?:tome|toma|tomar|consuma|administre|suspenda)\b.{0,40}\b(?:mg|medicament|f[aá]rmaco|pastilla|tableta|antibi[oó]tic|suplement)/i,
  /\btratamiento\b/i
];

export function validarSalida(crudo: unknown): { ok: boolean; salida?: SalidaIA; motivo?: string } {
  const o: any = crudo;
  const resumen = limpiar(o?.resumen, 900);
  const recordatorio = limpiar(o?.recordatorio, 300);
  const valores = Array.isArray(o?.valores)
    ? o.valores.slice(0, MAX_PARAMETROS).map((v: any) => ({ nombre: limpiar(v?.nombre, 100), significado: limpiar(v?.significado, 400) })).filter((v: any) => v.nombre && v.significado)
    : [];
  if (!resumen || valores.length === 0) {
    return { ok: false, motivo: 'La IA no devolvió una explicación utilizable. Intenta de nuevo.' };
  }
  const todo = [resumen, recordatorio, ...valores.map((v: any) => v.significado)].join(' ');
  if (PROHIBIDAS.some((r) => r.test(todo))) {
    return { ok: false, motivo: 'La IA incluyó una conclusión o indicación médica, que no está permitida. Se descartó el texto; intenta de nuevo.' };
  }
  return {
    ok: true,
    salida: {
      resumen,
      valores,
      recordatorio: recordatorio || 'Este texto es informativo; su médico debe interpretar los resultados.'
    }
  };
}

/** Texto plano listo para el campo "Explicación para el paciente" del informe. */
export function textoParaInforme(s: SalidaIA): string {
  return [s.resumen, '', ...s.valores.map((v) => `• ${v.nombre}: ${v.significado}`), '', s.recordatorio].join('\n');
}
