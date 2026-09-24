import type { Request, Response, NextFunction } from 'express';
import { hasPermission } from '../src/shared/permissions';

/**
 * "Ocultar un botón no es autorizar" (diagnóstico, sección 3). Este es el
 * middleware que faltaba: revalida el permiso EN EL SERVIDOR, con la misma
 * función (`hasPermission`) que usa el frontend para pintar la interfaz,
 * así que no puede haber una regla distinta escondida en cada lado.
 */
export function requirePermission(permissionId: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.staffUser) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    if (!hasPermission(req.staffUser, permissionId)) {
      return res.status(403).json({
        error: `El rol "${req.staffUser.roleId}" no tiene el permiso "${permissionId}".`
      });
    }
    return next();
  };
}
