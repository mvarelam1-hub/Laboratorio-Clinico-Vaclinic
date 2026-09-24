import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Express 4 NO atrapa automáticamente una promesa rechazada dentro de un
 * handler `async`: si nadie la captura, se vuelve un "unhandled rejection"
 * y — se comprobó al probar esta misma Etapa 3 — Node.js **mata el proceso**.
 * Un solo endpoint sin try/catch puede tirar todo el servidor para todos
 * los usuarios conectados.
 *
 * asyncHandler() envuelve cada ruta async para que cualquier error caiga
 * en next(err), y el middleware de error de server.ts responda 500 sin
 * tumbar el proceso.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
