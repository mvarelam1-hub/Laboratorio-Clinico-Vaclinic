import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireStaffAuth } from '../auth-staff';
import { authRouter } from './auth';
import { portalRouter } from './portal';
import { preferenciasRouter } from './preferencias';
import { pacientesRouter } from './pacientes';
import { ordenesRouter } from './ordenes';
import { resultadosRouter } from './resultados';
import { auditoriaRouter } from './auditoria';
import { examenesRouter } from './examenes';
import { carpetasRouter } from './carpetas';
import { episodiosRouter } from './episodios';
import { transferenciasRouter } from './transferencias';
import { perfilesRouter } from './perfiles';
import { personalRouter } from './personal';
import { rolesRouter } from './roles';
import { reactivosRouter } from './reactivos';
import { plantillasRouter } from './plantillas';
import { chatRouter } from './chat';

export const apiRouter = Router();

// Portal del paciente: SIN requireStaffAuth (no es personal), usa su propio
// token de portal (ver portal.ts).
apiRouter.use('/portal', portalRouter);

// Preferencias de notificación del paciente: igual que /portal, patient-facing,
// sin requireStaffAuth — usa el mismo requirePortalToken (ver preferencias.ts).
apiRouter.use('/preferencias', preferenciasRouter);

// Login, cambio de contraseña, TOTP y whoami de personal (ver
// server/routes/auth.ts). Cada endpoint de este router decide por sí mismo
// si exige sesión (requireStaffAuth) o no (login, verify-totp) — por eso se
// monta ANTES del middleware de "sesión limitada" de abajo, que de lo
// contrario bloquearía el propio cambio de contraseña.
apiRouter.use('/auth', authRouter);

/**
 * Sesión LIMITADA (usuario.must_change_password = TRUE, ver migración 0012):
 * solo puede usar /api/auth/* (change-password, logout) — nunca el resto de
 * la API — hasta que fije su propia contraseña. Se aplica DESPUÉS de montar
 * /auth (arriba) y ANTES de montar cualquier otro router protegido (abajo),
 * así que nunca interfiere con el propio flujo que la resuelve.
 *
 * `requireStaffAuth` corre aquí (y, de nuevo, dentro de cada router
 * individual — pacientesRouter.use(requireStaffAuth), etc.): es la misma
 * verificación idempotente ejecutada dos veces, nunca dos reglas distintas,
 * así que ninguno de los 14 routers existentes necesita dejar de llamarla
 * por su cuenta para que este único punto adicional funcione.
 */
apiRouter.use(requireStaffAuth, (req: Request, res: Response, next: NextFunction) => {
  if (req.staffUser?.mustChangePassword) {
    return res.status(403).json({ error: 'MUST_CHANGE_PASSWORD', mensaje: 'Debes cambiar tu contraseña inicial antes de continuar.' });
  }
  // TOTP OBLIGATORIO por rol (server/totp.ts::MANDATORY_TOTP_ROLES): si el
  // rol del usuario lo exige y todavía no lo activó, se bloquea TODO el
  // resto de la API con el mismo patrón que MUST_CHANGE_PASSWORD de arriba
  // — de lo contrario "obligatorio" solo sería una sugerencia de interfaz
  // (el banner de TotpEnrollmentSection) y nunca una regla real. Igual que
  // con la sesión limitada, /api/auth/* (incluido /totp/enroll y
  // /totp/confirm, montados antes de este middleware) sigue disponible,
  // así como /logout y /whoami, para que el usuario pueda completar el
  // enrolamiento o cerrar sesión.
  if (req.staffUser?.totpSetupRequired) {
    return res.status(403).json({ error: 'TOTP_SETUP_REQUIRED', mensaje: 'Tu rol exige activar la verificación en dos pasos (TOTP) antes de continuar.' });
  }
  return next();
});

apiRouter.use('/pacientes', pacientesRouter);
apiRouter.use('/ordenes', ordenesRouter);
apiRouter.use('/resultados', resultadosRouter);
apiRouter.use('/auditoria', auditoriaRouter);
apiRouter.use('/examenes', examenesRouter);
apiRouter.use('/carpetas', carpetasRouter);
apiRouter.use('/episodios', episodiosRouter);
apiRouter.use('/transferencias', transferenciasRouter);
apiRouter.use('/perfiles', perfilesRouter);
apiRouter.use('/personal', personalRouter);
apiRouter.use('/roles', rolesRouter);
apiRouter.use('/reactivos', reactivosRouter);
apiRouter.use('/plantillas', plantillasRouter);
apiRouter.use('/chat', chatRouter);
