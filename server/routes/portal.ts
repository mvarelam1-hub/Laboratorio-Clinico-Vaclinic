/**
 * Portal del Paciente — acceso SEGURO (Etapa 3, alineado a la tesis).
 *
 * Antes (app original): authenticatePatient() en ClinicContext.tsx recibía
 * el arreglo COMPLETO de pacientes (con accessCode y pinCode en texto
 * plano) ya cargado en el navegador, y comparaba ahí mismo. Cualquiera con
 * DevTools podía leer el código/PIN de cualquier paciente sin autenticarse.
 *
 * La tesis (capítulo 4, RF07, caso de uso "consultar resultado mediante
 * código único") especifica un único mecanismo de acceso: el código único
 * de consulta generado al registrar la orden, vigente 12 meses — SIN un
 * PIN separado. Una primera versión de este endpoint (Etapa 3) agregó un
 * PIN de dos factores que no está en la tesis ni en la pantalla real del
 * Portal (PatientPortalWelcomeView.tsx, que solo tiene un campo de
 * código/DNI); se revirtió esa parte para no introducir alcance que el
 * documento de origen no pide y no exigir un cambio de UI.
 *
 * Lo que SÍ es una mejora real de seguridad, y se conserva: el navegador
 * nunca recibe el listado de pacientes ni sus códigos — el código se valida
 * en el servidor contra la base de datos, se rechaza si expiró o no está
 * vigente, y la respuesta posterior queda limitada por token a la orden de
 * ESE paciente. Como el código es ahora el único secreto, se limita la
 * tasa de intentos por IP (ver `checkRateLimit` más abajo) para dificultar
 * su adivinación por fuerza bruta, ya que no hay una cuenta de paciente
 * conocida contra la cual contar intentos fallidos (a diferencia de un PIN
 * asociado a un usuario ya identificado).
 */
import { Router } from 'express';
import { pool } from '../db';
import { signPortalToken, verifyPortalToken } from '../token';
import { asyncHandler } from '../asyncHandler';

export const portalRouter = Router();

// Límite de tasa por IP, en memoria (ver nota de la Etapa 3 en
// ETAPA3_README.md): se reinicia si el servidor se reinicia. Es una
// mitigación básica contra fuerza bruta del código, no un reemplazo de
// medidas adicionales (ej. un WAF) que un despliegue de producción real
// debería sumar.
const MAX_INTENTOS_POR_VENTANA = 20;
const VENTANA_MINUTOS = 15;
const intentosPorIp = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = intentosPorIp.get(ip);
  if (!entry || entry.resetAt < now) {
    intentosPorIp.set(ip, { count: 1, resetAt: now + VENTANA_MINUTOS * 60_000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_INTENTOS_POR_VENTANA;
}

portalRouter.post('/login', asyncHandler(async (req, res) => {
  const { codigo } = req.body || {};
  if (!codigo) {
    return res.status(400).json({ error: 'Se requiere el código único de consulta.' });
  }

  const ip = req.ip || 'desconocida';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: `Demasiados intentos desde esta conexión. Espera ${VENTANA_MINUTOS} minutos e inténtalo de nuevo.`
    });
  }

  const { rows } = await pool.query(
    `SELECT p.id_paciente, c.id_orden, c.estado AS estado_codigo, c.fecha_vigencia
     FROM codigo_consulta c
     JOIN orden o ON o.id_orden = c.id_orden
     JOIN paciente p ON p.id_paciente = o.id_paciente
     WHERE c.codigo = $1`,
    [String(codigo).toUpperCase()]
  );

  // Mensaje idéntico exista o no el código: no revelar si el código existe.
  const genericError = { error: 'Código de consulta incorrecto o no encontrado.' };
  if (rows.length === 0) return res.status(401).json(genericError);

  const row = rows[0];

  if (row.estado_codigo !== 'Vigente' || new Date(row.fecha_vigencia) < new Date()) {
    return res.status(401).json({ error: 'El código de consulta expiró o ya no es válido. Solicita uno nuevo en recepción.' });
  }

  const token = signPortalToken({ idPaciente: row.id_paciente, idOrden: row.id_orden }, 900); // 15 min
  return res.json({ token, expiresInSeconds: 900 });
}));

// Exportado porque otros módulos patient-facing (ver server/routes/preferencias.ts,
// noveno de los 9 migrados desde localStorage) también autentican al paciente
// con este mismo token de portal, en vez de duplicar la lógica de verificación.
export function requirePortalToken(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = token ? verifyPortalToken(token) : null;
  if (!payload) return res.status(401).json({ error: 'Sesión de portal inválida o expirada. Vuelve a iniciar sesión.' });
  req.portalAuth = payload;
  next();
}

// Solo puede consultar LA ORDEN que autenticó en /login — nunca otra,
// aunque adivine el id: se filtra siempre por id_paciente + id_orden del token.
portalRouter.get('/orden', requirePortalToken, asyncHandler(async (req: any, res) => {
  const { idPaciente, idOrden } = req.portalAuth;
  const { rows } = await pool.query(
    `SELECT o.id_orden, o.numero_orden, o.estado, o.fecha_registro,
            e.nombre_examen, r.estado AS estado_resultado, r.valor_capturado,
            r.esta_fuera_de_rango, r.interpretacion_clinica, r.fecha_publicacion
     FROM orden o
     JOIN detalle_orden do_ ON do_.id_orden = o.id_orden
     JOIN examen e ON e.id_examen = do_.id_examen
     LEFT JOIN resultado r ON r.id_detalle = do_.id_detalle
     WHERE o.id_orden = $1 AND o.id_paciente = $2`,
    [idOrden, idPaciente]
  );

  // Un paciente nunca ve un resultado que no esté Publicado (los borradores
  // e "en corrección" son de uso interno del laboratorio).
  const visibles = rows
    .filter((r) => r.estado_resultado === 'Publicado' || r.estado_resultado == null)
    .map((r) => ({
      numeroOrden: r.numero_orden,
      examen: r.nombre_examen,
      estadoResultado: r.estado_resultado,
      valor: r.estado_resultado === 'Publicado' ? r.valor_capturado : null,
      fueraDeRango: r.estado_resultado === 'Publicado' ? r.esta_fuera_de_rango : null,
      interpretacion: r.estado_resultado === 'Publicado' ? r.interpretacion_clinica : null,
      fechaPublicacion: r.fecha_publicacion
    }));

  return res.json({ idOrden, resultados: visibles });
}));
