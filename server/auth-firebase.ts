/**
 * Verificación de identidad del PERSONAL (Etapa 3).
 *
 * Reemplaza StaffAuthModal.tsx (PIN compartido hardcodeado '1234'/'admin'/...
 * que además arrancaba autenticado por defecto). Ahora cada colaborador
 * inicia sesión con su cuenta individual de Firebase Authentication desde
 * el frontend, y el frontend manda el ID token de Firebase en cada petición
 * como `Authorization: Bearer <token>`. Este middleware lo verifica aquí,
 * en el servidor — nunca confiando en lo que diga el cliente sobre quién es.
 */
import type { Request, Response, NextFunction } from 'express';
import { pool } from './db';
import type { PermissionSubject } from '../src/shared/permissions';

export interface AuthenticatedUser extends PermissionSubject {
  idUsuario: number;
  nombreCompleto: string;
  uid: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staffUser?: AuthenticatedUser;
    }
  }
}

// Se usa `any` a propósito: el admin SDK se carga con require() en tiempo de
// ejecución (ver getFirebaseAdmin) para no forzar su inicialización si el
// entorno de pruebas usa DEV_AUTH_BYPASS_UID, así que no conviene atarse a
// los tipos internos de una versión concreta de firebase-admin.
let firebaseAdminApp: any = null;

function getFirebaseAdmin() {
  if (firebaseAdminApp) return firebaseAdminApp;
  // firebase-admin 13+ dejó de exponer el namespace monolítico
  // `admin.credential` / `admin.initializeApp` en el paquete raíz: hay que
  // importar los subpaquetes modulares 'firebase-admin/app' y
  // 'firebase-admin/auth'. Con la versión instalada (14.4.0), `require('firebase-admin')`
  // ya NO tiene `.credential` (confirmado en producción: los intentos de login
  // fallaban con "[AUTH] Token inválido o error de verificación: Cannot read
  // properties of undefined (reading 'cert')" porque admin.credential era
  // undefined). Este bug bloqueaba TODO inicio de sesión de personal, sin
  // importar usuario/contraseña ni proyecto de Firebase configurado.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { cert, initializeApp } = require('firebase-admin/app');
  const serviceAccountJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
  if (!serviceAccountJson) {
    throw new Error(
      'Falta FIREBASE_ADMIN_CREDENTIALS_JSON (credencial de servicio de Firebase Admin, generada en ' +
      'Firebase Console > Configuración del proyecto > Cuentas de servicio). No se usan credenciales hardcodeadas.'
    );
  }
  const credential = cert(JSON.parse(serviceAccountJson));
  firebaseAdminApp = initializeApp({ credential });
  return firebaseAdminApp;
}

/**
 * Middleware: exige un ID token de Firebase válido y que ese UID exista
 * como usuario de personal ACTIVO en la tabla `usuario`. Si cualquiera de
 * las dos condiciones falla, corta la petición con 401/403 ANTES de tocar
 * cualquier ruta — es aquí, y no en el frontend, donde se decide el acceso.
 */
export async function requireStaffAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let uid: string | null = null;

    if (process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS_UID && token === 'DEV_BYPASS') {
      // SOLO para pruebas locales sin credenciales reales de Firebase (ver README de la Etapa 3).
      // Nunca disponible si NODE_ENV=production, sin importar qué envíe el cliente.
      uid = process.env.DEV_AUTH_BYPASS_UID;
      console.warn('[AUTH] Usando DEV_AUTH_BYPASS_UID — solo válido fuera de producción.');
    } else {
      if (!token) {
        return res.status(401).json({ error: 'Falta el token de autenticación (Authorization: Bearer <token>).' });
      }
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getAuth } = require('firebase-admin/auth');
      const app = getFirebaseAdmin();
      const decoded = await getAuth(app).verifyIdToken(token);
      uid = decoded.uid;
    }

    const { rows } = await pool.query(
      `SELECT id_usuario, uid, nombre_completo, rol, estado, permisos_personalizados
       FROM usuario WHERE uid = $1`,
      [uid]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: 'Esta cuenta no está registrada como personal de VACLINIC.' });
    }

    const row = rows[0];
    req.staffUser = {
      idUsuario: row.id_usuario,
      uid: row.uid,
      nombreCompleto: row.nombre_completo,
      roleId: row.rol,
      status: row.estado ? 'activo' : 'inactivo',
      customPermissions: row.permisos_personalizados || {}
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
