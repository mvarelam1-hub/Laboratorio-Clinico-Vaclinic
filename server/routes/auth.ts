/**
 * Autenticación propia de PERSONAL — reemplaza el flujo de Firebase
 * Authentication (signInWithEmailAndPassword en el cliente +
 * GET /api/auth/whoami contra server/auth-firebase.ts).
 *
 * ANTES: el cliente iniciaba sesión directo contra Firebase; este backend
 * (server/auth-firebase.ts, ya eliminado) solo volvía a verificar el
 * resultado (whoami). El backend nunca emitía ni controlaba una sesión
 * propia.
 *
 * AHORA: TODO el login pasa por aquí. El flujo completo:
 *   1) POST /login            correo + contraseña -> sesión completa, o
 *                              `{ requiresTotp: true, loginTicket }` si la
 *                              cuenta tiene TOTP activado.
 *   2) POST /verify-totp       loginTicket + código de 6 dígitos -> sesión completa.
 *   3) Si la sesión trae `mustChangePassword`, es una sesión LIMITADA: el
 *      middleware de server/routes/index.ts bloquea cualquier ruta que no
 *      sea /api/auth/* con 403 MUST_CHANGE_PASSWORD hasta que se llame a
 *      POST /change-password.
 *   4) POST /totp/enroll y /totp/confirm — alta de segundo factor,
 *      obligatoria para los roles de server/totp.ts::MANDATORY_TOTP_ROLES.
 *   5) POST /logout — revoca la sesión (server/session.ts::revokeSession).
 *   6) GET /whoami — mismo endpoint que ya consumía el frontend
 *      (src/services/staffAuthService.ts), ahora con más campos.
 */
import { Router } from 'express';
import { pool } from '../db';
import { asyncHandler } from '../asyncHandler';
import { requireStaffAuth } from '../auth-staff';
import { hashPassword, verifyPassword } from '../password';
import { createSession, revokeSession, createLoginTicket, verifyLoginTicket, verifySessionToken } from '../session';
import { generateTotpSecret, totpAuthUri, verifyTotpToken, isTotpMandatoryForRole } from '../totp';
import { encryptSecret, decryptSecret } from '../crypto-aes';
import { registrarBitacora } from '../bitacora';

/**
 * Registra el inicio de sesión exitoso en la bitácora REAL
 * (historial_auditoria, vía registrarBitacora() — ver server/bitacora.ts).
 * Efecto secundario de "best effort": si la escritura de auditoría falla
 * (ej. la base de datos está momentáneamente ocupada), NUNCA debe tumbar
 * el login en sí -ya se emitió la sesión, es demasiado tarde para fallar
 * la petición completa por un problema de bitácora-.
 */
async function registrarLoginExitoso(idUsuario: number, rol: string, detalleExtra?: string): Promise<void> {
  try {
    await registrarBitacora({
      idUsuario,
      accion: 'Inicio de sesión exitoso',
      modulo: 'autenticacion',
      severidad: 'info',
      detalles: `Rol: ${rol}${detalleExtra ? ` (${detalleExtra})` : ''}`
    });
  } catch (err) {
    console.error('No se pudo registrar el inicio de sesión en la bitácora de auditoría:', err);
  }
}

export const authRouter = Router();

const SELECT_LOGIN = `id_usuario, nombre_completo, correo, contrasena_hash, rol, estado,
       totp_secret, totp_enabled, must_change_password`;

/**
 * POST /api/auth/login
 * Mensaje de error intencionalmente GENÉRICO en credenciales inválidas: no
 * distingue "correo no existe" de "contraseña incorrecta" para no revelar
 * qué correos están registrados (mismo principio que ya documentaba
 * verifyStaffSession en el frontend).
 */
authRouter.post('/login', asyncHandler(async (req, res) => {
  const { correo, contrasena } = req.body || {};
  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'correo y contrasena son obligatorios.' });
  }

  const { rows } = await pool.query(`SELECT ${SELECT_LOGIN} FROM usuario WHERE correo = $1`, [String(correo).trim()]);
  const usuario = rows[0];

  if (!usuario || !verifyPassword(contrasena, usuario.contrasena_hash)) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }
  if (!usuario.estado) {
    return res.status(403).json({ error: 'Usuario inactivo o suspendido.' });
  }

  if (usuario.totp_enabled) {
    // Segundo factor activo: NO se emite sesión todavía, solo un ticket de
    // 5 minutos que únicamente sirve para POST /verify-totp.
    const loginTicket = createLoginTicket(usuario.id_usuario);
    return res.json({ requiresTotp: true, loginTicket });
  }

  const { token } = await createSession(pool, usuario.id_usuario, {
    mustChangePassword: usuario.must_change_password,
    userAgent: req.headers['user-agent'] || null
  });
  await registrarLoginExitoso(usuario.id_usuario, usuario.rol);
  return res.json({
    requiresTotp: false,
    token,
    mustChangePassword: usuario.must_change_password,
    idUsuario: usuario.id_usuario,
    nombreCompleto: usuario.nombre_completo,
    roleId: usuario.rol
  });
}));

/**
 * POST /api/auth/verify-totp
 * Segundo paso del login cuando la cuenta tiene TOTP activado. El
 * `loginTicket` ya probó "conoce la contraseña" (paso 1); aquí se exige
 * además "tiene el segundo factor" antes de emitir la sesión real.
 */
authRouter.post('/verify-totp', asyncHandler(async (req, res) => {
  const { loginTicket, code } = req.body || {};
  if (!loginTicket || !code) {
    return res.status(400).json({ error: 'loginTicket y code son obligatorios.' });
  }

  const ticket = verifyLoginTicket(loginTicket);
  if (!ticket) {
    return res.status(401).json({ error: 'El ticket de inicio de sesión es inválido o expiró. Inicia sesión de nuevo.' });
  }

  const { rows } = await pool.query(`SELECT ${SELECT_LOGIN} FROM usuario WHERE id_usuario = $1`, [ticket.idUsuario]);
  const usuario = rows[0];
  if (!usuario || !usuario.estado) {
    return res.status(403).json({ error: 'Usuario inactivo o no encontrado.' });
  }
  if (!usuario.totp_enabled || !usuario.totp_secret) {
    return res.status(400).json({ error: 'Esta cuenta no tiene TOTP habilitado.' });
  }

  const secreto = decryptSecret(usuario.totp_secret);
  if (!verifyTotpToken(secreto, String(code))) {
    return res.status(401).json({ error: 'Código de verificación incorrecto o expirado.' });
  }

  const { token } = await createSession(pool, usuario.id_usuario, {
    mustChangePassword: usuario.must_change_password,
    userAgent: req.headers['user-agent'] || null
  });
  await registrarLoginExitoso(usuario.id_usuario, usuario.rol, 'segundo factor verificado');
  return res.json({
    token,
    mustChangePassword: usuario.must_change_password,
    idUsuario: usuario.id_usuario,
    nombreCompleto: usuario.nombre_completo,
    roleId: usuario.rol
  });
}));

/**
 * POST /api/auth/change-password
 * Requiere sesión válida (incluso una LIMITADA por mustChangePassword — es
 * justamente la única ruta, junto a /logout, que una sesión limitada puede
 * usar, ver el middleware de server/routes/index.ts).
 */
authRouter.post('/change-password', requireStaffAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword y newPassword son obligatorios.' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
  }

  const { rows } = await pool.query('SELECT contrasena_hash FROM usuario WHERE id_usuario = $1', [req.staffUser!.idUsuario]);
  if (rows.length === 0 || !verifyPassword(currentPassword, rows[0].contrasena_hash)) {
    return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
  }

  await pool.query(
    'UPDATE usuario SET contrasena_hash = $1, must_change_password = FALSE WHERE id_usuario = $2',
    [hashPassword(newPassword), req.staffUser!.idUsuario]
  );
  return res.json({ ok: true });
}));

/**
 * POST /api/auth/totp/enroll
 * Genera un secreto nuevo y lo guarda CIFRADO (no en texto plano) pero
 * TODAVÍA no lo activa (`totp_enabled` sigue en FALSE) — eso solo pasa en
 * /totp/confirm, al comprobar que el usuario de verdad pudo generar un
 * código válido con la app autenticadora.
 */
authRouter.post('/totp/enroll', requireStaffAuth, asyncHandler(async (req, res) => {
  if (req.staffUser!.mustChangePassword) {
    return res.status(403).json({ error: 'MUST_CHANGE_PASSWORD' });
  }

  const secreto = generateTotpSecret();
  await pool.query('UPDATE usuario SET totp_secret = $1 WHERE id_usuario = $2', [
    encryptSecret(secreto),
    req.staffUser!.idUsuario
  ]);

  const { rows } = await pool.query('SELECT correo FROM usuario WHERE id_usuario = $1', [req.staffUser!.idUsuario]);
  const otpauthUri = totpAuthUri(secreto, rows[0]?.correo || req.staffUser!.nombreCompleto);

  return res.json({ secret: secreto, otpauthUri });
}));

/**
 * POST /api/auth/totp/confirm
 * Verifica el primer código real contra el secreto recién generado en
 * /enroll y, si coincide, activa TOTP de verdad.
 */
authRouter.post('/totp/confirm', requireStaffAuth, asyncHandler(async (req, res) => {
  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'code es obligatorio.' });
  }

  const { rows } = await pool.query('SELECT totp_secret FROM usuario WHERE id_usuario = $1', [req.staffUser!.idUsuario]);
  const totpSecretCifrado = rows[0]?.totp_secret;
  if (!totpSecretCifrado) {
    return res.status(400).json({ error: 'No hay un enrolamiento de TOTP pendiente. Llama primero a /totp/enroll.' });
  }

  const secreto = decryptSecret(totpSecretCifrado);
  if (!verifyTotpToken(secreto, String(code))) {
    return res.status(401).json({ error: 'Código de verificación incorrecto o expirado.' });
  }

  await pool.query('UPDATE usuario SET totp_enabled = TRUE WHERE id_usuario = $1', [req.staffUser!.idUsuario]);
  return res.json({ ok: true });
}));

/** POST /api/auth/logout — revoca la sesión actual (ver server/session.ts::revokeSession). */
authRouter.post('/logout', requireStaffAuth, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  // requireStaffAuth ya validó el token; se vuelve a extraer el sessionId
  // aquí mismo (en vez de hacer que requireStaffAuth lo adjunte a req) para
  // mantener AuthenticatedUser idéntico a lo que ya consumían los otros 14
  // routers — ninguno necesita conocer el session_id interno.
  const payload = token ? verifySessionToken(token) : null;
  if (payload) {
    await revokeSession(pool, payload.sessionId);
  }
  return res.json({ ok: true });
}));

/**
 * GET /api/auth/whoami — mismo contrato que ya consumía el frontend
 * (src/services/staffAuthService.ts), con los campos nuevos que necesita
 * para decidir si redirigir a cambio de contraseña o a enrolamiento TOTP.
 */
authRouter.get('/whoami', requireStaffAuth, (req, res) => {
  const { idUsuario, nombreCompleto, roleId, status, mustChangePassword, totpEnabled, totpSetupRequired } = req.staffUser!;
  res.json({
    idUsuario,
    nombreCompleto,
    roleId,
    status,
    mustChangePassword,
    totpEnabled,
    totpSetupRequired,
    totpMandatory: isTotpMandatoryForRole(roleId)
  });
});
