/**
 * Cuentas de personal usadas recientemente EN ESTE EQUIPO.
 *
 * Sirve para que, al escribir el correo en el inicio de sesión, aparezcan las
 * cuentas que ya se han usado en esta computadora y baste con tocar una.
 * Solo se guarda correo, nombre y rol (nunca contraseñas ni tokens).
 *
 * Decisión de seguridad: la lista sale del propio equipo, NO de la base de
 * datos. Una pantalla de login pública que enumerara todas las cuentas del
 * servidor le daría a cualquiera la lista de usuarios a atacar.
 */
const STORAGE_KEY = 'vaclinic_recent_staff_accounts_v1';
const MAX_ACCOUNTS = 6;

export interface RecentStaffAccount {
  email: string;
  fullName: string;
  roleName?: string;
  lastUsedAt: string;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function esCuenta(x: unknown): x is RecentStaffAccount {
  const c = x as RecentStaffAccount;
  return !!c && typeof c.email === 'string' && c.email.includes('@') && typeof c.fullName === 'string';
}

export function loadRecentAccounts(storage: StorageLike | null = defaultStorage()): RecentStaffAccount[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(esCuenta).slice(0, MAX_ACCOUNTS) : [];
  } catch {
    return [];
  }
}

function guardar(lista: RecentStaffAccount[], storage: StorageLike | null) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(lista.slice(0, MAX_ACCOUNTS)));
  } catch {
    /* almacenamiento lleno o bloqueado: la lista es solo una comodidad */
  }
}

/** Registra/actualiza una cuenta tras un inicio de sesión exitoso (la más reciente va primero). */
export function rememberAccount(
  cuenta: { email: string; fullName: string; roleName?: string },
  storage: StorageLike | null = defaultStorage(),
  ahora: Date = new Date()
): RecentStaffAccount[] {
  const email = cuenta.email.trim().toLowerCase();
  if (!email.includes('@')) return loadRecentAccounts(storage);
  const resto = loadRecentAccounts(storage).filter((c) => c.email.toLowerCase() !== email);
  const lista = [{ email, fullName: cuenta.fullName, roleName: cuenta.roleName, lastUsedAt: ahora.toISOString() }, ...resto];
  guardar(lista, storage);
  return lista.slice(0, MAX_ACCOUNTS);
}

export function forgetAccount(email: string, storage: StorageLike | null = defaultStorage()): RecentStaffAccount[] {
  const lista = loadRecentAccounts(storage).filter((c) => c.email.toLowerCase() !== email.trim().toLowerCase());
  guardar(lista, storage);
  return lista;
}

/** Filtra por lo escrito (correo o nombre, sin distinguir mayúsculas ni acentos). */
export function filterAccounts(lista: RecentStaffAccount[], typed: string): RecentStaffAccount[] {
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = norm(typed.trim());
  if (!q) return lista;
  return lista.filter((c) => norm(c.email).includes(q) || norm(c.fullName).includes(q));
}
