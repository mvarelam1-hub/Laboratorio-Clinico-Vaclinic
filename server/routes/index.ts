import { Router } from 'express';
import { requireStaffAuth } from '../auth-firebase';
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

// Todo lo demás es personal autenticado con Firebase + permisos por rol.
apiRouter.get('/auth/whoami', requireStaffAuth, (req, res) => {
  const { idUsuario, nombreCompleto, roleId, status } = req.staffUser!;
  res.json({ idUsuario, nombreCompleto, roleId, status });
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
