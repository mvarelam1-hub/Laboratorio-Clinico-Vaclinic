import { describe, it, expect } from 'vitest';
import { mapMensajeRemoto, combinarMensajesRemotos } from './chatRemoto';

const fila: any = {
  id_mensaje: 7, id_canal: 'dm_x', id_emisor: 3, nombre_emisor: 'Ana', rol_emisor: 'recepcionista',
  id_destinatario: 5, nombre_destinatario: 'Luis', contenido: 'Hola', prioridad: 'urgente', fecha: '2026-10-04T10:00:00Z',
  id_episodio_referencia: null, numero_episodio_referencia: null, nombre_paciente_referencia: null,
  leido_por: [3], reacciones: [{ emoji: '👍', count: 1, users: [5] }]
};

describe('chatRemoto', () => {
  const personal = [{ id: 'usr-remote-3', remoteId: 3 }, { id: 'usr-remote-5', remoteId: 5 }];
  it('traduce ids del servidor a ids locales', () => {
    const m = mapMensajeRemoto(fila, personal, []);
    expect(m.senderId).toBe('usr-remote-3');
    expect(m.recipientId).toBe('usr-remote-5');
    expect(m.channelId).toBe('dm_usr-remote-5');
    expect(m.readBy).toEqual(['usr-remote-3']);
    expect(m.reactions?.[0].users).toEqual(['usr-remote-5']);
    expect(m.priority).toBe('urgente');
  });
  it('reconoce al usuario actual aunque su id local sea otro', () => {
    const m = mapMensajeRemoto(fila, [], [], { id: 'usr-3', remoteId: 3 });
    expect(m.senderId).toBe('usr-3');
  });
  it('prioridad desconocida pasa a normal', () => {
    expect(mapMensajeRemoto({ ...fila, prioridad: 'x' }, personal, []).priority).toBe('normal');
  });
  it('combina: conserva locales sin remoteId y reemplaza duplicados', () => {
    const remoto = mapMensajeRemoto(fila, personal, []);
    const local: any = { id: 'msg-1', timestamp: '2026-10-04T09:00:00.000Z', content: 'pendiente' };
    const viejo: any = { ...remoto, content: 'viejo' };
    const r = combinarMensajesRemotos([local, viejo], [remoto]);
    expect(r.map((m) => m.id)).toEqual(['msg-1', 'msg-remote-7']);
    expect(r[1].content).toBe('Hola');
  });
});
