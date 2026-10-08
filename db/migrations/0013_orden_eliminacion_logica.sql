-- ============================================================
-- VACLINIC - Migración 0013: eliminación lógica (soft-delete) y
-- auditoría de usuario/motivo en el ciclo de vida de `orden`.
--
-- Contexto (Fase 1 - Persistencia, informe técnico sección 4.3
-- "Eliminación lógica, no borrado físico"): "Pacientes, órdenes,
-- resultados e informes clínicos no deberían eliminarse físicamente.
-- Se recomienda soft-delete con estado, fecha, usuario y motivo de
-- anulación." Hallazgo de esta fase: updateOrder/deleteOrder/
-- archiveOrder/restoreOrder/bulk* en ClinicContext.tsx eran 100%
-- locales (sin llamada a la API) y, peor aún, deleteOrder/
-- bulkDeleteOrders hacían un `setOrders(prev => prev.filter(...))`
-- -un borrado FÍSICO del lado del navegador- que, de haber llegado a
-- sincronizarse, habría significado perder para siempre una orden
-- clínica. Esta migración prepara la base de datos para que "eliminar"
-- una orden desde el backend (server/routes/ordenes.ts) sea siempre
-- una marca lógica, nunca un DELETE real.
--
-- El archivado (archivada/fecha_archivo) ya existía desde la migración
-- 0003; aquí se le agrega el usuario responsable para completar el
-- mismo estándar de auditoría (usuario + fecha ya existían, faltaba
-- "quién").
-- ============================================================

BEGIN;

ALTER TABLE orden
    ADD COLUMN IF NOT EXISTS eliminada BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS fecha_eliminacion TIMESTAMP,
    ADD COLUMN IF NOT EXISTS id_usuario_eliminacion INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS motivo_eliminacion TEXT,
    ADD COLUMN IF NOT EXISTS id_usuario_archivo INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orden_eliminada ON orden (eliminada);

COMMIT;
