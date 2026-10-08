/**
 * Conversión de los mensajes reales del chat (tabla `mensaje_chat`) al modelo
 * que usa la pantalla (LabChatMessage), y mezcla con los que ya están en el
 * navegador. Los ids numéricos del servidor se traducen a los ids locales del
 * personal para que la pantalla reconozca "mis" mensajes.
 */
import type { LabChatMessage, LabStaffUser, ChatMessagePriority } from '../types';
import type { MensajeChatApiRow } from '../services/chatApiService';

type EpisodioMin = { id: string; remoteId?: number };

const PRIORIDADES: ChatMessagePriority[] = ['normal', 'urgente', 'panico'];

export function idLocalDeUsuario(
  idRemoto: number,
  personal: Pick<LabStaffUser, 'id' | 'remoteId'>[],
  actual?: Pick<LabStaffUser, 'id' | 'remoteId'> | null
): string {
  if (actual && actual.remoteId === idRemoto) return actual.id;
  return personal.find((u) => u.remoteId === idRemoto)?.id ?? `usr-remote-${idRemoto}`;
}

export function mapMensajeRemoto(
  fila: MensajeChatApiRow,
  personal: Pick<LabStaffUser, 'id' | 'remoteId'>[],
  episodios: EpisodioMin[],
  actual?: Pick<LabStaffUser, 'id' | 'remoteId'> | null
): LabChatMessage {
  const aLocal = (n: number) => idLocalDeUsuario(n, personal, actual);
  const prioridad = PRIORIDADES.includes(fila.prioridad as ChatMessagePriority) ? (fila.prioridad as ChatMessagePriority) : 'normal';
  const destinatarioLocal = fila.id_destinatario != null ? aLocal(fila.id_destinatario) : undefined;
  return {
    id: `msg-remote-${fila.id_mensaje}`,
    remoteId: fila.id_mensaje,
    // En una conversación directa el canal se rearma con el id local del destinatario.
    channelId: destinatarioLocal ? `dm_${destinatarioLocal}` : fila.id_canal,
    senderId: aLocal(fila.id_emisor),
    senderName: fila.nombre_emisor,
    senderRole: fila.rol_emisor,
    recipientId: destinatarioLocal,
    recipientName: fila.nombre_destinatario || undefined,
    timestamp: new Date(fila.fecha).toISOString(),
    content: fila.contenido,
    priority: prioridad,
    referenceEpisodeId: fila.id_episodio_referencia != null ? episodios.find((e) => e.remoteId === fila.id_episodio_referencia)?.id : undefined,
    referenceEpisodeNumber: fila.numero_episodio_referencia || undefined,
    referencePatientName: fila.nombre_paciente_referencia || undefined,
    readBy: (fila.leido_por || []).map(aLocal),
    reactions: (fila.reacciones || []).map((r) => ({ emoji: r.emoji, count: r.count, users: (r.users || []).map(aLocal) }))
  };
}

/** Los mensajes del servidor mandan; los locales sin remoteId (pendientes) se conservan. */
export function combinarMensajesRemotos(locales: LabChatMessage[], remotos: LabChatMessage[]): LabChatMessage[] {
  const idsRemotos = new Set(remotos.map((m) => m.remoteId));
  const soloLocales = locales.filter((m) => m.remoteId == null || !idsRemotos.has(m.remoteId));
  return [...soloLocales, ...remotos].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}
