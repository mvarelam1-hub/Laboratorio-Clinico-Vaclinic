/**
 * Helper interno para registrar eventos administrativos en la bitácora
 * REAL (`historial_auditoria`, migración 0001) — la misma tabla que ya
 * usaba `trg_auditoria_resultado` para auditar cambios de resultado, ahora
 * también para acciones de administración (personal, roles, catálogo,
 * episodios, etc.), vía las columnas `modulo`/`severidad` agregadas en la
 * migración 0011. Equivalente real de `logAuditEvent()` en ClinicContext.tsx.
 *
 * Deliberadamente NO se expone como ruta pública: solo el propio backend
 * llama a esto como efecto secundario de una acción real ya autorizada
 * (ej. crear personal), para que nadie pueda fabricar entradas de bitácora
 * llamando a un endpoint directamente.
 */
import { pool } from './db';

export type BitacoraModulo =
  | 'usuarios'
  | 'reportes'
  | 'control_calidad'
  | 'catalogo'
  | 'episodios'
  | 'autenticacion'
  | 'seguridad';

export type BitacoraSeveridad = 'info' | 'warning' | 'critical';

export async function registrarBitacora(params: {
  idUsuario: number;
  accion: string;
  modulo: BitacoraModulo;
  detalles?: string;
  severidad?: BitacoraSeveridad;
  valorAnterior?: string;
  valorNuevo?: string;
}): Promise<void> {
  const { idUsuario, accion, modulo, detalles, severidad = 'info', valorAnterior, valorNuevo } = params;
  await pool.query(
    `INSERT INTO historial_auditoria
       (id_usuario, accion, modulo, severidad, motivo_cambio, valor_anterior, valor_nuevo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [idUsuario, accion, modulo, severidad, detalles || null, valorAnterior || null, valorNuevo || null]
  );
}
