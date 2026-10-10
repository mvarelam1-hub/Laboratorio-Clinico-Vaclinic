/**
 * Paleta de colores y estilo visual del laboratorio (migraciones 0026 y 0027).
 *
 *  - Router PÚBLICO (`temaPublicoRouter`, montado ANTES de requireStaffAuth): el
 *    login y el portal del paciente aún no tienen sesión y deben verse con los
 *    colores del laboratorio. Solo lectura: GET /api/tema.
 *  - Router de ADMINISTRACIÓN (`temaAdminRouter`, después del middleware de
 *    sesión): PUT/DELETE /api/tema-admin con el permiso `admin_usuarios_roles`
 *    (administrador_ti y director). Cada cambio queda en la bitácora.
 *
 * Solo se guardan 4 colores `#rrggbb` ya validados: nada más llega al CSS del
 * navegador, así que no hay forma de inyectar estilos ni scripts por aquí.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-staff';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';
import { registrarBitacora } from '../bitacora';

export const CLAVES_COLOR = ['menu', 'acento', 'boton', 'fondo'] as const;
export type ColoresTema = Record<(typeof CLAVES_COLOR)[number], string>;

/** Devuelve los 4 colores en minúsculas o `null` si falta alguno o no es #rrggbb. */
export function validarColores(valor: unknown): ColoresTema | null {
  if (!valor || typeof valor !== 'object') return null;
  const origen = valor as Record<string, unknown>;
  const salida = {} as ColoresTema;
  for (const clave of CLAVES_COLOR) {
    const v = origen[clave];
    if (typeof v !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(v.trim())) return null;
    salida[clave] = v.trim().toLowerCase();
  }
  return salida;
}

export const ESTILOS = ['bosque', 'monad'] as const;
export type EstiloTema = (typeof ESTILOS)[number];

/** Estilo válido; si no se manda, 'bosque'. `undefined` si es un valor desconocido. */
export function validarEstilo(valor: unknown): EstiloTema | undefined {
  if (valor === null || valor === undefined) return 'bosque';
  return typeof valor === 'string' && (ESTILOS as readonly string[]).includes(valor) ? (valor as EstiloTema) : undefined;
}

/** Identificador corto de la paleta elegida ("oceano", "personalizada"…) o null. */
export function validarNombrePaleta(valor: unknown): string | null | undefined {
  if (valor === null || valor === undefined) return null;
  if (typeof valor !== 'string' || !/^[a-z0-9_-]{1,30}$/.test(valor)) return undefined;
  return valor;
}

// ---------------------------------------------------------------- público
export const temaPublicoRouter = Router();

temaPublicoRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT paleta, colores, estilo, actualizado_en FROM tema_laboratorio WHERE id = 1');
  res.setHeader('Cache-Control', 'no-cache');
  if (rows.length === 0) return res.json({ tema: null });
  const colores = validarColores(rows[0].colores);
  if (!colores) return res.json({ tema: null });
  return res.json({
    tema: { paleta: rows[0].paleta ?? null, colores, estilo: validarEstilo(rows[0].estilo) ?? 'bosque', version: new Date(rows[0].actualizado_en).getTime() }
  });
}));

// ---------------------------------------------------------- administración
export const temaAdminRouter = Router();
temaAdminRouter.use(requireStaffAuth);
temaAdminRouter.use(requirePermission('admin_usuarios_roles'));

temaAdminRouter.put('/', asyncHandler(async (req, res) => {
  const colores = validarColores(req.body?.colores);
  if (!colores) return res.status(400).json({ error: 'Los cuatro colores deben ser códigos como #0a3922.' });
  const paleta = validarNombrePaleta(req.body?.paleta);
  if (paleta === undefined) return res.status(400).json({ error: 'El nombre de la paleta no es válido.' });
  const estilo = validarEstilo(req.body?.estilo);
  if (estilo === undefined) return res.status(400).json({ error: 'El estilo no es válido.' });

  await pool.query(
    `INSERT INTO tema_laboratorio (id, paleta, colores, actualizado_en, id_usuario, estilo)
     VALUES (1, $1, $2::jsonb, NOW(), $3, $4)
     ON CONFLICT (id) DO UPDATE
       SET paleta = EXCLUDED.paleta, colores = EXCLUDED.colores, actualizado_en = NOW(),
           id_usuario = EXCLUDED.id_usuario, estilo = EXCLUDED.estilo`,
    [paleta, JSON.stringify(colores), req.staffUser!.idUsuario, estilo]
  );
  try {
    await registrarBitacora({
      idUsuario: req.staffUser!.idUsuario,
      accion: `Paleta de colores del sistema: se aplicó "${paleta ?? 'personalizada'}" (estilo ${estilo})`,
      modulo: 'catalogo',
      severidad: 'info',
      detalles: `Estilo ${estilo}. Menú ${colores.menu}, acento ${colores.acento}, botón ${colores.boton}, fondo ${colores.fondo}.`
    });
  } catch (err) {
    console.error('No se pudo registrar el cambio de paleta en la bitácora:', err);
  }
  return res.json({ ok: true });
}));

temaAdminRouter.delete('/', asyncHandler(async (req, res) => {
  const r = await pool.query('DELETE FROM tema_laboratorio WHERE id = 1');
  if ((r.rowCount ?? 0) > 0) {
    try {
      await registrarBitacora({
        idUsuario: req.staffUser!.idUsuario,
        accion: 'Paleta de colores del sistema: se restableció el diseño original',
        modulo: 'catalogo',
        severidad: 'info',
        detalles: 'Vuelve el estilo y la paleta Bosque.'
      });
    } catch (err) {
      console.error('No se pudo registrar el restablecimiento de la paleta en la bitácora:', err);
    }
  }
  return res.json({ ok: true });
}));
