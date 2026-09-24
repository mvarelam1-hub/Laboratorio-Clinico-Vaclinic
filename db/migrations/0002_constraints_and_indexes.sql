-- ============================================================
-- VACLINIC - Migración 0002: Restricciones de integridad e índices
-- Objetivo: reglas de negocio que Drizzle (schema.ts) no expresaba
-- (Drizzle solo declaraba tipos y FKs; no había ningún CHECK ni índice
-- adicional a las PK/UNIQUE implícitas).
-- ============================================================

BEGIN;

-- Estados válidos y unificados (evita valores libres inconsistentes en la app)
ALTER TABLE orden
    ADD CONSTRAINT chk_orden_estado
    CHECK (estado IN ('Registrada', 'En proceso', 'Completada', 'Cancelada'));

ALTER TABLE resultado
    ADD CONSTRAINT chk_resultado_estado
    CHECK (estado IN ('Borrador', 'Validado', 'Publicado', 'En correccion'));

ALTER TABLE codigo_consulta
    ADD CONSTRAINT chk_codigo_estado
    CHECK (estado IN ('Vigente', 'Usado', 'Expirado', 'Revocado'));

ALTER TABLE notificacion
    ADD CONSTRAINT chk_notificacion_estado
    CHECK (estado_envio IN ('Pendiente', 'Enviado', 'Fallido'));

-- Un menor de edad debe tener encargado legal registrado (regla clínica/legal real)
ALTER TABLE paciente
    ADD CONSTRAINT chk_menor_requiere_encargado
    CHECK (
        es_menor_edad = FALSE
        OR (nombre_encargado_legal IS NOT NULL AND telefono_encargado_legal IS NOT NULL)
    );

-- Rango de referencia coherente
ALTER TABLE rango_referencia
    ADD CONSTRAINT chk_rango_valores
    CHECK (valor_minimo IS NULL OR valor_maximo IS NULL OR valor_minimo <= valor_maximo);

ALTER TABLE rango_referencia
    ADD CONSTRAINT chk_rango_edades
    CHECK (edad_minima <= edad_maxima);

-- Un resultado publicado siempre debe tener fecha de publicación (y viceversa)
ALTER TABLE resultado
    ADD CONSTRAINT chk_resultado_publicado_fecha
    CHECK (
        (estado = 'Publicado' AND fecha_publicacion IS NOT NULL)
        OR (estado <> 'Publicado')
    );

-- ------------------------------------------------------------
-- Índices para las búsquedas reales que hace la aplicación:
--   - Buscador de pacientes por DNI (QuickPatientSearchModal, PatientManager)
--   - Listado de órdenes por estado (OrdersListView, dashboard)
--   - Consulta pública por código de acceso (Portal del paciente)
--   - Auditoría por resultado y por fecha (AuditLogsView)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_paciente_dni ON paciente (dni);
CREATE INDEX IF NOT EXISTS idx_orden_estado ON orden (estado);
CREATE INDEX IF NOT EXISTS idx_orden_numero ON orden (numero_orden);
CREATE INDEX IF NOT EXISTS idx_resultado_estado ON resultado (estado);
CREATE INDEX IF NOT EXISTS idx_codigo_consulta_codigo ON codigo_consulta (codigo);
CREATE INDEX IF NOT EXISTS idx_historial_resultado ON historial_auditoria (id_resultado);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_auditoria (fecha_hora);

COMMIT;
