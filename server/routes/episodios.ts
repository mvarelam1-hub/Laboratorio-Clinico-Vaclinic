/**
 * Episodios 4D (LabEpisode) — segundo módulo de los 9 migrados desde
 * localStorage (ver db/migrations/0011_modulos_restantes.sql, tabla
 * `episodio_4d`). Sigue el mismo patrón de rutas que ordenes.ts/pacientes.ts.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { requirePermission } from '../permissions-middleware';
import { hasPermission } from '../../src/shared/permissions';
import { asyncHandler } from '../asyncHandler';

export const episodiosRouter = Router();
episodiosRouter.use(requireStaffAuth);

// Permiso requerido para avanzar a cada dimensión — refleja quién realiza
// cada etapa real del flujo 4D (D1 admisión ya se exige al crear el
// episodio; D2 flebotomía, D3 analizadores, D4 validación/redacción).
const PERMISO_POR_DIMENSION: Record<string, string> = {
  D2_flebotomia: 'flebotomia_recoleccion',
  D3_analizadores: 'analizadores_lotes',
  D4_validacion: 'validacion_redaccion'
};

episodiosRouter.post('/', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const {
    idPaciente, idOrden, tipoPaciente, programaSalud, origen, medicoReferente, sede,
    prioridad, pruebasSolicitadas, codigosTubo, tipoMuestra, tatObjetivoMinutos, notas
  } = req.body || {};

  if (!idPaciente || !Array.isArray(pruebasSolicitadas) || pruebasSolicitadas.length === 0) {
    return res.status(400).json({ error: 'idPaciente y pruebasSolicitadas (arreglo no vacío) son obligatorios.' });
  }

  // Detección de duplicidad real: mismo paciente con al menos una prueba en
  // común en un episodio de las últimas 72h (misma regla que ya aplicaba
  // ClinicContext.tsx `addEpisode` en el frontend).
  const { rows: recientes } = await pool.query(
    `SELECT id_episodio, numero_episodio, pruebas_solicitadas FROM episodio_4d
     WHERE id_paciente = $1 AND hora_admision > NOW() - INTERVAL '72 hours'`,
    [idPaciente]
  );
  const duplicado = recientes.find((r: any) =>
    (r.pruebas_solicitadas || []).some((p: string) => pruebasSolicitadas.includes(p))
  );

  const numeroEpisodio = `4D-${new Date().getFullYear()}-EP${Math.floor(100 + Math.random() * 900)}${Date.now() % 1000}`;
  const { rows } = await pool.query(
    `INSERT INTO episodio_4d
       (numero_episodio, id_paciente, id_orden, tipo_paciente, programa_salud, origen, medico_referente, sede,
        prioridad, pruebas_solicitadas, codigos_tubo, tipo_muestra, tat_objetivo_minutos, notas,
        marca_duplicidad, detalle_duplicidad)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      numeroEpisodio, idPaciente, idOrden || null, tipoPaciente || null, programaSalud || null,
      origen || null, medicoReferente || null, sede || 'Sede Central',
      prioridad || 'rutina', pruebasSolicitadas, codigosTubo || [], tipoMuestra || null,
      tatObjetivoMinutos || 180, notas || null,
      !!duplicado,
      duplicado ? `Posible duplicado del episodio ${duplicado.numero_episodio} (últimas 72h, prueba(s) en común).` : null
    ]
  );
  return res.status(201).json(rows[0]);
}));

episodiosRouter.get('/', asyncHandler(async (req, res) => {
  const limite = Math.min(Number(req.query.limite) || 200, 1000);
  const { rows } = await pool.query(
    `SELECT ep.*, p.nombre_completo AS paciente_nombre, p.dni AS paciente_dni
     FROM episodio_4d ep
     JOIN paciente p ON p.id_paciente = ep.id_paciente
     ORDER BY ep.hora_admision DESC
     LIMIT $1`,
    [limite]
  );
  return res.json(rows);
}));

episodiosRouter.patch('/:id', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idEpisodio = Number(req.params.id);
  const { notas, prioridad, sedeDestino, transferido } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE episodio_4d
     SET notas = COALESCE($1, notas), prioridad = COALESCE($2, prioridad),
         sede_destino = COALESCE($3, sede_destino), transferido = COALESCE($4, transferido)
     WHERE id_episodio = $5 RETURNING *`,
    [notas ?? null, prioridad || null, sedeDestino || null, typeof transferido === 'boolean' ? transferido : null, idEpisodio]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Episodio no encontrado.' });
  return res.json(rows[0]);
}));

episodiosRouter.patch('/:id/avanzar', asyncHandler(async (req, res) => {
  const idEpisodio = Number(req.params.id);
  const { siguienteDimension } = req.body || {};
  const permisoRequerido = PERMISO_POR_DIMENSION[siguienteDimension];
  if (!permisoRequerido) {
    return res.status(400).json({ error: 'siguienteDimension inválida. Usa D2_flebotomia, D3_analizadores o D4_validacion.' });
  }
  if (!hasPermission(req.staffUser!, permisoRequerido)) {
    return res.status(403).json({ error: `El rol "${req.staffUser!.roleId}" no tiene el permiso "${permisoRequerido}".` });
  }

  const columnaTiempo: Record<string, string> = {
    D2_flebotomia: 'hora_flebotomia',
    D3_analizadores: 'hora_inicio_analizador',
    D4_validacion: 'hora_validacion'
  };
  const col = columnaTiempo[siguienteDimension];
  const { rows } = await pool.query(
    `UPDATE episodio_4d
     SET dimension_actual = $1, ${col} = COALESCE(${col}, NOW())
     WHERE id_episodio = $2 RETURNING *`,
    [siguienteDimension, idEpisodio]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Episodio no encontrado.' });
  return res.json(rows[0]);
}));

episodiosRouter.patch('/:id/duplicidad', requirePermission('admision_duplicidad'), asyncHandler(async (req, res) => {
  const idEpisodio = Number(req.params.id);
  const { accion } = req.body || {};
  if (!['keep', 'cancel', 'merge'].includes(accion)) {
    return res.status(400).json({ error: 'accion debe ser keep, cancel o merge.' });
  }

  if (accion === 'cancel') {
    const { rowCount } = await pool.query('DELETE FROM episodio_4d WHERE id_episodio = $1', [idEpisodio]);
    if (rowCount === 0) return res.status(404).json({ error: 'Episodio no encontrado.' });
    return res.json({ ok: true, accion: 'cancel' });
  }

  const { rows } = await pool.query(
    `UPDATE episodio_4d
     SET marca_duplicidad = FALSE,
         detalle_duplicidad = COALESCE(detalle_duplicidad, '') || $1
     WHERE id_episodio = $2 RETURNING *`,
    [accion === 'merge' ? ' [Fusionado por personal]' : ' [Confirmado como no duplicado]', idEpisodio]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Episodio no encontrado.' });
  return res.json(rows[0]);
}));
