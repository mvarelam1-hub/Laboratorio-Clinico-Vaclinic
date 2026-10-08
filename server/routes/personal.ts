/**
 * Personal / usuarios del sistema (LabStaffUser) — quinto módulo de los 9
 * migrados desde localStorage (ver ClinicContext.tsx addStaffUser/
 * updateStaffUser/deleteStaffUser/toggleUserStatus/resetUserPin).
 *
 * A diferencia de los módulos anteriores, este NO crea una tabla nueva:
 * reutiliza `usuario`, la misma tabla real que ya usa la autenticación de
 * personal (server/auth-staff.ts, antes server/auth-firebase.ts), extendida
 * en la migración 0011_modulos_restantes.sql con las columnas que le
 * faltaban (nombre_usuario, telefono, sede_asignada, color_avatar,
 * texto_sello_firma, url_imagen_firma, doble_factor_habilitado, notas,
 * ultimo_login) y en la 0012 con las de autenticación propia
 * (contrasena_hash real, totp_secret, totp_enabled, must_change_password).
 *
 * Nota de alcance real, heredada de cómo YA funciona el login (no es una
 * limitación nueva de este módulo): `usuario.estado` es BOOLEAN, no el
 * enum de 4 valores que usa el frontend (UserStatus: activo/inactivo/
 * suspendido/vacaciones) — auth-staff.ts ya colapsa
 * `estado ? 'activo' : 'inactivo'` para decidir el acceso real. Este
 * módulo hace exactamente lo mismo: cualquier estado que no sea "activo"
 * se guarda como estado=false: la distinción entre inactivo/suspendido/
 * vacaciones no sobrevive en el backend real, igual que ya ocurría en el
 * login.
 *
 * CONTRASEÑAS (Fase 13t): al crear un usuario (POST /) el servidor genera una
 * contraseña TEMPORAL aleatoria, guarda solo su hash scrypt, deja al usuario
 * con must_change_password=TRUE y la devuelve UNA sola vez en la respuesta
 * (`contrasenaTemporal`). Para quien olvidó su clave existe
 * POST /:id/restablecer-contrasena (misma mecánica, y además revoca sus
 * sesiones abiertas). La contraseña en texto plano NUNCA se guarda ni se
 * escribe en bitácora ni en logs.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-staff';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';
import { hashPassword, generarContrasenaTemporal } from '../password';
import { registrarBitacora } from '../bitacora';

export const personalRouter = Router();
personalRouter.use(requireStaffAuth);
personalRouter.use(requirePermission('admin_usuarios_roles'));

// `pin_code` NO se devuelve: es un dato obsoleto (ya no autentica, migración 0008)
// y enviarlo en claro a cada pantalla de administración solo amplía la fuga.
const SELECT_COLUMNAS = `id_usuario, uid, nombre_completo, correo, rol, especialidad, numero_colegiado,
       estado, permisos_personalizados, nombre_usuario, telefono, sede_asignada,
       color_avatar, texto_sello_firma, url_imagen_firma, doble_factor_habilitado, notas,
       ultimo_login, fecha_creacion`;

function generarPinPorDefecto(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** La bitácora es "best effort": un fallo al auditar no debe tumbar la acción ya hecha. */
async function auditarSinFallar(params: Parameters<typeof registrarBitacora>[0]): Promise<void> {
  try {
    await registrarBitacora(params);
  } catch (err) {
    console.error('[personal] No se pudo escribir en la bitácora de auditoría:', err);
  }
}

personalRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(`SELECT ${SELECT_COLUMNAS} FROM usuario WHERE rol != 'sistema' ORDER BY fecha_creacion DESC`);
  return res.json(rows);
}));

personalRouter.post('/', asyncHandler(async (req, res) => {
  const {
    fullName, username, email, phone, roleId, specialty, licenseNumber,
    assignedBranch, pinCode, customPermissions, avatarColor, notes, initialPassword
  } = req.body || {};

  if (!fullName || !String(fullName).trim() || !email || !String(email).trim() || !roleId) {
    return res.status(400).json({ error: 'fullName, email y roleId son obligatorios.' });
  }

  // Evita escalada de privilegios: crear una cuenta administrador_ti (que ahora nace con
  // contraseña utilizable) solo le corresponde a otro administrador_ti.
  if (roleId === 'administrador_ti' && req.staffUser!.roleId !== 'administrador_ti') {
    return res.status(403).json({ error: 'Solo un administrador de sistemas puede crear otra cuenta de administrador de sistemas.' });
  }

  // Contraseña temporal: la define el administrador (mín. 8) o, si no manda
  // ninguna, se genera una aleatoria. Solo se guarda su hash.
  if (initialPassword !== undefined && initialPassword !== null && initialPassword !== '' && String(initialPassword).length < 8) {
    return res.status(400).json({ error: 'La contraseña inicial debe tener al menos 8 caracteres.' });
  }
  const contrasenaTemporal = initialPassword ? String(initialPassword) : generarContrasenaTemporal();

  try {
    const { rows } = await pool.query(
      `INSERT INTO usuario
         (nombre_completo, correo, rol, especialidad, numero_colegiado, pin_code, estado,
          permisos_personalizados, nombre_usuario, telefono, sede_asignada, color_avatar, notas,
          contrasena_hash, must_change_password)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8, $9, $10, $11, $12, $13, TRUE)
       RETURNING ${SELECT_COLUMNAS}`,
      [
        String(fullName).trim(), String(email).trim(), roleId, specialty || null, licenseNumber || null,
        pinCode || generarPinPorDefecto(), JSON.stringify(customPermissions || {}),
        username || null, phone || null, assignedBranch || 'todas', avatarColor || 'bg-teal-600', notes || null,
        hashPassword(contrasenaTemporal)
      ]
    );
    await auditarSinFallar({
      idUsuario: req.staffUser!.idUsuario,
      accion: 'Creación de usuario con contraseña temporal',
      modulo: 'usuarios',
      severidad: 'info',
      detalles: `Usuario ${rows[0].nombre_completo} (rol ${rows[0].rol}) creado; debe cambiar su contraseña al primer ingreso.`
    });
    // La contraseña temporal viaja SOLO en esta respuesta y nunca debe quedar en cachés.
    res.setHeader('Cache-Control', 'no-store');
    return res.status(201).json({ ...rows[0], contrasenaTemporal });
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo o nombre de usuario.' });
    }
    if (err?.code === '23514') {
      return res.status(400).json({ error: `El rol "${roleId}" no es válido.` });
    }
    throw err;
  }
}));

personalRouter.patch('/:id', asyncHandler(async (req, res) => {
  const idUsuario = Number(req.params.id);
  const {
    fullName, username, email, phone, roleId, specialty, licenseNumber,
    assignedBranch, customPermissions, avatarColor, notes,
    signatureStampText, signatureImageUrl, twoFactorEnabled
  } = req.body || {};

  if (roleId === 'administrador_ti' && req.staffUser!.roleId !== 'administrador_ti') {
    return res.status(403).json({ error: 'Solo un administrador de sistemas puede asignar el rol de administrador de sistemas.' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE usuario
       SET nombre_completo = COALESCE($1, nombre_completo),
           nombre_usuario = COALESCE($2, nombre_usuario),
           correo = COALESCE($3, correo),
           telefono = COALESCE($4, telefono),
           rol = COALESCE($5, rol),
           especialidad = COALESCE($6, especialidad),
           numero_colegiado = COALESCE($7, numero_colegiado),
           sede_asignada = COALESCE($8, sede_asignada),
           permisos_personalizados = COALESCE($9, permisos_personalizados),
           color_avatar = COALESCE($10, color_avatar),
           notas = COALESCE($11, notas),
           texto_sello_firma = COALESCE($12, texto_sello_firma),
           url_imagen_firma = COALESCE($13, url_imagen_firma),
           doble_factor_habilitado = COALESCE($14, doble_factor_habilitado)
       WHERE id_usuario = $15
       RETURNING ${SELECT_COLUMNAS}`,
      [
        fullName || null, username || null, email || null, phone || null, roleId || null,
        specialty || null, licenseNumber || null, assignedBranch || null,
        customPermissions !== undefined ? JSON.stringify(customPermissions) : null,
        avatarColor || null, notes || null, signatureStampText || null, signatureImageUrl || null,
        twoFactorEnabled !== undefined ? Boolean(twoFactorEnabled) : null, idUsuario
      ]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json(rows[0]);
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un usuario con ese correo o nombre de usuario.' });
    }
    if (err?.code === '23514') {
      return res.status(400).json({ error: `El rol "${roleId}" no es válido.` });
    }
    throw err;
  }
}));

/**
 * POST /api/personal/:id/restablecer-contrasena
 * El administrador genera una contraseña TEMPORAL nueva para un colaborador
 * (olvidó la suya, cuenta recién migrada, etc.). Efectos, todos en el
 * servidor: guarda solo el hash, marca must_change_password=TRUE, revoca sus
 * sesiones abiertas y (opcional, `reiniciarTotp: true`) desactiva su
 * autenticador para que lo vuelva a configurar. La contraseña se devuelve UNA
 * vez; no se guarda en claro ni se escribe en bitácora.
 */
personalRouter.post('/:id/restablecer-contrasena', asyncHandler(async (req, res) => {
  const idUsuario = Number(req.params.id);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    return res.status(400).json({ error: 'Identificador de usuario inválido.' });
  }
  if (req.staffUser!.idUsuario === idUsuario) {
    return res.status(400).json({ error: 'Para cambiar tu propia contraseña usa "Cambiar contraseña"; aquí solo se restablece la de otras personas.' });
  }

  const { reiniciarTotp, newPassword } = req.body || {};
  if (newPassword !== undefined && newPassword !== null && newPassword !== '' && String(newPassword).length < 8) {
    return res.status(400).json({ error: 'La contraseña nueva debe tener al menos 8 caracteres.' });
  }

  const { rows: destino } = await pool.query(
    'SELECT id_usuario, nombre_completo, rol FROM usuario WHERE id_usuario = $1',
    [idUsuario]
  );
  if (destino.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
  if (destino[0].rol === 'sistema') {
    return res.status(403).json({ error: 'La cuenta interna del sistema no se puede restablecer.' });
  }
  // Evita escalada de privilegios: solo un administrador_ti puede restablecer a otro administrador_ti.
  if (destino[0].rol === 'administrador_ti' && req.staffUser!.roleId !== 'administrador_ti') {
    return res.status(403).json({ error: 'Solo un administrador de sistemas puede restablecer la contraseña de otro administrador de sistemas.' });
  }

  const contrasenaTemporal = newPassword ? String(newPassword) : generarContrasenaTemporal();
  const quitarTotp = reiniciarTotp === true;

  await pool.query(
    `UPDATE usuario
     SET contrasena_hash = $1,
         must_change_password = TRUE
         ${quitarTotp ? ', totp_enabled = FALSE, totp_secret = NULL' : ''}
     WHERE id_usuario = $2`,
    [hashPassword(contrasenaTemporal), idUsuario]
  );
  // Cierra las sesiones abiertas: quien tuviera la clave vieja (o un token robado) deja de entrar.
  await pool.query(
    'UPDATE sesion_personal SET revocado_en = NOW() WHERE id_usuario = $1 AND revocado_en IS NULL',
    [idUsuario]
  );

  await auditarSinFallar({
    idUsuario: req.staffUser!.idUsuario,
    accion: 'Restablecimiento de contraseña',
    modulo: 'seguridad',
    severidad: 'warning',
    detalles: `Contraseña temporal emitida para ${destino[0].nombre_completo} (rol ${destino[0].rol}); sesiones abiertas revocadas${quitarTotp ? '; autenticador (TOTP) reiniciado' : ''}.`
  });

  res.setHeader('Cache-Control', 'no-store');
  return res.json({ ok: true, idUsuario, contrasenaTemporal, totpReiniciado: quitarTotp });
}));

personalRouter.patch('/:id/estado', asyncHandler(async (req, res) => {
  const idUsuario = Number(req.params.id);
  const { status } = req.body || {};
  const ESTADOS_VALIDOS = ['activo', 'inactivo', 'suspendido', 'vacaciones'];
  if (!ESTADOS_VALIDOS.includes(status)) {
    return res.status(400).json({ error: `status inválido. Usa ${ESTADOS_VALIDOS.join(', ')}.` });
  }
  // usuario.estado solo distingue activo/no-activo (ver nota de alcance al
  // inicio del archivo); inactivo/suspendido/vacaciones se guardan igual.
  const { rows } = await pool.query(
    `UPDATE usuario SET estado = $1 WHERE id_usuario = $2 RETURNING ${SELECT_COLUMNAS}`,
    [status === 'activo', idUsuario]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
  return res.json({ ...rows[0], status_solicitado: status });
}));

personalRouter.patch('/:id/pin', asyncHandler(async (req, res) => {
  const idUsuario = Number(req.params.id);
  const { pinCode } = req.body || {};
  if (!pinCode || !/^\d{4,6}$/.test(String(pinCode))) {
    return res.status(400).json({ error: 'pinCode debe ser un código numérico de 4 a 6 dígitos.' });
  }
  const { rows } = await pool.query(
    `UPDATE usuario SET pin_code = $1 WHERE id_usuario = $2 RETURNING ${SELECT_COLUMNAS}`,
    [String(pinCode), idUsuario]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
  return res.json(rows[0]);
}));

personalRouter.delete('/:id', asyncHandler(async (req, res) => {
  const idUsuario = Number(req.params.id);
  if (req.staffUser!.idUsuario === idUsuario) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de usuario.' });
  }
  try {
    const { rowCount } = await pool.query('DELETE FROM usuario WHERE id_usuario = $1', [idUsuario]);
    if (rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.json({ ok: true });
  } catch (err: any) {
    // historial_auditoria.id_usuario es ON DELETE RESTRICT (trazabilidad
    // ISO 15189 real): un usuario que ya generó bitácora no puede borrarse
    // sin perder esa evidencia. Se refleja honestamente en vez de fallar
    // con un 500 genérico.
    if (err?.code === '23503') {
      return res.status(409).json({ error: 'No se puede eliminar: el usuario tiene historial de auditoría asociado. Desactívalo en vez de eliminarlo.' });
    }
    throw err;
  }
}));
