-- ============================================================
-- VACLINIC - Migración 0021: contenido público del Portal del Paciente
-- (noticias de salud y promociones del laboratorio).
--
-- Contexto: el portal público debe poder informar y promocionar al
-- laboratorio, pero SIN contenido inventado: antes la pantalla de
-- "Promociones" del personal mostraba descuentos y "usos" de ejemplo que
-- nunca existieron. Ahora todo lo que ve el público lo escribe y publica
-- el propio laboratorio; si no hay nada publicado, el portal lo dice.
--
-- Una fila es una NOTICIA/consejo de salud o una PROMOCIÓN. Solo se
-- muestran al público las filas con `publicado = TRUE` (y, en promociones,
-- cuya vigencia no haya terminado).
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS contenido_publico (
    id_contenido        SERIAL PRIMARY KEY,
    tipo                TEXT NOT NULL CHECK (tipo IN ('noticia', 'promocion')),
    titulo              TEXT NOT NULL,
    resumen             TEXT NOT NULL DEFAULT '',
    cuerpo              TEXT NOT NULL DEFAULT '',
    etiqueta            TEXT,
    fuente              TEXT,
    enlace              TEXT,
    fecha_publicacion   DATE NOT NULL DEFAULT CURRENT_DATE,
    vigente_hasta       DATE,
    publicado           BOOLEAN NOT NULL DEFAULT FALSE,
    id_usuario_ultima_mod INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    fecha_creacion      TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contenido_publico_publico
    ON contenido_publico (tipo, publicado, fecha_publicacion DESC);

COMMIT;
