/**
 * Recuperación de contraseña del personal por enlace de correo.
 *
 * Reglas de diseño:
 *  - El token es aleatorio de 32 bytes (CSPRNG) y solo viaja en el enlace del
 *    correo. En la base de datos se guarda su hash SHA-256 (tabla
 *    `recuperacion_contrasena`, migración 0022).
 *  - Vence a los 5 minutos (TTL_RECUPERACION_MS) y es de un solo uso.
 *  - No se envían correos a dominios que no pueden recibirlos (`.local`,
 *    `.test`, `.invalid`, `.example`, `.localhost`): la cuenta de arranque
 *    `admin.sistemas@vaclinic.local` debe cambiarse por un correo real.
 */
import { createHash, randomBytes } from 'crypto';

export const TTL_RECUPERACION_MS = 5 * 60 * 1000;
export const MINUTOS_RECUPERACION = TTL_RECUPERACION_MS / 60000;

const DOMINIOS_NO_ENTREGABLES = ['local', 'test', 'invalid', 'example', 'localhost'];

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generarTokenRecuperacion(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
}

/** `true` si el correo parece poder recibir mensajes de verdad. */
export function esCorreoEntregable(correo: string | null | undefined): boolean {
  if (!correo) return false;
  const limpio = String(correo).trim().toLowerCase();
  const partes = limpio.split('@');
  if (partes.length !== 2 || !partes[0] || !partes[1].includes('.')) return false;
  const tld = partes[1].split('.').pop() as string;
  return !DOMINIOS_NO_ENTREGABLES.includes(tld);
}

export function validarNuevaContrasena(valor: unknown): string | null {
  if (typeof valor !== 'string' || valor.length < 8) {
    return 'La nueva contraseña debe tener al menos 8 caracteres.';
  }
  if (valor.length > 128) return 'La nueva contraseña es demasiado larga.';
  return null;
}
