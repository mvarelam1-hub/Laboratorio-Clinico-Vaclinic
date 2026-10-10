-- ============================================================
-- VACLINIC - Migración 0028: estilo "apple" (oscuro) para el tema del laboratorio.
--
-- Amplía la lista de estilos permitidos de la migración 0027 ('bosque', 'monad')
-- con 'apple'. Las filas existentes no cambian.
-- ============================================================

BEGIN;

ALTER TABLE tema_laboratorio DROP CONSTRAINT IF EXISTS tema_laboratorio_estilo_check;
ALTER TABLE tema_laboratorio
    ADD CONSTRAINT tema_laboratorio_estilo_check CHECK (estilo IN ('bosque', 'monad', 'apple'));

COMMIT;
