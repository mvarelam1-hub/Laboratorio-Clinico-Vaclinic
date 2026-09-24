/**
 * Hash de PIN de paciente con scrypt (nativo de Node, sin dependencias nuevas).
 * Antes: el PIN vivía en texto plano dentro del objeto Patient cargado
 * completo en el navegador (ClinicContext.tsx). Ahora se guarda como
 * "salt:hash" en paciente.pin_hash y solo el backend lo compara.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(pin, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, storedHash: string | null): boolean {
  if (!storedHash) return false;
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(pin, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
