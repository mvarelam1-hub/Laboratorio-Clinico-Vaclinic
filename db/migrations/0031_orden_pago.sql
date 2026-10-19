-- =====================================================================
-- VACLINIC - Migración 0031: pagos de exámenes agregados a una orden.
--
-- Cuando hay que agregar un examen a una orden que ya existe, recepción
-- registra el número de pago (boleta o recibo de caja) que lo respalda.
-- Cada número queda ligado a su orden, con el monto cobrado y quién lo
-- registró, y no puede repetirse en otra orden (evita errores de captura
-- y que un mismo comprobante justifique dos cobros).
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS orden_pago (
    id_pago      SERIAL PRIMARY KEY,
    id_orden     INTEGER NOT NULL REFERENCES orden(id_orden) ON DELETE CASCADE,
    numero_pago  TEXT NOT NULL,
    monto        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (monto >= 0),
    concepto     TEXT NOT NULL DEFAULT 'examen_adicional',
    id_usuario   INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    fecha_pago   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_orden_pago_numero ON orden_pago (lower(numero_pago));
CREATE INDEX IF NOT EXISTS idx_orden_pago_orden ON orden_pago (id_orden);

COMMIT;
