/**
 * Chat interno (LabChatMessage) — octavo módulo de los 9 migrados desde
 * localStorage (ver ClinicContext.tsx sendChatMessage/
 * markChatMessagesAsRead/addChatReaction/deleteChatMessage/
 * clearChatChannelHistory). Migración real:
 * db/migrations/0011_modulos_restantes.sql (tabla `mensaje_chat`).
 *
 * NOTA DE ALCANCE IMPORTANTE: el frontend tiene un concepto de
 * "currentStaffUser" que es una identidad LOCAL simulada (selector de
 * personaje de demostración, no pasa por Firebase — ver el comentario de
 * ClinicContext.tsx sobre biometría/PIN) y puede no coincidir con la
 * identidad real autenticada de esta petición HTTP (req.staffUser, la
 * que valida el token de Firebase). Por seguridad, igual que ya hacían
 * bitacora.ts/reactivos.ts con `id_operador`, este módulo SIEMPRE usa
 * req.staffUser.idUsuario como emisor/lector/quien reacciona real -
 * nunca un id que venga en el cuerpo de la petición- así que un usuario
 * autenticado no puede hacerse pasar por otro en el historial real,
 * aunque la UI esté "actuando" como otro personaje de demostración.
 *
 * No existe ningún permiso dedicado a "chat" en LAB_PERMISSIONS_CATALOG
 * (es una herramienta de comunicación interna, no un módulo clínico con
 * control de acceso propio), y el frontend tampoco lo restringe hoy —
 * por eso solo se exige requireStaffAuth (cualquier personal activo),
 * sin requirePermission.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { asyncHandler } from '../asyncHandler';

export const chatRouter = Router();
chatRouter.use(requireStaffAuth);

const PRIORIDADES_VALIDAS = ['normal', 'urgente', 'panico'];

const SELECT_MENSAJES = `
  SELECT m.*,
         ue.nombre_completo AS nombre_emisor, ue.rol AS rol_emisor,
         ud.nombre_completo AS nombre_destinatario,
         ep.numero_episodio AS numero_episodio_referencia,
         p.nombre_completo AS nombre_paciente_referencia
  FROM mensaje_chat m
  JOIN usuario ue ON ue.id_usuario = m.id_emisor
  LEFT JOIN usuario ud ON ud.id_usuario = m.id_destinatario
  LEFT JOIN episodio_4d ep ON ep.id_episodio = m.id_episodio_referencia
  LEFT JOIN paciente p ON p.id_paciente = ep.id_paciente
`;

chatRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(`${SELECT_MENSAJES} ORDER BY m.fecha ASC`);
  return res.json(rows);
}));

chatRouter.post('/', asyncHandler(async (req, res) => {
  const { channelId, recipientId, content, priority, referenceEpisodeId } = req.body || {};

  if (!channelId || !String(channelId).trim()) {
    return res.status(400).json({ error: 'channelId es obligatorio.' });
  }
  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: 'content es obligatorio.' });
  }
  const prioridadFinal = PRIORIDADES_VALIDAS.includes(priority) ? priority : 'normal';

  const { rows } = await pool.query(
    `INSERT INTO mensaje_chat (id_canal, id_emisor, id_destinatario, contenido, prioridad, id_episodio_referencia, leido_por)
     VALUES ($1, $2, $3, $4, $5, $6, ARRAY[$2]::int[])
     RETURNING id_mensaje`,
    [String(channelId).trim(), req.staffUser!.idUsuario, recipientId ? Number(recipientId) : null,
     String(content).trim(), prioridadFinal, referenceEpisodeId ? Number(referenceEpisodeId) : null]
  );

  const { rows: completo } = await pool.query(`${SELECT_MENSAJES} WHERE m.id_mensaje = $1`, [rows[0].id_mensaje]);
  return res.status(201).json(completo[0]);
}));

// Simplificación deliberada frente al heurístico local (que también
// intentaba emparejar por senderId/recipientId): todo mensaje real ya se
// escribe con un id_canal único y correcto (los mensajes directos usan
// "dm_<idLocal>"), así que marcar por id_canal es suficiente y más
// simple que la lógica original de markChatMessagesAsRead().
chatRouter.patch('/canales/:channelId/leido', asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    `UPDATE mensaje_chat
     SET leido_por = array_append(leido_por, $1)
     WHERE id_canal = $2 AND NOT ($1 = ANY(leido_por))`,
    [req.staffUser!.idUsuario, req.params.channelId]
  );
  return res.json({ ok: true, actualizados: rowCount });
}));

chatRouter.post('/:id/reacciones', asyncHandler(async (req, res) => {
  const idMensaje = Number(req.params.id);
  const { emoji } = req.body || {};
  if (!emoji || !String(emoji).trim()) {
    return res.status(400).json({ error: 'emoji es obligatorio.' });
  }
  const idUsuario = req.staffUser!.idUsuario;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT reacciones FROM mensaje_chat WHERE id_mensaje = $1 FOR UPDATE', [idMensaje]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Mensaje no encontrado.' });
    }

    // Misma lógica de toggle que ya usaba addChatReaction() en el frontend.
    const actuales: Array<{ emoji: string; count: number; users: number[] }> = rows[0].reacciones || [];
    const existente = actuales.find((r) => r.emoji === emoji);
    let nuevas: Array<{ emoji: string; count: number; users: number[] }>;
    if (existente) {
      if (existente.users.includes(idUsuario)) {
        const usuariosFiltrados = existente.users.filter((u) => u !== idUsuario);
        nuevas = usuariosFiltrados.length === 0
          ? actuales.filter((r) => r.emoji !== emoji)
          : actuales.map((r) => (r.emoji === emoji ? { ...r, count: usuariosFiltrados.length, users: usuariosFiltrados } : r));
      } else {
        nuevas = actuales.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, idUsuario] } : r));
      }
    } else {
      nuevas = [...actuales, { emoji, count: 1, users: [idUsuario] }];
    }

    const { rows: actualizado } = await client.query(
      'UPDATE mensaje_chat SET reacciones = $1 WHERE id_mensaje = $2 RETURNING id_mensaje, reacciones',
      [JSON.stringify(nuevas), idMensaje]
    );
    await client.query('COMMIT');
    return res.json(actualizado[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// Solo el propio emisor puede borrar su mensaje -restricción real que la
// versión local no tenía (cualquiera podía borrar cualquier mensaje de
// cualquiera), agregada aquí a propósito porque una vez el chat es una
// tabla compartida real, borrar el mensaje de otra persona es un
// problema de integridad real y no solo una curiosidad de localStorage.
chatRouter.delete('/:id', asyncHandler(async (req, res) => {
  const idMensaje = Number(req.params.id);
  const { rows } = await pool.query('SELECT id_emisor FROM mensaje_chat WHERE id_mensaje = $1', [idMensaje]);
  if (rows.length === 0) return res.status(404).json({ error: 'Mensaje no encontrado.' });
  if (rows[0].id_emisor !== req.staffUser!.idUsuario) {
    return res.status(403).json({ error: 'Solo puedes eliminar tus propios mensajes.' });
  }
  await pool.query('DELETE FROM mensaje_chat WHERE id_mensaje = $1', [idMensaje]);
  return res.json({ ok: true });
}));

// A diferencia de DELETE /:id, este SÍ replica el alcance sin
// restricciones que ya tenía clearChatChannelHistory() en localStorage
// (cualquier personal puede limpiar un canal completo). Se documenta
// honestamente: antes solo borraba la copia local de ese navegador; en
// Postgres real borra el historial compartido de TODO el equipo para
// ese canal -un riesgo real que no existía antes de esta migración y
// que amerita una política de acceso dedicada más adelante-.
chatRouter.delete('/canales/:channelId', asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM mensaje_chat WHERE id_canal = $1', [req.params.channelId]);
  return res.json({ ok: true, eliminados: rowCount });
}));
