import type { Request, Response, NextFunction } from 'express';
import { hasPermission } from '../src/shared/permissions';
import { getEffectiveRolesConfig } from './rolePermissionsCache';

/**
 * "Ocultar un botón no es autorizar" (diagnóstico, sección 3). Este es el
 * middleware que faltaba: revalida el permiso EN EL SERVIDOR, con la misma
 * función (`hasPermission`) que usa el frontend para pintar la interfaz,
 * así que no puede haber una regla distinta escondida en cada lado.
 *
 * Desde la corrección de rolePermissionsCache.ts, el catálogo de roles que
 * se le pasa a `hasPermission()` aquí es el EFECTIVO (estático +
 * ediciones guardadas en `rol_permiso_default`), no el estático a secas:
 * este es el único lado donde esa diferencia de verdad autoriza o rechaza
 * una petición HTTP real.
 */
export function requirePermission(permissionId: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.staffUser) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    if (!hasPermission(req.staffUser, permissionId, getEffectiveRolesConfig())) {
      return res.status(403).json({
        error: `El rol "${req.staffUser.roleId}" no tiene el permiso "${permissionId}".`
      });
    }
    return next();
  };
}
