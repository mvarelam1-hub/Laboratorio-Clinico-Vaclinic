/**
 * Límite de intentos fallidos de inicio de sesión (personal).
 *
 * Por qué existe: sin esto, cualquiera puede probar contraseñas (o los
 * códigos de 6 dígitos del autenticador) sin parar. Con esto, después de
 * MAX_INTENTOS fallos seguidos para la misma clave (correo o usuario), esa
 * clave queda BLOQUEADA un rato (BLOQUEO_MS) y el servidor responde 429.
 *
 * Decisiones de diseño (honestas, para quien lo mantenga):
 *  - Vive en la memoria del servidor: es suficiente con UNA sola instancia
 *    (el caso actual en Render) pero se reinicia si el servicio se reinicia
 *    y no se comparte entre varias instancias. Si algún día se escala a
 *    varias instancias, hay que moverlo a la base de datos.
 *  - La clave es el CORREO (no la IP): detrás del proxy de Render todas las
 *    peticiones llegan con la IP del proxy, y bloquear por IP bloquearía a
 *    todo el laboratorio a la vez. A cambio, alguien que conozca un correo
 *    puede bloquearlo 15 minutos; es un mal menor frente a adivinar claves.
 *  - Un inicio de sesión correcto borra el contador de esa clave.
 *  - El mensaje de bloqueo es el mismo exista o no el correo, para no
 *    revelar qué correos están registrados.
 */

export const MAX_INTENTOS = 5;
export const VENTANA_MS = 15 * 60 * 1000;
export const BLOQUEO_MS = 15 * 60 * 1000;

interface Registro {
  fallos: number[]; // marcas de tiempo (ms) de los fallos dentro de la ventana
  bloqueadoHasta: number;
}

const registros = new Map<string, Registro>();
const MAX_CLAVES = 10_000; // tope de memoria

function normalizar(clave: string): string {
  return String(clave).trim().toLowerCase();
}

function podar(ahora: number): void {
  if (registros.size <= MAX_CLAVES) return;
  for (const [k, r] of registros) {
    if (r.bloqueadoHasta <= ahora && r.fallos.every((t) => ahora - t > VENTANA_MS)) registros.delete(k);
  }
}

/** Segundos que faltan para que se desbloquee `clave`, o 0 si NO está bloqueada. */
export function segundosDeBloqueo(clave: string, ahora: number = Date.now()): number {
  const r = registros.get(normalizar(clave));
  if (!r || r.bloqueadoHasta <= ahora) return 0;
  return Math.ceil((r.bloqueadoHasta - ahora) / 1000);
}

/**
 * Anota un fallo para `clave`. Devuelve `bloqueadoAhora: true` solo en el
 * fallo que dispara el bloqueo (para registrarlo una única vez en bitácora).
 */
export function registrarFallo(clave: string, ahora: number = Date.now()): { bloqueadoAhora: boolean; intentosRestantes: number } {
  podar(ahora);
  const k = normalizar(clave);
  const r = registros.get(k) ?? { fallos: [], bloqueadoHasta: 0 };
  r.fallos = r.fallos.filter((t) => ahora - t <= VENTANA_MS);
  r.fallos.push(ahora);
  let bloqueadoAhora = false;
  if (r.fallos.length >= MAX_INTENTOS && r.bloqueadoHasta <= ahora) {
    r.bloqueadoHasta = ahora + BLOQUEO_MS;
    r.fallos = [];
    bloqueadoAhora = true;
  }
  registros.set(k, r);
  return { bloqueadoAhora, intentosRestantes: Math.max(0, MAX_INTENTOS - r.fallos.length) };
}

/** Borra el historial de fallos de `clave` (inicio de sesión correcto). */
export function limpiarFallos(clave: string): void {
  registros.delete(normalizar(clave));
}

/** Solo para pruebas. */
export function reiniciarLimitador(): void {
  registros.clear();
}

/** Mensaje en español para el 429. */
export function mensajeBloqueo(segundos: number): string {
  const minutos = Math.max(1, Math.ceil(segundos / 60));
  return `Demasiados intentos fallidos. Espera ${minutos} minuto${minutos === 1 ? '' : 's'} e inténtalo de nuevo.`;
}
