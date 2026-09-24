/**
 * Token firmado (HMAC-SHA256) de corta duración para el Portal del Paciente.
 *
 * Reemplaza el mecanismo actual (ClinicContext.tsx authenticatePatient):
 * el frontend ya no recibe la lista completa de pacientes ni compara PIN en
 * el navegador. El backend valida código+PIN una sola vez y devuelve un
 * token que SOLO sirve para consultar esa orden/paciente puntual, con
 * vencimiento corto. No se usa JWT de una librería externa para no sumar
 * una dependencia nueva: es la misma idea (payload + firma) implementada
 * con `crypto` de Node, que ya viene incluido.
 */
import { createHmac, timingSafeEqual } from 'crypto';

export interface PortalTokenPayload {
  idPaciente: number;
  idOrden: number;
  exp: number; // epoch seconds
}

function getSecret(): string {
  const secret = process.env.PORTAL_TOKEN_SECRET;
  if (!secret) {
    throw new Error('Falta la variable de entorno PORTAL_TOKEN_SECRET (usar un valor largo y aleatorio en producción).');
  }
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

export function signPortalToken(payload: Omit<PortalTokenPayload, 'exp'>, ttlSeconds = 900): string {
  const full: PortalTokenPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const body = base64url(JSON.stringify(full));
  const sig = base64url(createHmac('sha256', getSecret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyPortalToken(token: string): PortalTokenPayload | null {
  const [body, sig] = (token || '').split('.');
  if (!body || !sig) return null;

  const expectedSig = base64url(createHmac('sha256', getSecret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload: PortalTokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expirado
    return payload;
  } catch {
    return null;
  }
}
