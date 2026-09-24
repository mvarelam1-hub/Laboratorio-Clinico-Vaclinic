-- ============================================================
-- VACLINIC - Migración 0005: Triggers
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- trg_marcar_fuera_rango
-- Antes de insertar/actualizar un resultado, calcula automáticamente
-- esta_fuera_de_rango usando fn_evaluar_rango_referencia, en vez de
-- confiar en que el frontend lo calcule (el cliente no debe ser la
-- única fuente de verdad de un dato clínico).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION calcular_fuera_rango() RETURNS TRIGGER AS $$
DECLARE
    v_id_examen INTEGER;
    v_genero TEXT;
    v_edad INTEGER;
    v_valor NUMERIC;
    v_estado_valor TEXT;
BEGIN
    -- Solo se puede evaluar si el valor capturado es numérico; los resultados
    -- de texto (ej. "Positivo"/"Negativo", cualitativos) se dejan sin marcar aquí.
    BEGIN
        v_valor := NEW.valor_capturado::NUMERIC;
    EXCEPTION WHEN OTHERS THEN
        RETURN NEW; -- no numérico: no se evalúa automáticamente
    END;

    SELECT do_.id_examen, p.genero, DATE_PART('year', AGE(p.fecha_nacimiento))::INTEGER
    INTO v_id_examen, v_genero, v_edad
    FROM detalle_orden do_
    JOIN orden o ON o.id_orden = do_.id_orden
    JOIN paciente p ON p.id_paciente = o.id_paciente
    WHERE do_.id_detalle = NEW.id_detalle;

    IF v_id_examen IS NULL THEN
        RETURN NEW;
    END IF;

    v_estado_valor := fn_evaluar_rango_referencia(v_id_examen, v_valor, v_genero, v_edad);
    NEW.esta_fuera_de_rango := (v_estado_valor IN ('alto', 'bajo'));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_marcar_fuera_rango ON resultado;
CREATE TRIGGER trg_marcar_fuera_rango
    BEFORE INSERT OR UPDATE OF valor_capturado ON resultado
    FOR EACH ROW
    EXECUTE FUNCTION calcular_fuera_rango();

-- ------------------------------------------------------------
-- trg_auditoria_resultado
-- Registra en historial_auditoria cualquier cambio de estado o de valor
-- capturado en un resultado ya existente (ISO 15189: ningún resultado
-- publicado se sobrescribe silenciosamente).
--
-- El backend/API debe ejecutar, dentro de la misma transacción, antes
-- del UPDATE:
--   SET LOCAL app.current_user_id = '<id_usuario autenticado>';
--   SET LOCAL app.motivo_cambio   = '<motivo indicado por el usuario>';
-- Si no se establecen, el trigger usa el usuario "Sistema Automático" y un
-- motivo genérico, para que la auditoría nunca falle ni quede sin registrar.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_auditoria_resultado() RETURNS TRIGGER AS $$
DECLARE
    v_id_usuario INTEGER;
    v_motivo TEXT;
BEGIN
    IF NEW.estado IS NOT DISTINCT FROM OLD.estado
       AND NEW.valor_capturado IS NOT DISTINCT FROM OLD.valor_capturado THEN
        RETURN NEW; -- sin cambios relevantes para auditoría
    END IF;

    v_id_usuario := NULLIF(current_setting('app.current_user_id', true), '')::INTEGER;
    IF v_id_usuario IS NULL THEN
        SELECT id_usuario INTO v_id_usuario FROM usuario WHERE correo = 'sistema@vaclinic.local';
    END IF;

    v_motivo := NULLIF(current_setting('app.motivo_cambio', true), '');
    IF v_motivo IS NULL THEN
        v_motivo := CASE
            WHEN OLD.estado = 'Publicado' AND NEW.estado <> 'Publicado' THEN 'Corrección de informe publicado (motivo no registrado por la API)'
            ELSE 'Actualización de resultado (motivo no registrado por la API)'
        END;
    END IF;

    INSERT INTO historial_auditoria (id_resultado, id_usuario, accion, valor_anterior, valor_nuevo, motivo_cambio)
    VALUES (
        NEW.id_resultado,
        v_id_usuario,
        CASE WHEN OLD.estado = 'Publicado' THEN 'correccion_post_publicacion' ELSE 'actualizacion_resultado' END,
        'estado=' || OLD.estado || '; valor=' || OLD.valor_capturado,
        'estado=' || NEW.estado || '; valor=' || NEW.valor_capturado,
        v_motivo
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_resultado ON resultado;
CREATE TRIGGER trg_auditoria_resultado
    AFTER UPDATE ON resultado
    FOR EACH ROW
    EXECUTE FUNCTION fn_auditoria_resultado();

COMMIT;
