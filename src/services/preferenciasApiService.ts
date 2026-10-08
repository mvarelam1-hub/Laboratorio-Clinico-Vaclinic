/**
 * Cliente HTTP para preferencias de notificación del paciente
 * (server/routes/preferencias.ts) — noveno y último de los 9 módulos
 * migrados desde localStorage.
 *
 * LÍMITE DE ALCANCE REAL: a diferencia de todos los demás servicios de
 * este directorio (que usan getFirebaseAuth().currentUser, la sesión
 * REAL de personal), este endpoint es patient-facing y exige un token de
 * portal real (ver server/routes/portal.ts, requirePortalToken) obtenido
 * de POST /api/portal/login con un código de consulta vigente.
 *
 * ClinicContext.tsx (authenticatePatient) TODAVÍA no llama a ese login
 * real -sigue usando el mecanismo local/inseguro anterior a la Etapa 3,
 * ya documentado como pendiente en el propio portal.ts-, así que hoy no
 * existe ningún token de portal real disponible en el navegador para
 * usar estas funciones. Por eso, aunque el backend ya está completo,
 * probado y verificado end-to-end de forma real (con un token real
 * obtenido a mano en las pruebas), updatePatientNotificationPrefs() en
 * ClinicContext.tsx NO las llama todavía: hacerlo requeriría primero
 * migrar la autenticación real del Portal del Paciente, un cambio de
 * alcance mucho mayor que este módulo. Este archivo queda listo para
 * cuando esa migración ocurra.
 */

export class PreferenciasApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'PreferenciasApiError';
  }
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body?.error) return body.error;
  } catch {
    /* respuesta sin cuerpo JSON */
  }
  return `El servidor respondió ${res.status}.`;
}

export interface PreferenciaApiRow {
  id_paciente: number;
  push_web_habilitado: boolean;
  push_firebase_habilitado: boolean;
  alertas_whatsapp: boolean;
  alertas_correo: boolean;
  solo_alertas_criticas: boolean;
  consejos_salud_habilitado: boolean;
  fecha_actualizacion: string | null;
  [key: string]: unknown;
}

export interface ActualizarPreferenciasInput {
  webPushEnabled?: boolean;
  firebasePushEnabled?: boolean;
  whatsappAlerts?: boolean;
  emailAlerts?: boolean;
  criticalAlertsOnly?: boolean;
  healthTipsEnabled?: boolean;
}

export async function obtenerPreferenciasRemotas(portalToken: string): Promise<PreferenciaApiRow> {
  const res = await fetch('/api/preferencias', { headers: { Authorization: `Bearer ${portalToken}` } });
  if (!res.ok) throw new PreferenciasApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function actualizarPreferenciasRemotas(portalToken: string, input: ActualizarPreferenciasInput): Promise<PreferenciaApiRow> {
  const res = await fetch('/api/preferencias', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${portalToken}` },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new PreferenciasApiError(await parseErrorBody(res), res.status);
  return res.json();
}
