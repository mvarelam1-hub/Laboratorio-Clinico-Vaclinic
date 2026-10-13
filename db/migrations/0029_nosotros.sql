-- =====================================================================
-- VACLINIC - Migración 0029: pestaña "Nosotros" del Portal del Paciente.
--
-- 1) Textos de "Nosotros" (visión, misión, valores y equipo): los escribe
--    el propio laboratorio desde Ajustes. Es UNA sola fila (id = 1) con los
--    datos en JSONB; si no hay fila, el portal muestra textos por defecto.
-- 2) Las fotos de esa pestaña (visión, misión, fondo de servicios y fotos
--    del equipo) usan la misma tabla de imágenes de la portada, así que se
--    amplía la lista de posiciones permitidas.
-- =====================================================================

BEGIN;

-- Quita la restricción anterior de `clave` (sin depender de su nombre) y
-- crea otra con las posiciones nuevas.
DO $$
DECLARE c RECORD;
BEGIN
    FOR c IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'portada_imagen'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%area_quimica%'
    LOOP
        EXECUTE format('ALTER TABLE portada_imagen DROP CONSTRAINT %I', c.conname);
    END LOOP;
END $$;

ALTER TABLE portada_imagen
    ADD CONSTRAINT portada_imagen_clave_check
    CHECK (clave IN (
        'logo', 'fondo', 'fondo_pagina', 'escudo',
        'area_hematologia', 'area_parasitos', 'area_cristales', 'area_quimica',
        'nosotros_vision', 'nosotros_mision', 'nosotros_servicios',
        'equipo_1', 'equipo_2', 'equipo_3', 'equipo_4'
    ));

CREATE TABLE IF NOT EXISTS nosotros_contenido (
    id             SMALLINT PRIMARY KEY CHECK (id = 1),
    datos          JSONB NOT NULL,
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    id_usuario     INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

COMMIT;
