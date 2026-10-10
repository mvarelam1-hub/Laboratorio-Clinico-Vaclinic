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
import { segundosDeBloqueo, registrarFallo, limpiarFallos, mensajeBloqueo } from '../loginLimiter';
import { generarTokenRecuperacion, hashToken, esCorreoEntregable, validarNuevaContrasena, MINUTOS_RECUPERACION } from '../passwordReset';
import { enviarCorreo, plantillaRecuperacion, plantillaUsuario, urlBase } from '../mailer';

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

/**
 * Deja constancia en la bitácora de que una cuenta quedó bloqueada
 * temporalmente por demasiados intentos fallidos (ver server/loginLimiter.ts).
 * "Best effort": un fallo al escribir la bitácora nunca cambia la respuesta.
 */
async function registrarBloqueo(idUsuario: number | null, paso: 'contraseña' | 'código de verificación'): Promise<void> {
  if (idUsuario === null) return;
  try {
    await registrarBitacora({
      idUsuario,
      accion: 'Cuenta bloqueada temporalmente por intentos fallidos',
      modulo: 'autenticacion',
      severidad: 'warning',
      detalles: `Demasiados intentos fallidos de ${paso}; bloqueo temporal de 15 minutos.`
    });
  } catch (err) {
    console.error('No se pudo registrar el bloqueo en la bitácora de auditoría:', err);
  }
}

function responderBloqueado(res: import('express').Response, segundos: number) {
  res.setHeader('Retry-After', String(segundos));
  return res.status(429).json({ error: mensajeBloqueo(segundos) });
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

  const claveLogin = String(correo).trim();
  const segundosBloqueado = segundosDeBloqueo(claveLogin);
  if (segundosBloqueado > 0) return responderBloqueado(res, segundosBloqueado);

  const { rows } = await pool.query(`SELECT ${SELECT_LOGIN} FROM usuario WHERE correo = $1`, [claveLogin]);
  const usuario = rows[0];

  if (!usuario || !verifyPassword(contrasena, usuario.contrasena_hash)) {
    const fallo = registrarFallo(claveLogin);
    if (fallo.bloqueadoAhora) {
      await registrarBloqueo(usuario ? usuario.id_usuario : null, 'contraseña');
      return responderBloqueado(res, segundosDeBloqueo(claveLogin));
    }
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }
  if (!usuario.estado) {
    return res.status(403).json({ error: 'Usuario inactivo o suspendido.' });
  }
  // Contraseña correcta: se borran los fallos de contraseña de este correo.
  limpiarFallos(claveLogin);

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

  // El código de 6 dígitos tiene su propio contador por usuario (no se borra
  // al volver a escribir la contraseña), para que no se pueda adivinar.
  const claveTotp = `totp:${ticket.idUsuario}`;
  const segundosBloqueado = segundosDeBloqueo(claveTotp);
  if (segundosBloqueado > 0) return responderBloqueado(res, segundosBloqueado);

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
    const fallo = registrarFallo(claveTotp);
    if (fallo.bloqueadoAhora) {
      await registrarBloqueo(usuario.id_usuario, 'código de verificación');
      return responderBloqueado(res, segundosDeBloqueo(claveTotp));
    }
    return res.status(401).json({ error: 'Código de verificación incorrecto o expirado.' });
  }
  limpiarFallos(claveTotp);

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
 * POST /api/auth/forgot-password
 * Recuperación por correo: si el correo es de una cuenta ACTIVA con un
 * correo real, se envía un enlace de un solo uso que vence en 5 minutos.
 * La respuesta es SIEMPRE la misma (exista o no la cuenta) para no revelar
 * qué correos están registrados. Máximo 5 solicitudes por correo cada 15
 * minutos (mismo limitador que el login). Recuperar la contraseña NO
 * salta el segundo factor: al entrar sigue pidiéndose el código TOTP.
 */
const MENSAJE_RECUPERACION =
  `Si el correo pertenece a una cuenta activa, te enviamos un enlace para restablecer la contraseña. Vence en ${MINUTOS_RECUPERACION} minutos.`;

authRouter.post('/forgot-password', asyncHandler(async (req, res) => {
  const correo = String(req.body?.correo || '').trim();
  if (!correo) return res.status(400).json({ error: 'El correo es obligatorio.' });

  const clave = `olvido:${correo.toLowerCase()}`;
  if (segundosDeBloqueo(clave) > 0) return res.json({ ok: true, mensaje: MENSAJE_RECUPERACION });
  registrarFallo(clave);

  const { rows } = await pool.query(
    'SELECT id_usuario, nombre_completo, correo, estado FROM usuario WHERE correo = $1',
    [correo]
  );
  const usuario = rows[0];
  if (usuario && usuario.estado && esCorreoEntregable(usuario.correo)) {
    const { token, hash } = generarTokenRecuperacion();
    // Una solicitud nueva invalida las anteriores que siguieran sin usar.
    await pool.query(
      'UPDATE recuperacion_contrasena SET usado_en = NOW() WHERE id_usuario = $1 AND usado_en IS NULL',
      [usuario.id_usuario]
    );
    await pool.query(
      `INSERT INTO recuperacion_contrasena (id_usuario, token_hash, expira)
       VALUES ($1, $2, NOW() + make_interval(mins => $3))`,
      [usuario.id_usuario, hash, MINUTOS_RECUPERACION]
    );
    const enlace = `${urlBase()}/?reset=${token}`;
    const plantilla = plantillaRecuperacion({ nombre: usuario.nombre_completo, enlace, minutos: MINUTOS_RECUPERACION });
    const envio = await enviarCorreo({ para: usuario.correo, ...plantilla });
    if (!envio.enviado) console.error('[recuperación] No se pudo enviar el correo:', envio.motivo);
    try {
      await registrarBitacora({
        idUsuario: usuario.id_usuario,
        accion: 'Solicitud de recuperación de contraseña',
        modulo: 'autenticacion',
        severidad: 'info',
        detalles: envio.enviado ? 'Enlace enviado por correo.' : 'No se pudo enviar el correo.'
      });
    } catch (err) {
      console.error('No se pudo registrar la solicitud de recuperación en la bitácora:', err);
    }
  }
  return res.json({ ok: true, mensaje: MENSAJE_RECUPERACION });
}));

/**
 * POST /api/auth/forgot-username
 * "Perdí mi usuario": el usuario de VACLINIC es el correo registrado de la
 * cuenta. La persona escribe su NOMBRE COMPLETO y el sistema manda un
 * recordatorio SOLO al correo registrado de esa cuenta (nunca se muestra
 * en pantalla). La respuesta es siempre la misma, exista o no la cuenta.
 * Máximo 5 solicitudes por nombre cada 15 minutos. Si dos cuentas activas
 * tienen el mismo nombre, cada una recibe el recordatorio en su propio correo.
 */
const MENSAJE_USUARIO =
  'Si el nombre corresponde a una cuenta activa con correo real, enviamos un recordatorio de tu usuario a ese correo.';

authRouter.post('/forgot-username', asyncHandler(async (req, res) => {
  const nombre = String(req.body?.nombre || '').trim().replace(/\s+/g, ' ');
  if (nombre.length < 3) return res.status(400).json({ error: 'Escribe tu nombre completo.' });
  if (nombre.length > 150) return res.status(400).json({ error: 'El nombre es demasiado largo.' });

  const clave = `usuario:${nombre.toLowerCase()}`;
  if (segundosDeBloqueo(clave) > 0) return res.json({ ok: true, mensaje: MENSAJE_USUARIO });
  registrarFallo(clave);

  const { rows } = await pool.query(
    `SELECT id_usuario, nombre_completo, correo
       FROM usuario
      WHERE LOWER(TRIM(nombre_completo)) = LOWER($1) AND estado = TRUE`,
    [nombre]
  );
  for (const cuenta of rows) {
    if (!esCorreoEntregable(cuenta.correo)) continue;
    const plantilla = plantillaUsuario({ nombre: cuenta.nombre_completo, usuario: cuenta.correo, enlace: urlBase() });
    const envio = await enviarCorreo({ para: cuenta.correo, ...plantilla });
    if (!envio.enviado) console.error('[recuperación de usuario] No se pudo enviar el correo:', envio.motivo);
    try {
      await registrarBitacora({
        idUsuario: cuenta.id_usuario,
        accion: 'Solicitud de recordatorio de usuario',
        modulo: 'autenticacion',
        severidad: 'info',
        detalles: envio.enviado ? 'Recordatorio enviado al correo registrado.' : 'No se pudo enviar el correo.'
      });
    } catch (err) {
      console.error('No se pudo registrar el recordatorio de usuario en la bitácora:', err);
    }
  }
  return res.json({ ok: true, mensaje: MENSAJE_USUARIO });
}));

/**
 * POST /api/auth/reset-password
 * Canjea el token del correo por una contraseña nueva. El token se marca
 * como usado ANTES de cambiar la contraseña (un solo uso aun con dos
 * peticiones simultáneas) y se revocan todas las sesiones abiertas de la cuenta.
 */
authRouter.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, nuevaContrasena } = req.body || {};
  if (!token || !nuevaContrasena) {
    return res.status(400).json({ error: 'token y nuevaContrasena son obligatorios.' });
  }
  const errorContrasena = validarNuevaContrasena(nuevaContrasena);
  if (errorContrasena) return res.status(400).json({ error: errorContrasena });

  const ENLACE_INVALIDO = 'El enlace es inválido o ya venció. Solicita uno nuevo.';
  const { rows } = await pool.query(
    `SELECT r.id, r.id_usuario, u.correo, u.estado
       FROM recuperacion_contrasena r
       JOIN usuario u ON u.id_usuario = r.id_usuario
      WHERE r.token_hash = $1 AND r.usado_en IS NULL AND r.expira > NOW()`,
    [hashToken(String(token))]
  );
  const fila = rows[0];
  if (!fila || !fila.estado) return res.status(400).json({ error: ENLACE_INVALIDO });

  const marcado = await pool.query(
    'UPDATE recuperacion_contrasena SET usado_en = NOW() WHERE id = $1 AND usado_en IS NULL RETURNING id',
    [fila.id]
  );
  if (marcado.rowCount === 0) return res.status(400).json({ error: ENLACE_INVALIDO });

  await pool.query(
    'UPDATE usuario SET contrasena_hash = $1, must_change_password = FALSE WHERE id_usuario = $2',
    [hashPassword(String(nuevaContrasena)), fila.id_usuario]
  );
  await pool.query(
    'UPDATE sesion_personal SET revocado_en = NOW() WHERE id_usuario = $1 AND revocado_en IS NULL',
    [fila.id_usuario]
  );
  limpiarFallos(String(fila.correo).trim());
  try {
    await registrarBitacora({
      idUsuario: fila.id_usuario,
      accion: 'Contraseña restablecida con enlace de recuperación',
      modulo: 'autenticacion',
      severidad: 'warning',
      detalles: 'Se revocaron las sesiones abiertas de la cuenta.'
    });
  } catch (err) {
    console.error('No se pudo registrar el restablecimiento en la bitácora:', err);
  }
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
