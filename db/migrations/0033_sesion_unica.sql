-- ============================================================
-- 0033_sesion_unica.sql
-- Una sola sesión activa por usuario del personal.
--
-- Al iniciar sesión, las sesiones anteriores de ese mismo usuario se
-- revocan. Esta columna guarda el motivo para que la página que se cierra
-- pueda decirle al usuario por qué ("iniciaron sesión en otro lugar") en
-- vez de un error genérico.
-- ============================================================

BEGIN;

ALTER TABLE sesion_personal
    ADD COLUMN IF NOT EXISTS revocado_motivo TEXT;

COMMIT;
