/**
 * Generador y validador de Códigos Secretos / PINs Seguros para Pacientes en VACLINIC
 * 
 * Diseñado para generar códigos secretos de alta entropía difíciles de adivinar
 * (evitando secuencias predecibles como 0001, 1234 o basadas en el año),
 * sin caracteres confusos (como '0'/'O', '1'/'I'/'L') para facilitar la lectura
 * tanto al personal del laboratorio como al paciente.
 */

// Alfabeto Base32 Crockford/Sanitized (sin caracteres visualmente confusos como 0/O, 1/I/L)
const SECRET_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Genera un código secreto alfanumérico seguro de alta entropía difícil de descubrir.
 * Formato: 6 caracteres en mayúsculas (ej. "7K9P2X", "W4N8TY") o con prefijo "VAC-" ("VAC-7K9P2X").
 * 32^6 = 1,073,741,824 combinaciones posibles (más de mil millones).
 */
export function generateSecretAccessCode(length: number = 6): string {
  let result = '';
  // Usar crypto si está disponible para aleatoriedad criptográfica
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomBytes = new Uint8Array(length);
    window.crypto.getRandomValues(randomBytes);
    for (let i = 0; i < length; i++) {
      result += SECRET_ALPHABET[randomBytes[i] % SECRET_ALPHABET.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * SECRET_ALPHABET.length);
      result += SECRET_ALPHABET[idx];
    }
  }
  return result;
}

/**
 * Determina si un PIN es débil o fácilmente predecible
 */
export function isWeakOrPredictablePin(pin: string): boolean {
  if (!pin || pin.length < 4) return true;
  const isSequential = '01234567890123456789'.includes(pin) || '98765432109876543210'.includes(pin);
  const isAllSame = /^(\d)\1+$/.test(pin);
  const isYear = (pin.length === 4 && (pin.startsWith('19') || pin.startsWith('20')));
  const isIncrementalDemo = /^(000[1-9]|00[1-9][0-9]|1234|4321|1111|2222)$/.test(pin);
  return isSequential || isAllSame || isYear || isIncrementalDemo;
}

/**
 * Genera un PIN numérico seguro de 6 dígitos no predecible
 * (evita repetidos como 111111, secuencias como 123456 o años).
 */
export function generateSecretPinCode(length: number = 6): string {
  let pin = '';
  const digits = '0123456789';
  
  let attempts = 0;
  while (attempts < 50) {
    pin = '';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const randomBytes = new Uint8Array(length);
      window.crypto.getRandomValues(randomBytes);
      for (let i = 0; i < length; i++) {
        pin += digits[randomBytes[i] % digits.length];
      }
    } else {
      for (let i = 0; i < length; i++) {
        pin += digits[Math.floor(Math.random() * digits.length)];
      }
    }

    if (!isWeakOrPredictablePin(pin)) {
      return pin;
    }
    attempts++;
  }

  return pin;
}

/**
 * Genera un PIN numérico único que garantiza no coincidir con ningún paciente existente
 */
export function generateUniquePatientPin(existingPins: (string | undefined)[], length: number = 6): string {
  const existingSet = new Set(
    existingPins
      .filter((p): p is string => Boolean(p))
      .map(p => p.trim().toUpperCase())
  );

  let attempts = 0;
  while (attempts < 100) {
    const candidate = generateSecretPinCode(length);
    if (!existingSet.has(candidate)) {
      return candidate;
    }
    attempts++;
  }

  // Fallback con longitud extendida
  return generateSecretPinCode(length + 1);
}

/**
 * Enmascara un código o PIN para protegerlo en vistas administrativas por defecto
 */
export function maskSecretPin(pin?: string, showLastDigits: number = 0): string {
  if (!pin) return '••••••';
  const clean = pin.trim();
  if (showLastDigits > 0 && clean.length > showLastDigits) {
    const hidden = '•'.repeat(clean.length - showLastDigits);
    const visible = clean.slice(-showLastDigits);
    return `${hidden}${visible}`;
  }
  return '•'.repeat(Math.max(clean.length, 6));
}

/**
 * Sanitiza y compara un código ingresado contra el código secreto o PIN del paciente
 */
export function matchesSecretCode(input: string, secretCode?: string, pinCode?: string): boolean {
  if (!input) return false;
  const cleanInput = input.trim().toUpperCase().replace(/[\s-]/g, '');
  
  if (secretCode) {
    const cleanSecret = secretCode.trim().toUpperCase().replace(/[\s-]/g, '');
    if (cleanSecret === cleanInput) return true;
  }

  if (pinCode) {
    const cleanPin = pinCode.trim().toUpperCase().replace(/[\s-]/g, '');
    if (cleanPin === cleanInput) return true;
  }

  return false;
}

// =========================================================================
// Control de Tasa / Prevención de Fuerza Bruta para Consultas de Órdenes + PIN
// =========================================================================

interface AttemptRecord {
  attempts: number;
  lastAttemptAt: number;
  lockedUntil?: number;
}

const attemptRegistry: Map<string, AttemptRecord> = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 segundos de penalización

/**
 * Verifica si una clave (IP/Order) está temporalmente bloqueada por exceso de intentos
 */
export function checkAttemptLockout(key: string): { locked: boolean; remainingSeconds: number; attemptsLeft: number } {
  const normalizedKey = key.trim().toUpperCase();
  const record = attemptRegistry.get(normalizedKey);
  const now = Date.now();

  if (!record) {
    return { locked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS };
  }

  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { locked: true, remainingSeconds, attemptsLeft: 0 };
  }

  // Si ya pasó el bloqueo, resetear
  if (record.lockedUntil && record.lockedUntil <= now) {
    attemptRegistry.delete(normalizedKey);
    return { locked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS };
  }

  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - record.attempts);
  return { locked: false, remainingSeconds: 0, attemptsLeft };
}

/**
 * Registra un intento fallido y bloquea si se supera el umbral
 */
export function recordFailedAttempt(key: string): { locked: boolean; remainingSeconds: number; attemptsLeft: number } {
  const normalizedKey = key.trim().toUpperCase();
  const now = Date.now();
  const record = attemptRegistry.get(normalizedKey) || { attempts: 0, lastAttemptAt: now };

  record.attempts += 1;
  record.lastAttemptAt = now;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    attemptRegistry.set(normalizedKey, record);
    return { locked: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000), attemptsLeft: 0 };
  }

  attemptRegistry.set(normalizedKey, record);
  return { locked: false, remainingSeconds: 0, attemptsLeft: MAX_ATTEMPTS - record.attempts };
}

/**
 * Limpia el registro de intentos tras un acceso exitoso
 */
export function clearFailedAttempts(key: string): void {
  const normalizedKey = key.trim().toUpperCase();
  attemptRegistry.delete(normalizedKey);
}

/**
 * Determina si una orden o reporte contiene resultados clínicos considerados sensibles
 * (Pruebas de serología, VIH, hormonas, oncología, o diagnósticos médicos de laboratorio)
 */
export function isSensitiveClinicalResult(category?: string, title?: string, urgentAlert?: boolean): boolean {
  if (urgentAlert) return true;
  const text = `${category || ''} ${title || ''}`.toLowerCase();
  
  const sensitiveKeywords = [
    'vih', 'hiv', 'sida', 'vdrl', 'sifilis', 'sífilis', 'hepatitis', 
    'chlamydia', 'gonorrea', 'embarazo', 'hcg', 'psa', 'prostata',
    'oncologia', 'tumor', 'biopsia', 'toxicolog', 'drogas', 'abuso',
    'estradiol', 'testosterona', 'espermiograma', 'genet'
  ];

  return sensitiveKeywords.some(kw => text.includes(kw));
}

// =========================================================================
// Criptografía SHA-256 para securePIN (Validación segura sin exponer el PIN)
// =========================================================================

export const VACLINIC_PIN_SALT = 'VACLINIC_LAB_SECURE_PIN_V1_2026';

function rightRotate(value: number, amount: number) {
  return (value >>> amount) | (value << (32 - amount));
}

/**
 * Función SHA-256 pura y determinista compatible con cliente y servidor
 */
export function sha256Hex(ascii: string): string {
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (let i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = hash.slice(0);

    for (let j = 0; j < 64; j++) {
      const w15 = w[j - 15] || 0;
      const w2 = w[j - 2] || 0;
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[j] = j < 16 ? (w[j] || 0) : ((w[j - 16] || 0) + s0 + (w[j - 7] || 0) + s1) | 0;

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[j] + w[j]) | 0;
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (let j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  let result = '';
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Computa el hash SHA-256 seguro del PIN secreto del paciente
 */
export function computeSecurePinHash(pin: string, salt: string = VACLINIC_PIN_SALT): string {
  const clean = (pin || '').trim();
  return sha256Hex(`${salt}:${clean}`);
}

/**
 * Valida un PIN ingresado contra el securePIN (hash) almacenado en la base de datos
 */
export function verifyPinAgainstHash(enteredPin: string, storedHash?: string): boolean {
  if (!enteredPin || !storedHash) return false;
  const computed = computeSecurePinHash(enteredPin);
  return computed.toLowerCase() === storedHash.toLowerCase();
}

/**
 * Sanitiza los registros de pacientes para vistas administrativas,
 * garantizando que el campo 'securePIN' nunca sea expuesto en listados administrativos.
 */
export function sanitizePatientForAdminList<T extends { securePIN?: string }>(patient: T): Omit<T, 'securePIN'> {
  const { securePIN, ...safePatient } = patient;
  return safePatient;
}


