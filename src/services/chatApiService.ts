/**
 * Cliente HTTP para el chat interno (server/routes/chat.ts) — octavo
 * módulo de los 9 migrados desde localStorage (ver
 * db/migrations/0011_modulos_restantes.sql, tabla `mensaje_chat`).
 *
 * IMPORTANTE: el backend siempre usa la identidad real autenticada
 * (req.staffUser.idUsuario) como emisor/lector/quien reacciona/quien
 * borra — nunca un id que este cliente envíe en el cuerpo. Por eso estas
 * funciones no aceptan ni envían un "senderId": no tendría ningún efecto
 * y sería engañoso simularlo aquí.
 */
import { getFirebaseAuth } from './firebaseConfig';

export class ChatApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ChatApiError';
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new ChatApiError('No hay una sesión de personal activa (Firebase) para llamar a la API.');
  }
  const idToken = await user.getIdToken();
  return fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}`, ...(options.headers || {}) }
  });
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

export interface MensajeChatApiRow {
  id_mensaje: number;
  id_canal: string;
  id_emisor: number;
  nombre_emisor: string;
  rol_emisor: string;
  id_destinatario: number | null;
  nombre_destinatario: string | null;
  contenido: string;
  prioridad: string;
  fecha: string;
  id_episodio_referencia: number | null;
  numero_episodio_referencia: string | null;
  nombre_paciente_referencia: string | null;
  leido_por: number[];
  reacciones: { emoji: string; count: number; users: number[] }[] | null;
  [key: string]: unknown;
}

export interface EnviarMensajeInput {
  channelId: string;
  recipientId?: number;
  content: string;
  priority: string;
  referenceEpisodeId?: number;
}

export async function enviarMensajeRemoto(input: EnviarMensajeInput): Promise<MensajeChatApiRow> {
  const res = await authFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      channelId: input.channelId,
      recipientId: input.recipientId,
      content: input.content,
      priority: input.priority,
      referenceEpisodeId: input.referenceEpisodeId
    })
  });
  if (!res.ok) throw new ChatApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function marcarCanalLeidoRemoto(channelId: string): Promise<{ ok: true; actualizados: number }> {
  const res = await authFetch(`/api/chat/canales/${encodeURIComponent(channelId)}/leido`, { method: 'PATCH' });
  if (!res.ok) throw new ChatApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function toggleReaccionRemota(idMensaje: number, emoji: string): Promise<{ id_mensaje: number; reacciones: { emoji: string; count: number; users: number[] }[] }> {
  const res = await authFetch(`/api/chat/${idMensaje}/reacciones`, { method: 'POST', body: JSON.stringify({ emoji }) });
  if (!res.ok) throw new ChatApiError(await parseErrorBody(res), res.status);
  return res.json();
}

export async function eliminarMensajeRemoto(idMensaje: number): Promise<void> {
  const res = await authFetch(`/api/chat/${idMensaje}`, { method: 'DELETE' });
  if (!res.ok) throw new ChatApiError(await parseErrorBody(res), res.status);
}

export async function limpiarHistorialCanalRemoto(channelId: string): Promise<{ ok: true; eliminados: number }> {
  const res = await authFetch(`/api/chat/canales/${encodeURIComponent(channelId)}`, { method: 'DELETE' });
  if (!res.ok) throw new ChatApiError(await parseErrorBody(res), res.status);
  return res.json();
}
