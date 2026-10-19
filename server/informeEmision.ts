/**
 * Emisión del PDF oficial de un informe — compartida por el personal
 * (GET /api/informes/:id/pdf) y por el paciente (GET /api/portal/informes/:id/pdf).
 *
 * Todo sale de la base de datos: informe sellado, laboratorio y firmantes
 * reales. Un informe publicado solo se emite si su contenido sigue siendo el
 * sellado; así nunca sale un PDF con QR "válido" de un contenido que cambió.
 */
import { pool } from './db';
import { hashContenido } from './informeIntegridad';
import { generarInformePdf, construirUrlVerificacion } from './informePdf';

export type EmisionPdf =
  | { ok: false; status: number; error: string; code?: string }
  | { ok: true; pdf: Uint8Array | ArrayBuffer; nombreArchivo: string; publicado: boolean; numeroInforme: string };

export interface OpcionesEmision {
  baseUrl: string;
  /** Si se indica, el informe debe pertenecer a esa orden (portal del paciente). */
  idOrden?: number;
  /** Si es true, solo informes publicados/entregados (portal del paciente). */
  soloPublicados?: boolean;
}

export async function emitirPdfInforme(idInforme: number, opts: OpcionesEmision): Promise<EmisionPdf> {
  if (!Number.isInteger(idInforme) || idInforme <= 0) return { ok: false, status: 400, error: 'Id de informe inválido.' };

  const { rows } = await pool.query(
    `SELECT i.*, c.nombre_laboratorio, c.nombre_legal, c.nit_ruc, c.registro_sanitario, c.acreditacion_iso,
            c.direccion AS lab_direccion, c.telefono AS lab_telefono, c.email AS lab_email,
            c."tamaño_papel" AS lab_papel, c.color_primario, c.color_valor_critico,
            c.datos_adicionales AS lab_extra,
            o.numero_orden AS numero_orden_oficial
     FROM informe_clinico i
     LEFT JOIN configuracion_laboratorio c ON c.id_laboratorio = 1
     LEFT JOIN orden o ON o.id_orden = i.id_orden
     WHERE i.id_informe = $1 AND i.eliminado = FALSE`,
    [idInforme]
  );
  const notFound = { ok: false as const, status: 404, error: 'Informe no encontrado o ya eliminado.' };
  if (rows.length === 0) return notFound;
  const i = rows[0];
  const publicado = i.estado === 'publicado' || i.estado === 'entregado';

  // Para el paciente, un informe ajeno o no publicado "no existe": misma respuesta.
  if (opts.idOrden !== undefined && i.id_orden !== opts.idOrden) return notFound;
  if (opts.soloPublicados && !publicado) return notFound;

  if (publicado) {
    if (!i.codigo_verificacion || !i.hash_contenido) {
      return {
        ok: false, status: 409, code: 'INFORME_SIN_SELLO',
        error: 'Este informe se publicó antes de existir el sello de verificación. Vuelve a publicarlo para poder emitir el PDF oficial.'
      };
    }
    if (hashContenido(i) !== i.hash_contenido) {
      return {
        ok: false, status: 409, code: 'INFORME_MODIFICADO',
        error: 'El contenido de este informe cambió después de publicarse, por lo que su sello ya no es válido. Vuelve a publicarlo para emitir un PDF oficial.'
      };
    }
  }

  let validado: string[] = [];
  let verificado: string[] = [];
  if (i.id_orden) {
    const { rows: firmantes } = await pool.query(
      `SELECT r.validado_por_nombre, r.verificado_por_nombre
       FROM resultado r JOIN detalle_orden d ON d.id_detalle = r.id_detalle
       WHERE d.id_orden = $1`,
      [i.id_orden]
    );
    const unicos = (xs: Array<string | null>) => [...new Set(xs.filter((x): x is string => !!x && x.trim() !== ''))];
    validado = unicos(firmantes.map((f: any) => f.validado_por_nombre));
    verificado = unicos(firmantes.map((f: any) => f.verificado_por_nombre));
  }

  // Firmantes configurados en Ajustes: hasta 3, en el orden Elaborado por → Visto bueno → Autorizado por.
  const extra = (i.lab_extra && typeof i.lab_extra === 'object') ? i.lab_extra : {};
  const ROTULOS: Record<string, { orden: number; rotulo: string }> = {
    signer_1_prep: { orden: 1, rotulo: 'Elaborado por' },
    signer_2_qb: { orden: 2, rotulo: 'Visto bueno' },
    signer_3_tech: { orden: 3, rotulo: 'Autorizado por' }
  };
  const firmantes = (Array.isArray(extra.signers) ? extra.signers : [])
    .filter((s: any) => s && s.enabled && typeof s.name === 'string' && s.name.trim())
    .sort((a: any, b: any) => (ROTULOS[a.id]?.orden ?? 9) - (ROTULOS[b.id]?.orden ?? 9))
    .slice(0, 3)
    .map((s: any, k: number) => ({
      rotulo: ROTULOS[s.id]?.rotulo ?? ['Elaborado por', 'Visto bueno', 'Autorizado por'][k],
      nombre: s.name.trim(), cargo: s.roleTitle || null, especialidad: s.specialty || null,
      colegiado: s.licenseNumber || null, imagen: typeof s.signatureImageUrl === 'string' ? s.signatureImageUrl : null
    }));

  const d = i.datos_json || {};
  const pdf = await generarInformePdf({
    numero_informe: i.numero_informe,
    // Único código visible del informe: el número de la orden.
    numero_orden: i.numero_orden_oficial,
    titulo: i.titulo,
    estado: i.estado,
    fecha_muestra: i.fecha_muestra,
    fecha_emision: i.fecha_emision,
    fecha_publicacion: i.fecha_publicacion,
    hallazgos: i.hallazgos_clinicos,
    conclusiones: i.conclusiones_medico,
    explicacion: i.explicacion_paciente,
    recomendaciones: i.recomendaciones || [],
    incluirConclusiones: d.includeConclusionsInReport,
    incluirRecomendaciones: d.includeRecommendationsInReport,
    incluirExplicacion: d.includeAiExplanationInReport,
    paciente: {
      nombre: d.patientName, documento: d.patientNationalId, edad: d.patientAge, genero: d.patientGender,
      medico: d.referringDoctor, muestra: d.sampleType
    },
    parametros: Array.isArray(d.parameters) ? d.parameters : [],
    laboratorio: {
      nombre: i.nombre_laboratorio || 'Laboratorio clínico', nombre_legal: i.nombre_legal, nit: i.nit_ruc,
      registro_sanitario: i.registro_sanitario, acreditacion: i.acreditacion_iso, direccion: i.lab_direccion,
      telefono: i.lab_telefono, email: i.lab_email, color_primario: i.color_primario,
      color_critico: i.color_valor_critico, papel: i.lab_papel,
      horario: typeof extra.businessHours === 'string' ? extra.businessHours : null,
      logo: typeof extra.logoUrl === 'string' && extra.logoUrl.startsWith('data:image/') ? extra.logoUrl : null
    },
    firmas: {
      publicado_por: i.publicado_por_nombre, colegiado: i.publicado_por_colegiado,
      especialidad: i.publicado_por_especialidad, validado_por: validado, verificado_por: verificado, firmantes
    },
    sello: publicado
      ? { codigo: i.codigo_verificacion, hash: i.hash_contenido, url: construirUrlVerificacion(opts.baseUrl, i.codigo_verificacion, i.hash_contenido) }
      : undefined
  });

  const nombreArchivo = `Informe-${String(i.numero_orden_oficial || i.numero_informe).replace(/[^A-Za-z0-9._-]/g, '_')}${publicado ? '' : '-BORRADOR'}.pdf`;
  return { ok: true, pdf, nombreArchivo, publicado, numeroInforme: i.numero_informe };
}
