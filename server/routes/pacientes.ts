import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-staff';
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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENEROS_VALIDOS = ['M', 'F', 'Otro'];

/** Texto recortado; cadena vacía o no-texto -> null (nunca se guarda "" ni se inventa un valor). */
function textoOpcional(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

/** Años cumplidos a `hoy`; null si la fecha no es válida, es futura o implica más de 120 años. */
export function edadEnAnios(fechaISO: unknown, hoy: Date = new Date()): number | null {
  if (typeof fechaISO !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(fechaISO)) return null;
  const [y, m, d] = fechaISO.slice(0, 10).split('-').map(Number);
  const nac = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(nac.getTime()) || nac.getUTCMonth() !== m - 1) return null; // p. ej. 2026-02-31
  let edad = hoy.getUTCFullYear() - y;
  if (hoy.getUTCMonth() + 1 < m || (hoy.getUTCMonth() + 1 === m && hoy.getUTCDate() < d)) edad--;
  if (nac.getTime() > hoy.getTime() || edad > 120) return null;
  return edad;
}

/** Traduce los CHECK de la base a un mensaje que el personal entienda (en vez del texto crudo de Postgres). */
function mensajeDeRestriccion(err: any): string {
  const detalle = `${err?.constraint || ''} ${err?.message || ''}`;
  if (detalle.includes('chk_paciente_contacto')) return 'Registra al menos un medio de contacto: teléfono o correo.';
  if (detalle.includes('chk_menor_requiere_encargado')) return 'Un paciente menor de edad requiere nombre y teléfono del encargado legal.';
  return err?.message || 'No se pudo guardar el paciente.';
}

pacientesRouter.post('/', requirePermission('admision_pacientes'), asyncHandler(async (req, res) => {
  const body = req.body || {};
  const nombreCompleto = textoOpcional(body.nombreCompleto);
  const dni = textoOpcional(body.dni);
  const telefono = textoOpcional(body.telefonoWhatsApp);
  const correo = textoOpcional(body.correo);
  const direccion = textoOpcional(body.direccion);
  const nombreEncargado = textoOpcional(body.nombreEncargadoLegal);
  const telefonoEncargado = textoOpcional(body.telefonoEncargadoLegal);
  const { genero, fechaNacimiento } = body;

  if (!nombreCompleto) return res.status(400).json({ error: 'El nombre completo es obligatorio.' });
  // Sexo y edad definen los rangos de referencia con los que se interpretan
  // sus resultados: no se aceptan vacíos ni valores por defecto.
  if (!GENEROS_VALIDOS.includes(genero)) {
    return res.status(400).json({ error: 'Indica el sexo del paciente (M, F u Otro): define los rangos de referencia.' });
  }
  const edad = edadEnAnios(fechaNacimiento);
  if (edad === null) {
    return res.status(400).json({ error: 'La fecha de nacimiento no es válida (no puede ser futura ni de más de 120 años).' });
  }
  if (!telefono && !correo) {
    return res.status(400).json({ error: 'Registra al menos un medio de contacto: teléfono o correo.' });
  }
  if (correo && !EMAIL_RE.test(correo)) {
    return res.status(400).json({ error: 'El correo no tiene un formato válido.' });
  }
  // La condición de menor la decide el SERVIDOR con la fecha de nacimiento,
  // no un indicador que mande el cliente (que antes nunca se enviaba y dejaba
  // a los niños registrados como adultos y sin encargado).
  const esMenor = edad < 18;
  if (esMenor && (!nombreEncargado || !telefonoEncargado)) {
    return res.status(400).json({
      error: 'El paciente es menor de edad: registra el nombre y el teléfono de su encargado legal.',
      code: 'MENOR_REQUIERE_ENCARGADO'
    });
  }

  try {
    if (dni) {
      const { rows: existentes } = await pool.query(
        'SELECT id_paciente, nombre_completo FROM paciente WHERE lower(dni) = lower($1) LIMIT 1',
        [dni]
      );
      if (existentes.length > 0) {
        return res.status(409).json({
          error: `Ya existe un paciente con ese documento: ${existentes[0].nombre_completo}.`,
          code: 'DNI_DUPLICADO',
          paciente: existentes[0]
        });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO paciente (nombre_completo, dni, fecha_nacimiento, genero, telefono_whatsapp,
                              correo, direccion, es_menor_edad, nombre_encargado_legal, telefono_encargado_legal,
                              fecha_nacimiento_estimada)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [nombreCompleto, dni, fechaNacimiento, genero, telefono,
        correo, direccion, esMenor, nombreEncargado, telefonoEncargado, body.fechaNacimientoEstimada === true]
    );
    return res.status(201).json(rows[0]);
  } catch (err: any) {
    return res.status(400).json({ error: mensajeDeRestriccion(err) });
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
  fecha_nacimiento_estimada: 'fechaNacimientoEstimada',
};

pacientesRouter.patch('/:id', requirePermission('admision_pacientes'), asyncHandler(async (req, res) => {
  const idPaciente = Number(req.params.id);
  const campos: Record<string, any> = {};
  for (const [columna, clave] of Object.entries(CAMPOS_PACIENTE_PATCH)) {
    if (req.body?.[clave] === undefined) continue;
    // Texto vacío = "sin dato" (NULL), nunca una cadena vacía ni un valor inventado.
    const valor = req.body[clave];
    campos[columna] = typeof valor === 'string' ? textoOpcional(valor) : valor;
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
    return res.status(400).json({ error: mensajeDeRestriccion(err) });
  }
}));
