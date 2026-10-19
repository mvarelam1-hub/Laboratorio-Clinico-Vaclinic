/**
 * PDF oficial del informe, generado en el SERVIDOR (migración 0019).
 *
 * Es el ÚNICO formato de informe: el personal y el paciente descargan este
 * mismo documento (GET /api/informes/:id/pdf y /api/portal/informes/:id/pdf).
 *
 * Por qué en el servidor: el PDF que sale del navegador lo arma el cliente
 * con lo que el cliente quiera (firmantes inventados, hash aleatorio, QR a un
 * dominio sin ruta). Este PDF, en cambio, se compone solo con datos que
 * están en la base de datos — informe sellado, laboratorio, firmantes reales
 * (quién capturó/validó/verificó/publicó) — y el QR apunta a la verificación
 * pública real (`/verificar/:codigo`), que recalcula la huella del contenido.
 *
 * Un solo código visible: el N.º de orden. El código de verificación largo y
 * la huella viven en el QR y en letra pequeña junto a él, para quien quiera
 * comprobar el documento a mano.
 *
 * Es PDF vectorial (texto seleccionable y buscable, no una captura de
 * pantalla) con las fuentes estándar de PDF (Helvetica), que solo cubren
 * Latin-1: `limpiarTexto` convierte lo que no cubren (≥, –, “ ” …) en
 * equivalentes ASCII para que NUNCA salga un carácter corrupto en un
 * resultado clínico.
 */
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { formatearCodigo, huellaCorta } from './informeIntegridad';

export interface ParametroPdf {
  name?: string; value?: string | number; unit?: string; referenceRange?: string;
  status?: string; notes?: string; section?: string;
}

export interface DatosInformePdf {
  numero_informe: string;
  /** Número de la orden (único código visible del informe). Si falta, se usa el del informe. */
  numero_orden?: string | null;
  titulo: string;
  estado: string;
  fecha_muestra?: Date | string | null;
  fecha_emision?: Date | string | null;
  fecha_publicacion?: Date | string | null;
  hallazgos?: string | null;
  conclusiones?: string | null;
  explicacion?: string | null;
  recomendaciones?: string[];
  incluirConclusiones?: boolean;
  incluirRecomendaciones?: boolean;
  incluirExplicacion?: boolean;
  paciente: { nombre?: string | null; documento?: string | null; edad?: string | number | null; genero?: string | null; medico?: string | null; muestra?: string | null };
  parametros: ParametroPdf[];
  laboratorio: {
    nombre: string; nombre_legal?: string | null; nit?: string | null; registro_sanitario?: string | null;
    acreditacion?: string | null; direccion?: string | null; telefono?: string | null; email?: string | null;
    color_primario?: string | null; color_critico?: string | null; papel?: 'letter' | 'a4' | 'legal' | string | null;
    horario?: string | null;
    /** Logo del membrete configurado en Ajustes (data URL PNG/JPEG/WEBP). Si falta, se dibuja la cruz de VACLINIC. */
    logo?: string | null;
  };
  firmas: {
    publicado_por?: string | null; colegiado?: string | null; especialidad?: string | null;
    validado_por: string[]; verificado_por: string[];
    /** Hasta 3 firmantes configurados en Ajustes (Elaborado por / Visto bueno / Autorizado por), ya en orden. */
    firmantes?: FirmantePdf[];
  };
  /** Solo si el informe está publicado y sellado. */
  sello?: { codigo: string; hash: string; url: string };
}

export interface FirmantePdf {
  /** 'Elaborado por' | 'Visto bueno' | 'Autorizado por' */
  rotulo: string;
  nombre: string;
  cargo?: string | null;
  especialidad?: string | null;
  colegiado?: string | null;
  /** Imagen de la firma (data URL PNG/JPEG). Solo se imprime en informes oficiales. */
  imagen?: string | null;
}

/** Mismo horario que imprime la hoja en pantalla cuando Ajustes no define otro. */
export const HORARIO_PREDETERMINADO = 'Lunes a Viernes: 7:00 a 16:00 - Sabado: 7:00 a 15:00 - Domingo: 7:00 a 11:00';

const CARACTERES_ASCII: Record<string, string> = {
  '≥': '>=', '≤': '<=', '–': '-', '—': '-', '‑': '-', '−': '-', '‘': "'", '’': "'", '“': '"', '”': '"',
  '…': '...', '•': '-', '→': '->', '←': '<-', 'µ': 'u', 'μ': 'u', '²': '^2', '³': '^3', '¹': '^1',
  // Espacios especiales (NBSP, fino y estrecho sin salto): la fuente estándar no los dibuja.
  '\u00a0': ' ', '\u2009': ' ', '\u202f': ' '
};

/** Latin-1 se conserva (acentos, ñ); lo demás se transcribe o se reemplaza por '?'. */
export function limpiarTexto(valor: unknown): string {
  const s = String(valor ?? '');
  let salida = '';
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    // Primero el mapa: ², ³, ¹ y µ están en Latin-1 pero la fuente estándar de
    // jsPDF NO los dibuja (salen en blanco: "10³/µL" -> "10 / L"), así que se
    // transcriben aunque estén "dentro" del rango soportado.
    if (CARACTERES_ASCII[ch] !== undefined) salida += CARACTERES_ASCII[ch];
    else if (ch === '\n' || ch === '\t' || (cp >= 0x20 && cp <= 0x7e) || (cp >= 0xa1 && cp <= 0xff)) salida += ch;
    else if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) salida += ' ';
    else salida += '?';
  }
  return salida;
}

export function construirUrlVerificacion(baseUrl: string, codigo: string, hash?: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  return `${base}/verificar/${codigo}${hash ? `?h=${hash.slice(0, 16)}` : ''}`;
}

type RGB = [number, number, number];

function rgb(hex: string | null | undefined, porDefecto: RGB): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || '').trim());
  if (!m) return porDefecto;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function fmtFecha(valor: Date | string | null | undefined, conHora = false): string {
  if (!valor) return '-';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-GT', conHora ? { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Guatemala' } : { dateStyle: 'long', timeZone: 'America/Guatemala' });
}

function fmtFechaCorta(valor: Date | string | null | undefined): string {
  if (!valor) return '';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Guatemala' });
}

/** "22" -> "22 años"; "6 meses" se respeta tal cual; vacío -> "-". */
function textoEdad(edad: string | number | null | undefined): string {
  if (edad === undefined || edad === null || String(edad).trim() === '') return '-';
  const s = String(edad).trim();
  return /^\d+$/.test(s) ? `${s} ${s === '1' ? 'año' : 'años'}` : s;
}

function textoGenero(g: string | null | undefined): string {
  const s = (g || '').trim();
  if (/^m/i.test(s)) return 'Masculino';
  if (/^f/i.test(s)) return 'Femenino';
  return s || '-';
}

// Paleta de la hoja de resultados (la misma que se ve en pantalla).
const INK: RGB = [17, 24, 39];
const MUTED: RGB = [75, 85, 99];
const RULE: RGB = [209, 213, 219];
const NAVY: RGB = [15, 31, 51];
const MINT: RGB = [94, 234, 212];
const CARD: RGB = [248, 250, 252];
const OK_BG: RGB = [209, 250, 229]; const OK_TXT: RGB = [4, 120, 87];
const ALTO_BG: RGB = [254, 226, 226]; const ALTO_TXT: RGB = [185, 28, 28];
const BAJO_BG: RGB = [254, 243, 199]; const BAJO_TXT: RGB = [180, 83, 9];

/** El estado se distingue SIEMPRE por texto (Normal/Alto/Bajo/Critico), no solo por color. */
const ETIQUETA_ESTADO: Record<string, string> = { normal: 'NORMAL', low: 'BAJO', high: 'ALTO', critical: 'CRITICO' };

export async function generarInformePdf(d: DatosInformePdf): Promise<Uint8Array> {
  const formato = d.laboratorio.papel === 'a4' ? 'a4' : d.laboratorio.papel === 'legal' ? 'legal' : 'letter';
  const doc = new jsPDF({ unit: 'mm', format: formato, compress: true });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 11;
  const W = PW - M * 2;
  const FOOT = 30; // reserva inferior: banda de valores + pie de página
  const acento = rgb(d.laboratorio.color_primario, [15, 118, 110]);
  const oficial = !!d.sello;
  const codigoOrden = (d.numero_orden && d.numero_orden.trim()) || d.numero_informe;

  let y = M;
  const texto = (t: unknown, x: number, yy: number, opts?: any) => doc.text(limpiarTexto(t), x, yy, opts);
  const lineas = (t: unknown, ancho: number): string[] => doc.splitTextToSize(limpiarTexto(t), ancho);
  const fuente = (estilo: 'normal' | 'bold' | 'italic', tam: number, c: RGB) => {
    doc.setFont('helvetica', estilo); doc.setFontSize(tam); doc.setTextColor(...c);
  };

  // Se dibuja AL FINAL sobre cada página y translúcida, para que las filas
  // sombreadas de la tabla no la tapen y el texto debajo siga legible.
  const marcaDeAgua = () => {
    if (oficial) return;
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.13 }));
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(120, 120, 120);
    // Con `angle`, jsPDF ignora align:'center': se calcula el punto de inicio
    // para que el centro del texto caiga en (cx, cy) sobre la diagonal.
    const rad = (35 * Math.PI) / 180;
    const girado = (t: string, cx: number, cy: number) => {
      const w = doc.getTextWidth(t);
      doc.text(t, cx - (w / 2) * Math.cos(rad), cy + (w / 2) * Math.sin(rad), { angle: 35 });
    };
    doc.setFontSize(70);
    girado('BORRADOR', PW / 2, PH / 2);
    doc.setFontSize(18);
    girado('SIN VALOR OFICIAL', PW / 2 + 14, PH / 2 + 22);
    doc.restoreGraphicsState();
  };

  const logo = (cx: number, cy: number, r: number) => {
    doc.setDrawColor(...acento); doc.setLineWidth(0.9);
    doc.circle(cx, cy, r, 'S');
    doc.setFillColor(...acento);
    doc.roundedRect(cx - r * 0.13, cy - r * 0.6, r * 0.26, r * 1.2, 0.4, 0.4, 'F');
    doc.roundedRect(cx - r * 0.6, cy - r * 0.13, r * 1.2, r * 0.26, 0.4, 0.4, 'F');
  };

  // Logo configurado en Ajustes: se imprime con su proporción original.
  const imagenLogo = (() => {
    const src = d.laboratorio.logo;
    const m = src ? /^data:image\/(png|jpe?g|webp);base64,/i.exec(src) : null;
    if (!src || !m) return null;
    try {
      const p = doc.getImageProperties(src);
      if (!p.width || !p.height) return null;
      const tipo = m[1].toLowerCase();
      return { src, formato: tipo === 'png' ? 'PNG' : tipo === 'webp' ? 'WEBP' : 'JPEG', proporcion: p.width / p.height };
    } catch {
      return null;
    }
  })();

  /** Dibuja el logo dentro de una caja de alto `alto` (mm) y devuelve el ancho usado, o 0 si no hay logo. */
  const dibujarLogoImagen = (x: number, yTop: number, alto: number, anchoMax: number): number => {
    if (!imagenLogo) return 0;
    let h = alto;
    let w = h * imagenLogo.proporcion;
    if (w > anchoMax) { w = anchoMax; h = w / imagenLogo.proporcion; }
    try {
      doc.addImage(imagenLogo.src, imagenLogo.formato, x, yTop + (alto - h) / 2, w, h);
      return w;
    } catch {
      return 0;
    }
  };

  const encabezadoCompleto = async () => {
    // Marca y títulos
    const anchoLogo = dibujarLogoImagen(M, M + 1, 16, 34);
    let xTexto = M + 20;
    if (anchoLogo > 0) xTexto = M + anchoLogo + 4;
    else logo(M + 8.5, M + 9, 8);
    fuente('bold', 19, INK);
    texto(d.laboratorio.nombre.toUpperCase(), xTexto, M + 9);
    fuente('bold', 6.5, INK);
    texto('INFORME DE RESULTADOS DE LABORATORIO CLINICO', xTexto, M + 14);
    if (d.laboratorio.nombre_legal) { fuente('normal', 6.5, MUTED); texto(d.laboratorio.nombre_legal, xTexto, M + 18); }

    // Cuadro oscuro con el único código visible: el N.º de orden
    const bw = 64; const bh = 26; const bx = PW - M - bw;
    doc.setFillColor(...NAVY); doc.roundedRect(bx, M, bw, bh, 3, 3, 'F');
    const etiquetaPildora = oficial ? 'INFORME OFICIAL DE RESULTADOS' : 'BORRADOR - SIN VALOR OFICIAL';
    fuente('bold', 5.6, MINT);
    const pw = doc.getTextWidth(etiquetaPildora) + 6;
    doc.setDrawColor(...MINT); doc.setLineWidth(0.25);
    doc.roundedRect(bx + bw - 4 - pw, M + 3, pw, 4.6, 2.3, 2.3, 'S');
    texto(etiquetaPildora, bx + bw - 4 - pw / 2, M + 6.2, { align: 'center' });
    fuente('bold', 9, [255, 255, 255]);
    const rotulo = 'N.º DE ORDEN: ';
    const anchoVal = doc.getTextWidth(limpiarTexto(codigoOrden));
    texto(codigoOrden, bx + bw - 4, M + 13, { align: 'right' });
    texto(rotulo, bx + bw - 4 - anchoVal, M + 13, { align: 'right' });
    fuente('normal', 6.5, [203, 213, 225]);
    const fm = fmtFechaCorta(d.fecha_muestra);
    if (fm) texto(`Fecha de muestra: ${fm}`, bx + bw - 4, M + 18, { align: 'right' });
    texto(`Fecha de emision: ${fmtFechaCorta(d.fecha_emision || d.fecha_publicacion) || fmtFechaCorta(new Date())}`, bx + bw - 4, M + 22, { align: 'right' });

    // QR de verificación junto al cuadro (solo informes sellados)
    if (d.sello) {
      const qr = await QRCode.toDataURL(d.sello.url, { errorCorrectionLevel: 'M', margin: 1, width: 240 });
      const qx = bx - 3 - 17;
      doc.addImage(qr, 'PNG', qx, M + 1, 17, 17);
      fuente('bold', 4.8, MUTED);
      texto('CODIGO DE', qx + 8.5, M + 20.5, { align: 'center' });
      texto('VERIFICACION', qx + 8.5, M + 22.6, { align: 'center' });
    }

    // Contacto
    y = M + bh + 4;
    fuente('normal', 7, MUTED);
    const contacto = [
      d.laboratorio.telefono && `Tel. ${d.laboratorio.telefono}`,
      d.laboratorio.direccion,
      d.laboratorio.email
    ].filter(Boolean).join('   |   ');
    if (contacto) { for (const l of lineas(contacto, W)) { texto(l, M, y); y += 3.4; } }
    const legales = [
      d.laboratorio.nit && `NIT/RUC: ${d.laboratorio.nit}`,
      d.laboratorio.registro_sanitario && `Reg. sanitario: ${d.laboratorio.registro_sanitario}`,
      d.laboratorio.acreditacion && `Acreditacion: ${d.laboratorio.acreditacion}`
    ].filter(Boolean).join('   |   ');
    if (legales) { texto(legales, M, y); y += 3.4; }

    // Horario de atención
    const horario = (d.laboratorio.horario || HORARIO_PREDETERMINADO).trim();
    y += 1;
    doc.setFillColor(...NAVY); doc.roundedRect(M, y, W, 6.5, 1.8, 1.8, 'F');
    fuente('bold', 6.5, [203, 213, 225]);
    texto('HORARIO DE ATENCION:', M + 4, y + 4.2);
    const wRotulo = doc.getTextWidth('HORARIO DE ATENCION:');
    fuente('bold', 6.8, [255, 255, 255]);
    texto(horario, M + 6 + wRotulo, y + 4.2);
    y += 6.5 + 4;
  };

  const encabezadoCorto = () => {
    const anchoLogoCorto = dibujarLogoImagen(M, 6.5, 9, 18);
    if (anchoLogoCorto <= 0) logo(M + 3.5, 11, 3.2);
    fuente('bold', 10, INK);
    texto(d.laboratorio.nombre.toUpperCase(), anchoLogoCorto > 0 ? M + anchoLogoCorto + 3 : M + 9, 12.2);
    fuente('normal', 7.5, MUTED);
    texto(`Orden ${codigoOrden} - ${limpiarTexto(d.paciente.nombre || '')}`, PW - M, 12.2, { align: 'right' });
    doc.setDrawColor(...acento); doc.setLineWidth(0.5); doc.line(M, 16, PW - M, 16);
    y = 22;
  };

  const asegurar = (alto: number, alSaltar?: () => void) => {
    if (y + alto > PH - FOOT) {
      doc.addPage();
      encabezadoCorto();
      alSaltar?.();
    }
  };

  const tituloSeccion = (t: string) => {
    asegurar(12);
    fuente('bold', 9.5, INK);
    texto(t.toUpperCase(), M, y);
    doc.setDrawColor(...acento); doc.setLineWidth(0.5); doc.line(M, y + 1.8, PW - M, y + 1.8);
    y += 7;
  };

  const parrafo = (t: string, tam = 9.5) => {
    fuente('normal', tam, [30, 30, 30]);
    for (const l of lineas(t, W)) {
      asegurar(5);
      texto(l, M, y);
      y += tam * 0.42 + 0.9;
    }
    y += 2;
  };

  // ---------------- Página 1 ----------------
  await encabezadoCompleto();

  // Datos del paciente (tarjeta)
  const p = d.paciente;
  const campos: Array<[string, string, boolean]> = [
    ['Paciente', (p.nombre || '-').toUpperCase(), true],
    ['Edad / genero', `${textoEdad(p.edad)}  -  ${textoGenero(p.genero)}`, false],
    ['Documento / ID', p.documento || '-', false],
    ['Medico referente', p.medico || 'Particular', false],
    ['Tipo de muestra', p.muestra || '-', false],
    ['Fecha de muestra', fmtFecha(d.fecha_muestra), false]
  ];
  const colW = W / 3;
  const altoTarjeta = 9 + Math.ceil(campos.length / 3) * 11 + 1;
  doc.setFillColor(...CARD); doc.setDrawColor(...RULE); doc.setLineWidth(0.25);
  doc.roundedRect(M, y, W, altoTarjeta, 2.5, 2.5, 'FD');
  fuente('bold', 8, INK);
  texto('DATOS DEL PACIENTE', M + 4, y + 5.8);
  campos.forEach(([k, v, fuerte], idx) => {
    const cx = M + 4 + (idx % 3) * colW;
    const cy = y + 12 + Math.floor(idx / 3) * 11;
    fuente('bold', 5.8, MUTED);
    texto(k.toUpperCase(), cx, cy);
    fuente('bold', fuerte ? 9.5 : 8.6, INK);
    texto(lineas(v, colW - 6)[0] || '-', cx, cy + 4.3);
  });
  y += altoTarjeta + 5;

  // ---------------- Resultados ----------------
  asegurar(24);
  fuente('bold', 9.5, INK);
  texto('RESULTADOS DE LOS ANALISIS CLINICOS', M, y);
  // Leyenda de colores
  const leyenda: Array<[string, RGB]> = [['BAJO', BAJO_TXT], ['ALTO', ALTO_TXT], ['NORMAL', OK_TXT]];
  let lx = PW - M;
  fuente('bold', 6, MUTED);
  for (const [etq, col] of leyenda) {
    const w = doc.getTextWidth(etq);
    texto(etq, lx - w, y - 0.3);
    doc.setFillColor(...col); doc.circle(lx - w - 2.2, y - 1, 0.9, 'F');
    lx -= w + 7;
  }
  doc.setDrawColor(...acento); doc.setLineWidth(0.5); doc.line(M, y + 1.8, PW - M, y + 1.8);
  y += 7;

  const cols = [
    { t: 'Examen / parametro', w: W * 0.36 },
    { t: 'Resultado obtenido', w: W * 0.17 },
    { t: 'Valores de referencia', w: W * 0.29 },
    { t: 'Estado', w: W * 0.18 }
  ];
  const xs: number[] = [];
  cols.reduce((acc, c) => { xs.push(acc); return acc + c.w; }, M);

  const cabeceraTabla = () => {
    fuente('bold', 6.2, MUTED);
    cols.forEach((c, i) => texto(c.t.toUpperCase(), xs[i] + 3, y));
    doc.setDrawColor(...RULE); doc.setLineWidth(0.25); doc.line(M, y + 1.8, PW - M, y + 1.8);
    y += 6;
  };

  if (d.parametros.length === 0) {
    fuente('italic', 9, [120, 120, 120]);
    texto('Este informe no contiene resultados cuantitativos.', M + 1.5, y + 1);
    y += 8;
  }

  // Los parámetros se agrupan por sección (en el orden en que aparecen).
  const grupos: Array<{ nombre: string; filas: ParametroPdf[] }> = [];
  for (const prm of d.parametros) {
    const nombre = (prm.section && prm.section.trim()) || d.titulo || 'Resultados';
    const g = grupos.find((x) => x.nombre === nombre);
    if (g) g.filas.push(prm); else grupos.push({ nombre, filas: [prm] });
  }

  for (const g of grupos) {
    asegurar(30);
    doc.setFillColor(...CARD); doc.setDrawColor(...RULE); doc.setLineWidth(0.25);
    doc.roundedRect(M, y - 4.2, W, 8, 2, 2, 'FD');
    fuente('bold', 8.6, INK);
    texto(g.nombre, M + 3, y + 0.8);
    const cuenta = `${g.filas.length} ${g.filas.length === 1 ? 'PARAMETRO' : 'PARAMETROS'}`;
    fuente('bold', 5.8, INK);
    const cw = doc.getTextWidth(cuenta) + 5;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(PW - M - 3 - cw, y - 2.8, cw, 5, 2.5, 2.5, 'FD');
    texto(cuenta, PW - M - 3 - cw / 2, y + 0.6, { align: 'center' });
    y += 8;
    cabeceraTabla();

    for (const prm of g.filas) {
      const estado = (prm.status || 'normal').toLowerCase();
      const anormal = estado !== 'normal';
      const nombre = lineas(prm.name || '-', cols[0].w - 5);
      const notas = prm.notes ? lineas(`Nota: ${prm.notes}`, cols[0].w - 5) : [];
      const unidad = prm.unit ? ` ${limpiarTexto(prm.unit)}` : '';
      const ref = lineas(prm.referenceRange || '-', cols[2].w - 4);
      const filas = Math.max(nombre.length + notas.length, ref.length, 1);
      const alto = filas * 4 + 3;
      asegurar(alto + 1, () => { /* la fila sigue en la hoja siguiente */ cabeceraTabla(); });
      fuente('bold', 8.6, INK);
      nombre.forEach((l, i) => texto(l, xs[0] + 3, y + i * 4));
      if (notas.length) {
        fuente('italic', 7, [100, 100, 100]);
        notas.forEach((l, i) => texto(l, xs[0] + 3, y + (nombre.length + i) * 4));
      }
      // Resultado + unidad
      const colorValor: RGB = estado === 'high' || estado === 'critical' ? ALTO_TXT : estado === 'low' ? BAJO_TXT : INK;
      fuente('bold', anormal ? 10 : 9, colorValor);
      const valor = lineas(prm.value ?? '-', cols[1].w - 3)[0] || '-';
      texto(valor, xs[1] + 3, y);
      if (unidad) {
        const wv = doc.getTextWidth(limpiarTexto(valor));
        fuente('normal', 6.8, MUTED);
        texto(unidad, xs[1] + 3 + wv + 0.8, y);
      }
      fuente('normal', 8, MUTED);
      ref.forEach((l, i) => texto(l, xs[2] + 3, y + i * 4));
      // Estado: pastilla con texto (se entiende también en blanco y negro)
      const etiqueta = ETIQUETA_ESTADO[estado] || limpiarTexto(prm.status).toUpperCase();
      const [bg, tx]: [RGB, RGB] = estado === 'normal' ? [OK_BG, OK_TXT]
        : estado === 'low' ? [BAJO_BG, BAJO_TXT]
        : estado === 'critical' ? [INK, [255, 255, 255]]
        : [ALTO_BG, ALTO_TXT];
      fuente('bold', 6.2, tx);
      const ancho = doc.getTextWidth(etiqueta) + 6;
      doc.setFillColor(...bg);
      doc.roundedRect(xs[3] + 3, y - 3.4, ancho, 4.6, 2.3, 2.3, 'F');
      texto(etiqueta, xs[3] + 3 + ancho / 2, y - 0.2, { align: 'center' });
      y += alto;
      doc.setDrawColor(...RULE); doc.setLineWidth(0.15); doc.line(M, y - 3.4, PW - M, y - 3.4);
    }
    y += 3;
  }
  y += 2;

  // Nota fija bajo los resultados
  asegurar(12);
  doc.setFillColor(239, 246, 255); doc.setDrawColor(191, 219, 254); doc.setLineWidth(0.25);
  doc.roundedRect(M, y - 3.5, W, 8, 2, 2, 'FD');
  fuente('bold', 7.2, [30, 64, 175]);
  texto('Nota:', M + 3, y + 1.2);
  fuente('normal', 7.2, [30, 58, 138]);
  texto('Los resultados corresponden unicamente a la muestra analizada. Ante cualquier duda, consulte a su medico tratante.', M + 10.5, y + 1.2);
  y += 10;

  // ---------------- Texto clínico ----------------
  if (d.hallazgos && d.hallazgos.trim()) { tituloSeccion('Hallazgos clinicos'); parrafo(d.hallazgos); }
  if (d.incluirConclusiones !== false && d.conclusiones && d.conclusiones.trim()) { tituloSeccion('Conclusiones'); parrafo(d.conclusiones); }
  if (d.incluirExplicacion && d.explicacion && d.explicacion.trim()) { tituloSeccion('Explicacion para el paciente'); parrafo(d.explicacion); }
  if (d.incluirRecomendaciones !== false && d.recomendaciones && d.recomendaciones.length > 0) {
    tituloSeccion('Recomendaciones');
    for (const r of d.recomendaciones) parrafo(`- ${r}`);
  }

  // ---------------- Firmas y verificación ----------------
  // Alto del bloque de firmas + QR + texto de verificación (debe caber sobre la banda del pie).
  const ALTO_BLOQUE = oficial ? 76 : 46;
  asegurar(ALTO_BLOQUE);
  y += 2;
  tituloSeccion(oficial ? 'Firmas y verificacion' : 'Firmas');
  const yBloque = y;
  const anchoTexto = oficial ? W - 40 : W;
  const firmantes = (d.firmas.firmantes || []).filter((f) => f.nombre && f.nombre.trim()).slice(0, 3);
  let yf = yBloque;
  if (firmantes.length > 0) {
    // Hasta 3 firmas lado a lado; el QR de verificación ocupa la cuarta columna.
    const anchoCol = (oficial ? W - 36 : W) / 3;
    let altoMax = 0;
    for (let k = 0; k < firmantes.length; k++) {
      const f = firmantes[k];
      const cx = M + anchoCol * k + anchoCol / 2;
      const wLinea = anchoCol - 8;
      // Espacio de la firma manuscrita (imagen) sobre la línea.
      if (oficial && f.imagen && /^data:image\/(png|jpe?g);base64,/i.test(f.imagen)) {
        try {
          const props = doc.getImageProperties(f.imagen);
          const maxW = Math.min(36, wLinea); const maxH = 12;
          const esc = Math.min(maxW / props.width, maxH / props.height);
          const w = props.width * esc; const h = props.height * esc;
          doc.addImage(f.imagen, /png/i.test(f.imagen.slice(0, 20)) ? 'PNG' : 'JPEG', cx - w / 2, yBloque + 12.5 - h, w, h);
        } catch { /* una firma ilegible no debe impedir el informe */ }
      }
      doc.setDrawColor(...INK); doc.setLineWidth(0.3);
      doc.line(cx - wLinea / 2, yBloque + 13, cx + wLinea / 2, yBloque + 13);
      let yy = yBloque + 16.5;
      fuente('bold', 6.2, MUTED);
      texto(f.rotulo.toUpperCase(), cx, yy, { align: 'center' }); yy += 3.8;
      fuente('bold', 8.5, INK);
      for (const l of lineas(f.nombre, wLinea)) { texto(l, cx, yy, { align: 'center' }); yy += 3.8; }
      fuente('normal', 7, MUTED);
      for (const t of [f.cargo, f.especialidad, f.colegiado ? `Colegiado ${f.colegiado}` : ''].filter((x): x is string => !!x && x.trim() !== '')) {
        for (const l of lineas(t, wLinea)) { texto(l, cx, yy, { align: 'center' }); yy += 3.3; }
      }
      altoMax = Math.max(altoMax, yy - yBloque);
    }
    yf = yBloque + altoMax + 2;
    if (oficial) {
      fuente('bold', 6.2, MUTED);
      texto('FECHA DE PUBLICACION', M, yf); fuente('bold', 8, INK);
      texto(fmtFecha(d.fecha_publicacion, true), M + 34, yf);
      yf += 5;
    }
  } else {
    const filasFirma: Array<[string, string]> = [
      ['Publicado por', [d.firmas.publicado_por, d.firmas.colegiado && `Colegiado ${d.firmas.colegiado}`, d.firmas.especialidad].filter(Boolean).join(' - ') || '-'],
      ['Resultados validados por', d.firmas.validado_por.join(', ') || '-']
    ];
    if (d.firmas.verificado_por.length) filasFirma.push(['Criticos verificados por (2a verificacion)', d.firmas.verificado_por.join(', ')]);
    if (oficial) filasFirma.push(['Fecha de publicacion', fmtFecha(d.fecha_publicacion, true)]);
    for (const [k, v] of filasFirma) {
      fuente('bold', 6.2, MUTED);
      texto(k.toUpperCase(), M, yf);
      fuente('bold', 9, INK);
      const ls = lineas(v, anchoTexto);
      ls.forEach((l, i) => texto(l, M, yf + 4.2 + i * 4));
      yf += 4.2 + ls.length * 4 + 3;
    }
  }
  if (oficial && d.sello) {
    const qr = await QRCode.toDataURL(d.sello.url, { errorCorrectionLevel: 'M', margin: 1, width: 360 });
    doc.addImage(qr, 'PNG', PW - M - 32, yBloque - 2, 32, 32);
    fuente('bold', 6, MUTED);
    texto('ESCANEE PARA VERIFICAR', PW - M - 16, yBloque + 33, { align: 'center' });
    yf = Math.max(yf, yBloque + 37);
    // Comprobación manual, en letra pequeña: no es otro código para el paciente.
    fuente('normal', 6.5, MUTED);
    texto(`Verificacion manual: codigo ${formatearCodigo(d.sello.codigo)}  |  huella ${huellaCorta(d.sello.hash)}`, M, yf);
    yf += 3.6;
    fuente('normal', 6.5, MUTED);
    for (const l of lineas(`Verifique la autenticidad de este informe en: ${d.sello.url}. La verificacion confirma que el contenido no fue modificado desde su publicacion.`, W)) {
      texto(l, M, yf); yf += 3.1;
    }
    y = yf;
  } else {
    y = yf + 2;
    fuente('bold', 8.5, INK);
    for (const l of lineas('Este documento es un BORRADOR sin valor oficial: no ha sido publicado y no incluye codigo de verificacion.', W)) { texto(l, M, y); y += 4; }
  }

  // ---------------- Pie de página en todas las páginas ----------------
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    marcaDeAgua();
    // Banda de valores (solo en la última hoja)
    if (i === total) {
      const by = PH - 25; const bh = 8;
      doc.setFillColor(...acento); doc.roundedRect(M, by, W, bh, 3, 3, 'F');
      fuente('bold', 6.2, [255, 255, 255]);
      const pilares = ['TECNOLOGIA AVANZADA', 'RESULTADOS CONFIABLES', 'ATENCION PERSONALIZADA', 'COMPROMISO CON TU SALUD'];
      pilares.forEach((t, k) => texto(t, M + (W / 4) * (k + 0.5), by + 5, { align: 'center' }));
    }
    doc.setDrawColor(...RULE); doc.setLineWidth(0.2); doc.line(M, PH - 14, PW - M, PH - 14);
    fuente('normal', 7, MUTED);
    texto(oficial ? `Orden ${codigoOrden}  |  ${d.laboratorio.nombre}` : `Orden ${codigoOrden}  |  BORRADOR - sin valor oficial`, M, PH - 10);
    texto(`Pagina ${i} de ${total}`, PW - M, PH - 10, { align: 'right' });
    texto('Documento confidencial: contiene informacion de salud protegida. Su valor clinico depende de la interpretacion de un profesional.', M, PH - 6.5);
  }

  return new Uint8Array(doc.output('arraybuffer'));
}
