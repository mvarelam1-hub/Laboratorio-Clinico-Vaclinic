/**
 * Verificación y ciclo de vida de la sesión del PERSONAL contra el backend
 * real (server/routes/auth.ts, server/auth-staff.ts).
 *
 * ANTES (Firebase Authentication): el login real ocurría en el SDK de
 * Firebase (signInWithEmailAndPassword), en el cliente; este archivo solo
 * volvía a confirmar el resultado contra `GET /api/auth/whoami` antes de
 * considerarlo válido.
 *
 * AHORA: TODO el login ocurre en el backend — no hay SDK externo. Este
 * archivo es un conjunto de wrappers delgados sobre `fetch`, cada uno con
 * el mismo estilo que ya tenía `verifyStaffSession`: nunca asume éxito,
 * siempre distingue el motivo del fallo con un código explícito, y nunca
 * lanza — todo vuelve como `{ ok: true | false, ... }`.
 */

export interface StaffWhoAmI {
  idUsuario: number;
  nombreCompleto: string;
  roleId: string;
  status: string;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  totpSetupRequired: boolean;
  totpMandatory: boolean;
}

/** Subconjunto de StaffWhoAmI que ClinicContext.tsx necesita para decidir qué pantalla forzar. */
export type StaffAuthMeta = Pick<StaffWhoAmI, 'mustChangePassword' | 'totpEnabled' | 'totpSetupRequired' | 'totpMandatory'>;

export type StaffVerificationResult =
  | { ok: true; data: StaffWhoAmI }
  | { ok: false; reason: 'unauthorized' | 'forbidden' | 'inactive' | 'network' | 'unknown'; message: string };

export type StaffLoginResult =
  | { ok: true; requiresTotp: false; token: string; mustChangePassword: boolean; idUsuario: number; nombreCompleto: string; roleId: string }
  | { ok: true; requiresTotp: true; loginTicket: string }
  | { ok: false; message: string };

export type StaffActionResult = { ok: true } | { ok: false; message: string };

async function mensajeDeError(res: Response, mensajePorDefecto: string): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error) return body.error;
  } catch {
    /* ignore body parse errors, keep default message */
  }
  return mensajePorDefecto;
}

/**
 * Llama a GET /api/auth/whoami con el token de sesión propio del personal
 * (ya NO un ID token de Firebase, pero el contrato es idéntico: un bearer
 * token cualquiera). Nunca asume éxito: si el backend no responde lo dice
 * explícitamente en vez de dejar pasar al usuario.
 */
export async function verifyStaffSession(sessionToken: string): Promise<StaffVerificationResult> {
  try {
    const res = await fetch('/api/auth/whoami', {
      headers: { Authorization: `Bearer ${sessionToken}` }
    });

    if (res.ok) {
      const data = (await res.json()) as StaffWhoAmI;
      return { ok: true, data };
    }

    if (res.status === 401) {
      return { ok: false, reason: 'unauthorized', message: 'El token de sesión no fue válido para el servidor.' };
    }
    if (res.status === 403) {
      const message = await mensajeDeError(res, 'Esta cuenta no está registrada como personal de VACLINIC, o está inactiva.');
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

/**
 * POST /api/auth/login — primer paso del login propio. Si la cuenta tiene
 * TOTP activado, el backend NO emite sesión: devuelve `requiresTotp: true`
 * + un `loginTicket` de 5 minutos que solo sirve para `verifyTotp()`.
 */
export async function loginStaff(correo: string, contrasena: string): Promise<StaffLoginResult> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, message: body?.error || 'Correo o contraseña incorrectos.' };
    }
    if (body.requiresTotp) {
      return { ok: true, requiresTotp: true, loginTicket: body.loginTicket };
    }
    return {
      ok: true,
      requiresTotp: false,
      token: body.token,
      mustChangePassword: Boolean(body.mustChangePassword),
      idUsuario: body.idUsuario,
      nombreCompleto: body.nombreCompleto,
      roleId: body.roleId
    };
  } catch (err) {
    console.error('[StaffAuth] No se pudo contactar al servidor para iniciar sesión:', err);
    return { ok: false, message: 'No se pudo contactar al servidor de VACLINIC. Intenta de nuevo en unos segundos.' };
  }
}

/** POST /api/auth/verify-totp — segundo paso del login cuando la cuenta tiene TOTP activado. */
export async function verifyTotp(loginTicket: string, code: string): Promise<StaffLoginResult> {
  try {
    const res = await fetch('/api/auth/verify-totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginTicket, code })
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, message: body?.error || 'Código de verificación incorrecto o expirado.' };
    }
    return {
      ok: true,
      requiresTotp: false,
      token: body.token,
      mustChangePassword: Boolean(body.mustChangePassword),
      idUsuario: body.idUsuario,
      nombreCompleto: body.nombreCompleto,
      roleId: body.roleId
    };
  } catch (err) {
    console.error('[StaffAuth] No se pudo contactar al servidor para verificar el código TOTP:', err);
    return { ok: false, message: 'No se pudo contactar al servidor de VACLINIC. Intenta de nuevo en unos segundos.' };
  }
}

/** POST /api/auth/change-password — requiere una sesión válida (incluso una LIMITADA por mustChangePassword). */
export async function changePassword(sessionToken: string, currentPassword: string, newPassword: string): Promise<StaffActionResult> {
  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!res.ok) {
      return { ok: false, message: await mensajeDeError(res, 'No se pudo cambiar la contraseña.') };
    }
    return { ok: true };
  } catch (err) {
    console.error('[StaffAuth] No se pudo contactar al servidor para cambiar la contraseña:', err);
    return { ok: false, message: 'No se pudo contactar al servidor de VACLINIC. Intenta de nuevo en unos segundos.' };
  }
}

export interface EnrollTotpResult {
  ok: true;
  secret: string;
  otpauthUri: string;
}

/** POST /api/auth/totp/enroll — genera un secreto nuevo (todavía no activado) y la URI para el QR. */
export async function enrollTotp(sessionToken: string): Promise<EnrollTotpResult | { ok: false; message: string }> {
  try {
    const res = await fetch('/api/auth/totp/enroll', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: body?.error || 'No se pudo generar el secreto TOTP.' };
    }
    return { ok: true, secret: body.secret, otpauthUri: body.otpauthUri };
  } catch (err) {
    console.error('[StaffAuth] No se pudo contactar al servidor para enrolar TOTP:', err);
    return { ok: false, message: 'No se pudo contactar al servidor de VACLINIC. Intenta de nuevo en unos segundos.' };
  }
}

/** POST /api/auth/totp/confirm — activa TOTP tras verificar el primer código real. */
export async function confirmTotp(sessionToken: string, code: string): Promise<StaffActionResult> {
  try {
    const res = await fetch('/api/auth/totp/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
      body: JSON.stringify({ code })
    });
    if (!res.ok) {
      return { ok: false, message: await mensajeDeError(res, 'Código de verificación incorrecto o expirado.') };
    }
    return { ok: true };
  } catch (err) {
    console.error('[StaffAuth] No se pudo contactar al servidor para confirmar TOTP:', err);
    return { ok: false, message: 'No se pudo contactar al servidor de VACLINIC. Intenta de nuevo en unos segundos.' };
  }
}

/**
 * POST /api/auth/logout — revoca la sesión en el servidor (ver
 * server/session.ts::revokeSession). Se llama en "best effort": si falla
 * por red, el cliente igual borra el token local (ver ClinicContext.tsx) —
 * no tiene sentido bloquear el logout local porque el servidor no respondió.
 */
export async function logoutStaff(sessionToken: string): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` }
    });
  } catch (err) {
    console.warn('[StaffAuth] No se pudo revocar la sesión en el servidor (se cierra localmente de todas formas):', err);
  }
}
