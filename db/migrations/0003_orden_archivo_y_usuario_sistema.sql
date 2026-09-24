-- ============================================================
-- VACLINIC - Migración 0003: soporte de archivo de órdenes y usuario de sistema
-- El frontend (ArchivedOrdersView.tsx, archiveOrder()) ya maneja el concepto
-- de "orden archivada" en localStorage, pero la tabla `orden` no lo contemplaba.
-- También se crea un usuario técnico "Sistema Automático" para que los
-- triggers de auditoría (migración 0005) siempre tengan un responsable
-- cuando la acción la dispara la base de datos y no una petición autenticada.
-- ============================================================

BEGIN;

ALTER TABLE orden
    ADD COLUMN IF NOT EXISTS archivada BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS fecha_archivo TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_orden_archivada ON orden (archivada);

INSERT INTO usuario (nombre_completo, correo, contrasena_hash, rol, estado)
VALUES ('Sistema Automático VACLINIC', 'sistema@vaclinic.local', 'no_login', 'sistema', TRUE)
ON CONFLICT (correo) DO NOTHING;

COMMIT;
