/**
 * Informe clínico (MedicalReport) — migración 0014. Antes de esta
 * migración el documento del informe (título, hallazgos, conclusiones,
 * explicación IA para el paciente, firma digital, QR, reporte del
 * analizador adjunto) vivía 100% en localStorage (ver ClinicContext.tsx
 * `reports`); lo único que llegaba a Postgres era, indirectamente, un
 * valor por examen vía POST /api/resultados.
 *
 * Mismo patrón de columnas reales + JSONB ya usado en plantillas.ts para
 * `plantilla_informe`: los campos que de verdad hace falta poder
 * consultar/filtrar (estado, categoría, título, fechas, QR) son columnas
 * propias; el resto de la estructura de MedicalReport -grande, anidada y
 * específica del frontend- va en `datos_json`. `CAMPOS_ADICIONALES` abajo
 * es la lista explícita y completa de qué se guarda ahí.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-staff';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';

export const informesRouter = Router();
informesRouter.use(requireStaffAuth);

const ESTADOS_VALIDOS = ['borrador', 'revision', 'publicado', 'entregado'];

function aArregloTexto(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.map(String) : [];
}

// Claves de MedicalReport sin columna propia -snapshot de datos del
// paciente al momento de emitir, parámetros capturados, firma digital,
// reporte adjunto del analizador, flags de qué incluir al imprimir- que
// se guardan tal cual en `datos_json`. Mantenerla explícita (en vez de
// "todo lo que sobre del body") evita que un campo nuevo o mal escrito en
// el frontend se cuele sin que nadie lo note aquí.
function extraerDatosAdicionales(body: Record<string, unknown>) {
  const {
    patientId, patientName, patientNationalId, patientAge, patientGender,
    referringDoctor, company, laboratoryName, sampleType, tubeType, parameters,
    includeConclusionsInReport, includeRecommendationsInReport, includeAiExplanationInReport,
    urgentAlert, signature, notesToStaff, episodeId, branchId, attachedAnalyzerReport
  } = body;
  return {
    patientId, patientName, patientNationalId, patientAge, patientGender,
    referringDoctor, company, laboratoryName, sampleType, tubeType, parameters,
    includeConclusionsInReport, includeRecommendationsInReport, includeAiExplanationInReport,
    urgentAlert, signature, notesToStaff, episodeId, branchId, attachedAnalyzerReport
  };
}

informesRouter.post('/', requirePermission('validacion_redaccion'), asyncHandler(async (req, res) => {
  const body = req.body || {};
  const {
    idOrden, numeroInforme, titulo, categoria, estado,
    fechaMuestra, fechaEmision, hallazgosClinicos, conclusionesMedico,
    explicacionPaciente, recomendaciones, codigoVerificacionQr
  } = body;

  if (!numeroInforme || !String(numeroInforme).trim()) {
    return res.status(400).json({ error: 'numeroInforme es obligatorio.' });
  }
  if (!titulo || !String(titulo).trim()) {
    return res.status(400).json({ error: 'titulo es obligatorio.' });
  }
  if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: `estado inválido. Usa uno de: ${ESTADOS_VALIDOS.join(', ')}.` });
  }

  const { rows } = await pool.query(
    `INSERT INTO informe_clinico
       (id_orden, numero_informe, categoria, titulo, estado, fecha_muestra, fecha_emision,
        hallazgos_clinicos, conclusiones_medico, explicacion_paciente, recomendaciones,
        codigo_verificacion_qr, datos_json, id_usuario_creacion)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      idOrden || null, String(numeroInforme).trim(), categoria || 'laboratorio', String(titulo).trim(),
      estado || 'borrador', fechaMuestra || null, fechaEmision || null,
      hallazgosClinicos || null, conclusionesMedico || null, explicacionPaciente || null,
      aArregloTexto(recomendaciones), codigoVerificacionQr || null,
      JSON.stringify(extraerDatosAdicionales(body)), req.staffUser!.idUsuario
    ]
  );
  return res.status(201).json(rows[0]);
}));

// Excluye `eliminado = TRUE` (igual que GET /api/ordenes desde la
// migración 0013): un informe eliminado lógicamente no debe reaparecer en
// el listado general, pero sigue consultable por id para auditoría.
informesRouter.get('/', asyncHandler(async (req, res) => {
  const limite = Math.min(Number(req.query.limite) || 100, 500);
  const { rows } = await pool.query(
    `SELECT id_informe, id_orden, numero_informe, categoria, titulo, estado,
            fecha_muestra, fecha_emision, codigo_verificacion_qr, fecha_creacion, fecha_actualizacion
     FROM informe_clinico
     WHERE eliminado = FALSE
     ORDER BY fecha_creacion DESC
     LIMIT $1`,
    [limite]
  );
  return res.json(rows);
}));

informesRouter.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM informe_clinico WHERE id_informe = $1', [Number(req.params.id)]);
  if (rows.length === 0) return res.status(404).json({ error: 'Informe no encontrado.' });
  return res.json(rows[0]);
}));

informesRouter.patch('/:id', requirePermission('validacion_redaccion'), asyncHandler(async (req, res) => {
  const idInforme = Number(req.params.id);
  const body = req.body || {};
  const {
    idOrden, titulo, categoria, estado, fechaMuestra, fechaEmision,
    hallazgosClinicos, conclusionesMedico, explicacionPaciente, recomendaciones, codigoVerificacionQr
  } = body;

  if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: `estado inválido. Usa uno de: ${ESTADOS_VALIDOS.join(', ')}.` });
  }

  // `datos_json` se fusiona (no se reemplaza entero) con el operador `||`
  // de JSONB: cualquier campo adicional que este PATCH no traiga -ej. un
  // AiSummaryModeModal.tsx que solo actualiza explicacionPaciente, sin
  // tocar `parameters` ni `signature`- conserva su valor ya guardado.
  const datosAdicionales = extraerDatosAdicionales(body);
  const datosAEnviar = Object.fromEntries(Object.entries(datosAdicionales).filter(([, v]) => v !== undefined));

  const { rows } = await pool.query(
    `UPDATE informe_clinico
     SET id_orden = COALESCE($1, id_orden), titulo = COALESCE($2, titulo),
         categoria = COALESCE($3, categoria), estado = COALESCE($4, estado),
         fecha_muestra = COALESCE($5, fecha_muestra), fecha_emision = COALESCE($6, fecha_emision),
         hallazgos_clinicos = COALESCE($7, hallazgos_clinicos),
         conclusiones_medico = COALESCE($8, conclusiones_medico),
         explicacion_paciente = COALESCE($9, explicacion_paciente),
         recomendaciones = COALESCE($10, recomendaciones),
         codigo_verificacion_qr = COALESCE($11, codigo_verificacion_qr),
         datos_json = datos_json || $12::jsonb,
         fecha_actualizacion = NOW()
     WHERE id_informe = $13 AND eliminado = FALSE
     RETURNING *`,
    [
      idOrden || null, titulo || null, categoria || null, estado || null,
      fechaMuestra || null, fechaEmision || null, hallazgosClinicos || null,
      conclusionesMedico || null, explicacionPaciente || null,
      recomendaciones !== undefined ? aArregloTexto(recomendaciones) : null,
      codigoVerificacionQr || null, JSON.stringify(datosAEnviar), idInforme
    ]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Informe no encontrado o ya eliminado.' });
  return res.json(rows[0]);
}));

// Única acción real de "publicar" en el backend: Borrador/Revisión ->
// Publicado, con usuario y fecha de publicación (separado del PATCH
// general de arriba porque exige el permiso más alto
// 'validacion_publicacion', igual que TRANSICIONES.publicar en
// resultados.ts). La firma digital en sí (doctorName, hash, etc.) viaja en
// el body como cualquier otro campo de `datos_json` -este endpoint no la
// genera, solo persiste lo que ClinicContext.tsx `publishReport` ya arma.
informesRouter.patch('/:id/publicar', requirePermission('validacion_publicacion'), asyncHandler(async (req, res) => {
  const idInforme = Number(req.params.id);
  const datosAdicionales = extraerDatosAdicionales(req.body || {});
  const datosAEnviar = Object.fromEntries(Object.entries(datosAdicionales).filter(([, v]) => v !== undefined));

  // Doble verificación de críticos (migración 0018): el informe no puede
  // publicarse mientras la orden tenga un resultado fuera de rango que aún
  // no verificó un segundo bioanalista. Se enlaza por id_orden porque
  // resultado.id_informe no se rellena todavía desde ninguna ruta. Los
  // críticos ya 'Publicado' (legado, anteriores a la migración) no bloquean.
  const { rows: criticosPendientes } = await pool.query(
    `SELECT 1
     FROM informe_clinico i
     JOIN detalle_orden d ON d.id_orden = i.id_orden
     JOIN resultado r ON r.id_detalle = d.id_detalle
     WHERE i.id_informe = $1
       AND r.esta_fuera_de_rango = TRUE
       AND r.fecha_verificacion IS NULL
       AND r.estado <> 'Publicado'
     LIMIT 1`,
    [idInforme]
  );
  if (criticosPendientes.length > 0) {
    return res.status(409).json({
      error: 'Este informe tiene resultados críticos (fuera de rango) que aún requieren la verificación de un segundo bioanalista antes de publicarse.',
      code: 'DOBLE_VERIFICACION_PENDIENTE'
    });
  }

  const { rows } = await pool.query(
    `UPDATE informe_clinico
     SET estado = 'publicado', fecha_publicacion = NOW(), id_usuario_publicacion = $1,
         datos_json = datos_json || $2::jsonb, fecha_actualizacion = NOW()
     WHERE id_informe = $3 AND eliminado = FALSE
     RETURNING *`,
    [req.staffUser!.idUsuario, JSON.stringify(datosAEnviar), idInforme]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Informe no encontrado o ya eliminado.' });
  return res.json(rows[0]);
}));

// Eliminación lógica -nunca un DELETE real, igual que en órdenes (migración
// 0013): "Pacientes, órdenes, resultados e informes clínicos no deberían
// eliminarse físicamente" (informe técnico, sección 4.3).
informesRouter.delete('/:id', requirePermission('validacion_redaccion'), asyncHandler(async (req, res) => {
  const idInforme = Number(req.params.id);
  const { motivo } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE informe_clinico
     SET eliminado = TRUE, fecha_eliminacion = NOW(), id_usuario_eliminacion = $1, motivo_eliminacion = $2
     WHERE id_informe = $3 AND eliminado = FALSE
     RETURNING id_informe, eliminado, fecha_eliminacion`,
    [req.staffUser!.idUsuario, (motivo && String(motivo).trim()) || null, idInforme]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Informe no encontrado o ya estaba eliminado.' });
  return res.json({ ok: true, ...rows[0] });
}));
