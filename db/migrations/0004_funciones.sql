-- ============================================================
-- VACLINIC - Migración 0004: Funciones
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- fn_evaluar_rango_referencia
-- Determina si un valor numérico está normal / bajo / alto para un examen,
-- estratificado por género y edad (equivalente en BD de
-- src/utils/referenceRangeEvaluator.ts, que hoy solo corre en el navegador
-- y por lo tanto puede ser manipulado por el cliente).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_evaluar_rango_referencia(
    p_id_examen INTEGER,
    p_valor NUMERIC,
    p_genero TEXT,
    p_edad INTEGER
) RETURNS TEXT AS $$
DECLARE
    v_rango RECORD;
BEGIN
    SELECT valor_minimo, valor_maximo
    INTO v_rango
    FROM rango_referencia
    WHERE id_examen = p_id_examen
      AND (genero = 'Ambos' OR genero = p_genero)
      AND p_edad BETWEEN edad_minima AND edad_maxima
    ORDER BY (genero = p_genero) DESC -- prioriza un rango específico de género sobre "Ambos"
    LIMIT 1;

    IF NOT FOUND OR v_rango.valor_minimo IS NULL OR v_rango.valor_maximo IS NULL THEN
        RETURN 'sin_rango_definido';
    ELSIF p_valor < v_rango.valor_minimo THEN
        RETURN 'bajo';
    ELSIF p_valor > v_rango.valor_maximo THEN
        RETURN 'alto';
    ELSE
        RETURN 'normal';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_evaluar_rango_referencia IS
    'Clasifica un valor de examen contra rango_referencia según género y edad del paciente. Usada por trg_marcar_fuera_rango.';

-- ------------------------------------------------------------
-- fn_generar_codigo_consulta
-- Genera un código de acceso único y no adivinable para que un paciente
-- consulte una orden específica (reemplaza el esquema actual del frontend
-- donde el código/PIN vive en texto plano dentro del arreglo de pacientes
-- cargado completo en el navegador).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_generar_codigo_consulta(p_id_orden INTEGER, p_dias_vigencia INTEGER DEFAULT 30)
RETURNS TEXT AS $$
DECLARE
    v_codigo TEXT;
    v_intentos INTEGER := 0;
BEGIN
    LOOP
        v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM codigo_consulta WHERE codigo = v_codigo);
        v_intentos := v_intentos + 1;
        IF v_intentos > 10 THEN
            RAISE EXCEPTION 'No se pudo generar un código de consulta único tras % intentos', v_intentos;
        END IF;
    END LOOP;

    INSERT INTO codigo_consulta (id_orden, codigo, fecha_vigencia, estado)
    VALUES (p_id_orden, v_codigo, (CURRENT_DATE + (p_dias_vigencia || ' days')::interval), 'Vigente')
    ON CONFLICT (id_orden) DO UPDATE
        SET codigo = EXCLUDED.codigo,
            fecha_vigencia = EXCLUDED.fecha_vigencia,
            estado = 'Vigente',
            fecha_generacion = NOW();

    RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_generar_codigo_consulta IS
    'Genera (o renueva) el código seguro de consulta pública de una orden, con fecha de vigencia.';

-- ------------------------------------------------------------
-- fn_historial_resultado
-- Reconstruye, a partir de historial_auditoria, todas las versiones de
-- un resultado (soporta el requisito de que una corrección genere
-- una nueva versión consultable, con responsable/fecha/motivo).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_historial_resultado(p_id_resultado INTEGER)
RETURNS TABLE (
    version_num BIGINT,
    accion TEXT,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    responsable TEXT,
    motivo_cambio TEXT,
    fecha_hora TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY h.fecha_hora ASC) AS version_num,
        h.accion,
        h.valor_anterior,
        h.valor_nuevo,
        u.nombre_completo AS responsable,
        h.motivo_cambio,
        h.fecha_hora
    FROM historial_auditoria h
    JOIN usuario u ON u.id_usuario = h.id_usuario
    WHERE h.id_resultado = p_id_resultado
    ORDER BY h.fecha_hora ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_historial_resultado IS
    'Devuelve el historial de versiones de un resultado (para la vista de corrección de informes de la Etapa 4).';

COMMIT;
