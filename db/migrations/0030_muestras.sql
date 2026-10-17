-- =====================================================================
-- VACLINIC - Migración 0030: muestras (tubos y recipientes) ligadas a la
-- orden.
--
-- ANTES: "Recepción de muestras" guardaba los tubos solo en la memoria de la
-- pantalla (se perdían al recargar) y no estaban ligados a ninguna orden.
-- AHORA: cada tubo/recipiente es una fila real, con su código de barras
-- único, su orden, su estado, su calidad pre-analítica y quién lo registró y
-- quién lo recibió. Los códigos de barras los genera el servidor (nunca el
-- navegador) para que no se repitan.
-- =====================================================================

BEGIN;

CREATE SEQUENCE IF NOT EXISTS muestra_codigo_seq START 1;

CREATE TABLE IF NOT EXISTS muestra (
    id_muestra         SERIAL PRIMARY KEY,
    codigo_barras      TEXT NOT NULL UNIQUE,
    id_orden           INTEGER NOT NULL REFERENCES orden(id_orden) ON DELETE CASCADE,
    categoria          TEXT NOT NULL DEFAULT 'tubo'
                       CHECK (categoria IN ('tubo', 'recipiente', 'hisopo')),
    tipo_contenedor    TEXT NOT NULL,
    etiqueta_contenedor TEXT NOT NULL,
    examenes           TEXT[] NOT NULL DEFAULT '{}',
    flebotomista       TEXT,
    fecha_recoleccion  TIMESTAMP NOT NULL DEFAULT NOW(),
    estado             TEXT NOT NULL DEFAULT 'recolectada'
                       CHECK (estado IN ('recolectada', 'en_proceso', 'analizada', 'rechazada')),
    calidad            TEXT NOT NULL DEFAULT 'optima'
                       CHECK (calidad IN ('optima', 'hemolisis_leve', 'hemolisis_severa', 'lipemica', 'coagulada')),
    motivo_rechazo     TEXT,
    id_registrador     INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    id_receptor        INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    fecha_recepcion    TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_muestra_orden  ON muestra (id_orden);
CREATE INDEX IF NOT EXISTS idx_muestra_estado ON muestra (estado);
CREATE INDEX IF NOT EXISTS idx_muestra_fecha  ON muestra (fecha_recoleccion DESC);

COMMENT ON TABLE muestra IS
    'Tubos/recipientes de una orden (recepción y trazabilidad pre-analítica).';
COMMENT ON COLUMN muestra.id_receptor IS
    'Usuario que escaneó el código en recepción (pasa la muestra a "en_proceso").';

COMMIT;
