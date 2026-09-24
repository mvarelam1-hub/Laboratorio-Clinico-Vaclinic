import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';

export const pacientesRouter = Router();
pacientesRouter.use(requireStaffAuth);

// NOTA (alineación con la tesis, capítulo 4): el registro de paciente ya
// NO genera un PIN. El único mecanismo de acceso del paciente a su
// resultado es el código único de consulta que se genera al registrar la
// ORDEN (tabla `codigo_consulta`, ver server/routes/ordenes.ts), tal como
// describe el caso de uso "consultar resultado mediante código único" del
// documento de origen — no hay un segundo factor de PIN en ese diseño.
pacientesRouter.post('/', requirePermission('admision_pacientes'), asyncHandler(async (req, res) => {
  const { nombreCompleto, dni, fechaNacimiento, genero, telefonoWhatsApp, correo, direccion,
    esMenorEdad, nombreEncargadoLegal, telefonoEncargadoLegal } = req.body || {};

  if (!nombreCompleto || !fechaNacimiento || !telefonoWhatsApp) {
    return res.status(400).json({ error: 'nombreCompleto, fechaNacimiento y telefonoWhatsApp son obligatorios.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO paciente (nombre_completo, dni, fecha_nacimiento, genero, telefono_whatsapp,
                              correo, direccion, es_menor_edad, nombre_encargado_legal, telefono_encargado_legal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [nombreCompleto, dni || null, fechaNacimiento, genero || null, telefonoWhatsApp,
        correo || null, direccion || null, !!esMenorEdad, nombreEncargadoLegal || null, telefonoEncargadoLegal || null]
    );
    return res.status(201).json(rows[0]);
  } catch (err: any) {
    // chk_menor_requiere_encargado u otras reglas de negocio de la migración 0002
    return res.status(400).json({ error: err.message });
  }
}));

// Listado / búsqueda de pacientes (para la pantalla de "Nueva orden" y el
// historial). ?buscar= filtra por nombre o DNI con ILIKE.
pacientesRouter.get('/', requirePermission('admision_pacientes'), asyncHandler(async (req, res) => {
  const buscar = String(req.query.buscar || '').trim();
  const limite = Math.min(Number(req.query.limite) || 50, 200);
  if (buscar) {
    const { rows } = await pool.query(
      `SELECT id_paciente, nombre_completo, dni, fecha_nacimiento, telefono_whatsapp, correo, direccion
       FROM paciente
       WHERE nombre_completo ILIKE $1 OR dni ILIKE $1
       ORDER BY nombre_completo
       LIMIT $2`,
      [`%${buscar}%`, limite]
    );
    return res.json(rows);
  }
  const { rows } = await pool.query(
    `SELECT id_paciente, nombre_completo, dni, fecha_nacimiento, telefono_whatsapp, correo, direccion
     FROM paciente ORDER BY id_paciente DESC LIMIT $1`,
    [limite]
  );
  return res.json(rows);
}));

pacientesRouter.get('/:id', requirePermission('admision_pacientes'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM paciente WHERE id_paciente = $1', [Number(req.params.id)]);
  if (rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado.' });
  return res.json(rows[0]);
}));

// Mapeo explícito columna_bd -> claveBody, en vez de derivarlo con una
// regex snake_case -> camelCase: "telefono_whatsapp" se escribe
// "telefonoWhatsApp" (con A mayúscula, por "WhatsApp") en el resto de la
// API -por ejemplo en el POST de arriba-, y una conversión automática
// ingenua produce "telefonoWhatsapp", que nunca coincide con lo que
// realmente envía el cliente. Un mapeo explícito no depende de que la
// ortografía de cada nombre seguía la misma regla mecánica.
const CAMPOS_PACIENTE_PATCH: Record<string, string> = {
  nombre_completo: 'nombreCompleto',
  dni: 'dni',
  fecha_nacimiento: 'fechaNacimiento',
  genero: 'genero',
  telefono_whatsapp: 'telefonoWhatsApp',
  correo: 'correo',
  direccion: 'direccion',
  es_menor_edad: 'esMenorEdad',
  nombre_encargado_legal: 'nombreEncargadoLegal',
  telefono_encargado_legal: 'telefonoEncargadoLegal',
};

pacientesRouter.patch('/:id', requirePermission('admision_pacientes'), asyncHandler(async (req, res) => {
  const idPaciente = Number(req.params.id);
  const campos: Record<string, any> = {};
  for (const [columna, clave] of Object.entries(CAMPOS_PACIENTE_PATCH)) {
    if (req.body?.[clave] !== undefined) campos[columna] = req.body[clave];
  }
  if (Object.keys(campos).length === 0) {
    return res.status(400).json({ error: 'No se envió ningún campo válido para actualizar.' });
  }
  const asignaciones = Object.keys(campos).map((c, i) => `${c} = $${i + 2}`).join(', ');
  try {
    const { rows } = await pool.query(
      `UPDATE paciente SET ${asignaciones} WHERE id_paciente = $1 RETURNING *`,
      [idPaciente, ...Object.values(campos)]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado.' });
    return res.json(rows[0]);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}));
