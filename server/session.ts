/**
 * Sesiones de PERSONAL firmadas con HMAC-SHA256 — mismo patrón que
 * `server/token.ts` (tokens del Portal del Paciente, firmados con
 * `PORTAL_TOKEN_SECRET`), pero con su PROPIO secreto (`SESSION_SECRET`) y
 * su propio ciclo de vida, porque son cosas distintas: un token de portal
 * vive 15 minutos y autoriza consultar UNA orden puntual; una sesión de
 * personal vive 8 horas y autoriza todo lo que el rol de ese usuario
 * permita (ver src/shared/permissions.ts).
 *
 * ANTES: no existía sesión propia — la "sesión" era, literalmente, el ID
 * token de Firebase, que Firebase emite/revoca/renueva y que este backend
 * nunca controlaba (server/auth-firebase.ts solo lo verificaba).
 *
 * AHORA: el backend emite y controla sus propias sesiones. Formato del
 * token: "vc1.<payload JSON en base64url>.<firma HMAC-SHA256 en base64url>"
 * ("vc1" = VaClinic, versión 1 del formato — permite cambiar el formato en
 * el futuro sin ambigüedad). Cada sesión además recibe un `session_id`
 * aleatorio registrado en la tabla `sesion_personal` (migración
 * 0012_staff_password_auth.sql): la FIRMA por sí sola nunca expira antes de
 * sus 8 horas, pero el `session_id` sí puede revocarse antes (logout) sin
 * esperar a que venza — por eso toda verificación real pasa por las DOS
 * comprobaciones: `verifySessionToken` (firma + vencimiento, sin tocar la
 * base de datos) y `isSessionRevoked` (consulta a `sesion_personal`).
 */
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { Pool } from 'pg';

const PREFIJO_SESION = 'vc1';
const TTL_SESION_SEGUNDOS = 8 * 60 * 60; // 8 horas

/** Motivo guardado cuando una sesión se cierra porque el mismo usuario inició otra. */
export const MOTIVO_NUEVO_INICIO = 'nuevo_inicio';

export interface SessionTokenPayload {
  idUsuario: number;
  sessionId: string;
  exp: number; // epoch seconds
  /** Claim de sesión limitada (ver server/routes/auth.ts): true hasta que el usuario cambie su contraseña inicial. */
  mustChangePassword: boolean;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('Falta la variable de entorno SESSION_SECRET (usar un valor largo y aleatorio, ej. `openssl rand -hex 32`).');
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function firmar(body: string): string {
  return base64url(createHmac('sha256', getSecret()).update(body).digest());
}

/**
 * Crea una sesión nueva: genera un `session_id` aleatorio, lo inserta en
 * `sesion_personal` (para poder revocarlo luego) y firma el token que el
 * cliente deberá mandar como `Authorization: Bearer <token>` en cada
 * petición.
 */
export async function createSession(
  pool: Pool,
  idUsuario: number,
  opts: { mustChangePassword?: boolean; ttlSeconds?: number; userAgent?: string | null; conservarOtras?: boolean } = {}
): Promise<{ token: string; sessionId: string }> {
  const ttlSeconds = opts.ttlSeconds ?? TTL_SESION_SEGUNDOS;

  // Una sola sesión activa por usuario: al iniciar sesión se cierran las
  // anteriores (la página que quedó abierta en otro lugar recibirá el aviso
  // en su próxima comprobación). `conservarOtras` existe solo para pruebas.
  if (!opts.conservarOtras) {
    await pool.query(
      `UPDATE sesion_personal
          SET revocado_en = NOW(), revocado_motivo = $2
        WHERE id_usuario = $1 AND revocado_en IS NULL AND expira > NOW()`,
      [idUsuario, MOTIVO_NUEVO_INICIO]
    );
  }
  const sessionId = randomBytes(24).toString('hex');
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;

  await pool.query(
    `INSERT INTO sesion_personal (id_usuario, session_id, expira, user_agent)
     VALUES ($1, $2, to_timestamp($3), $4)`,
    [idUsuario, sessionId, exp, opts.userAgent ?? null]
  );

  const payload: SessionTokenPayload = {
    idUsuario,
    sessionId,
    exp,
    mustChangePassword: Boolean(opts.mustChangePassword)
  };
  const body = base64url(JSON.stringify(payload));
  const sig = firmar(body);
  return { token: `${PREFIJO_SESION}.${body}.${sig}`, sessionId };
}

/**
 * Verifica SOLO la firma y el vencimiento del token — no toca la base de
 * datos (por eso no es `async`). El middleware (`server/auth-staff.ts`)
 * siempre complementa esto con `isSessionRevoked()` antes de confiar en el
 * resultado, porque un token con firma válida y aún no vencido puede haber
 * sido revocado explícitamente (logout).
 */
export function verifySessionToken(token: string): SessionTokenPayload | null {
  const partes = (token || '').split('.');
  if (partes.length !== 3 || partes[0] !== PREFIJO_SESION) return null;
  const [, body, sig] = partes;
  if (!body || !sig) return null;

  const esperado = firmar(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload: SessionTokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload.idUsuario !== 'number' || typeof payload.sessionId !== 'string') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expirada
    return payload;
  } catch {
    return null;
  }
}

/** Consulta si `sessionId` fue revocado explícitamente (logout) o ya no existe. */
export async function isSessionRevoked(pool: Pool, sessionId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT revocado_en FROM sesion_personal WHERE session_id = $1`,
    [sessionId]
  );
  if (rows.length === 0) return true; // no existe -> tratar como revocada
  return rows[0].revocado_en !== null;
}

/** Motivo por el que se revocó una sesión (null si no hay motivo guardado o no existe). */
export async function motivoDeRevocacion(pool: Pool, sessionId: string): Promise<string | null> {
  const { rows } = await pool.query(
    `SELECT revocado_motivo FROM sesion_personal WHERE session_id = $1`,
    [sessionId]
  );
  return rows[0]?.revocado_motivo ?? null;
}

/** Revoca una sesión (logout): queda registrada, no se borra, por trazabilidad. */
export async function revokeSession(pool: Pool, sessionId: string): Promise<void> {
  await pool.query(
    `UPDATE sesion_personal SET revocado_en = NOW() WHERE session_id = $1 AND revocado_en IS NULL`,
    [sessionId]
  );
}

// ---------------------------------------------------------------------------
// "Login ticket": credencial de corta duración (5 minutos) emitida entre el
// paso 1 (correo+contraseña correctos) y el paso 2 (código TOTP) del login
// de una cuenta con doble factor habilitado. A propósito NO es una sesión:
// no tiene `session_id` en `sesion_personal` ni sirve para llamar ninguna
// ruta protegida por `requireStaffAuth` — solo lo acepta
// POST /api/auth/verify-totp (ver server/routes/auth.ts).
// ---------------------------------------------------------------------------

const PREFIJO_TICKET = 'vt1';
const TTL_TICKET_SEGUNDOS = 5 * 60;

interface LoginTicketPayload {
  idUsuario: number;
  exp: number;
}

export function createLoginTicket(idUsuario: number, ttlSeconds = TTL_TICKET_SEGUNDOS): string {
  const payload: LoginTicketPayload = { idUsuario, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const body = base64url(JSON.stringify(payload));
  const sig = firmar(body);
  return `${PREFIJO_TICKET}.${body}.${sig}`;
}

export function verifyLoginTicket(ticket: string): { idUsuario: number } | null {
  const partes = (ticket || '').split('.');
  if (partes.length !== 3 || partes[0] !== PREFIJO_TICKET) return null;
  const [, body, sig] = partes;
  if (!body || !sig) return null;

  const esperado = firmar(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload: LoginTicketPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload.idUsuario !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { idUsuario: payload.idUsuario };
  } catch {
    return null;
  }
}
