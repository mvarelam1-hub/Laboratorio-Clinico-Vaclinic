/**
 * Hash de contraseñas de PERSONAL con scrypt (nativo de Node, sin
 * dependencias nuevas) — mismo patrón ya usado en `server/pin.ts` para el
 * PIN del paciente.
 *
 * ANTES (Etapa 3): `usuario.contrasena_hash` existía en el esquema desde la
 * migración 0001 pero NUNCA se usaba para autenticar — el login real era
 * Firebase Authentication (server/auth-firebase.ts) y esta columna solo
 * tenía cadenas de relleno (`'hash_demo_1'`, ver 0099_seed_demo_ficticio.sql).
 *
 * AHORA: esta columna vuelve a ser la credencial real. Se guarda como
 * "salt:hash" en hexadecimal (idéntico formato a pin.ts) y NUNCA se
 * almacena ni se compara la contraseña en texto plano.
 */
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/** Longitud del salt en bytes (antes de convertirlo a hex). */
const SALT_BYTES = 16;
/** Longitud de la derivación scrypt en bytes (antes de convertirla a hex). */
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  // scryptSync con el mismo salt y la misma longitud que al crear el hash:
  // si `password` es la contraseña correcta, el resultado es byte-idéntico.
  const candidate = scryptSync(password, salt, expected.length || KEY_LENGTH);
  if (candidate.length !== expected.length) return false;
  // timingSafeEqual en vez de === : evita que un atacante infiera la
  // contraseña midiendo cuánto tarda la comparación (timing attack).
  return timingSafeEqual(candidate, expected);
}
