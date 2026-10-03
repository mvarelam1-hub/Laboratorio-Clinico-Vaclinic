/**
 * TOTP (RFC 6238, sobre HOTP de RFC 4226) implementado desde cero con
 * `crypto` nativo de Node — sin librerías de terceros (`otplib`, `speakeasy`,
 * etc.), igual que el resto de la autenticación de personal
 * (server/password.ts, server/session.ts, server/crypto-aes.ts).
 *
 * Por qué TOTP y no solo contraseña: Firebase Authentication (lo que este
 * módulo reemplaza) no ofrecía segundo factor propio en este proyecto — el
 * único control de acceso era "¿conoce la contraseña de esa cuenta?". Para
 * los roles de mayor privilegio (director_laboratorio, administrador_ti,
 * ver MANDATORY_TOTP_ROLES más abajo) eso ya no es suficiente: exigen un
 * código de 6 dígitos que cambia cada 30 segundos, generado por una app
 * autenticadora (Google Authenticator, Authy, etc.) a partir de un secreto
 * que NUNCA viaja por la red después del enrolamiento inicial.
 *
 * Parámetros fijos (estándar de facto que usan todas las apps
 * autenticadoras, ver RFC 6238 §5.2): HMAC-SHA1, 6 dígitos, paso de 30s.
 * SHA1 es obligatorio aquí (no es una elección débil nuestra): es el único
 * algoritmo que Google Authenticator y la mayoría de apps autenticadoras
 * soportan de forma universal.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/** Bytes de entropía del secreto (160 bits, el tamaño recomendado por RFC 4226 §4). */
const SECRET_BYTES = 20;
/** Duración de cada paso de tiempo, en segundos. */
const STEP_SECONDS = 30;
/** Cantidad de dígitos del código mostrado al usuario. */
const DIGITS = 6;
/** Pasos hacia atrás/adelante que se aceptan para absorber el desfase de reloj (±30s). */
const WINDOW_STEPS = 1;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// ---------------------------------------------------------------------------
// Base32 (RFC 4648 §6) — no viene en Buffer de Node, así que se implementa a
// mano. Solo se necesita para el secreto TOTP (las apps autenticadoras
// esperan el secreto en Base32, nunca en hex/Base64).
// ---------------------------------------------------------------------------

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, ''); // ignora '=' de relleno y espacios
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Genera un secreto nuevo (160 bits aleatorios) codificado en Base32, listo para mostrar/guardar. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(SECRET_BYTES));
}

/**
 * Construye la URI `otpauth://` estándar que cualquier app autenticadora
 * sabe leer desde un código QR (RFC "Key Uri Format" de Google
 * Authenticator, de facto el estándar de la industria).
 */
export function totpAuthUri(secret: string, accountLabel: string, issuer = 'VACLINIC'): string {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(STEP_SECONDS)
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** HOTP (RFC 4226 §5.3) para un contador de pasos dado. Devuelve el código de `DIGITS` dígitos, con ceros a la izquierda. */
function hotp(secretBytes: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  // RFC 4226: el contador va en big-endian de 64 bits. JS no tiene enteros de
  // 64 bits nativos, pero el número de pasos de 30s no alcanzará
  // Number.MAX_SAFE_INTEGER en ningún escenario real, así que basta con
  // escribir los 32 bits bajos (los 32 altos quedan en cero).
  counterBuffer.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  counterBuffer.writeUInt32BE(counter >>> 0, 4);

  const hmac = createHmac('sha1', secretBytes).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f; // truncamiento dinámico, RFC 4226 §5.3
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const codigo = (binaryCode % 10 ** DIGITS).toString();
  return codigo.padStart(DIGITS, '0');
}

function stepForTime(epochSeconds: number): number {
  return Math.floor(epochSeconds / STEP_SECONDS);
}

/**
 * Calcula el código vigente para `secret` en el instante `at` (por defecto,
 * ahora). Se expone como función pública (no solo de uso interno) porque
 * sirve para las pruebas unitarias (server/totp.test.ts) y, potencialmente,
 * para que el backend muestre "tu código actual sería..." en un entorno de
 * desarrollo sin tener que instalar una app autenticadora de verdad.
 */
export function generateTotpToken(secret: string, at: Date = new Date()): string {
  const secretBytes = base32Decode(secret);
  return hotp(secretBytes, stepForTime(Math.floor(at.getTime() / 1000)));
}

/**
 * Compara `token` (lo que el usuario escribió) contra el código esperado
 * para "ahora", y también para ±WINDOW_STEPS pasos adyacentes, para tolerar
 * un reloj del celular ligeramente desincronizado o la latencia de escribir
 * el código justo cuando el paso está por cambiar.
 */
export function verifyTotpToken(secret: string, token: string, at: Date = new Date()): boolean {
  const codigoLimpio = String(token || '').trim();
  if (!/^\d{6}$/.test(codigoLimpio)) return false;

  const secretBytes = base32Decode(secret);
  if (secretBytes.length === 0) return false;

  const pasoActual = stepForTime(Math.floor(at.getTime() / 1000));
  const candidato = Buffer.from(codigoLimpio);

  for (let delta = -WINDOW_STEPS; delta <= WINDOW_STEPS; delta++) {
    const esperado = Buffer.from(hotp(secretBytes, pasoActual + delta));
    if (candidato.length === esperado.length && timingSafeEqual(candidato, esperado)) {
      return true;
    }
  }
  return false;
}

/**
 * Política de obligatoriedad de TOTP por rol (ver src/shared/permissions.ts
 * para el catálogo completo de LabStaffRole). Centralizada aquí en una sola
 * constante exportada para que cambiarla en el futuro sea un diff de una
 * línea, no una búsqueda por todo el backend.
 */
export const MANDATORY_TOTP_ROLES: readonly string[] = ['director_laboratorio', 'administrador_ti'];

export function isTotpMandatoryForRole(roleId: string): boolean {
  return MANDATORY_TOTP_ROLES.includes(roleId);
}
