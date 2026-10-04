/**
 * PDF oficial del informe, generado en el SERVIDOR (migración 0019).
 *
 * Por qué en el servidor: el PDF que sale del navegador lo arma el cliente
 * con lo que el cliente quiera (firmantes inventados, hash aleatorio, QR a un
 * dominio sin ruta). Este PDF, en cambio, se compone solo con datos que
 * están en la base de datos — informe sellado, laboratorio, firmantes reales
 * (quién capturó/validó/verificó/publicó) — y el QR apunta a la verificación
 * pública real (`/verificar/:codigo`), que recalcula la huella del contenido.
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
  };
  firmas: {
    publicado_por?: string | null; colegiado?: string | null; especialidad?: string | null;
    validado_por: string[]; verificado_por: string[];
  };
  /** Solo si el informe está publicado y sellado. */
  sello?: { codigo: string; hash: string; url: string };
}

const CARACTERES_ASCII: Record<string, string> = {
  '≥': '>=', '≤': '<=', '–': '-', '—': '-', '‑': '-', '−': '-', '‘': "'", '’': "'", '“': '"', '”': '"',
  '…': '...', '•': '-', '→': '->', '←': '<-', 'µ': 'u', 'μ': 'u', '²': '^2', '³': '^3', '¹': '^1', ' ': ' ', ' ': ' '
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

function rgb(hex: string | null | undefined, porDefecto: [number, number, number]): [number, number, number] {
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

const ETIQUETA_ESTADO: Record<string, string> = { normal: 'Normal', low: 'Bajo', high: 'Alto', critical: 'CRITICO' };

export async function generarInformePdf(d: DatosInformePdf): Promise<Uint8Array> {
  const formato = d.laboratorio.papel === 'a4' ? 'a4' : d.laboratorio.papel === 'legal' ? 'legal' : 'letter';
  const doc = new jsPDF({ unit: 'mm', format: formato, compress: true });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 16;
  const W = PW - M * 2;
  const FOOT = 24; // reserva inferior para el pie de página
  const color = rgb(d.laboratorio.color_primario, [13, 148, 136]);
  const rojo = rgb(d.laboratorio.color_critico, [200, 30, 30]);
  const oficial = !!d.sello;

  let y = M;
  const texto = (t: unknown, x: number, yy: number, opts?: any) => doc.text(limpiarTexto(t), x, yy, opts);
  const lineas = (t: unknown, ancho: number): string[] => doc.splitTextToSize(limpiarTexto(t), ancho);

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

  const encabezadoCompleto = () => {
    doc.setFillColor(...color);
    doc.rect(0, 0, PW, 3, 'F');
    y = 12;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...color);
    texto(d.laboratorio.nombre, M, y + 4);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(90, 90, 90);
    let yy = y + 9;
    const datos = [
      d.laboratorio.nombre_legal,
      [d.laboratorio.nit && `NIT/RUC: ${d.laboratorio.nit}`, d.laboratorio.registro_sanitario && `Reg. sanitario: ${d.laboratorio.registro_sanitario}`].filter(Boolean).join('  |  '),
      d.laboratorio.acreditacion && `Acreditacion: ${d.laboratorio.acreditacion}`,
      d.laboratorio.direccion,
      [d.laboratorio.telefono && `Tel. ${d.laboratorio.telefono}`, d.laboratorio.email].filter(Boolean).join('  |  ')
    ].filter(Boolean) as string[];
    for (const l of datos) { texto(l, M, yy); yy += 3.6; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(40, 40, 40);
    texto('INFORME DE LABORATORIO', PW - M, y + 3, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    texto(`No. ${d.numero_informe}`, PW - M, y + 8, { align: 'right' });
    texto(`Emision: ${fmtFecha(d.fecha_emision || d.fecha_publicacion)}`, PW - M, y + 12.5, { align: 'right' });
    y = Math.max(yy, y + 16) + 1;
    doc.setDrawColor(...color); doc.setLineWidth(0.6); doc.line(M, y, PW - M, y);
    y += 6;
  };

  const encabezadoCorto = () => {
    doc.setFillColor(...color);
    doc.rect(0, 0, PW, 3, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...color);
    texto(d.laboratorio.nombre, M, 11);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(90, 90, 90);
    texto(`Informe ${d.numero_informe} - ${limpiarTexto(d.paciente.nombre || '')}`, PW - M, 11, { align: 'right' });
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2); doc.line(M, 14, PW - M, 14);
    y = 20;
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
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...color);
    texto(t.toUpperCase(), M, y);
    doc.setDrawColor(...color); doc.setLineWidth(0.25); doc.line(M, y + 1.5, PW - M, y + 1.5);
    y += 6;
  };

  const parrafo = (t: string, tam = 9.5) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(tam); doc.setTextColor(30, 30, 30);
    for (const l of lineas(t, W)) {
      asegurar(5);
      texto(l, M, y);
      y += tam * 0.42 + 0.9;
    }
    y += 2;
  };

  // ---------------- Página 1 ----------------
  encabezadoCompleto();

  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(20, 20, 20);
  for (const l of lineas(d.titulo, W)) { texto(l, M, y); y += 6; }
  y += 1;

  // Ficha del paciente
  const p = d.paciente;
  const campos: Array<[string, string]> = [
    ['Paciente', p.nombre || '-'], ['Documento', p.documento || '-'],
    ['Edad', p.edad !== undefined && p.edad !== null && p.edad !== '' ? String(p.edad) : '-'], ['Sexo', p.genero || '-'],
    ['Medico referente', p.medico || '-'], ['Tipo de muestra', p.muestra || '-'],
    ['Fecha de muestra', fmtFecha(d.fecha_muestra)], ['Estado del informe', oficial ? 'Publicado' : 'Borrador (sin valor oficial)']
  ];
  const colW = W / 2;
  const altoFicha = Math.ceil(campos.length / 2) * 10 + 4;
  doc.setFillColor(244, 247, 249); doc.setDrawColor(220, 226, 230); doc.setLineWidth(0.2);
  doc.roundedRect(M, y, W, altoFicha, 1.5, 1.5, 'FD');
  campos.forEach(([k, v], idx) => {
    const cx = M + 4 + (idx % 2) * colW;
    const cy = y + 6 + Math.floor(idx / 2) * 10;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110, 110, 110);
    texto(k.toUpperCase(), cx, cy);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(25, 25, 25);
    texto(lineas(v, colW - 8)[0] || '-', cx, cy + 4.2);
  });
  y += altoFicha + 7;

  // ---------------- Tabla de resultados ----------------
  tituloSeccion('Resultados');
  const cols = [
    { t: 'Prueba', w: W * 0.36, a: 'left' as const },
    { t: 'Resultado', w: W * 0.16, a: 'left' as const },
    { t: 'Unidad', w: W * 0.13, a: 'left' as const },
    { t: 'Valores de referencia', w: W * 0.23, a: 'left' as const },
    { t: 'Estado', w: W * 0.12, a: 'left' as const }
  ];
  const xs: number[] = [];
  cols.reduce((acc, c) => { xs.push(acc); return acc + c.w; }, M);

  const cabeceraTabla = () => {
    doc.setFillColor(...color);
    doc.rect(M, y - 4.2, W, 6.2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
    cols.forEach((c, i) => texto(c.t, xs[i] + 1.5, y));
    y += 5.2;
  };
  cabeceraTabla();

  let seccionActual: string | undefined;
  let cebra = false;
  if (d.parametros.length === 0) {
    doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
    texto('Este informe no contiene resultados cuantitativos.', M + 1.5, y + 1);
    y += 8;
  }
  for (const prm of d.parametros) {
    if (prm.section && prm.section !== seccionActual) {
      seccionActual = prm.section;
      asegurar(14, cabeceraTabla);
      doc.setFillColor(228, 234, 238);
      doc.rect(M, y - 3.6, W, 5.2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(50, 60, 70);
      texto(prm.section, M + 1.5, y);
      y += 5.2;
    }
    const estado = (prm.status || 'normal').toLowerCase();
    const anormal = estado !== 'normal';
    const nombre = lineas(prm.name || '-', cols[0].w - 3);
    const notas = prm.notes ? lineas(`Nota: ${prm.notes}`, cols[0].w - 3) : [];
    const ref = lineas(prm.referenceRange || '-', cols[3].w - 3);
    const filas = Math.max(nombre.length + notas.length, ref.length, 1);
    const alto = filas * 4 + 2;
    asegurar(alto + 1, cabeceraTabla);
    if (cebra) { doc.setFillColor(248, 250, 251); doc.rect(M, y - 3.4, W, alto, 'F'); }
    cebra = !cebra;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(30, 30, 30);
    nombre.forEach((l, i) => texto(l, xs[0] + 1.5, y + i * 4));
    if (notas.length) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(100, 100, 100);
      notas.forEach((l, i) => texto(l, xs[0] + 1.5, y + (nombre.length + i) * 4));
    }
    doc.setFont('helvetica', anormal ? 'bold' : 'normal'); doc.setFontSize(9);
    if (estado === 'critical') doc.setTextColor(...rojo); else if (anormal) doc.setTextColor(180, 90, 0); else doc.setTextColor(30, 30, 30);
    texto(lineas(prm.value ?? '-', cols[1].w - 3)[0] || '-', xs[1] + 1.5, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60, 60, 60);
    texto(lineas(prm.unit || '', cols[2].w - 3)[0] || '', xs[2] + 1.5, y);
    ref.forEach((l, i) => texto(l, xs[3] + 1.5, y + i * 4));
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    if (estado === 'critical') doc.setTextColor(...rojo); else if (anormal) doc.setTextColor(180, 90, 0); else doc.setTextColor(40, 130, 70);
    texto(ETIQUETA_ESTADO[estado] || limpiarTexto(prm.status), xs[4] + 1.5, y);
    y += alto;
    doc.setDrawColor(232, 236, 238); doc.setLineWidth(0.15); doc.line(M, y - 3, PW - M, y - 3);
  }
  y += 5;

  // ---------------- Texto clínico ----------------
  if (d.hallazgos && d.hallazgos.trim()) { tituloSeccion('Hallazgos clinicos'); parrafo(d.hallazgos); }
  if (d.incluirConclusiones !== false && d.conclusiones && d.conclusiones.trim()) { tituloSeccion('Conclusiones'); parrafo(d.conclusiones); }
  if (d.incluirExplicacion && d.explicacion && d.explicacion.trim()) { tituloSeccion('Explicacion para el paciente'); parrafo(d.explicacion); }
  if (d.incluirRecomendaciones !== false && d.recomendaciones && d.recomendaciones.length > 0) {
    tituloSeccion('Recomendaciones');
    for (const r of d.recomendaciones) parrafo(`- ${r}`);
  }

  // ---------------- Firmas y sello ----------------
  const ALTO_BLOQUE = 52;
  asegurar(ALTO_BLOQUE);
  y += 2;
  tituloSeccion(oficial ? 'Firmas y verificacion' : 'Firmas');
  const yBloque = y;
  const anchoTexto = oficial ? W - 42 : W;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(40, 40, 40);
  const filasFirma: Array<[string, string]> = [
    ['Publicado por', [d.firmas.publicado_por, d.firmas.colegiado && `Colegiado ${d.firmas.colegiado}`, d.firmas.especialidad].filter(Boolean).join(' - ') || '-'],
    ['Resultados validados por', d.firmas.validado_por.join(', ') || '-']
  ];
  if (d.firmas.verificado_por.length) filasFirma.push(['Criticos verificados por (2a verificacion)', d.firmas.verificado_por.join(', ')]);
  if (oficial) filasFirma.push(['Fecha de publicacion', fmtFecha(d.fecha_publicacion, true)]);
  let yf = yBloque;
  for (const [k, v] of filasFirma) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110, 110, 110);
    texto(k.toUpperCase(), M, yf);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(25, 25, 25);
    const ls = lineas(v, anchoTexto);
    ls.forEach((l, i) => texto(l, M, yf + 4.2 + i * 4));
    yf += 4.2 + ls.length * 4 + 3;
  }
  if (oficial && d.sello) {
    const qr = await QRCode.toDataURL(d.sello.url, { errorCorrectionLevel: 'M', margin: 1, width: 360 });
    doc.addImage(qr, 'PNG', PW - M - 34, yBloque - 2, 34, 34);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(90, 90, 90);
    texto('Escanee para verificar', PW - M - 17, yBloque + 35, { align: 'center' });
    yf = Math.max(yf, yBloque + 38);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110, 110, 110);
    texto('CODIGO DE VERIFICACION', M, yf);
    doc.setFont('courier', 'bold'); doc.setFontSize(10); doc.setTextColor(25, 25, 25);
    texto(formatearCodigo(d.sello.codigo), M, yf + 4.5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(110, 110, 110);
    texto('HUELLA DEL CONTENIDO (SHA-256, primeros 64 bits)', M + 62, yf);
    doc.setFont('courier', 'bold'); doc.setFontSize(10); doc.setTextColor(25, 25, 25);
    texto(huellaCorta(d.sello.hash), M + 62, yf + 4.5);
    yf += 10;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(90, 90, 90);
    for (const l of lineas(`Verifique la autenticidad de este informe en: ${d.sello.url}. La verificacion confirma que el contenido no fue modificado desde su publicacion.`, W)) {
      texto(l, M, yf); yf += 3.3;
    }
    y = yf;
  } else {
    y = yf + 2;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...rojo);
    for (const l of lineas('Este documento es un BORRADOR sin valor oficial: no ha sido publicado y no incluye codigo de verificacion.', W)) { texto(l, M, y); y += 4; }
  }

  // ---------------- Pie de página en todas las páginas ----------------
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    marcaDeAgua();
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2); doc.line(M, PH - 14, PW - M, PH - 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(110, 110, 110);
    texto(oficial && d.sello
      ? `Informe ${d.numero_informe} | Codigo ${formatearCodigo(d.sello.codigo)} | Huella ${huellaCorta(d.sello.hash)}`
      : `Informe ${d.numero_informe} | BORRADOR - sin valor oficial`, M, PH - 10);
    texto(`Pagina ${i} de ${total}`, PW - M, PH - 10, { align: 'right' });
    texto('Documento confidencial: contiene informacion de salud protegida. Su valor clinico depende de la interpretacion de un profesional.', M, PH - 6.5);
  }

  return new Uint8Array(doc.output('arraybuffer'));
}
