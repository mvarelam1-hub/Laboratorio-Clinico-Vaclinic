-- ============================================================
-- VACLINIC - Migración 0007: Procedimientos almacenados
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- sp_archivar_ordenes_antiguas
-- Archiva (no elimina) órdenes completadas hace más de p_dias días,
-- equivalente en BD de archiveOrder()/ArchivedOrdersView.tsx del frontend,
-- pensado para ejecutarse periódicamente (cron del backend o del proveedor
-- de base de datos) en vez de depender de que el personal lo haga a mano.
-- ------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_archivar_ordenes_antiguas(p_dias INTEGER DEFAULT 90)
LANGUAGE plpgsql
AS $$
DECLARE
    v_afectadas INTEGER;
BEGIN
    UPDATE orden
    SET archivada = TRUE,
        fecha_archivo = NOW()
    WHERE archivada = FALSE
      AND estado IN ('Completada', 'Cancelada')
      AND fecha_registro < (NOW() - (p_dias || ' days')::interval);

    GET DIAGNOSTICS v_afectadas = ROW_COUNT;

    INSERT INTO historial_auditoria (id_usuario, accion, valor_nuevo, motivo_cambio)
    SELECT id_usuario, 'archivado_automatico', v_afectadas || ' orden(es) archivada(s)',
           'Ejecución de sp_archivar_ordenes_antiguas (> ' || p_dias || ' días)'
    FROM usuario WHERE correo = 'sistema@vaclinic.local';

    RAISE NOTICE 'sp_archivar_ordenes_antiguas: % orden(es) archivada(s)', v_afectadas;
END;
$$;

COMMENT ON PROCEDURE sp_archivar_ordenes_antiguas IS
    'Archiva órdenes completadas/canceladas más antiguas que p_dias y deja constancia en auditoría.';

COMMIT;
