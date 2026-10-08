import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

/**
 * Pruebas unitarias sobre el módulo "Gestión de pacientes" (server/routes/pacientes.ts).
 * Cubre las rutas agregadas para conectar el frontend real a la API (listado,
 * detalle y actualización), además de la creación ya existente.
 *
 * Dobles de prueba: se sustituyen `pool` (PostgreSQL real) y `requireStaffAuth`
 * (Firebase Admin) por versiones controladas, igual que en ordenes.test.ts.
 */

let currentStaffUser: any = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };

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
  const { pacientesRouter } = await import('./pacientes');
  const app = express();
  app.use(express.json());
  app.use('/api/pacientes', pacientesRouter);
  return app;
}

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  currentStaffUser = { idUsuario: 1, roleId: 'recepcionista', status: 'activo', nombreCompleto: 'Recepcionista Demo' };
});

const PACIENTE_ADULTO = {
  nombreCompleto: 'Ana López',
  genero: 'F',
  fechaNacimiento: '1990-01-01',
  telefonoWhatsApp: '50212345678',
};

describe('edadEnAnios', () => {
  const hoy = new Date(Date.UTC(2026, 9, 4));
  it('calcula años cumplidos antes y después del cumpleaños', async () => {
    const { edadEnAnios } = await import('./pacientes');
    expect(edadEnAnios('2000-10-04', hoy)).toBe(26);
    expect(edadEnAnios('2000-10-05', hoy)).toBe(25);
    expect(edadEnAnios('2026-10-04', hoy)).toBe(0);
  });
  it('rechaza fechas inválidas, futuras o de más de 120 años', async () => {
    const { edadEnAnios } = await import('./pacientes');
    expect(edadEnAnios('', hoy)).toBeNull();
    expect(edadEnAnios(undefined, hoy)).toBeNull();
    expect(edadEnAnios('2026-02-31', hoy)).toBeNull();
    expect(edadEnAnios('2027-01-01', hoy)).toBeNull();
    expect(edadEnAnios('1890-01-01', hoy)).toBeNull();
  });
});

describe('POST /api/pacientes (creación)', () => {
  it('rechaza con 400 si faltan campos obligatorios', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/pacientes').send({ nombreCompleto: 'Ana' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('crea el paciente con todos los campos, incluidos correo y dirección', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id_paciente: 9, nombre_completo: 'Ana López', correo: 'ana@correo.com', direccion: 'Zona 10' }],
    });
    const app = await buildApp();
    const res = await request(app).post('/api/pacientes').send({
      ...PACIENTE_ADULTO,
      correo: 'ana@correo.com',
      direccion: 'Zona 10',
    });
    expect(res.status).toBe(201);
    expect(res.body.id_paciente).toBe(9);
    expect(queryMock.mock.calls[0][0]).toMatch(/correo, direccion/);
    expect(queryMock.mock.calls[0][1]).toContain('ana@correo.com');
    expect(queryMock.mock.calls[0][1]).toContain('Zona 10');
  });

  it('exige el sexo: no acepta vacío ni valores fuera de M/F/Otro', async () => {
    const app = await buildApp();
    for (const genero of [undefined, '', 'X']) {
      const res = await request(app).post('/api/pacientes').send({ ...PACIENTE_ADULTO, genero });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/sexo/i);
    }
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('rechaza fecha de nacimiento ausente, futura o imposible', async () => {
    const app = await buildApp();
    for (const fechaNacimiento of [undefined, '2999-01-01', '2020-02-31']) {
      const res = await request(app).post('/api/pacientes').send({ ...PACIENTE_ADULTO, fechaNacimiento });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/fecha de nacimiento/i);
    }
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('exige teléfono o correo (al menos uno)', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/pacientes').send({ ...PACIENTE_ADULTO, telefonoWhatsApp: '  ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/contacto/i);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('acepta solo correo (sin teléfono) y guarda el teléfono como NULL', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 10 }] });
    const app = await buildApp();
    const res = await request(app).post('/api/pacientes').send({
      ...PACIENTE_ADULTO, telefonoWhatsApp: '', correo: 'ana@correo.com',
    });
    expect(res.status).toBe(201);
    const params = queryMock.mock.calls[0][1];
    expect(params[4]).toBeNull();
    expect(params[5]).toBe('ana@correo.com');
  });

  it('rechaza un correo con formato inválido', async () => {
    const app = await buildApp();
    const res = await request(app).post('/api/pacientes').send({ ...PACIENTE_ADULTO, correo: 'no-es-correo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/correo/i);
  });

  it('un menor de edad sin encargado legal se rechaza (MENOR_REQUIERE_ENCARGADO)', async () => {
    const anio = new Date().getUTCFullYear() - 5;
    const app = await buildApp();
    const res = await request(app).post('/api/pacientes').send({
      ...PACIENTE_ADULTO, fechaNacimiento: `${anio}-06-15`,
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MENOR_REQUIERE_ENCARGADO');
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('un menor con encargado se guarda marcado como menor (lo decide el servidor)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 11 }] });
    const anio = new Date().getUTCFullYear() - 5;
    const app = await buildApp();
    const res = await request(app).post('/api/pacientes').send({
      ...PACIENTE_ADULTO, fechaNacimiento: `${anio}-06-15`,
      nombreEncargadoLegal: 'Marta López', telefonoEncargadoLegal: '50255550000',
      esMenorEdad: false, // el cliente no manda: se ignora
    });
    expect(res.status).toBe(201);
    const params = queryMock.mock.calls[0][1];
    expect(params[7]).toBe(true);
    expect(params[8]).toBe('Marta López');
    expect(params[9]).toBe('50255550000');
  });

  it('un adulto se guarda con es_menor_edad = false', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 12 }] });
    const app = await buildApp();
    await request(app).post('/api/pacientes').send(PACIENTE_ADULTO);
    expect(queryMock.mock.calls[0][1][7]).toBe(false);
  });

  it('guarda la marca de fecha de nacimiento estimada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 13 }] });
    const app = await buildApp();
    await request(app).post('/api/pacientes').send({ ...PACIENTE_ADULTO, fechaNacimientoEstimada: true });
    expect(queryMock.mock.calls[0][1][10]).toBe(true);
  });

  it('responde 409 DNI_DUPLICADO con el paciente existente, sin insertar', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 3, nombre_completo: 'Otra Persona' }] });
    const app = await buildApp();
    const res = await request(app).post('/api/pacientes').send({ ...PACIENTE_ADULTO, dni: '1234567890101' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DNI_DUPLICADO');
    expect(res.body.paciente.id_paciente).toBe(3);
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it('traduce el CHECK de contacto de la base a un mensaje entendible', async () => {
    queryMock.mockRejectedValueOnce(Object.assign(new Error('new row violates check constraint'), { constraint: 'chk_paciente_contacto' }));
    const app = await buildApp();
    const res = await request(app).post('/api/pacientes').send(PACIENTE_ADULTO);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/teléfono o correo/);
  });

  it('rechaza con 403 a un rol sin admision_pacientes', async () => {
    currentStaffUser.roleId = 'administrador_ti';
    const app = await buildApp();
    const res = await request(app).post('/api/pacientes').send(PACIENTE_ADULTO);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/pacientes (listado y búsqueda)', () => {
  it('lista pacientes recientes cuando no se envía ?buscar', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 1, nombre_completo: 'María López' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/pacientes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(queryMock.mock.calls[0][0]).not.toMatch(/ILIKE/);
  });

  it('filtra con ILIKE por nombre o DNI cuando se envía ?buscar', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    await request(app).get('/api/pacientes?buscar=lopez');
    expect(queryMock.mock.calls[0][0]).toMatch(/ILIKE/);
    expect(queryMock.mock.calls[0][1][0]).toBe('%lopez%');
  });

  it('rechaza con 403 a un rol sin admision_pacientes', async () => {
    // NOTA: 'tecnico_flebotomista' SÍ tiene 'admision_pacientes' en
    // src/shared/permissions.ts (necesita ver datos del paciente al tomar
    // la muestra), así que no sirve para este caso de prueba -habría
    // pasado el middleware y fallado más adelante contra el mock de la
    // base de datos con un 500, no un 403-. 'administrador_ti' es un rol
    // real que efectivamente no tiene ese permiso.
    currentStaffUser.roleId = 'administrador_ti';
    const app = await buildApp();
    const res = await request(app).get('/api/pacientes');
    expect(res.status).toBe(403);
  });
});

describe('GET /api/pacientes/:id', () => {
  it('devuelve 404 si el paciente no existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).get('/api/pacientes/999');
    expect(res.status).toBe(404);
  });

  it('devuelve el paciente cuando existe', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 5, nombre_completo: 'Carlos Pérez' }] });
    const app = await buildApp();
    const res = await request(app).get('/api/pacientes/5');
    expect(res.status).toBe(200);
    expect(res.body.nombre_completo).toBe('Carlos Pérez');
  });
});

describe('PATCH /api/pacientes/:id', () => {
  it('rechaza con 400 si no se envía ningún campo válido', async () => {
    const app = await buildApp();
    const res = await request(app).patch('/api/pacientes/5').send({ campoInventado: 'x' });
    expect(res.status).toBe(400);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('actualiza solo los campos permitidos enviados', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 5, telefono_whatsapp: '50212345678' }] });
    const app = await buildApp();
    const res = await request(app).patch('/api/pacientes/5').send({ telefonoWhatsApp: '50212345678' });
    expect(res.status).toBe(200);
    expect(queryMock.mock.calls[0][0]).toMatch(/telefono_whatsapp = \$2/);
  });

  it('devuelve 404 si el id no corresponde a ningún paciente', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const app = await buildApp();
    const res = await request(app).patch('/api/pacientes/999').send({ telefonoWhatsApp: '1' });
    expect(res.status).toBe(404);
  });

  it('convierte texto vacío en NULL (nunca guarda "" ni inventa un valor)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id_paciente: 5 }] });
    const app = await buildApp();
    await request(app).patch('/api/pacientes/5').send({ correo: '   ', fechaNacimientoEstimada: true });
    const params = queryMock.mock.calls[0][1];
    expect(params).toContain(null);
    expect(params).toContain(true);
    expect(params).not.toContain('');
  });

  it('traduce el CHECK de menor/encargado a un mensaje entendible', async () => {
    queryMock.mockRejectedValueOnce(Object.assign(new Error('x'), { constraint: 'chk_menor_requiere_encargado' }));
    const app = await buildApp();
    const res = await request(app).patch('/api/pacientes/5').send({ esMenorEdad: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/encargado legal/);
  });
});
