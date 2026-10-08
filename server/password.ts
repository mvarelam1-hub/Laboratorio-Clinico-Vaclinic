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
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'crypto';

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

/**
 * Contraseña TEMPORAL legible para entregar a un colaborador nuevo (o tras
 * un restablecimiento). 12 caracteres con mayúscula, minúscula y dígito,
 * sin símbolos que se confundan al leer (0/O, 1/l/I). Usa `randomInt` (CSPRNG
 * de Node), nunca `Math.random`. Solo se muestra UNA vez al administrador:
 * en la base solo se guarda su hash scrypt y el usuario queda con
 * must_change_password = TRUE, así que debe cambiarla en su primer ingreso.
 */
const MAYUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MINUSCULAS = 'abcdefghijkmnopqrstuvwxyz';
const DIGITOS = '23456789';

export function generarContrasenaTemporal(longitud = 12): string {
  const todos = MAYUSCULAS + MINUSCULAS + DIGITOS;
  const caracteres = [
    MAYUSCULAS[randomInt(MAYUSCULAS.length)],
    MINUSCULAS[randomInt(MINUSCULAS.length)],
    DIGITOS[randomInt(DIGITOS.length)]
  ];
  while (caracteres.length < longitud) {
    caracteres.push(todos[randomInt(todos.length)]);
  }
  // Fisher-Yates con randomInt para que las 3 clases no queden siempre al inicio.
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  return caracteres.join('');
}
