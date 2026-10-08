/**
 * Cifrado simétrico AES-256-GCM (nativo de Node, sin dependencias nuevas)
 * para datos sensibles que deben poder RECUPERARSE en texto plano (a
 * diferencia de una contraseña o un PIN, que solo se comparan por hash —
 * ver `server/password.ts` y `server/pin.ts`).
 *
 * Primer y único uso hoy: `usuario.totp_secret` (migración
 * 0012_staff_password_auth.sql). El secreto TOTP no puede guardarse como
 * hash porque `verifyTotpToken()` (server/totp.ts) necesita el secreto
 * original para recalcular el código esperado cada vez que alguien inicia
 * sesión — por eso se cifra en reposo en vez de dejarlo en texto plano en
 * la base de datos.
 *
 * Formato de salida: "iv:tag:ciphertext", cada parte en Base64. El IV y el
 * authTag de GCM viajan junto al texto cifrado (no son secretos: su función
 * es garantizar unicidad e integridad, no confidencialidad) para poder
 * descifrar sin guardar nada más en una columna aparte.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITMO = 'aes-256-gcm';
/** AES-256 exige una clave de 32 bytes exactos. */
const LONGITUD_CLAVE = 32;
/** 12 bytes es el tamaño de IV recomendado para GCM (NIST SP 800-38D). */
const LONGITUD_IV = 12;

/**
 * Lee BACKUP_ENCRYPTION_KEY del entorno. Se documenta como 32 bytes
 * aleatorios codificados en HEX (64 caracteres) — igual convención que
 * `openssl rand -hex 32` ya usada para PORTAL_TOKEN_SECRET/SESSION_SECRET
 * (ver .env.example) — para no introducir un segundo formato de secreto en
 * el mismo proyecto.
 */
function getKey(): Buffer {
  const raw = process.env.BACKUP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'Falta la variable de entorno BACKUP_ENCRYPTION_KEY (32 bytes aleatorios en hex, ej. `openssl rand -hex 32`).'
    );
  }
  const key = Buffer.from(raw, 'hex');
  if (key.length !== LONGITUD_CLAVE) {
    throw new Error(
      `BACKUP_ENCRYPTION_KEY debe decodificar a ${LONGITUD_CLAVE} bytes en hex (64 caracteres); tiene ${key.length}.`
    );
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(LONGITUD_IV);
  const cipher = createCipheriv(ALGORITMO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decrypt(ciphertext: string): string {
  const partes = ciphertext.split(':');
  if (partes.length !== 3) {
    throw new Error('Formato de texto cifrado inválido (se esperaba "iv:tag:ciphertext").');
  }
  const [ivB64, tagB64, dataB64] = partes;
  const decipher = createDecipheriv(ALGORITMO, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return plaintext.toString('utf8');
}

// Alias explícitos para el caso de uso de TOTP (ver server/routes/auth.ts):
// mismo cifrado genérico de arriba, nombrado según lo que guarda, para que
// quede claro en el call site qué se está cifrando/descifrando.
export const encryptSecret = encrypt;
export const decryptSecret = decrypt;
