-- ============================================================
-- VACLINIC - Migración 0024: imágenes de la portada del login del personal.
--
-- La portada (logo, fondo de la tarjeta, fondo de la pantalla, escudo y los 4 íconos de áreas) la elige el propio
-- laboratorio desde Ajustes, sin tocar código. Se guardan en la base de datos
-- (BYTEA) porque el disco de Render se borra en cada reinicio/redespliegue.
-- Una fila por posición; si no hay fila, la pantalla usa el dibujo por defecto.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS portada_imagen (
    clave          TEXT PRIMARY KEY
                   CHECK (clave IN ('logo', 'fondo', 'fondo_pagina', 'escudo', 'area_hematologia', 'area_parasitos', 'area_cristales', 'area_quimica')),
    tipo_mime      TEXT NOT NULL CHECK (tipo_mime IN ('image/png', 'image/jpeg', 'image/webp')),
    datos          BYTEA NOT NULL,
    tamano_bytes   INTEGER NOT NULL CHECK (tamano_bytes > 0),
    actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
    id_usuario     INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

COMMIT;
