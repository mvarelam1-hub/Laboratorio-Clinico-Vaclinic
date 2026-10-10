-- ============================================================
-- VACLINIC - Migración 0022: recuperación de contraseña del personal
-- por enlace enviado al correo.
--
-- Cada solicitud guarda SOLO el hash SHA-256 del token (el token en claro
-- viaja únicamente en el enlace del correo y nunca se almacena), vence a
-- los 5 minutos y se puede usar una sola vez. Si una base de datos se
-- filtrara, estos hashes no sirven para entrar.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS recuperacion_contrasena (
    id            SERIAL PRIMARY KEY,
    id_usuario    INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    token_hash    TEXT NOT NULL UNIQUE,
    creado        TIMESTAMP NOT NULL DEFAULT NOW(),
    expira        TIMESTAMP NOT NULL,
    usado_en      TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recuperacion_contrasena_usuario
    ON recuperacion_contrasena (id_usuario);

COMMIT;
