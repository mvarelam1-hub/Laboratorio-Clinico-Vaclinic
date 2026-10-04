-- ============================================================
-- VACLINIC - Migración 0018: doble verificación de resultados críticos.
--
-- Contexto: un resultado "fuera de rango" (resultado.esta_fuera_de_rango,
-- calculado por trg_marcar_fuera_rango, migración 0005) es lo que el propio
-- sistema ya trata como crítico (vw_resultados_criticos, migración 0006: "para
-- alerta y confirmación obligatoria del bioanalista/médico"). ANTES de esta
-- migración esa "confirmación obligatoria" era solo un modal en el
-- navegador (CriticalValuesConfirmationModal) que la MISMA persona que
-- capturó el valor se confirmaba a sí misma: un solo usuario podía capturar,
-- validar y publicar un valor peligroso sin que nadie más lo viera, y el
-- backend no lo impedía de ninguna forma.
--
-- AHORA: un resultado crítico no puede pasar a "Publicado" mientras un
-- SEGUNDO bioanalista, distinto de quien lo capturó y de quien lo validó, no
-- lo haya verificado (PATCH /api/resultados/:id/verificar). La regla vive en
-- el servidor (server/routes/resultados.ts) Y en la base de datos (CHECK de
-- separación de funciones + trigger de publicación) como defensa en
-- profundidad: ni un cliente modificado ni un UPDATE directo pueden saltarla.
--
-- Decisión de diseño: el trigger de publicación solo se dispara en la
-- TRANSICIÓN a 'Publicado', no sobre toda fila publicada. Así los resultados
-- críticos ya publicados antes de esta migración (legado) no se tocan ni se
-- les inventa una verificación que nunca ocurrió; si alguno se corrige y se
-- vuelve a publicar, desde ese momento sí exige la doble verificación.
-- ============================================================

BEGIN;

ALTER TABLE resultado
    ADD COLUMN IF NOT EXISTS id_validador          INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS id_verificador        INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS verificado_por_nombre TEXT,
    ADD COLUMN IF NOT EXISTS fecha_verificacion    TIMESTAMP;

COMMENT ON COLUMN resultado.id_validador IS
    'Usuario que ejecutó la acción "validar" (Borrador -> Validado). Se reinicia en cada nueva validación.';
COMMENT ON COLUMN resultado.id_verificador IS
    'Segundo bioanalista que confirmó un resultado crítico (distinto de id_analista e id_validador).';
COMMENT ON COLUMN resultado.verificado_por_nombre IS
    'Nombre del verificador al momento de verificar (se conserva aunque el usuario se elimine).';

-- Coherencia: nombre y fecha de verificación siempre van juntos.
ALTER TABLE resultado
    ADD CONSTRAINT chk_resultado_verificacion_coherente
    CHECK ((fecha_verificacion IS NULL) = (verificado_por_nombre IS NULL));

-- Separación de funciones: el verificador NO puede ser quien capturó ni
-- quien validó el valor. (Un id NULL -usuario eliminado- no viola la regla.)
ALTER TABLE resultado
    ADD CONSTRAINT chk_resultado_verificador_distinto
    CHECK (
        id_verificador IS NULL
        OR (id_verificador IS DISTINCT FROM id_analista
            AND id_verificador IS DISTINCT FROM id_validador)
    );

-- Un crítico no puede pasar a Publicado sin verificación (defensa en
-- profundidad: aunque alguien ejecute un UPDATE directo a la base).
CREATE OR REPLACE FUNCTION fn_exigir_verificacion_critico() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'Publicado'
       AND OLD.estado IS DISTINCT FROM 'Publicado'
       AND NEW.esta_fuera_de_rango IS TRUE
       AND NEW.fecha_verificacion IS NULL THEN
        RAISE EXCEPTION 'Un resultado crítico (fuera de rango) requiere verificación de un segundo bioanalista antes de publicarse (resultado %).', NEW.id_resultado
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exigir_verificacion_critico ON resultado;
CREATE TRIGGER trg_exigir_verificacion_critico
    BEFORE UPDATE OF estado ON resultado
    FOR EACH ROW
    EXECUTE FUNCTION fn_exigir_verificacion_critico();

-- La vista de críticos expone ahora el estado de la verificación. Las
-- columnas nuevas van al final (requisito de CREATE OR REPLACE VIEW).
CREATE OR REPLACE VIEW vw_resultados_criticos AS
SELECT
    r.id_resultado,
    o.numero_orden,
    p.nombre_completo AS paciente,
    e.nombre_examen,
    r.valor_capturado,
    r.estado,
    r.fecha_captura,
    u.nombre_completo AS analista,
    r.validado_por_nombre,
    r.verificado_por_nombre,
    r.fecha_verificacion
FROM resultado r
JOIN detalle_orden do_ ON do_.id_detalle = r.id_detalle
JOIN orden o ON o.id_orden = do_.id_orden
JOIN paciente p ON p.id_paciente = o.id_paciente
JOIN examen e ON e.id_examen = do_.id_examen
LEFT JOIN usuario u ON u.id_usuario = r.id_analista
WHERE r.esta_fuera_de_rango = TRUE
  AND r.estado <> 'Publicado'
ORDER BY r.fecha_captura ASC;

COMMIT;
