/**
 * Token real de sesión de PERSONAL (ver server/auth-staff.ts,
 * server/session.ts) — reemplaza Firebase Authentication desde la
 * migración 0012. Vive en su propio archivo, sin importar nada de
 * ClinicContext.tsx, precisamente para que los *ApiService.ts de este
 * mismo directorio puedan leerlo sin crear un import circular (varios de
 * ellos ya son importados POR ClinicContext.tsx).
 *
 * Hallazgo real (Fase 1 / Persistencia): los 13 *ApiService.ts de este
 * directorio (carpetas, chat, episodios, examenes, ordenes, pacientes,
 * perfiles, personal, plantillas, reactivos, resultados, roles,
 * transferencias) armaban su cabecera Authorization con
 * `getFirebaseAuth().currentUser.getIdToken()`. Pero ningún flujo del
 * frontend vuelve a iniciar sesión con Firebase desde que el login propio
 * (server/routes/auth.ts) reemplazó por completo a Firebase Authentication
 * — confirmado en src/services/staffAuthService.ts, que documenta ese
 * reemplazo explícitamente. Por lo tanto `currentUser` siempre era `null`,
 * esas 13 llamadas nunca llegaban a intentar la petición de red, y cada
 * módulo "ya migrado" caía en silencio a su respaldo de localStorage —
 * verificado leyendo server/auth-staff.ts: solo acepta el token propio
 * (verifySessionToken()), nunca un ID token de Firebase.
 *
 * ClinicContext.tsx guarda y expone este mismo valor bajo el nombre
 * STAFF_SESSION_TOKEN_STORAGE_KEY (re-exportado desde aquí, ver ese
 * archivo) — es la MISMA clave de localStorage, una sola fuente de verdad.
 */
export const STAFF_SESSION_TOKEN_STORAGE_KEY = 'vaclinic_session_token';

/** Lee el token real de sesión del personal, o null si no hay sesión activa. */
export function getStaffSessionToken(): string | null {
  try {
    return localStorage.getItem(STAFF_SESSION_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}
