-- ============================================================
-- VACLINIC - Migración 0027: estilo visual del sistema.
--
-- Además de los 4 colores (migración 0026), el laboratorio elige un "estilo":
-- 'bosque' (el diseño actual) o 'monad' (pergamino, títulos en serif, texto en
-- monoespaciada). Las filas que ya existían quedan en 'bosque'.
-- ============================================================

BEGIN;

ALTER TABLE tema_laboratorio
    ADD COLUMN IF NOT EXISTS estilo TEXT NOT NULL DEFAULT 'bosque'
    CHECK (estilo IN ('bosque', 'monad'));

COMMIT;
