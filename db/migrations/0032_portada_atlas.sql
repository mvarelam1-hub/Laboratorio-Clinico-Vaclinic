-- =====================================================================
-- VACLINIC - Migración 0032: imágenes del Atlas Microscópico.
--
-- Cada elemento del Atlas Microscópico del portal del paciente puede tener
-- su propia imagen (Ajustes → "8. Portada del acceso"). Se guardan en la
-- misma tabla de imágenes de la portada con la clave `atlas_<id>` (minúsculas,
-- números y guion bajo). La restricción de `clave` solo permitía las
-- posiciones fijas, así que se amplía para aceptar también esas claves.
-- =====================================================================

BEGIN;

-- Quita la restricción anterior de `clave` (sin depender de su nombre) y
-- crea otra que además acepta las claves del Atlas.
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
    CHECK (
        clave IN (
            'logo', 'fondo', 'fondo_pagina', 'escudo',
            'area_hematologia', 'area_parasitos', 'area_cristales', 'area_quimica',
            'nosotros_vision', 'nosotros_mision', 'nosotros_servicios',
            'equipo_1', 'equipo_2', 'equipo_3', 'equipo_4'
        )
        OR clave ~ '^atlas_[a-z0-9_]{1,50}$'
    );

COMMIT;
