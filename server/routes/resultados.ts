/**
 * Ciclo de vida de un resultado: Borrador -> Validado -> Publicado -> (En corrección).
 * Cada transición aquí:
 *  1) exige el permiso correspondiente REVALIDADO en el servidor (no solo
 *     oculto en el frontend), y
 *  2) corre dentro de withAuditContext() para que el trigger de la Etapa 2
 *     (trg_auditoria_resultado) registre quién y por qué en historial_auditoria.
 */
import { Router } from 'express';
import { pool, withAuditContext } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { requirePermission } from '../permissions-middleware';
import { hasPermission } from '../../src/shared/permissions';
import { asyncHandler } from '../asyncHandler';

export const resultadosRouter = Router();
resultadosRouter.use(requireStaffAuth);

// Captura inicial de un resultado (RF03/RF04): crea la fila en estado
// "Borrador" para un detalle_orden que todavía no tiene resultado, y calcula
// esta_fuera_de_rango contra rango_referencia (edad/género del paciente),
// tal como describe el caso de uso "validar rango de referencia" del Cap. 4.
resultadosRouter.post('/', requirePermission('analizadores_manual'), asyncHandler(async (req, res) => {
  const { idDetalle, valorCapturado } = req.body || {};
  if (!idDetalle || valorCapturado === undefined || valorCapturado === null || valorCapturado === '') {
    return res.status(400).json({ error: 'idDetalle y valorCapturado son obligatorios.' });
  }

  const { rows: existente } = await pool.query('SELECT id_resultado FROM resultado WHERE id_detalle = $1', [idDetalle]);
  if (existente.length > 0) {
    return res.status(409).json({ error: 'Este detalle de orden ya tiene un resultado capturado. Usa la corrección si necesitas cambiarlo.' });
  }

  const { rows: detalleRows } = await pool.query(
    `SELECT d.id_examen, p.fecha_nacimiento, p.genero
     FROM detalle_orden d
     JOIN orden o ON o.id_orden = d.id_orden
     JOIN paciente p ON p.id_paciente = o.id_paciente
     WHERE d.id_detalle = $1`,
    [idDetalle]
  );
  if (detalleRows.length === 0) return res.status(404).json({ error: 'detalle_orden no encontrado.' });
  const { id_examen: idExamen, fecha_nacimiento: fechaNacimiento, genero } = detalleRows[0];

  const valorNumerico = Number(valorCapturado);
  let fueraDeRango = false;
  if (!Number.isNaN(valorNumerico)) {
    const edad = Math.floor((Date.now() - new Date(fechaNacimiento).getTime()) / (365.25 * 24 * 3600 * 1000));
    const { rows: rangoRows } = await pool.query(
      `SELECT valor_minimo, valor_maximo FROM rango_referencia
       WHERE id_examen = $1 AND edad_minima <= $2 AND edad_maxima >= $2
         AND (genero = 'Ambos' OR genero = $3)
       ORDER BY id_rango LIMIT 1`,
      [idExamen, edad, genero || 'Ambos']
    );
    if (rangoRows.length > 0) {
      const { valor_minimo: min, valor_maximo: max } = rangoRows[0];
      if (min !== null && valorNumerico < Number(min)) fueraDeRango = true;
      if (max !== null && valorNumerico > Number(max)) fueraDeRango = true;
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO resultado (id_detalle, id_analista, valor_capturado, estado, esta_fuera_de_rango)
     VALUES ($1, $2, $3, 'Borrador', $4)
     RETURNING id_resultado, id_detalle, valor_capturado, estado, esta_fuera_de_rango`,
    [idDetalle, req.staffUser!.idUsuario, String(valorCapturado), fueraDeRango]
  );
  return res.status(201).json(rows[0]);
}));

// Transiciones de estado permitidas explícitamente (requisito de la sección 4
// del diagnóstico: "define las transiciones permitidas y quién puede ejecutarlas").
const TRANSICIONES: Record<string, { destino: string; permiso: string }> = {
  validar: { destino: 'Validado', permiso: 'validacion_firma_digital' },
  publicar: { destino: 'Publicado', permiso: 'validacion_publicacion' },
  corregir: { destino: 'En correccion', permiso: 'validacion_firma_digital' }
};

resultadosRouter.patch('/:id/:accion', asyncHandler(async (req, res) => {
  try {
    const { id, accion } = req.params;
    const transicion = TRANSICIONES[accion];
    if (!transicion) {
      return res.status(400).json({ error: `Acción "${accion}" no reconocida. Usa: ${Object.keys(TRANSICIONES).join(', ')}.` });
    }

    const staffUser = req.staffUser!;
    if (!hasPermission(staffUser, transicion.permiso)) {
      return res.status(403).json({ error: `El rol "${staffUser.roleId}" no tiene el permiso "${transicion.permiso}".` });
    }

    const idResultado = Number(id);
    const { motivo, nuevoValor } = req.body || {};

    const { rows } = await pool.query('SELECT estado, valor_capturado FROM resultado WHERE id_resultado = $1', [idResultado]);
    if (rows.length === 0) return res.status(404).json({ error: 'Resultado no encontrado.' });
    const actual = rows[0];

    if (accion === 'publicar' && actual.estado !== 'Validado') {
      return res.status(409).json({ error: `No se puede publicar un resultado en estado "${actual.estado}". Debe estar Validado primero.` });
    }
    if (accion === 'corregir' && actual.estado !== 'Publicado') {
      return res.status(409).json({ error: 'Solo se puede "corregir" un resultado ya Publicado. Si aún no se publicó, edítalo directamente.' });
    }
    if (accion === 'corregir' && !motivo) {
      return res.status(400).json({ error: 'Una corrección post-publicación exige indicar el motivo (queda en el historial).' });
    }

    await withAuditContext(
      { userId: staffUser.idUsuario, motivo: motivo || `Transición de estado: ${actual.estado} → ${transicion.destino}` },
      async (client) => {
        if (accion === 'corregir' && nuevoValor !== undefined) {
          await client.query(
            `UPDATE resultado SET estado = $1, valor_capturado = $2 WHERE id_resultado = $3`,
            [transicion.destino, String(nuevoValor), idResultado]
          );
        } else if (accion === 'validar') {
          await client.query(
            `UPDATE resultado SET estado = $1, validado_por_nombre = $2 WHERE id_resultado = $3`,
            [transicion.destino, staffUser.nombreCompleto, idResultado]
          );
        } else if (accion === 'publicar') {
          await client.query(
            `UPDATE resultado SET estado = $1, fecha_publicacion = NOW() WHERE id_resultado = $2`,
            [transicion.destino, idResultado]
          );
        } else {
          await client.query(`UPDATE resultado SET estado = $1 WHERE id_resultado = $2`, [transicion.destino, idResultado]);
        }
      }
    );

    return res.json({ ok: true, idResultado, estadoAnterior: actual.estado, estadoNuevo: transicion.destino });
  } catch (err: any) {
    console.error('[resultados] Error al aplicar transición:', err.message); // sin PII del paciente en el log
    return res.status(500).json({ error: 'No se pudo aplicar la transición.' });
  }
}));

// Historial de versiones de un resultado (requisito: "una corrección debe
// generar una nueva versión... consultable"), usando fn_historial_resultado
// de la migración 0004.
resultadosRouter.get('/:id/historial', requirePermission('admin_bitacora_auditoria'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM fn_historial_resultado($1)', [Number(req.params.id)]);
  return res.json({ idResultado: Number(req.params.id), versiones: rows });
}));
