/**
 * Verificación de identidad del PERSONAL (reemplaza `server/auth-firebase.ts`).
 *
 * ANTES: cada colaborador iniciaba sesión con Firebase Authentication desde
 * el frontend, y el backend verificaba el ID token con `firebase-admin`
 * (requería `FIREBASE_ADMIN_CREDENTIALS_JSON`, una dependencia externa y una
 * cuenta de servicio de Google).
 *
 * AHORA: autenticación 100% propia con `crypto` nativo de Node — sin
 * servicios externos ni dependencias nuevas:
 *   - Contraseña: scrypt con salt por usuario (server/password.ts).
 *   - Sesión: token HMAC-SHA256 propio con TTL de 8h, revocable
 *     individualmente vía `sesion_personal` (server/session.ts).
 *   - Segundo factor: TOTP (RFC 6238) obligatorio para los roles de mayor
 *     privilegio (server/totp.ts).
 *
 * El CONTRATO de este middleware es intencionalmente IDÉNTICO al de
 * auth-firebase.ts: mismo nombre exportado (`requireStaffAuth`), misma
 * interfaz `AuthenticatedUser`, mismo campo `req.staffUser`, mismos códigos
 * de estado (401 sin token/token inválido o expirado, 403 cuenta no
 * encontrada/inactiva/sesión revocada). Así ninguno de los 14 routers que ya
 * consumían `requireStaffAuth` necesita cambiar su lógica — solo la línea
 * de import (`../auth-firebase` -> `../auth-staff`).
 */
import type { Request, Response, NextFunction } from 'express';
import { pool } from './db';
import type { PermissionSubject } from '../src/shared/permissions';
import { verifySessionToken, isSessionRevoked, motivoDeRevocacion, MOTIVO_NUEVO_INICIO } from './session';
import { isTotpMandatoryForRole } from './totp';

export interface AuthenticatedUser extends PermissionSubject {
  idUsuario: number;
  nombreCompleto: string;
  uid: string;
  /** true mientras el usuario no haya cambiado su contraseña inicial (ver server/routes/auth.ts). */
  mustChangePassword: boolean;
  totpEnabled: boolean;
  /** true si el rol exige TOTP (server/totp.ts::MANDATORY_TOTP_ROLES) y el usuario todavía no lo activó. */
  totpSetupRequired: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staffUser?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware: exige una sesión propia válida (firma + vencimiento + no
 * revocada) y que el usuario de esa sesión exista y esté ACTIVO en la tabla
 * `usuario`. Si cualquiera de las condiciones falla, corta la petición con
 * 401/403 ANTES de tocar cualquier ruta.
 */
export async function requireStaffAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let idUsuario: number | null = null;
    let mustChangePasswordClaim = false;

    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.DEV_AUTH_BYPASS_ID_USUARIO &&
      token === 'DEV_BYPASS'
    ) {
      // SOLO para pruebas locales sin base de datos de sesiones poblada.
      // Nunca disponible si NODE_ENV=production, sin importar qué envíe el
      // cliente (misma garantía que ya ofrecía DEV_AUTH_BYPASS_UID).
      idUsuario = Number(process.env.DEV_AUTH_BYPASS_ID_USUARIO);
      console.warn('[AUTH] Usando DEV_AUTH_BYPASS_ID_USUARIO — solo válido fuera de producción.');
    } else {
      if (!token) {
        return res.status(401).json({ error: 'Falta el token de autenticación (Authorization: Bearer <token>).' }); // RF-05
      }
      const payload = verifySessionToken(token);
      if (!payload) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
      }
      if (await isSessionRevoked(pool, payload.sessionId)) {
        const motivo = await motivoDeRevocacion(pool, payload.sessionId);
        return res.status(403).json({
          error: motivo === MOTIVO_NUEVO_INICIO
            ? 'Tu sesión se cerró porque este usuario inició sesión en otro lugar. Solo se permite una sesión abierta por usuario.'
            : 'La sesión fue cerrada. Inicia sesión nuevamente.'
        });
      }
      idUsuario = payload.idUsuario;
      mustChangePasswordClaim = payload.mustChangePassword;
    }

    const { rows } = await pool.query(
      `SELECT id_usuario, uid, nombre_completo, rol, estado, permisos_personalizados, totp_enabled
       FROM usuario WHERE id_usuario = $1`,
      [idUsuario]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Esta cuenta no está registrada como personal de VACLINIC.' }); // RF-06
    }

    const row = rows[0];
    const totpEnabled = Boolean(row.totp_enabled);
    req.staffUser = {
      idUsuario: row.id_usuario,
      uid: row.uid || '',
      nombreCompleto: row.nombre_completo,
      roleId: row.rol,
      status: row.estado ? 'activo' : 'inactivo',
      customPermissions: row.permisos_personalizados || {},
      mustChangePassword: mustChangePasswordClaim,
      totpEnabled,
      totpSetupRequired: isTotpMandatoryForRole(row.rol) && !totpEnabled
    };

    if (req.staffUser.status !== 'activo') {
      return res.status(403).json({ error: 'Usuario inactivo o suspendido.' });
    }

    return next();
  } catch (err: any) {
    console.error('[AUTH] Token inválido o error de verificación:', err?.message);
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}
