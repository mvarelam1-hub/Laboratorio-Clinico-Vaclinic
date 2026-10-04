/**
 * Funciones puras / utilidades de los respaldos de VACLINIC
 * (scripts/backup-db.mjs y scripts/restore-verify.mjs).
 *
 * Se separan de los scripts CLI para poder probarlas sin base de datos
 * (server/backup-lib.test.ts), igual que scripts/migrate.mjs expone su
 * lógica de selección.
 *
 * Formato del archivo cifrado (.enc):
 *   [ "VACBK1" (6 bytes) ][ IV (12 bytes) ][ ciphertext AES-256-GCM ][ authTag (16 bytes) ]
 * El authTag va AL FINAL para poder cifrar en streaming un volcado grande
 * sin cargarlo entero en memoria. Si alguien altera un solo byte del
 * archivo, el descifrado falla (GCM autentica), no entrega datos corruptos.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { open, stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

export const MAGIC = Buffer.from('VACBK1');
export const LONGITUD_IV = 12;
export const LONGITUD_TAG = 16;
const LONGITUD_CLAVE = 32;

/** Misma convención que server/crypto-aes.ts: 32 bytes en hex (64 caracteres). */
export function leerClave(raw = process.env.BACKUP_ENCRYPTION_KEY) {
  if (!raw) {
    throw new Error('Falta BACKUP_ENCRYPTION_KEY (32 bytes en hex, ej. `openssl rand -hex 32`).');
  }
  const key = Buffer.from(raw, 'hex');
  if (key.length !== LONGITUD_CLAVE) {
    throw new Error(`BACKUP_ENCRYPTION_KEY debe decodificar a ${LONGITUD_CLAVE} bytes en hex (64 caracteres); tiene ${key.length}.`);
  }
  return key;
}

/** backup-20261004-153045.dump (UTC, ordenable alfabéticamente = cronológicamente). */
export function nombreRespaldo(fecha = new Date(), cifrado = true) {
  const p = (n, l = 2) => String(n).padStart(l, '0');
  const sello =
    `${fecha.getUTCFullYear()}${p(fecha.getUTCMonth() + 1)}${p(fecha.getUTCDate())}` +
    `-${p(fecha.getUTCHours())}${p(fecha.getUTCMinutes())}${p(fecha.getUTCSeconds())}`;
  return `backup-${sello}.dump${cifrado ? '.enc' : ''}`;
}

const PATRON_RESPALDO = /^backup-(\d{8}-\d{6})\.dump(\.enc)?$/;

export function esArchivoRespaldo(nombre) {
  return PATRON_RESPALDO.test(nombre);
}

/** Respaldos ordenados del más reciente al más antiguo. */
export function ordenarRespaldos(nombres) {
  return nombres
    .filter(esArchivoRespaldo)
    .sort((a, b) => PATRON_RESPALDO.exec(b)[1].localeCompare(PATRON_RESPALDO.exec(a)[1]));
}

/**
 * Retención: conserva los `conservar` más recientes y devuelve los demás
 * para borrarlos. Nunca devuelve algo que no sea un respaldo con nuestro
 * patrón (jamás borra archivos ajenos que alguien dejó en la carpeta), y
 * nunca borra si `conservar` < 1 (protege contra una configuración errónea
 * que dejaría la carpeta sin ningún respaldo).
 */
export function seleccionarParaBorrar(nombres, conservar) {
  if (!Number.isInteger(conservar) || conservar < 1) return [];
  return ordenarRespaldos(nombres).slice(conservar);
}

export async function sha256Archivo(ruta) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(ruta), hash);
  return hash.digest('hex');
}

export async function cifrarArchivo(origen, destino, clave) {
  const iv = randomBytes(LONGITUD_IV);
  const cipher = createCipheriv('aes-256-gcm', clave, iv);
  const salida = createWriteStream(destino);
  salida.write(Buffer.concat([MAGIC, iv]));
  await pipeline(createReadStream(origen), cipher, salida, { end: false });
  // pipeline con end:false deja el stream abierto para anexar el authTag.
  await new Promise((resolve, reject) => {
    salida.end(cipher.getAuthTag(), (err) => (err ? reject(err) : resolve()));
  });
}

export async function descifrarArchivo(origen, destino, clave) {
  const { size } = await stat(origen);
  if (size < MAGIC.length + LONGITUD_IV + LONGITUD_TAG) {
    throw new Error('Archivo de respaldo cifrado demasiado corto o truncado.');
  }
  const fh = await open(origen, 'r');
  let cabecera, tag;
  try {
    cabecera = Buffer.alloc(MAGIC.length + LONGITUD_IV);
    await fh.read(cabecera, 0, cabecera.length, 0);
    tag = Buffer.alloc(LONGITUD_TAG);
    await fh.read(tag, 0, LONGITUD_TAG, size - LONGITUD_TAG);
  } finally {
    await fh.close();
  }
  if (!cabecera.subarray(0, MAGIC.length).equals(MAGIC)) {
    throw new Error('El archivo no tiene el formato de respaldo cifrado de VACLINIC (cabecera VACBK1 ausente).');
  }
  const iv = cabecera.subarray(MAGIC.length);
  const decipher = createDecipheriv('aes-256-gcm', clave, iv);
  decipher.setAuthTag(tag);
  await pipeline(
    createReadStream(origen, { start: cabecera.length, end: size - LONGITUD_TAG - 1 }),
    decipher,
    createWriteStream(destino)
  );
}

/**
 * Compara los conteos de filas por tabla del manifiesto (origen, tomados
 * en la misma instantánea que el volcado) contra los de la base restaurada.
 * Devuelve { ok, diferencias[] }. Una tabla que falta en la restauración
 * cuenta como diferencia (no se ignora en silencio).
 */
export function compararConteos(esperado, obtenido) {
  const diferencias = [];
  for (const [tabla, n] of Object.entries(esperado)) {
    if (!(tabla in obtenido)) {
      diferencias.push({ tabla, esperado: n, obtenido: null });
    } else if (Number(obtenido[tabla]) !== Number(n)) {
      diferencias.push({ tabla, esperado: n, obtenido: Number(obtenido[tabla]) });
    }
  }
  return { ok: diferencias.length === 0, diferencias };
}
