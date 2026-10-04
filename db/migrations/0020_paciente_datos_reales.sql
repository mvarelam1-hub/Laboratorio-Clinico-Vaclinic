-- ============================================================
-- VACLINIC - Migración 0020: el registro de pacientes deja de exigir datos que
-- la pantalla de admisión tenía que INVENTAR.
--
-- Contexto: `paciente.telefono_whatsapp` era NOT NULL y `fecha_nacimiento`
-- NOT NULL. Cuando el paciente no daba teléfono, la pantalla "Nueva orden"
-- rellenaba '502-5555-0000' (y un correo falso, tipo de sangre O+, nacimiento
-- 1995-01-01 ...) para que el INSERT no fallara. Un registro clínico con datos
-- inventados es peor que uno incompleto: el correo falso podía recibir
-- resultados reales y una edad falsa cambia los rangos de referencia.
--
-- AHORA:
--   * El teléfono es opcional, pero debe existir AL MENOS un medio de contacto
--     (teléfono o correo): chk_paciente_contacto. Los registros existentes
--     cumplen (todos tienen teléfono); no se tocan.
--   * Si el paciente solo sabe su edad, la fecha de nacimiento se calcula y se
--     marca con `fecha_nacimiento_estimada = TRUE`, para no confundir una
--     estimación con una fecha oficial.
-- ============================================================

BEGIN;

ALTER TABLE paciente ALTER COLUMN telefono_whatsapp DROP NOT NULL;

ALTER TABLE paciente
    ADD COLUMN IF NOT EXISTS fecha_nacimiento_estimada BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE paciente
    ADD CONSTRAINT chk_paciente_contacto
    CHECK (telefono_whatsapp IS NOT NULL OR correo IS NOT NULL);

COMMENT ON COLUMN paciente.fecha_nacimiento_estimada IS
    'TRUE si la fecha se calculó a partir de la edad que dijo el paciente (no es la fecha oficial).';

COMMIT;
