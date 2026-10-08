import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre "Personal / usuarios" (server/routes/personal.ts)
 * — quinto módulo de los 9 migrados desde localStorage. Mismo patrón de
 * dobles de prueba que carpetas.test.ts / episodios.test.ts.
 */

let currentStaffUser: any = { idUsuario: 3, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Directora Demo' };

vi.mock('../auth-staff', () => ({
  requireStaffAuth: (req: any, _res: any, next: any) => {
    req.staffUser = currentStaffUser;
    next();
  },
}));

const queryMock = vi.fn();
vi.mock('../db', () => ({
  pool: { query: (...args: any[]) => queryMock(...args) },
}));

async function buildApp() {
  const { personalRouter } = await import('./personal');
  const app = express();
  app.use(express.json());
  app.use('/api/personal', personalRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 3, roleId: 'director_laboratorio', status: 'activo', nombreCompleto: 'Directora Demo' };
});

describe('Toda la ruta requiere admin_usuarios_roles', () => {
  it('rechaza con 403 a un rol sin admin_usuarios_roles (ej. bioanalista) en cualquier verbo', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bioanalista Demo' };
    const app = await buildApp();
    const resGet = await request(app).get('/api/personal');
    expect(resGet.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('GET /api/personal', () => {
  it('lista el personal excluyendo la cuenta de sistema', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 2, rol: 'bioanalista' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/personal');
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).toContain("rol != 'sistema'");
  });
});

describe('POST /api/personal', () => {
  it('rechaza con 400 si faltan campos obligatorios', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/personal').send({ fullName: 'Nuevo' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('crea el usuario con estado=TRUE por defecto', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 10, nombre_completo: 'Nuevo Bioanalista', estado: true }] });
    const app = await buildApp();
    const res = await request(app).post('/api/personal').send({
      fullName: 'Nuevo Bioanalista', email: 'nuevo@vaclinic.test', roleId: 'bioanalista', phone: '5555-5555'
    });
    expect(res.status).toBe(201);
    expect(queryMock.mock.calls[0][0]).toContain('TRUE');
  });

  it('responde 409 si el correo o nombre de usuario ya existe (23505)', async () => {
    const errorDuplicado: any = new Error('duplicate key');
    errorDuplicado.code = '23505';
    queryMock.mockRejectedValueOnce(errorDuplicado);
    const app = await buildApp();
    const res = await request(app).post('/api/personal').send({ fullName: 'X', email: 'x@vaclinic.test', roleId: 'bioanalista' });
    expect(res.status).toBe(409);
  });

  it('responde 400 si el rol viola el CHECK constraint (23514)', async () => {
    const errorCheck: any = new Error('check violation');
    errorCheck.code = '23514';
    queryMock.mockRejectedValueOnce(errorCheck);
    const app = await buildApp();
    const res = await request(app).post('/api/personal').send({ fullName: 'X', email: 'x@vaclinic.test', roleId: 'rol_inventado' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/personal — contraseña temporal', () => {
  it('guarda solo el hash scrypt, fuerza el cambio y devuelve la contraseña temporal UNA vez', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 11, nombre_completo: 'Nueva Recepción', rol: 'recepcionista' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/personal').send({
      fullName: 'Nueva Recepción', email: 'recepcion@vaclinic.test', roleId: 'recepcionista'
    });
    expect(res.status).toBe(201);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(typeof res.body.contrasenaTemporal).toBe('string');
    expect(res.body.contrasenaTemporal.length).toBeGreaterThanOrEqual(12);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain('contrasena_hash');
    expect(sql).toContain('must_change_password');
    // El parámetro guardado es un hash "salt:hash", jamás la contraseña en claro.
    const guardado = params.find((p: any) => typeof p === 'string' && /^[0-9a-f]{32}:[0-9a-f]{128}$/.test(p));
    expect(guardado).toBeDefined();
    expect(params).not.toContain(res.body.contrasenaTemporal);
    const { verifyPassword } = await import('../password');
    expect(verifyPassword(res.body.contrasenaTemporal, guardado)).toBe(true);
  });

  it('acepta una contraseña inicial elegida por el administrador (mín. 8) y rechaza una corta', async () => {
    const app = await buildApp();
    const corta = await request(app).post('/api/personal').send({
      fullName: 'X', email: 'x@vaclinic.test', roleId: 'bioanalista', initialPassword: 'corta'
    });
    expect(corta.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();

    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 12, nombre_completo: 'X', rol: 'bioanalista' }] });
    const ok = await request(app).post('/api/personal').send({
      fullName: 'X', email: 'x@vaclinic.test', roleId: 'bioanalista', initialPassword: 'ClaveInicial9'
    });
    expect(ok.status).toBe(201);
    expect(ok.body.contrasenaTemporal).toBe('ClaveInicial9');
  });

  it('un director no puede crear una cuenta administrador_ti (403)', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/personal').send({
      fullName: 'Falso Admin', email: 'falso@vaclinic.test', roleId: 'administrador_ti'
    });
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('un administrador_ti sí puede crear otra cuenta administrador_ti', async () => {
    currentStaffUser = { idUsuario: 1, roleId: 'administrador_ti', status: 'activo', nombreCompleto: 'Admin' };
    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 13, nombre_completo: 'Otro Admin', rol: 'administrador_ti' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/personal').send({
      fullName: 'Otro Admin', email: 'otro@vaclinic.test', roleId: 'administrador_ti'
    });
    expect(res.status).toBe(201);
  });
});

describe('POST /api/personal/:id/restablecer-contrasena', () => {
  it('rechaza con 403 a un rol sin admin_usuarios_roles', async () => {
    currentStaffUser = { idUsuario: 2, roleId: 'bioanalista', status: 'activo', nombreCompleto: 'Bio' };
    const app = await buildApp();
    const res = await request(app).post('/api/personal/5/restablecer-contrasena').send({});
    expect(res.status).toBe(403);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rechaza restablecerse a uno mismo (400) y un id inválido', async () => {
    const app = await buildApp();
    const self = await request(app).post('/api/personal/3/restablecer-contrasena').send({});
    expect(self.status).toBe(400);
    const malo = await request(app).post('/api/personal/abc/restablecer-contrasena').send({});
    expect(malo.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('responde 404 si el usuario no existe y 403 con la cuenta interna del sistema', async () => {
    const app = await buildApp();
    queryMock.mockResolvedValueOnce({ rows: [] });
    expect((await request(app).post('/api/personal/99/restablecer-contrasena').send({})).status).toBe(404);
    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 7, nombre_completo: 'Sistema', rol: 'sistema' }] });
    expect((await request(app).post('/api/personal/7/restablecer-contrasena').send({})).status).toBe(403);
  });

  it('un director no puede restablecer a un administrador_ti (403, sin escalada de privilegios)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 1, nombre_completo: 'Admin', rol: 'administrador_ti' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/personal/1/restablecer-contrasena').send({});
    expect(res.status).toBe(403);
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it('emite una contraseña temporal, guarda solo el hash, fuerza el cambio y revoca las sesiones', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_usuario: 5, nombre_completo: 'Laboratorista', rol: 'bioanalista' }] })
      .mockResolvedValue({ rows: [], rowCount: 1 });
    const app = await buildApp();
    const res = await request(app).post('/api/personal/5/restablecer-contrasena').send({});
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.ok).toBe(true);
    expect(res.body.totpReiniciado).toBe(false);
    expect(res.body.contrasenaTemporal.length).toBeGreaterThanOrEqual(12);

    const sqls = queryMock.mock.calls.map(([sql]) => String(sql));
    const update = queryMock.mock.calls.find(([sql]) => String(sql).includes('contrasena_hash'))!;
    expect(String(update[0])).toContain('must_change_password = TRUE');
    expect(String(update[0])).not.toContain('totp_secret');
    expect(update[1]).not.toContain(res.body.contrasenaTemporal);
    expect(sqls.some((q) => q.includes('UPDATE sesion_personal SET revocado_en'))).toBe(true);
    // La bitácora nunca recibe la contraseña.
    const bitacora = queryMock.mock.calls.find(([sql]) => String(sql).includes('historial_auditoria'))!;
    expect(JSON.stringify(bitacora[1])).not.toContain(res.body.contrasenaTemporal);
  });

  it('con reiniciarTotp:true también desactiva el autenticador', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id_usuario: 5, nombre_completo: 'Lab', rol: 'bioanalista' }] })
      .mockResolvedValue({ rows: [], rowCount: 1 });
    const app = await buildApp();
    const res = await request(app).post('/api/personal/5/restablecer-contrasena').send({ reiniciarTotp: true });
    expect(res.status).toBe(200);
    expect(res.body.totpReiniciado).toBe(true);
    const update = queryMock.mock.calls.find(([sql]) => String(sql).includes('contrasena_hash'))!;
    expect(String(update[0])).toContain('totp_enabled = FALSE');
    expect(String(update[0])).toContain('totp_secret = NULL');
  });

  it('rechaza una contraseña elegida de menos de 8 caracteres', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/personal/5/restablecer-contrasena').send({ newPassword: 'corta' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/personal/:id/estado', () => {
  it('rechaza con 400 un estado desconocido', async () => {
    const app = await buildApp();
    const res = await request(app).patch('/api/personal/2/estado').send({ status: 'de_vacaciones_forzadas' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('guarda estado=FALSE para "suspendido" (colapsado, igual que el login real)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 2, estado: false }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/personal/2/estado').send({ status: 'suspendido' });
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][1]).toEqual([false, 2]);
    expect(res.body.status_solicitado).toBe('suspendido');
  });

  it('responde 404 si el usuario no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/personal/999/estado').send({ status: 'activo' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/personal/:id/pin', () => {
  it('rechaza con 400 un PIN no numérico', async () => {
    const app = await buildApp();
    const res = await request(app).patch('/api/personal/2/pin').send({ pinCode: 'abcd' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('actualiza el PIN', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_usuario: 2, pin_code: '4321' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/personal/2/pin').send({ pinCode: '4321' });
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/personal/:id', () => {
  it('rechaza con 400 que el usuario se elimine a sí mismo', async () => {
    const app = await buildApp();
    const res = await request(app).delete('/api/personal/3'); // currentStaffUser.idUsuario === 3
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('elimina a otro usuario', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });
    const app = await buildApp();
    const res = await request(app).delete('/api/personal/2');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('responde 409 si el usuario tiene historial de auditoría asociado (23503)', async () => {
    const errorFk: any = new Error('foreign key violation');
    errorFk.code = '23503';
    queryMock.mockRejectedValueOnce(errorFk);
    const app = await buildApp();
    const res = await request(app).delete('/api/personal/2');
    expect(res.status).toBe(409);
  });

  it('responde 404 si el usuario no existe', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0 });
    const app = await buildApp();
    const res = await request(app).delete('/api/personal/999');
    expect(res.status).toBe(404);
  });
});

describe('El PIN obsoleto nunca se devuelve', () => {
  it('ninguna consulta de lectura/escritura selecciona pin_code', async () => {
    queryMock.mockResolvedValue({ rows: [] });
    const app = await buildApp();
    await request(app).get('/api/personal');
    await request(app).patch('/api/personal/2/pin').send({ pinCode: '4321' });
    for (const [sql] of queryMock.mock.calls) {
      const returning = String(sql).split('RETURNING')[1] ?? String(sql).split('FROM usuario')[0];
      expect(returning).not.toMatch(/pin_code/);
    }
  });
});
