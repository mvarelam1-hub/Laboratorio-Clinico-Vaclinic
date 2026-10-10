-- ============================================================
-- VACLINIC - Migración 0026: paleta de colores del sistema.
--
-- El laboratorio elige su paleta desde Ajustes ("9. Paleta del sistema") y
-- se aplica a todos los usuarios y al portal del paciente. Es una sola fila
-- (id = 1) con 4 colores #rrggbb; si no hay fila, se ve el diseño original.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS tema_laboratorio (
    id             SMALLINT PRIMARY KEY CHECK (id = 1),
    paleta         TEXT,
    colores        JSONB NOT NULL,
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    id_usuario     INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

COMMIT;
