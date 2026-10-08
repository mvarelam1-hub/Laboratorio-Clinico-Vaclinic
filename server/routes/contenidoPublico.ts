/**
 * Gestión (personal) de las noticias y promociones que se muestran en el
 * Portal del Paciente. Lo público se lee en routes/publico.ts.
 *
 * Leer la lista completa (incluye borradores) puede cualquier miembro del
 * personal; crear, editar, publicar o eliminar exige `catalogo_tarifas_editar`
 * (las promociones son decisiones comerciales, igual que los precios).
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-staff';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';
import { registrarBitacora } from '../bitacora';

export const contenidoPublicoRouter = Router();
contenidoPublicoRouter.use(requireStaffAuth);

const TIPOS = ['noticia', 'promocion'];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

interface Normalizado {
  tipo: string; titulo: string; resumen: string; cuerpo: string;
  etiqueta: string | null; fuente: string | null; enlace: string | null;
  fechaPublicacion: string | null; vigenteHasta: string | null; publicado: boolean;
}

/** Valida el cuerpo; devuelve el error en español o los datos limpios. */
export function normalizarContenido(body: any): { error: string } | { datos: Normalizado } {
  const b = body || {};
  const tipo = String(b.tipo || '');
  if (!TIPOS.includes(tipo)) return { error: 'El tipo debe ser "noticia" o "promocion".' };
  const titulo = String(b.titulo || '').trim();
  if (!titulo) return { error: 'El título es obligatorio.' };
  if (titulo.length > 160) return { error: 'El título no puede pasar de 160 caracteres.' };
  const resumen = String(b.resumen || '').trim();
  const cuerpo = String(b.cuerpo || '').trim();
  if (resumen.length > 400) return { error: 'El resumen no puede pasar de 400 caracteres.' };
  if (cuerpo.length > 6000) return { error: 'El texto no puede pasar de 6000 caracteres.' };
  if (!resumen && !cuerpo) return { error: 'Escribe al menos un resumen o el texto completo.' };

  const enlaceTxt = String(b.enlace || '').trim();
  if (enlaceTxt) {
    try {
      const u = new URL(enlaceTxt);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('x');
    } catch {
      return { error: 'El enlace debe empezar con http:// o https://.' };
    }
  }
  const fechaPub = b.fechaPublicacion ? String(b.fechaPublicacion) : null;
  const vigente = b.vigenteHasta ? String(b.vigenteHasta) : null;
  if (fechaPub && !FECHA.test(fechaPub)) return { error: 'La fecha de publicación no es válida.' };
  if (vigente && !FECHA.test(vigente)) return { error: 'La fecha de vigencia no es válida.' };
  if (fechaPub && vigente && vigente < fechaPub) return { error: 'La vigencia no puede terminar antes de la fecha de publicación.' };
  if (tipo === 'noticia' && vigente) return { error: 'Las noticias no tienen vigencia; usa una promoción para eso.' };

  return {
    datos: {
      tipo, titulo, resumen, cuerpo,
      etiqueta: String(b.etiqueta || '').trim().slice(0, 40) || null,
      fuente: String(b.fuente || '').trim().slice(0, 120) || null,
      enlace: enlaceTxt || null,
      fechaPublicacion: fechaPub, vigenteHasta: vigente,
      publicado: b.publicado === true,
    },
  };
}

const COLUMNAS = `id_contenido, tipo, titulo, resumen, cuerpo, etiqueta, fuente, enlace,
  to_char(fecha_publicacion, 'YYYY-MM-DD') AS fecha_publicacion,
  to_char(vigente_hasta, 'YYYY-MM-DD') AS vigente_hasta,
  publicado, fecha_actualizacion`;

contenidoPublicoRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM contenido_publico ORDER BY fecha_publicacion DESC, id_contenido DESC`
  );
  return res.json(rows);
}));

contenidoPublicoRouter.post('/', requirePermission('catalogo_tarifas_editar'), asyncHandler(async (req, res) => {
  const r = normalizarContenido(req.body);
  if ('error' in r) return res.status(400).json({ error: r.error });
  const d = r.datos;
  const { rows } = await pool.query(
    `INSERT INTO contenido_publico
       (tipo, titulo, resumen, cuerpo, etiqueta, fuente, enlace, fecha_publicacion, vigente_hasta, publicado, id_usuario_ultima_mod)
     VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8::date, CURRENT_DATE), $9::date, $10, $11)
     RETURNING ${COLUMNAS}`,
    [d.tipo, d.titulo, d.resumen, d.cuerpo, d.etiqueta, d.fuente, d.enlace, d.fechaPublicacion, d.vigenteHasta, d.publicado, req.staffUser!.idUsuario]
  );
  await registrarBitacora({
    idUsuario: req.staffUser!.idUsuario, accion: `Creó ${d.tipo} del portal público`, modulo: 'catalogo',
    detalles: `"${d.titulo}" (${d.publicado ? 'publicado' : 'borrador'})`,
  }).catch(() => {});
  return res.status(201).json(rows[0]);
}));

contenidoPublicoRouter.put('/:id', requirePermission('catalogo_tarifas_editar'), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Id no válido.' });
  const r = normalizarContenido(req.body);
  if ('error' in r) return res.status(400).json({ error: r.error });
  const d = r.datos;
  const { rows } = await pool.query(
    `UPDATE contenido_publico SET
       tipo=$1, titulo=$2, resumen=$3, cuerpo=$4, etiqueta=$5, fuente=$6, enlace=$7,
       fecha_publicacion = COALESCE($8::date, fecha_publicacion), vigente_hasta=$9::date,
       publicado=$10, id_usuario_ultima_mod=$11, fecha_actualizacion=NOW()
     WHERE id_contenido=$12
     RETURNING ${COLUMNAS}`,
    [d.tipo, d.titulo, d.resumen, d.cuerpo, d.etiqueta, d.fuente, d.enlace, d.fechaPublicacion, d.vigenteHasta, d.publicado, req.staffUser!.idUsuario, id]
  );
  if (!rows.length) return res.status(404).json({ error: 'No existe ese contenido.' });
  await registrarBitacora({
    idUsuario: req.staffUser!.idUsuario, accion: `Editó ${d.tipo} del portal público`, modulo: 'catalogo',
    detalles: `"${d.titulo}" (${d.publicado ? 'publicado' : 'borrador'})`,
  }).catch(() => {});
  return res.json(rows[0]);
}));

contenidoPublicoRouter.delete('/:id', requirePermission('catalogo_tarifas_editar'), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Id no válido.' });
  const { rows } = await pool.query('DELETE FROM contenido_publico WHERE id_contenido=$1 RETURNING titulo, tipo', [id]);
  if (!rows.length) return res.status(404).json({ error: 'No existe ese contenido.' });
  await registrarBitacora({
    idUsuario: req.staffUser!.idUsuario, accion: `Eliminó ${rows[0].tipo} del portal público`, modulo: 'catalogo',
    detalles: `"${rows[0].titulo}"`, severidad: 'warning',
  }).catch(() => {});
  return res.json({ ok: true });
}));
