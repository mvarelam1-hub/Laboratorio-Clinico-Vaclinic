/**
 * Plantillas de informes (ReportTemplate) — séptimo módulo de los 9
 * migrados desde localStorage (ver ClinicContext.tsx addTemplate/
 * updateTemplate). Migración real: db/migrations/0011_modulos_restantes.sql
 * (tabla `plantilla_informe`).
 *
 * A diferencia de los demás módulos, `id_plantilla` es TEXT (no SERIAL):
 * el frontend siempre genera y reutiliza su propio id (ver
 * TemplateAiAuditModal.tsx `handleSaveOptimizedTemplate`), y
 * `addTemplate()` en ClinicContext.tsx YA era un upsert real (si el id
 * existe reemplaza, si no inserta) — por eso PUT /:id replica ese mismo
 * upsert en el backend en vez de una simple creación.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';

export const plantillasRouter = Router();
plantillasRouter.use(requireStaffAuth);

function aArreglo(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.map(String) : [];
}

plantillasRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM plantilla_informe ORDER BY fecha_actualizacion DESC');
  return res.json(rows);
}));

plantillasRouter.put('/:id', requirePermission('validacion_redaccion'), asyncHandler(async (req, res) => {
  const idPlantilla = req.params.id;
  const {
    name, category, description, defaultParameters, defaultRecommendations,
    sampleType, tubeType, tubesRequired, preanalyticalNotes, panicAlertRule,
    complianceStandard, complianceScore, lastAuditedAt
  } = req.body || {};

  if (!name || !String(name).trim() || !category) {
    return res.status(400).json({ error: 'name y category son obligatorios.' });
  }

  const { rows } = await pool.query(
    `INSERT INTO plantilla_informe
       (id_plantilla, nombre, categoria, descripcion, parametros_default, recomendaciones_default,
        tipo_muestra, tipo_tubo, tubos_requeridos, notas_preanaliticas, regla_alerta_panico,
        estandar_cumplimiento, puntaje_cumplimiento, fecha_ultima_auditoria, fecha_actualizacion)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
     ON CONFLICT (id_plantilla) DO UPDATE SET
       nombre = EXCLUDED.nombre, categoria = EXCLUDED.categoria, descripcion = EXCLUDED.descripcion,
       parametros_default = EXCLUDED.parametros_default, recomendaciones_default = EXCLUDED.recomendaciones_default,
       tipo_muestra = EXCLUDED.tipo_muestra, tipo_tubo = EXCLUDED.tipo_tubo,
       tubos_requeridos = EXCLUDED.tubos_requeridos, notas_preanaliticas = EXCLUDED.notas_preanaliticas,
       regla_alerta_panico = EXCLUDED.regla_alerta_panico, estandar_cumplimiento = EXCLUDED.estandar_cumplimiento,
       puntaje_cumplimiento = EXCLUDED.puntaje_cumplimiento, fecha_ultima_auditoria = EXCLUDED.fecha_ultima_auditoria,
       fecha_actualizacion = NOW()
     RETURNING *`,
    [
      idPlantilla, String(name).trim(), category, description || null,
      JSON.stringify(Array.isArray(defaultParameters) ? defaultParameters : []),
      aArreglo(defaultRecommendations), sampleType || null, tubeType || null,
      tubesRequired !== undefined ? aArreglo(tubesRequired) : null, preanalyticalNotes || null,
      panicAlertRule || null, complianceStandard || null,
      complianceScore !== undefined ? Number(complianceScore) : null, lastAuditedAt || null
    ]
  );
  return res.json(rows[0]);
}));

plantillasRouter.patch('/:id', requirePermission('validacion_redaccion'), asyncHandler(async (req, res) => {
  const idPlantilla = req.params.id;
  const {
    name, category, description, defaultParameters, defaultRecommendations,
    sampleType, tubeType, tubesRequired, preanalyticalNotes, panicAlertRule,
    complianceStandard, complianceScore, lastAuditedAt
  } = req.body || {};

  const { rows } = await pool.query(
    `UPDATE plantilla_informe
     SET nombre = COALESCE($1, nombre), categoria = COALESCE($2, categoria),
         descripcion = COALESCE($3, descripcion),
         parametros_default = COALESCE($4, parametros_default),
         recomendaciones_default = COALESCE($5, recomendaciones_default),
         tipo_muestra = COALESCE($6, tipo_muestra), tipo_tubo = COALESCE($7, tipo_tubo),
         tubos_requeridos = COALESCE($8, tubos_requeridos),
         notas_preanaliticas = COALESCE($9, notas_preanaliticas),
         regla_alerta_panico = COALESCE($10, regla_alerta_panico),
         estandar_cumplimiento = COALESCE($11, estandar_cumplimiento),
         puntaje_cumplimiento = COALESCE($12, puntaje_cumplimiento),
         fecha_ultima_auditoria = COALESCE($13, fecha_ultima_auditoria),
         fecha_actualizacion = NOW()
     WHERE id_plantilla = $14
     RETURNING *`,
    [
      name || null, category || null, description || null,
      defaultParameters !== undefined ? JSON.stringify(defaultParameters) : null,
      defaultRecommendations !== undefined ? aArreglo(defaultRecommendations) : null,
      sampleType || null, tubeType || null,
      tubesRequired !== undefined ? aArreglo(tubesRequired) : null, preanalyticalNotes || null,
      panicAlertRule || null, complianceStandard || null,
      complianceScore !== undefined ? Number(complianceScore) : null, lastAuditedAt || null, idPlantilla
    ]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Plantilla no encontrada.' });
  return res.json(rows[0]);
}));
