/**
 * Verificación PÚBLICA de autenticidad de un informe (migración 0019).
 *
 * Quien recibe un PDF (paciente, médico tratante, aseguradora) escanea el QR
 * o escribe el código y esta ruta le responde, desde la base de datos real:
 *   - si el informe existe y está publicado,
 *   - si su contenido sigue siendo EXACTAMENTE el que se selló al publicarlo
 *     (se recalcula la huella SHA-256 y se compara con la sellada),
 *   - si la copia que tiene en la mano es de la versión vigente (el QR lleva
 *     los primeros caracteres de la huella de la versión impresa: `?h=`),
 *   - quién lo publicó y quién validó/verificó los resultados.
 *
 * Es pública a propósito (no hay sesión de paciente al escanear un QR), así
 * que expone lo MÍNIMO: nombre del paciente enmascarado, jamás documento,
 * teléfono ni valores clínicos. El código (16 caracteres, ~79 bits) no es
 * adivinable; aun así se limita la tasa por IP para no exponer la base a
 * barridos ni a carga.
 *
 * Dos routers: JSON (`/api/verificar/:codigo`) y página HTML renderizada en
 * el servidor (`/verificar/:codigo`) — sin JavaScript ni dependencia del
 * bundle de React, para que funcione desde cualquier teléfono. Todo texto
 * que viene de la base se escapa antes de ir al HTML.
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler } from '../asyncHandler';
import {
  esCodigoVerificacionValido, formatearCodigo, hashContenido, huellaCorta, enmascararNombre
} from '../informeIntegridad';

export type EstadoVerificacion = 'valido' | 'modificado' | 'no_publicado' | 'anulado';

export interface ResultadoVerificacion {
  estado: EstadoVerificacion;
  /** null si el QR no trae huella de versión (o el informe no está vigente). */
  version_coincide: boolean | null;
  codigo: string;
  numero_informe: string;
  titulo: string;
  categoria: string | null;
  laboratorio: string;
  laboratorio_legal: string | null;
  registro_sanitario: string | null;
  fecha_publicacion: Date | string | null;
  fecha_sello: Date | string | null;
  paciente_enmascarado: string;
  publicado_por: { nombre: string | null; colegiado: string | null; especialidad: string | null };
  validado_por: string[];
  verificado_por: string[];
  huella: string;
}

// --- Límite de tasa por IP (en memoria, igual que portal.ts) -----------------
const MAX_CONSULTAS = 120;
const VENTANA_MS = 15 * 60_000;
const consultasPorIp = new Map<string, { count: number; resetAt: number }>();

export function permitirConsulta(ip: string, ahora = Date.now()): boolean {
  const e = consultasPorIp.get(ip);
  if (!e || e.resetAt < ahora) {
    // Higiene: evita que el mapa crezca sin límite con IPs que no vuelven.
    if (consultasPorIp.size > 5000) {
      for (const [k, v] of consultasPorIp) if (v.resetAt < ahora) consultasPorIp.delete(k);
    }
    consultasPorIp.set(ip, { count: 1, resetAt: ahora + VENTANA_MS });
    return true;
  }
  e.count += 1;
  return e.count <= MAX_CONSULTAS;
}

/** Solo para pruebas. */
export function _reiniciarLimite() {
  consultasPorIp.clear();
}

const unicos = (xs: Array<string | null>) => [...new Set(xs.filter((x): x is string => !!x && x.trim() !== ''))];

export async function consultarVerificacion(codigo: string, huellaVersion?: string): Promise<ResultadoVerificacion | null> {
  const { rows } = await pool.query(
    `SELECT i.id_informe, i.id_orden, i.numero_informe, i.titulo, i.categoria, i.estado, i.eliminado,
            i.hallazgos_clinicos, i.conclusiones_medico, i.explicacion_paciente, i.recomendaciones,
            i.datos_json, i.codigo_verificacion, i.hash_contenido, i.fecha_sello, i.fecha_publicacion,
            i.publicado_por_nombre, i.publicado_por_colegiado, i.publicado_por_especialidad,
            c.nombre_laboratorio, c.nombre_legal, c.registro_sanitario
     FROM informe_clinico i
     LEFT JOIN configuracion_laboratorio c ON c.id_laboratorio = 1
     WHERE i.codigo_verificacion = $1`,
    [codigo]
  );
  if (rows.length === 0) return null;
  const i = rows[0];

  let validado: string[] = [];
  let verificado: string[] = [];
  if (i.id_orden) {
    const { rows: firmantes } = await pool.query(
      `SELECT r.validado_por_nombre, r.verificado_por_nombre
       FROM resultado r
       JOIN detalle_orden d ON d.id_detalle = r.id_detalle
       WHERE d.id_orden = $1`,
      [i.id_orden]
    );
    validado = unicos(firmantes.map((f: any) => f.validado_por_nombre));
    verificado = unicos(firmantes.map((f: any) => f.verificado_por_nombre));
  }

  const recalculado = hashContenido(i);
  const publicado = i.estado === 'publicado' || i.estado === 'entregado';
  let estado: EstadoVerificacion;
  if (i.eliminado) estado = 'anulado';
  else if (!publicado) estado = 'no_publicado';
  else if (recalculado !== i.hash_contenido) estado = 'modificado';
  else estado = 'valido';

  // ¿La copia impresa es la versión vigente? Solo tiene sentido si el
  // informe sigue íntegro; la huella del QR es el prefijo de la sellada.
  let versionCoincide: boolean | null = null;
  if (huellaVersion && /^[0-9a-f]{8,64}$/i.test(huellaVersion) && estado === 'valido') {
    versionCoincide = String(i.hash_contenido).toLowerCase().startsWith(huellaVersion.toLowerCase());
  }

  return {
    estado,
    version_coincide: versionCoincide,
    codigo: i.codigo_verificacion,
    numero_informe: i.numero_informe,
    titulo: i.titulo,
    categoria: i.categoria,
    laboratorio: i.nombre_laboratorio || 'Laboratorio clínico',
    laboratorio_legal: i.nombre_legal || null,
    registro_sanitario: i.registro_sanitario || null,
    fecha_publicacion: i.fecha_publicacion,
    fecha_sello: i.fecha_sello,
    paciente_enmascarado: enmascararNombre(i.datos_json?.patientName),
    publicado_por: {
      nombre: i.publicado_por_nombre, colegiado: i.publicado_por_colegiado, especialidad: i.publicado_por_especialidad
    },
    validado_por: validado,
    verificado_por: verificado,
    huella: huellaCorta(i.hash_contenido || '')
  };
}

// --- HTML -----------------------------------------------------------------
export function esc(valor: unknown): string {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

function fmtFecha(valor: Date | string | null): string {
  if (!valor) return '—';
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-GT', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Guatemala' });
}

const PAGINA_CSS = `
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f1f5f9;color:#0f172a;padding:16px}
.card{max-width:560px;margin:24px auto;background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.12);overflow:hidden}
.banner{padding:20px 22px;color:#fff}.ok{background:#059669}.warn{background:#d97706}.bad{background:#dc2626}.neutral{background:#475569}
.banner h1{margin:0;font-size:20px}.banner p{margin:6px 0 0;font-size:13.5px;opacity:.95;line-height:1.4}
dl{margin:0;padding:8px 22px 18px}dt{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-top:14px}
dd{margin:2px 0 0;font-size:15px;font-weight:600;word-break:break-word}dd small{font-weight:400;color:#475569;display:block}
.foot{padding:14px 22px 20px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;line-height:1.5}
code{font-family:ui-monospace,Menlo,monospace;font-size:13px}
form{padding:20px 22px}input{width:100%;padding:12px;font-size:16px;border:1px solid #cbd5e1;border-radius:10px;font-family:ui-monospace,Menlo,monospace;text-transform:uppercase}
button{margin-top:12px;width:100%;padding:12px;font-size:15px;font-weight:700;border:0;border-radius:10px;background:#0f172a;color:#fff;cursor:pointer}
`;

function envolver(titulo: string, cuerpo: string): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(titulo)}</title><style>${PAGINA_CSS}</style></head><body><div class="card">${cuerpo}</div></body></html>`;
}

export function renderPaginaVerificacion(r: ResultadoVerificacion): string {
  const banner = {
    valido: { c: 'ok', t: 'Informe auténtico', d: 'Este informe fue emitido por el laboratorio y su contenido no ha sido modificado desde su publicación.' },
    modificado: { c: 'bad', t: 'Contenido modificado', d: 'El contenido de este informe NO coincide con el que se publicó. No lo considere válido y comuníquese con el laboratorio.' },
    no_publicado: { c: 'warn', t: 'Informe no publicado', d: 'El informe existe pero todavía no ha sido publicado oficialmente. No es un documento válido.' },
    anulado: { c: 'bad', t: 'Informe anulado', d: 'Este informe fue anulado por el laboratorio y no debe usarse. Comuníquese con el laboratorio.' }
  }[r.estado];

  let aviso = '';
  if (r.estado === 'valido' && r.version_coincide === false) {
    aviso = `<dt>Atención</dt><dd style="color:#b45309">La copia que usted tiene es de una versión anterior<small>El laboratorio corrigió y volvió a emitir este informe. Solicite la versión vigente.</small></dd>`;
  } else if (r.estado === 'valido' && r.version_coincide === true) {
    aviso = `<dt>Versión</dt><dd style="color:#047857">Su copia es la versión vigente</dd>`;
  }

  const lista = (xs: string[]) => (xs.length ? xs.map(esc).join('<br>') : '—');
  const pub = r.publicado_por;
  const cuerpo = `
<div class="banner ${banner.c}"><h1>${esc(banner.t)}</h1><p>${esc(banner.d)}</p></div>
<dl>
${aviso}
<dt>Informe</dt><dd>${esc(r.numero_informe)}<small>${esc(r.titulo)}</small></dd>
<dt>Laboratorio</dt><dd>${esc(r.laboratorio)}${r.laboratorio_legal ? `<small>${esc(r.laboratorio_legal)}</small>` : ''}${r.registro_sanitario ? `<small>Registro sanitario: ${esc(r.registro_sanitario)}</small>` : ''}</dd>
<dt>Paciente</dt><dd>${esc(r.paciente_enmascarado)}</dd>
<dt>Publicado</dt><dd>${esc(fmtFecha(r.fecha_publicacion))}</dd>
<dt>Publicado por</dt><dd>${esc(pub.nombre || '—')}${pub.colegiado ? `<small>Colegiado: ${esc(pub.colegiado)}</small>` : ''}${pub.especialidad ? `<small>${esc(pub.especialidad)}</small>` : ''}</dd>
<dt>Resultados validados por</dt><dd>${lista(r.validado_por)}</dd>
${r.verificado_por.length ? `<dt>Resultados críticos verificados por</dt><dd>${lista(r.verificado_por)}</dd>` : ''}
<dt>Código de verificación</dt><dd><code>${esc(formatearCodigo(r.codigo))}</code></dd>
<dt>Huella del contenido (SHA-256)</dt><dd><code>${esc(r.huella)}</code></dd>
</dl>
<div class="foot">Por privacidad, esta página no muestra datos clínicos ni el documento completo del paciente. Compare la huella con la impresa al pie de su PDF.</div>`;
  return envolver(`Verificación de informe ${r.numero_informe}`, cuerpo);
}

export function renderPaginaNoEncontrada(): string {
  return envolver('Verificación de informe', `
<div class="banner bad"><h1>Código no encontrado</h1><p>No existe ningún informe con ese código. Revise que lo escribió completo o que el documento no sea una falsificación.</p></div>
<form method="get" action="/verificar" autocomplete="off"><label for="c" style="font-size:13px;color:#475569">Escriba el código de verificación impreso en su informe</label>
<input id="c" name="codigo" maxlength="24" placeholder="XXXX-XXXX-XXXX-XXXX" required><button type="submit">Verificar</button></form>`);
}

export function renderFormularioVerificacion(): string {
  return envolver('Verificación de informe', `
<div class="banner neutral"><h1>Verificar un informe</h1><p>Confirme que un informe de laboratorio es auténtico y no fue modificado.</p></div>
<form method="get" action="/verificar" autocomplete="off"><label for="c" style="font-size:13px;color:#475569">Código de verificación (está junto al código QR del informe)</label>
<input id="c" name="codigo" maxlength="24" placeholder="XXXX-XXXX-XXXX-XXXX" required><button type="submit">Verificar</button></form>`);
}

function normalizarCodigo(crudo: unknown): string {
  return String(crudo ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function cabecerasPrivadas(res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Referrer-Policy', 'no-referrer');
}

function demasiadasConsultas(req: Request): boolean {
  return !permitirConsulta(req.ip || 'desconocida');
}

// --- /api/verificar -------------------------------------------------------
export const verificarApiRouter = Router();

verificarApiRouter.get('/:codigo', asyncHandler(async (req, res) => {
  cabecerasPrivadas(res);
  if (demasiadasConsultas(req)) return res.status(429).json({ error: 'Demasiadas consultas. Intenta de nuevo en unos minutos.' });
  const codigo = normalizarCodigo(req.params.codigo);
  if (!esCodigoVerificacionValido(codigo)) return res.status(404).json({ error: 'Código no encontrado.' });
  const r = await consultarVerificacion(codigo, typeof req.query.h === 'string' ? req.query.h : undefined);
  if (!r) return res.status(404).json({ error: 'Código no encontrado.' });
  return res.json(r);
}));

// --- /verificar (HTML) ----------------------------------------------------
export const verificarPaginaRouter = Router();

const CSP_PAGINA = "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";

verificarPaginaRouter.get('/', (req, res) => {
  cabecerasPrivadas(res);
  res.setHeader('Content-Security-Policy', CSP_PAGINA);
  // Formulario manual: /verificar?codigo=XXXX redirige a la ruta canónica.
  const codigo = normalizarCodigo(req.query.codigo);
  if (codigo) return res.redirect(302, `/verificar/${encodeURIComponent(codigo)}`);
  return res.type('html').send(renderFormularioVerificacion());
});

verificarPaginaRouter.get('/:codigo', asyncHandler(async (req, res) => {
  cabecerasPrivadas(res);
  res.setHeader('Content-Security-Policy', CSP_PAGINA);
  if (demasiadasConsultas(req)) {
    return res.status(429).type('html').send(envolver('Demasiadas consultas', '<div class="banner warn"><h1>Demasiadas consultas</h1><p>Intente de nuevo en unos minutos.</p></div>'));
  }
  const codigo = normalizarCodigo(req.params.codigo);
  if (!esCodigoVerificacionValido(codigo)) return res.status(404).type('html').send(renderPaginaNoEncontrada());
  const r = await consultarVerificacion(codigo, typeof req.query.h === 'string' ? req.query.h : undefined);
  if (!r) return res.status(404).type('html').send(renderPaginaNoEncontrada());
  return res.type('html').send(renderPaginaVerificacion(r));
}));
