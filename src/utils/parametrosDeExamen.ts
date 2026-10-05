import { LabCatalogItem, LabCustomProfile, ReportParameter } from '../types';
import { COMPOSICION_POR_CODIGO, ALIAS_COMPONENTE } from '../data/composicionPerfiles';
import { FACTORY_CATALOG_TESTS } from '../data/factoryCatalog';
import { resolveAgeSexReferenceRange, nombreTieneNormaDemografica, parseMultiGenderRange, parseReferenceRange } from './referenceRangeEvaluator';

/** Minúsculas, sin acentos ni signos (deja letras, números, % y /). */
export const normalizarNombre = (s: string): string =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9/%]+/g, ' ').trim();

/** Busca un examen del catálogo por código o por nombre EXACTO (nunca por "contiene"). */
export function buscarExamen(nombreOCodigo: string, catalogo: LabCatalogItem[]): LabCatalogItem | undefined {
  const n = normalizarNombre(nombreOCodigo);
  if (!n) return undefined;
  return catalogo.find((c) => normalizarNombre(c.code) === n) || catalogo.find((c) => normalizarNombre(c.name) === n);
}

export interface ComponenteResuelto {
  nombre: string;
  /** Examen del catálogo que lo define; undefined si el panel nombra algo que el catálogo no tiene. */
  examen?: LabCatalogItem;
}

/**
 * Componentes de un perfil/panel. Orden de prioridad:
 *  1. `includedParameters` del propio examen (nombres → catálogo por nombre exacto o alias),
 *  2. composición por defecto por código (`COMPOSICION_POR_CODIGO`).
 * Devuelve [] si el examen no es un perfil o no tiene composición definida.
 */
export function componentesDePerfil(item: LabCatalogItem, catalogo: LabCatalogItem[]): ComponenteResuelto[] {
  const porCodigo = (codigo: string) => catalogo.find((c) => c.code === codigo);

  const delCodigo = COMPOSICION_POR_CODIGO[item.code];
  if (delCodigo) {
    return delCodigo.map((cod) => porCodigo(cod)).filter((x): x is LabCatalogItem => !!x).map((examen) => ({ nombre: examen.name, examen }));
  }

  const nombres = item.includedParameters || [];
  const salida: ComponenteResuelto[] = [];
  for (const nombre of nombres) {
    const n = normalizarNombre(nombre);
    const exacto = catalogo.find((c) => normalizarNombre(c.name) === n);
    if (exacto) { salida.push({ nombre, examen: exacto }); continue; }
    const alias = ALIAS_COMPONENTE[n];
    if (alias) {
      for (const cod of alias) {
        const ex = porCodigo(cod);
        salida.push(ex ? { nombre: ex.name, examen: ex } : { nombre });
      }
      continue;
    }
    salida.push({ nombre });
  }
  return salida;
}

/** Una fila de captura para un examen individual (o un componente sin examen propio en el catálogo). */
function filaDeCaptura(
  nombre: string,
  examen: LabCatalogItem | undefined,
  edad: number | undefined,
  genero: string | undefined,
  seccion: string | undefined,
  idFila: string
): ReportParameter {
  const generoConocido = /^(m|f)/i.test(genero || '');
  const edadConocida = typeof edad === 'number' && edad > 0;
  // Solo los analitos con norma propia por edad/sexo (hemoglobina, creatinina…)
  // usan el estándar demográfico, y solo si la edad y el sexo son conocidos: con
  // datos desconocidos se mostraría el rango de un adulto varón. Todo lo demás
  // usa EXACTAMENTE el rango del catálogo (nunca el de otro analito por parecido
  // de nombre: "Hemoglobina Corpuscular Media" no es "Hemoglobina").
  const rangoCatalogo = examen?.referenceRange || '';
  let rango = rangoCatalogo;
  let minVal: number | undefined;
  let maxVal: number | undefined;
  let notas: string | undefined;
  const usarDemografico = edadConocida && generoConocido && nombreTieneNormaDemografica(nombre);
  if (usarDemografico) {
    const r = resolveAgeSexReferenceRange(nombre, rangoCatalogo, edad as number, genero as string, undefined, true);
    rango = r.effectiveRange && r.effectiveRange !== '—' ? r.effectiveRange : rangoCatalogo;
    minVal = r.min;
    maxVal = r.max;
    notas = r.demographicRuleApplied;
  } else {
    const porSexo = generoConocido ? parseMultiGenderRange(rangoCatalogo, genero as string) : null;
    if (porSexo) {
      rango = porSexo.rangeText || rangoCatalogo;
      minVal = porSexo.min;
      maxVal = porSexo.max;
    } else {
      const p = parseReferenceRange(rangoCatalogo);
      minVal = p.min;
      maxVal = p.max;
    }
  }
  return {
    id: idFila,
    name: nombre,
    value: '',
    unit: examen?.unit || '',
    referenceRange: rango,
    minVal,
    maxVal,
    status: 'normal',
    sampleType: examen?.sampleType || undefined,
    methodology: examen?.methodology || undefined,
    notes: notas,
    ...(seccion ? { section: seccion } : {})
  };
}

/**
 * Filas de captura de un informe para los exámenes pedidos. Es ESTRICTO: cada
 * examen pedido produce exactamente lo que el catálogo define para él —un
 * examen individual da una fila; un perfil/panel da una fila por componente—.
 * Nunca agrega exámenes que no se pidieron ni inventa unidades o rangos: lo que
 * el catálogo no define queda vacío para que el personal lo complete.
 */
export function parametrosDeExamenes(
  testsList: string[],
  edad: number | undefined,
  genero: string | undefined,
  catalogo: LabCatalogItem[] = FACTORY_CATALOG_TESTS,
  testCodes?: Array<string | undefined>,
  perfiles: LabCustomProfile[] = []
): ReportParameter[] {
  const filas: ReportParameter[] = [];
  let n = 1;
  testsList.forEach((pedido, idx) => {
    const codigo = testCodes?.[idx];
    const examen = (codigo ? buscarExamen(codigo, catalogo) : undefined) || buscarExamen(pedido, catalogo);
    const inicio = filas.length;

    // Perfil personalizado (EXAMEN DE HECES COMPLETA, ORINA COMPLETA…): una fila
    // por cada prueba que define el perfil, con su unidad y rango.
    const perfil = !examen
      ? perfiles.find((p) => (codigo && p.code === codigo) || normalizarNombre(p.name) === normalizarNombre(pedido))
      : undefined;
    if (perfil && (perfil.tests || []).length > 0) {
      for (const t of perfil.tests!.filter((x) => x.status !== 'Inactiva')) {
        const comoExamen = {
          name: t.name,
          unit: t.unit,
          referenceRange: t.referenceRange || (t.minRange !== undefined && t.maxRange !== undefined && t.minRange !== '' ? `${t.minRange} - ${t.maxRange}` : ''),
          methodology: t.methodology
        } as unknown as LabCatalogItem;
        filas.push(filaDeCaptura(t.name, comoExamen, edad, genero, perfil.name, `p-${n++}`));
      }
      for (let i = inicio; i < filas.length; i++) filas[i].examCode = codigo || perfil.code;
      return;
    }

    const componentes = examen ? componentesDePerfil(examen, catalogo) : [];
    if (examen && componentes.length > 0) {
      const seccion = examen.name;
      for (const c of componentes) filas.push(filaDeCaptura(c.nombre, c.examen, edad, genero, seccion, `p-${n++}`));
    } else {
      filas.push(filaDeCaptura(examen?.name || pedido, examen, edad, genero, undefined, `p-${n++}`));
    }

    if (codigo || examen?.code) {
      for (let i = inicio; i < filas.length; i++) filas[i].examCode = codigo || examen?.code;
    }
  });
  return filas;
}
