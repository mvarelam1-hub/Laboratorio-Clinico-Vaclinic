/**
 * Imágenes de la portada del login del personal (migración 0024).
 *
 *  - Router PÚBLICO (`portadaPublicaRouter`, montado ANTES de requireStaffAuth):
 *    la pantalla de login aún no tiene sesión, así que necesita leer las
 *    imágenes sin credenciales. Solo lectura: GET /api/portada y
 *    GET /api/portada/imagen/:clave.
 *  - Router de ADMINISTRACIÓN (`portadaAdminRouter`, montado después del
 *    middleware de sesión): PUT/DELETE /api/portada-admin/imagen/:clave.
 *    Exige el permiso `admin_usuarios_roles` (administrador_ti y director) y
 *    cada cambio queda en la bitácora.
 *
 * Seguridad de lo que se sube: solo PNG, JPEG y WebP, verificados por sus
 * primeros bytes (no por lo que diga el navegador) y de máximo 1.5 MB. No se
 * acepta SVG a propósito: un SVG puede llevar scripts. Al servirlas se
 * agregan `nosniff` y una CSP que impide ejecutar nada aunque alguien abra
 * la dirección de la imagen directamente.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-staff';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';
import { registrarBitacora } from '../bitacora';
import { combinarNosotros, normalizarNosotros, type Nosotros } from '../nosotros';

export const CLAVES_PORTADA = ['logo', 'fondo', 'fondo_pagina', 'escudo', 'area_hematologia', 'area_parasitos', 'area_cristales', 'area_quimica', 'nosotros_vision', 'nosotros_mision', 'nosotros_servicios', 'equipo_1', 'equipo_2', 'equipo_3', 'equipo_4'] as const;
export type ClavePortada = (typeof CLAVES_PORTADA)[number];
export const MAX_BYTES_PORTADA = 1.5 * 1024 * 1024;

export function esClavePortada(valor: unknown): valor is ClavePortada {
  return typeof valor === 'string' && (CLAVES_PORTADA as readonly string[]).includes(valor);
}

/** Detecta el formato real por los primeros bytes. `null` si no es PNG/JPEG/WebP. */
export function detectarMime(bytes: Buffer): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

const NOMBRES: Record<ClavePortada, string> = {
  logo: 'logo principal',
  fondo: 'fondo de la portada',
  fondo_pagina: 'fondo de la pantalla de acceso',
  escudo: 'escudo del acceso',
  area_hematologia: 'ícono de Hematología',
  area_parasitos: 'ícono de Parásitos',
  area_cristales: 'ícono de Cristales',
  area_quimica: 'ícono de Química sanguínea',
  nosotros_vision: 'foto de Visión (Nosotros)',
  nosotros_mision: 'foto de Misión (Nosotros)',
  nosotros_servicios: 'fondo de la invitación final (Nosotros)',
  equipo_1: 'foto del integrante 1 del equipo',
  equipo_2: 'foto del integrante 2 del equipo',
  equipo_3: 'foto del integrante 3 del equipo',
  equipo_4: 'foto del integrante 4 del equipo'
};

// ---------------------------------------------------------------- público
export const portadaPublicaRouter = Router();

/** Qué posiciones tienen imagen y su versión (para que el navegador recargue al cambiar). */
portadaPublicaRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT clave, actualizado_en FROM portada_imagen');
  const imagenes: Record<string, { version: number }> = {};
  for (const fila of rows) imagenes[fila.clave] = { version: new Date(fila.actualizado_en).getTime() };
  res.setHeader('Cache-Control', 'no-cache');
  res.json({ imagenes });
}));

portadaPublicaRouter.get('/imagen/:clave', asyncHandler(async (req, res) => {
  const clave = req.params.clave;
  if (!esClavePortada(clave)) return res.status(404).json({ error: 'No existe esa imagen.' });
  const { rows } = await pool.query('SELECT tipo_mime, datos FROM portada_imagen WHERE clave = $1', [clave]);
  if (rows.length === 0) return res.status(404).json({ error: 'Esa posición no tiene imagen.' });
  res.setHeader('Content-Type', rows[0].tipo_mime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(rows[0].datos);
}));

// ---------------------------------------------------------- administración
export const portadaAdminRouter = Router();
portadaAdminRouter.use(requireStaffAuth);
portadaAdminRouter.use(requirePermission('admin_usuarios_roles'));

portadaAdminRouter.put('/imagen/:clave', asyncHandler(async (req, res) => {
  const clave = req.params.clave;
  if (!esClavePortada(clave)) return res.status(404).json({ error: 'No existe esa posición de imagen.' });

  const base64 = req.body?.base64;
  if (typeof base64 !== 'string' || !base64) return res.status(400).json({ error: 'Falta la imagen.' });
  // Corta antes de decodificar algo enorme: 4 caracteres base64 ≈ 3 bytes.
  if (base64.length > Math.ceil((MAX_BYTES_PORTADA * 4) / 3) + 8) {
    return res.status(413).json({ error: 'La imagen pesa más de 1.5 MB. Elige una más ligera.' });
  }
  const datos = Buffer.from(base64, 'base64');
  if (datos.length === 0) return res.status(400).json({ error: 'La imagen está vacía o dañada.' });
  if (datos.length > MAX_BYTES_PORTADA) return res.status(413).json({ error: 'La imagen pesa más de 1.5 MB. Elige una más ligera.' });
  const mime = detectarMime(datos);
  if (!mime) return res.status(400).json({ error: 'Solo se aceptan imágenes PNG, JPG o WebP.' });

  await pool.query(
    `INSERT INTO portada_imagen (clave, tipo_mime, datos, tamano_bytes, actualizado_en, id_usuario)
     VALUES ($1, $2, $3, $4, NOW(), $5)
     ON CONFLICT (clave) DO UPDATE
       SET tipo_mime = EXCLUDED.tipo_mime, datos = EXCLUDED.datos, tamano_bytes = EXCLUDED.tamano_bytes,
           actualizado_en = NOW(), id_usuario = EXCLUDED.id_usuario`,
    [clave, mime, datos, datos.length, req.staffUser!.idUsuario]
  );
  try {
    await registrarBitacora({
      idUsuario: req.staffUser!.idUsuario,
      accion: `Portada del login: se cambió el ${NOMBRES[clave]}`,
      modulo: 'catalogo',
      severidad: 'info',
      detalles: `${mime}, ${datos.length} bytes.`
    });
  } catch (err) {
    console.error('No se pudo registrar el cambio de portada en la bitácora:', err);
  }
  return res.json({ ok: true, clave, tamano: datos.length });
}));

portadaAdminRouter.delete('/imagen/:clave', asyncHandler(async (req, res) => {
  const clave = req.params.clave;
  if (!esClavePortada(clave)) return res.status(404).json({ error: 'No existe esa posición de imagen.' });
  const r = await pool.query('DELETE FROM portada_imagen WHERE clave = $1', [clave]);
  if ((r.rowCount ?? 0) > 0) {
    try {
      await registrarBitacora({
        idUsuario: req.staffUser!.idUsuario,
        accion: `Portada del login: se quitó el ${NOMBRES[clave]}`,
        modulo: 'catalogo',
        severidad: 'info',
        detalles: 'Vuelve a mostrarse el dibujo por defecto.'
      });
    } catch (err) {
      console.error('No se pudo registrar la baja de portada en la bitácora:', err);
    }
  }
  return res.json({ ok: true });
}));

// ---------------------------------------------------------------- Nosotros
/** Textos de la pestaña "Nosotros" del portal: lo guardado mezclado con los textos por defecto. */
async function leerNosotros(): Promise<Nosotros> {
  const { rows } = await pool.query('SELECT datos FROM nosotros_contenido WHERE id = 1');
  return combinarNosotros(rows[0]?.datos);
}

portadaPublicaRouter.get('/nosotros', asyncHandler(async (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.json(await leerNosotros());
}));

portadaAdminRouter.get('/nosotros', asyncHandler(async (_req, res) => {
  res.json(await leerNosotros());
}));

portadaAdminRouter.put('/nosotros', asyncHandler(async (req, res) => {
  const r = normalizarNosotros(req.body);
  if ('error' in r) return res.status(400).json({ error: r.error });
  await pool.query(
    `INSERT INTO nosotros_contenido (id, datos, actualizado_en, id_usuario)
     VALUES (1, $1::jsonb, NOW(), $2)
     ON CONFLICT (id) DO UPDATE
       SET datos = EXCLUDED.datos, actualizado_en = NOW(), id_usuario = EXCLUDED.id_usuario`,
    [JSON.stringify(r.datos), req.staffUser!.idUsuario]
  );
  try {
    await registrarBitacora({
      idUsuario: req.staffUser!.idUsuario,
      accion: 'Portal del paciente: se actualizó la página "Nosotros"',
      modulo: 'catalogo',
      severidad: 'info',
      detalles: 'Presentación, visión, misión, valores y equipo.'
    });
  } catch (err) {
    console.error('No se pudo registrar el cambio de Nosotros en la bitácora:', err);
  }
  return res.json({ ok: true, datos: r.datos });
}));
