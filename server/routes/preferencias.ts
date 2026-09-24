/**
 * Preferencias de notificación por paciente — noveno y último de los 9
 * módulos migrados desde localStorage (ver ClinicContext.tsx
 * patientNotificationPrefs/updatePatientNotificationPrefs). Migración
 * real: db/migrations/0011_modulos_restantes.sql (tabla
 * `preferencia_notificacion_paciente`, PRIMARY KEY id_paciente).
 *
 * A diferencia de los otros 8 módulos (todos personal/staff), este es
 * PATIENT-FACING: usa requirePortalToken (server/routes/portal.ts), el
 * mismo mecanismo real y seguro con el que el paciente consulta su orden,
 * en vez de requireStaffAuth.
 *
 * LÍMITE DE ALCANCE REAL E IMPORTANTE, descubierto al diseñar este
 * módulo (no introducido por él): el Portal del Paciente del frontend
 * (ClinicContext.tsx `authenticatePatient`) TODAVÍA no llama a
 * POST /api/portal/login -sigue comparando accessCode/pinCode/nationalId
 * contra el arreglo completo de pacientes cargado en el navegador, el
 * mecanismo inseguro que portal.ts ya documenta en su propio comentario
 * de cabecera como pendiente de reemplazar-. Por lo tanto estas rutas
 * están completas, probadas y verificadas end-to-end de forma real
 * (con un token real obtenido vía POST /api/portal/login), pero
 * ClinicContext.tsx NO puede conectarse a ellas todavía sin antes
 * migrar la autenticación real del Portal -eso es un cambio mucho más
 * grande que "preferencias de notificación" y queda fuera de alcance de
 * este módulo-. Ver src/services/preferenciasApiService.ts para el
 * detalle de esta limitación desde el lado del cliente.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requirePortalToken } from './portal';
import { asyncHandler } from '../asyncHandler';

export const preferenciasRouter = Router();
preferenciasRouter.use(requirePortalToken as any);

const DEFAULTS = {
  push_web_habilitado: true,
  push_firebase_habilitado: false,
  alertas_whatsapp: true,
  alertas_correo: false,
  solo_alertas_criticas: false,
  consejos_salud_habilitado: true
};

preferenciasRouter.get('/', asyncHandler(async (req: any, res) => {
  const { idPaciente } = req.portalAuth;
  const { rows } = await pool.query(
    'SELECT * FROM preferencia_notificacion_paciente WHERE id_paciente = $1',
    [idPaciente]
  );
  if (rows.length === 0) {
    // Todavía no existe una fila real para este paciente (nunca las
    // personalizó): se devuelven los mismos valores por defecto que ya
    // tiene la columna en la migración, sin crear la fila (GET no debe
    // tener efectos secundarios).
    return res.json({ id_paciente: idPaciente, ...DEFAULTS, fecha_actualizacion: null });
  }
  return res.json(rows[0]);
}));

preferenciasRouter.put('/', asyncHandler(async (req: any, res) => {
  const { idPaciente } = req.portalAuth;
  const { webPushEnabled, firebasePushEnabled, whatsappAlerts, emailAlerts, criticalAlertsOnly, healthTipsEnabled } = req.body || {};

  // Upsert real en una sola instrucción: si la fila no existe, se inserta
  // usando el valor recibido o el default de la columna para cada campo
  // no enviado; si ya existe, COALESCE conserva el valor guardado para
  // cualquier campo que este PUT no incluya (comportamiento de PATCH
  // parcial, aunque el verbo sea PUT -igual convención que
  // guardarPlantillaRemota()/ON CONFLICT DO UPDATE en plantillas.ts-).
  const { rows } = await pool.query(
    `INSERT INTO preferencia_notificacion_paciente
       (id_paciente, push_web_habilitado, push_firebase_habilitado, alertas_whatsapp, alertas_correo, solo_alertas_criticas, consejos_salud_habilitado)
     VALUES ($1, COALESCE($2, TRUE), COALESCE($3, FALSE), COALESCE($4, TRUE), COALESCE($5, FALSE), COALESCE($6, FALSE), COALESCE($7, TRUE))
     ON CONFLICT (id_paciente) DO UPDATE SET
       push_web_habilitado = COALESCE($2, preferencia_notificacion_paciente.push_web_habilitado),
       push_firebase_habilitado = COALESCE($3, preferencia_notificacion_paciente.push_firebase_habilitado),
       alertas_whatsapp = COALESCE($4, preferencia_notificacion_paciente.alertas_whatsapp),
       alertas_correo = COALESCE($5, preferencia_notificacion_paciente.alertas_correo),
       solo_alertas_criticas = COALESCE($6, preferencia_notificacion_paciente.solo_alertas_criticas),
       consejos_salud_habilitado = COALESCE($7, preferencia_notificacion_paciente.consejos_salud_habilitado),
       fecha_actualizacion = NOW()
     RETURNING *`,
    [idPaciente, webPushEnabled, firebasePushEnabled, whatsappAlerts, emailAlerts, criticalAlertsOnly, healthTipsEnabled]
  );
  return res.json(rows[0]);
}));
