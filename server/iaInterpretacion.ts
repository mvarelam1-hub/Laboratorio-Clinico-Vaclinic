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

export interface EspecialistaSugerido {
  profesional: string;
  area: string;
}

// Especialista que normalmente valora cada grupo de pruebas (nombres del catálogo de
// especialidades). Es solo una referencia orientativa: el médico tratante es quien decide si
// refiere al paciente.
export const ESPECIALISTAS_POR_PRUEBA: { patron: RegExp; nombre: string; area: string }[] = [
  { patron: /\bpsa\b|ant[ií]geno prost[aá]tico/i, nombre: 'Urólogo', area: 'sistema urinario y próstata' },
  { patron: /\bcea\b|\bca[ -]?125\b|\bca[ -]?19[ -]?9\b|\bca[ -]?15[ -]?3\b|alfa-?fetoprote[ií]na|\bafp\b|marcador(?:es)? tumoral/i, nombre: 'Oncólogo', area: 'marcadores tumorales' },
  { patron: /\bvih\b|\bhiv\b|vdrl|\brpr\b|hbsag|ant[ií]geno de superficie|anti-?hcv|hepatitis|dengue|covid|sars-?cov/i, nombre: 'Infectólogo', area: 'enfermedades infecciosas' },
  { patron: /glicosilad|hba1c|a1c|glucosa|glicemia|glucemia|insulina|tsh|\bt3\b|\bt4\b|tiroid|cortisol|paratiroid|\bpth\b|prolactina/i, nombre: 'Endocrinólogo', area: 'glucosa y hormonas' },
  { patron: /creatinina|crea\b|urea|\bbun\b|nitr[oó]geno ureico|cistatina|filtrado glomerular|\btfg\b|microalb|dep[uú]raci[oó]n/i, nombre: 'Nefrólogo', area: 'riñones' },
  { patron: /\btgo\b|\btgp\b|\bast\b|\balt\b|transaminasa|bilirrubina|fosfatasa alcalina|\bggt\b|g-glutamil/i, nombre: 'Hepatólogo', area: 'hígado' },
  { patron: /amilasa|lipasa|calprotectina|sangre oculta|helicobacter/i, nombre: 'Gastroenterólogo', area: 'aparato digestivo' },
  { patron: /colesterol|triglic[eé]rido|\bldl\b|\bhdl\b|troponina|ck-?mb|\bbnp\b|nt-?probnp/i, nombre: 'Cardiólogo', area: 'corazón y grasas en sangre' },
  { patron: /factor reumatoide|\bana\b|antinucleares|anti-?ccp|[aá]cido [uú]rico|complemento c[34]/i, nombre: 'Reumatólogo', area: 'articulaciones y sistema inmunitario' },
  { patron: /\bige\b|inmunoglobulina e/i, nombre: 'Alergólogo', area: 'alergias' },
  { patron: /beta-?hcg|\bhcg\b|estradiol|progesterona|\bfsh\b|\blh\b/i, nombre: 'Ginecólogo', area: 'sistema reproductor femenino' },
  { patron: /hemoglobina|hematocrito|leucocito|plaqueta|eritrocito|hemat[ií]es|\bvcm\b|ferritina|hierro|vitamina b12|folato|\btp\b|\bttp\b|\binr\b|fibrin[oó]geno/i, nombre: 'Hematólogo', area: 'sangre y coagulación' }
];

const ESPECIALISTAS = ESPECIALISTAS_POR_PRUEBA.map((x) => ({ patron: x.patron, profesional: x.nombre.toLowerCase(), area: x.area }));

/** Especialistas orientativos solo para las pruebas fuera de rango o críticas. */
export function especialistasSugeridos(e: EntradaIA): EspecialistaSugerido[] {
  const vistos = new Map<string, EspecialistaSugerido>();
  for (const p of e.parametros) {
    if (!p.status || p.status === 'normal') continue;
    const hallado = ESPECIALISTAS.find((x) => x.patron.test(p.name));
    if (hallado && !vistos.has(hallado.profesional)) vistos.set(hallado.profesional, { profesional: hallado.profesional, area: hallado.area });
  }
  return [...vistos.values()];
}

/** Frase fija para la conclusión; no diagnostica, solo orienta hacia quién puede valorar. */
export function fraseEspecialista(lista: EspecialistaSugerido[]): string {
  if (lista.length === 0) return '';
  const nombres = lista.map((x) => `${x.profesional} (${x.area})`);
  const unidos = nombres.length === 1 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} o ${nombres[nombres.length - 1]}`;
  return `Valoración orientativa: ${unidos}.`;
}

const NUM = String.raw`-?\d+(?:[.,]\d+)?`;
const aNumero = (t: string): number => Number(t.replace(',', '.'));
const redondear = (n: number): string => String(Number(n.toFixed(1)));

/** Límites numéricos de un rango de referencia: "70-100", "< 200", "≥ 40", "hasta 5,2". null si no se entiende. */
export function parsearRango(rango?: string | null): { min?: number; max?: number } | null {
  const r = String(rango ?? '').trim();
  if (!r) return null;
  // Si el texto menciona varios niveles ("< 200 deseable; 200-239 limítrofe"), vale el primero.
  const candidatos: { pos: number; rango: { min?: number; max?: number } }[] = [];
  const par = new RegExp(`(${NUM})\\s*(?:-|–|—|a)\\s*(${NUM})`).exec(r);
  if (par) {
    const [a, b] = [aNumero(par[1]), aNumero(par[2])];
    if (Number.isFinite(a) && Number.isFinite(b) && a <= b) candidatos.push({ pos: par.index, rango: { min: a, max: b } });
  }
  const tope = new RegExp(`(?:<=?|≤|hasta|menor(?:es)?\\s+(?:de|que|a))\\s*(${NUM})`, 'i').exec(r);
  if (tope) candidatos.push({ pos: tope.index, rango: { max: aNumero(tope[1]) } });
  const piso = new RegExp(`(?:>=?|≥|desde|mayor(?:es)?\\s+(?:de|que|a))\\s*(${NUM})`, 'i').exec(r);
  if (piso) candidatos.push({ pos: piso.index, rango: { min: aNumero(piso[1]) } });
  candidatos.sort((x, y) => x.pos - y.pos);
  if (candidatos.length) return candidatos[0].rango;
  return null;
}

/**
 * Cuánto se aleja un resultado numérico del rango de referencia, calculado aquí
 * (no por la IA) para que la cifra sea exacta. null si no se puede calcular.
 */
export function describirDesviacion(p: ParametroIA): string | null {
  if (!/^-?\d+(?:[.,]\d+)?$/.test(p.value.trim())) return null;
  const rango = parsearRango(p.referenceRange);
  if (!rango) return null;
  const v = aNumero(p.value);
  const u = p.unit ? ` ${p.unit}` : '';
  if (rango.max !== undefined && v > rango.max) {
    const dif = v - rango.max;
    const pct = rango.max !== 0 ? `, ${redondear((dif / Math.abs(rango.max)) * 100)} % sobre el límite` : '';
    return `${redondear(dif)}${u} por encima del límite superior (${redondear(rango.max)})${pct}`;
  }
  if (rango.min !== undefined && v < rango.min) {
    const dif = rango.min - v;
    const pct = rango.min !== 0 ? `, ${redondear((dif / Math.abs(rango.min)) * 100)} % bajo el límite` : '';
    return `${redondear(dif)}${u} por debajo del límite inferior (${redondear(rango.min)})${pct}`;
  }
  return 'dentro del intervalo de referencia';
}

export function construirPrompt(e: EntradaIA): string {
  const filas = e.parametros
    .map((p) => {
      const desv = describirDesviacion(p);
      return `- ${p.name}: ${p.value} ${p.unit || ''} (referencia: ${p.referenceRange || 'no indicada'}; marcado por el laboratorio: ${ESTADO_ES[p.status || 'normal']}${desv ? `; desviación calculada: ${desv}` : ''})`;
    })
    .join('\n');
  const hayCriticos = e.parametros.some((p) => p.status === 'critical');
  const especialistas = especialistasSugeridos(e);
  const hayFuera = hayCriticos || e.parametros.some((p) => p.status === 'high' || p.status === 'low');
  const instruccionConclusion = hayCriticos
    ? 'IMPORTANTE: hay valores críticos. La conclusión debe nombrar la(s) prueba(s) crítica(s) con su valor y decir, sin alarmar, que debe consultar a su médico tratante a la brevedad.'
    : hayFuera
      ? 'La conclusión debe nombrar las pruebas fuera de rango con su valor y sentido (elevado o disminuido) y recomendar valoración clínica por su médico tratante.'
      : 'La conclusión debe decir que todos los valores están dentro del rango de referencia.';
  return `Eres un Químico Biólogo clínico que redacta la interpretación de resultados de un informe de laboratorio. Registro profesional, objetivo, preciso y CONCISO; sin relleno ni frases genéricas. Tu única tarea es EXPLICAR qué mide cada prueba y dónde cae el resultado frente a su rango de referencia. El personal del laboratorio revisará tu texto antes de entregarlo.

REGLAS ESTRICTAS (si no puedes cumplirlas, responde con resumen vacío):
- NO diagnostiques ni menciones enfermedades probables o posibles. NO concluyas nada sobre la salud de la persona.
- NO recomiendes medicamentos, dietas, suplementos ni tratamientos.
- Para cualquier valor fuera de rango o crítico, indica solo que corresponde valoración clínica por su médico tratante (quien decide si lo refiere). No inventes especialidades: menciona solo la indicada abajo, si hay una.
- Basa todo SOLO en los datos de abajo. Cita el valor y su unidad, y usa la "desviación calculada" tal cual cuando exista; NO inventes cifras ni rangos ni porcentajes.
- Una sola oración por prueba, de MÁXIMO 30 palabras: qué mide (en pocas palabras) y cómo se ubica el resultado (dentro del rango, o cuánto por encima o por debajo del límite). No repitas el nombre de la prueba dentro de la oración. Sin adjetivos de relleno ni tono alarmista. No repitas datos personales.

DATOS (sin identificación personal):
- Estudio: ${e.titulo || 'Estudio de laboratorio'}
- Edad: ${e.edad ?? 'no indicada'} | Sexo: ${e.genero || 'no indicado'}
- Resultados:
${filas}
- Especialista orientativo para los valores fuera de rango: ${especialistas.length ? especialistas.map((x) => `${x.profesional} (${x.area})`).join(', ') : 'ninguno'}

Devuelve ÚNICAMENTE un JSON con este formato:
{
  "valores": [ { "nombre": "nombre de la prueba", "significado": "UNA oración, máximo 30 palabras: qué mide y dónde se ubica el valor (ej.: «Mide el colesterol circulante en sangre; 245 mg/dL, 45 mg/dL por encima del límite superior (200)»)." } ],
  "resumen": "Máximo 2 oraciones: cuántos resultados están dentro y cuáles fuera del rango de referencia. ${instruccionConclusion} ${especialistas.length ? 'Menciona de forma breve la valoración orientativa por ' + especialistas.map((x) => x.profesional).join(', ') + '.' : ''} No diagnostiques ni nombres enfermedades.",
  "recordatorio": "Una oración corta: texto informativo; la interpretación clínica corresponde a su médico tratante."
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
  const resumen = limpiar(o?.resumen, 400);
  const recordatorio = limpiar(o?.recordatorio, 300);
  const valores = Array.isArray(o?.valores)
    ? o.valores.slice(0, MAX_PARAMETROS).map((v: any) => ({ nombre: limpiar(v?.nombre, 100), significado: limpiar(v?.significado, 220) })).filter((v: any) => v.nombre && v.significado)
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
  return [...s.valores.map((v) => `• ${v.nombre}: ${v.significado}`), '', `Conclusión: ${s.resumen}`, s.recordatorio].join('\n');
}
