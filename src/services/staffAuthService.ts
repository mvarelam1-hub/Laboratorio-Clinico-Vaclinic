/**
 * Verificación del personal contra el backend real (Etapa 3).
 *
 * El login de Firebase (signInWithEmailAndPassword) solo prueba que la
 * PERSONA conoce su contraseña de esa cuenta de Firebase. Que esa cuenta
 * tenga permiso de entrar al sistema LIS de VACLINIC lo decide el backend
 * (server/auth-firebase.ts -> tabla `usuario`), nunca el frontend. Por eso
 * todo login de personal debe terminar aquí antes de considerarse válido.
 */

export interface StaffWhoAmI {
  idUsuario: number;
  nombreCompleto: string;
  roleId: string;
  status: string;
}

export type StaffVerificationResult =
  | { ok: true; data: StaffWhoAmI }
  | { ok: false; reason: 'unauthorized' | 'forbidden' | 'inactive' | 'network' | 'unknown'; message: string };

/**
 * Llama a GET /api/auth/whoami con el ID token de Firebase del usuario que
 * acaba de iniciar sesión. Nunca asume éxito: si el backend no responde
 * (por ejemplo, porque todavía no está desplegado) lo dice explícitamente
 * en vez de dejar pasar al usuario.
 */
export async function verifyStaffSession(idToken: string): Promise<StaffVerificationResult> {
  try {
    const res = await fetch('/api/auth/whoami', {
      headers: { Authorization: `Bearer ${idToken}` }
    });

    if (res.ok) {
      const data = (await res.json()) as StaffWhoAmI;
      return { ok: true, data };
    }

    if (res.status === 401) {
      return { ok: false, reason: 'unauthorized', message: 'El token de sesión no fue válido para el servidor.' };
    }
    if (res.status === 403) {
      let message = 'Esta cuenta de Firebase no está registrada como personal de VACLINIC, o está inactiva.';
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch {
        /* ignore body parse errors, keep default message */
      }
      return { ok: false, reason: message.toLowerCase().includes('inactivo') ? 'inactive' : 'forbidden', message };
    }

    return { ok: false, reason: 'unknown', message: `El servidor respondió con un error inesperado (${res.status}).` };
  } catch (err) {
    console.error('[StaffAuth] No se pudo contactar al backend de verificación:', err);
    return {
      ok: false,
      reason: 'network',
      message: 'No se pudo contactar al servidor de VACLINIC para verificar la cuenta. Intenta de nuevo en unos segundos.'
    };
  }
}
