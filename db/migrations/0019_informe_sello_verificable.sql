-- ============================================================
-- VACLINIC - Migración 0019: sello de integridad y verificación pública
-- del informe clínico publicado.
--
-- Contexto: ANTES, el "código QR y validación" de un informe era decorativo.
-- El hash de validación se generaba con Math.random() en el navegador
-- (ClinicContext.tsx publishReport) y el QR apuntaba a un dominio
-- (vaclinic.laboratorio.gt/valida?...) sin ninguna ruta detrás: nada en el
-- servidor podía confirmar que un PDF fuera auténtico ni que no hubiera sido
-- alterado. Un PDF clínico que cualquiera puede fabricar o editar y que
-- "se ve oficial" es un riesgo real para el paciente y para el laboratorio.
--
-- AHORA, al publicar, el SERVIDOR:
--   * genera un código de verificación aleatorio e impredecible
--     (`codigo_verificacion`, el que va dentro del QR; nunca lo decide el
--     cliente),
--   * calcula la huella SHA-256 del contenido clínico (`hash_contenido`) y
--     la guarda con la fecha del sello,
--   * y registra QUIÉN publicó (nombre, colegiado y especialidad sacados del
--     usuario autenticado, no de lo que mande el navegador).
-- GET /api/verificar/:codigo (pública) recalcula la huella desde la base y
-- la compara con la sellada: si alguien editó el informe después de
-- publicarlo, la verificación lo dice.
--
-- `codigo_verificacion_qr` (migración 0014) se conserva tal cual por
-- compatibilidad, pero NO es confiable: lo escribe el cliente.
-- ============================================================

BEGIN;

ALTER TABLE informe_clinico
    ADD COLUMN IF NOT EXISTS codigo_verificacion       TEXT,
    ADD COLUMN IF NOT EXISTS hash_contenido            TEXT,
    ADD COLUMN IF NOT EXISTS fecha_sello               TIMESTAMP,
    ADD COLUMN IF NOT EXISTS publicado_por_nombre      TEXT,
    ADD COLUMN IF NOT EXISTS publicado_por_colegiado   TEXT,
    ADD COLUMN IF NOT EXISTS publicado_por_especialidad TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_informe_codigo_verificacion
    ON informe_clinico (codigo_verificacion)
    WHERE codigo_verificacion IS NOT NULL;

-- El sello va completo o no va: código, huella y fecha siempre juntos.
ALTER TABLE informe_clinico
    ADD CONSTRAINT chk_informe_sello_completo
    CHECK ((codigo_verificacion IS NULL) = (hash_contenido IS NULL)
       AND (codigo_verificacion IS NULL) = (fecha_sello IS NULL));

COMMENT ON COLUMN informe_clinico.codigo_verificacion IS
    'Código aleatorio emitido por el servidor al publicar; va en el QR del PDF. Único.';
COMMENT ON COLUMN informe_clinico.hash_contenido IS
    'SHA-256 del contenido clínico canónico al momento de publicar (ver server/informeIntegridad.ts).';

COMMIT;
