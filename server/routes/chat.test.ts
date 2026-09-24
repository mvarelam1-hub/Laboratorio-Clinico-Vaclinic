import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre "Chat interno" (server/routes/chat.ts) — octavo
 * módulo de los 9 migrados desde localStorage. No hay requirePermission
 * (cualquier personal autenticado puede usar el chat), pero SÍ hay una
 * regla de seguridad central a verificar en cada endpoint: el emisor/
 * lector/quien-reacciona/quien-borra SIEMPRE es req.staffUser.idUsuario,
 * nunca un valor que venga en el cuerpo de la petición.
 *
 * POST /:id/reacciones usa una transacción real con SELECT ... FOR UPDATE
 * (pool.connect()), así que el doble de `../db` expone `connect()` igual
 * que en roles.test.ts / reactivos.test.ts.
 */

let currentStaffUser: any = { idUsuario: 3, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Directora Demo' };

vi.mock('../auth-firebase', () => ({
  requireStaffAuth: (req: any, _res: any, next: any) => {
    req.staffUser = currentStaffUser;
    next();
  },
}));

const queryMock = vi.fn();
const clientQueryMock = vi.fn();
const clientReleaseMock = vi.fn();
vi.mock('../db', () => ({
  pool: {
    query: (...args: any[]) => queryMock(...args),
    connect: async () => ({ query: (...args: any[]) => clientQueryMock(...args), release: clientReleaseMock }),
  },
}));

async function buildApp() {
  const { chatRouter } = await import('./chat');
  const app = express();
  app.use(express.json());
  app.use('/api/chat', chatRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  clientQueryMock.mockReset();
  clientReleaseMock.mockReset();
  currentStaffUser = { idUsuario: 3, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Directora Demo' };
});

describe('GET /api/chat', () => {
  it('lista mensajes con joins a usuario/episodio/paciente, sin exigir permiso extra', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_mensaje: 1, nombre_emisor: 'Directora Demo' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/chat');
    expect(res.status).toBe(200);
    expect(res.body[0].nombre_emisor).toBe('Directora Demo');
    expect(queryMock.mock.calls[0][0]).toContain('ORDER BY m.fecha ASC');
  });
});

describe('POST /api/chat', () => {
  it('rechaza con 400 si falta channelId', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/chat').send({ content: 'hola' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rechaza con 400 si falta content', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/chat').send({ channelId: 'general' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('crea el mensaje usando SIEMPRE req.staffUser.idUsuario como emisor, ignorando cualquier senderId del cuerpo', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_mensaje: 42 }] }) // INSERT
      .mockResolvedValueOnce({ rows: [{ id_mensaje: 42, nombre_emisor: 'Directora Demo' }] }); // SELECT completo
    const app = await buildApp();
    const res = await request(app).post('/api/chat').send({
      channelId: 'general', content: 'Hola equipo', priority: 'normal',
      senderId: 999, // intento de suplantación: debe ser ignorado por completo
    });
    expect(res.status).toBe(201);
    const insertArgs = queryMock.mock.calls[0][1];
    expect(insertArgs[1]).toBe(3); // req.staffUser.idUsuario, no 999
    expect(res.body.id_mensaje).toBe(42);
  });

  it('usa priority "normal" si el valor recibido no es válido', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_mensaje: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id_mensaje: 1 }] });
    const app = await buildApp();
    await request(app).post('/api/chat').send({ channelId: 'general', content: 'x', priority: 'inventado' });
    const insertArgs = queryMock.mock.calls[0][1];
    expect(insertArgs[4]).toBe('normal');
  });

  it('acepta priority "panico" cuando es válida', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_mensaje: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id_mensaje: 2 }] });
    const app = await buildApp();
    await request(app).post('/api/chat').send({ channelId: 'urgencias', content: 'STAT', priority: 'panico' });
    const insertArgs = queryMock.mock.calls[0][1];
    expect(insertArgs[4]).toBe('panico');
  });
});

describe('PATCH /api/chat/canales/:channelId/leido', () => {
  it('marca como leído por el usuario autenticado en ese canal', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 3 });
    const app = await buildApp();
    const res = await request(app).patch('/api/chat/canales/general/leido');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, actualizados: 3 });
    expect(queryMock.mock.calls[0][1]).toEqual([3, 'general']);
  });
});

describe('POST /api/chat/:id/reacciones', () => {
  it('rechaza con 400 si falta emoji', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/chat/1/reacciones').send({});
    expect(res.status).toBe(400);
    expect(clientQueryMock).not.toHaveBeenCalled();
  });

  it('agrega una reacción nueva si el usuario no había reaccionado con ese emoji', async () => {
    clientQueryMock
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ reacciones: [] }] }) // SELECT FOR UPDATE
      .mockResolvedValueOnce({ rows: [{ id_mensaje: 1, reacciones: [{ emoji: '👍', count: 1, users: [3] }] }] }) // UPDATE
      .mockResolvedValueOnce({}); // COMMIT
    const app = await buildApp();
    const res = await request(app).post('/api/chat/1/reacciones').send({ emoji: '👍' });
    expect(res.status).toBe(200);
    expect(res.body.reacciones).toEqual([{ emoji: '👍', count: 1, users: [3] }]);
    expect(clientReleaseMock).toHaveBeenCalled();
  });

  it('quita la reacción (toggle) si el usuario ya había reaccionado con ese emoji', async () => {
    clientQueryMock
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ reacciones: [{ emoji: '👍', count: 1, users: [3] }] }] }) // SELECT FOR UPDATE
      .mockResolvedValueOnce({ rows: [{ id_mensaje: 1, reacciones: [] }] }) // UPDATE
      .mockResolvedValueOnce({}); // COMMIT
    const app = await buildApp();
    const res = await request(app).post('/api/chat/1/reacciones').send({ emoji: '👍' });
    expect(res.status).toBe(200);
    expect(res.body.reacciones).toEqual([]);
  });

  it('responde 404 dentro de la transacción si el mensaje no existe (y hace ROLLBACK)', async () => {
    clientQueryMock
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }); // SELECT FOR UPDATE vacío
    const app = await buildApp();
    const res = await request(app).post('/api/chat/999/reacciones').send({ emoji: '👍' });
    expect(res.status).toBe(404);
    expect(clientQueryMock.mock.calls.map((c) => c[0])).toContain('ROLLBACK');
    expect(clientReleaseMock).toHaveBeenCalled();
  });
});

describe('DELETE /api/chat/:id', () => {
  it('responde 404 si el mensaje no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).delete('/api/chat/999');
    expect(res.status).toBe(404);
  });

  it('responde 403 si el usuario autenticado no es el emisor del mensaje', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_emisor: 99 }] });
    const app = await buildApp();
    const res = await request(app).delete('/api/chat/1');
    expect(res.status).toBe(403);
  });

  it('elimina el mensaje si el usuario autenticado es el propio emisor', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_emisor: 3 }] })
      .mockResolvedValueOnce({ rowCount: 1 });
    const app = await buildApp();
    const res = await request(app).delete('/api/chat/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('DELETE /api/chat/canales/:channelId', () => {
  it('limpia el historial completo del canal, sin restricción de emisor', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 7 });
    const app = await buildApp();
    const res = await request(app).delete('/api/chat/canales/general');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, eliminados: 7 });
  });
});
