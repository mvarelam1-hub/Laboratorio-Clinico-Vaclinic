/**
 * Contenido de la pestaña "Nosotros" del Portal del Paciente (migración 0029).
 *
 * Lo edita el laboratorio desde Ajustes. Aquí viven los textos por defecto
 * (para que la pestaña nunca salga vacía), la validación de lo que se guarda
 * y la mezcla de lo guardado con los valores por defecto.
 *
 * Las fotos NO van aquí: usan la tabla de imágenes de la portada con las
 * posiciones nosotros_vision, nosotros_mision, nosotros_servicios y
 * equipo_1..equipo_4 (la foto N corresponde al integrante N del equipo).
 */

export interface ValorNosotros { titulo: string; texto: string; }
export interface IntegranteNosotros { nombre: string; cargo: string; }

export interface Nosotros {
  intro: string;
  vision: string;
  mision: string;
  valores: ValorNosotros[];
  /** Siempre 4 posiciones (la foto N va con el integrante N); vacío = no se muestra. */
  equipo: IntegranteNosotros[];
}

export const MAX_VALORES = 4;
export const MAX_EQUIPO = 4;

export const NOSOTROS_POR_DEFECTO: Nosotros = {
  intro: 'Somos un laboratorio clínico que pone la precisión al servicio de tu salud y te atiende con cercanía.',
  vision:
    'Ser el laboratorio clínico de confianza de nuestra región: reconocido por resultados exactos, entregados a tiempo y explicados con claridad, y por mejorar cada día junto con nuestro equipo y nuestra tecnología.',
  mision:
    'Realizar análisis clínicos confiables y oportunos, atendiendo a cada paciente con respeto y calidez, con personal capacitado y equipo actualizado, para apoyar las decisiones de su médico.',
  valores: [
    { titulo: 'Precisión', texto: 'Cada resultado se revisa antes de entregarse.' },
    { titulo: 'Confianza', texto: 'Tus datos y tus resultados son confidenciales.' },
    { titulo: 'Calidez', texto: 'Te explicamos cada paso y resolvemos tus dudas.' },
    { titulo: 'Mejora continua', texto: 'Actualizamos procesos y equipo para servirte mejor.' },
  ],
  equipo: [
    { nombre: '', cargo: '' }, { nombre: '', cargo: '' }, { nombre: '', cargo: '' }, { nombre: '', cargo: '' },
  ],
};

const LIM = { intro: 220, vision: 600, mision: 600, valorTitulo: 40, valorTexto: 160, nombre: 80, cargo: 80 };

function texto(v: unknown, max: number): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

/** Valida el cuerpo del editor; devuelve el error en español o los datos limpios. */
export function normalizarNosotros(body: any): { error: string } | { datos: Nosotros } {
  const b = body || {};
  for (const [campo, etiqueta, max] of [
    ['intro', 'La presentación', LIM.intro], ['vision', 'La visión', LIM.vision], ['mision', 'La misión', LIM.mision],
  ] as const) {
    const bruto = typeof b[campo] === 'string' ? b[campo].replace(/\s+/g, ' ').trim() : '';
    if (!bruto) return { error: `${etiqueta} no puede quedar vacía.` };
    if (bruto.length > max) return { error: `${etiqueta} no puede pasar de ${max} caracteres.` };
  }
  if (!Array.isArray(b.valores)) return { error: 'Los valores no son válidos.' };
  if (b.valores.length > MAX_VALORES) return { error: `Máximo ${MAX_VALORES} valores.` };
  const valores: ValorNosotros[] = [];
  for (const v of b.valores) {
    const titulo = texto(v?.titulo, 1000);
    const detalle = texto(v?.texto, 1000);
    if (!titulo && !detalle) continue;
    if (!titulo) return { error: 'Cada valor necesita un título.' };
    if (titulo.length > LIM.valorTitulo) return { error: `El título de un valor no puede pasar de ${LIM.valorTitulo} caracteres.` };
    if (detalle.length > LIM.valorTexto) return { error: `La descripción de un valor no puede pasar de ${LIM.valorTexto} caracteres.` };
    valores.push({ titulo, texto: detalle });
  }
  if (!Array.isArray(b.equipo) || b.equipo.length > MAX_EQUIPO) return { error: `El equipo debe tener como máximo ${MAX_EQUIPO} personas.` };
  const equipo: IntegranteNosotros[] = [];
  for (let i = 0; i < MAX_EQUIPO; i++) {
    const p = b.equipo[i];
    const nombre = texto(p?.nombre, 1000);
    const cargo = texto(p?.cargo, 1000);
    if (nombre.length > LIM.nombre) return { error: `El nombre del integrante ${i + 1} no puede pasar de ${LIM.nombre} caracteres.` };
    if (cargo.length > LIM.cargo) return { error: `El cargo del integrante ${i + 1} no puede pasar de ${LIM.cargo} caracteres.` };
    if (cargo && !nombre) return { error: `El integrante ${i + 1} tiene cargo pero no nombre.` };
    equipo.push({ nombre, cargo });
  }
  return {
    datos: {
      intro: texto(b.intro, LIM.intro), vision: texto(b.vision, LIM.vision), mision: texto(b.mision, LIM.mision),
      valores, equipo,
    },
  };
}

/** Mezcla lo guardado (posiblemente incompleto o viejo) con los valores por defecto. */
export function combinarNosotros(guardado: unknown): Nosotros {
  const r = normalizarNosotros(guardado);
  if ('datos' in r) return r.datos;
  // Si lo guardado no es válido, se usa lo que sí sirva y el resto por defecto.
  const g: any = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    intro: texto(g.intro, LIM.intro) || NOSOTROS_POR_DEFECTO.intro,
    vision: texto(g.vision, LIM.vision) || NOSOTROS_POR_DEFECTO.vision,
    mision: texto(g.mision, LIM.mision) || NOSOTROS_POR_DEFECTO.mision,
    valores: NOSOTROS_POR_DEFECTO.valores,
    equipo: NOSOTROS_POR_DEFECTO.equipo,
  };
}
