-- ============================================================
-- VACLINIC - Migración 0016: metadata de pago, prioridad y biometría
-- en la orden (requerimiento P0 "Pagos/caja reales" del informe técnico).
--
-- Contexto (Fase 1 - Persistencia): LabOrder.priority, .paymentMethod,
-- .pendingBalance, .appliedPromo, .bedRoom, .isHighRisk,
-- .biometricAuthorized/.biometricAuthData -y el `status` operativo
-- (Pendiente/En Proceso/Listo/Entregado) que conduce toda la UI de
-- seguimiento- vivían 100% en el estado de React (`orders`, ver
-- ClinicContext.tsx `updateOrder`). server/routes/ordenes.ts (migración
-- 0013) ya comentaba explícitamente esta brecha: "prioridad, método de
-- pago o datos biométricos todavía no existen en `orden`". Tampoco se
-- guardaba nunca `total_cobrado` -quedaba en 0 desde la creación-, pese a
-- que POST /api/ordenes sí conoce el precio de cada examen.
--
-- `estado` (columna ya existente desde la migración 0001, valores
-- Registrada/En proceso/Completada/Cancelada) es un estado administrativo
-- que NINGUNA ruta transiciona hoy -se fija una sola vez al crear la
-- orden y nunca se vuelve a tocar-. El `status` operativo del frontend
-- (Pendiente/En Proceso/Listo/Entregado, el que decide p.ej. cuándo
-- disparar la notificación push de "resultados listos") es un concepto
-- DISTINTO: no se reutiliza `estado` para no introducir una transición
-- clínica incorrecta entre dos vocabularios que no corresponden 1:1
-- (según ya advertía el comentario de la migración 0013). En su lugar se
-- agrega `estado_flujo`, con el vocabulario exacto del frontend.
--
-- Diseño: columnas reales -todas estas son filtradas o mostradas en el
-- dashboard/admisión real, no son datos anidados de interfaz-, sin
-- JSONB: `datos_biometricos` es la única excepción porque
-- LabOrder.biometricAuthData ya es un objeto anidado (method,
-- authorizedBy, staffRole, timestamp, credentialId, confidenceScore,
-- deviceType) y no hay necesidad de columnas separadas para cada campo.
-- ============================================================

BEGIN;

ALTER TABLE orden
    ADD COLUMN IF NOT EXISTS prioridad TEXT NOT NULL DEFAULT 'rutina'
        CHECK (prioridad IN ('rutina', 'urgente', 'stat_panico')),
    ADD COLUMN IF NOT EXISTS estado_flujo TEXT NOT NULL DEFAULT 'Pendiente'
        CHECK (estado_flujo IN ('Pendiente', 'En Proceso', 'Listo', 'Entregado')),
    ADD COLUMN IF NOT EXISTS metodo_pago TEXT
        CHECK (metodo_pago IS NULL OR metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'seguro', 'por_cobrar')),
    ADD COLUMN IF NOT EXISTS saldo_pendiente NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS promo_aplicada TEXT,
    ADD COLUMN IF NOT EXISTS sede_cama TEXT,
    ADD COLUMN IF NOT EXISTS es_alto_riesgo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS biometria_autorizada BOOLEAN NOT NULL DEFAULT FALSE,
    -- { method, authorizedBy, staffRole, timestamp, credentialId?,
    --   confidenceScore?, deviceType? } -ver LabOrder.biometricAuthData.
    ADD COLUMN IF NOT EXISTS datos_biometricos JSONB;

CREATE INDEX IF NOT EXISTS idx_orden_prioridad ON orden (prioridad);
CREATE INDEX IF NOT EXISTS idx_orden_estado_flujo ON orden (estado_flujo);

COMMIT;
