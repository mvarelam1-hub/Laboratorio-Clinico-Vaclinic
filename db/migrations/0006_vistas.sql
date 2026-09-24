-- ============================================================
-- VACLINIC - Migración 0006: Vistas
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- vw_ordenes_pendientes_validacion
-- Alimenta el dashboard de personal (OrdersListView / LabDispatchesView):
-- órdenes que tienen al menos un resultado capturado pero aún no validado.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW vw_ordenes_pendientes_validacion AS
SELECT
    o.id_orden,
    o.numero_orden,
    p.nombre_completo AS paciente,
    o.fecha_registro,
    o.sede,
    COUNT(r.id_resultado) AS total_resultados,
    COUNT(r.id_resultado) FILTER (WHERE r.estado = 'Borrador') AS pendientes_validacion,
    COUNT(r.id_resultado) FILTER (WHERE r.estado = 'Validado') AS validados_no_publicados,
    COUNT(r.id_resultado) FILTER (WHERE r.estado = 'Publicado') AS publicados
FROM orden o
JOIN paciente p ON p.id_paciente = o.id_paciente
JOIN detalle_orden do_ ON do_.id_orden = o.id_orden
LEFT JOIN resultado r ON r.id_detalle = do_.id_detalle
WHERE o.archivada = FALSE
GROUP BY o.id_orden, o.numero_orden, p.nombre_completo, o.fecha_registro, o.sede
HAVING COUNT(r.id_resultado) FILTER (WHERE r.estado = 'Borrador') > 0;

COMMENT ON VIEW vw_ordenes_pendientes_validacion IS
    'Órdenes activas con resultados aún en Borrador, para el panel de bioanalistas/validación.';

-- ------------------------------------------------------------
-- vw_resultados_criticos
-- Alimenta LabAlertsView / CriticalValuesConfirmationModal: resultados
-- fuera de rango (calculados por trg_marcar_fuera_rango) que todavía no
-- han sido publicados.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW vw_resultados_criticos AS
SELECT
    r.id_resultado,
    o.numero_orden,
    p.nombre_completo AS paciente,
    e.nombre_examen,
    r.valor_capturado,
    r.estado,
    r.fecha_captura,
    u.nombre_completo AS analista
FROM resultado r
JOIN detalle_orden do_ ON do_.id_detalle = r.id_detalle
JOIN orden o ON o.id_orden = do_.id_orden
JOIN paciente p ON p.id_paciente = o.id_paciente
JOIN examen e ON e.id_examen = do_.id_examen
LEFT JOIN usuario u ON u.id_usuario = r.id_analista
WHERE r.esta_fuera_de_rango = TRUE
  AND r.estado <> 'Publicado'
ORDER BY r.fecha_captura ASC;

COMMENT ON VIEW vw_resultados_criticos IS
    'Resultados fuera de rango pendientes de publicación, para alerta y confirmación obligatoria del bioanalista/médico.';

COMMIT;
