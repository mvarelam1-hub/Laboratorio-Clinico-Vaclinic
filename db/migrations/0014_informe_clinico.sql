-- ============================================================
-- VACLINIC - Migración 0014: persistencia real del informe clínico
-- (MedicalReport).
--
-- Contexto (Fase 1 - Persistencia): este era, por lejos, el hueco más
-- grande encontrado en esta fase (27 archivos del frontend consumen
-- `MedicalReport`, ver ClinicContext.tsx `reports`). ANTES: el informe
-- -título, hallazgos clínicos, conclusiones del médico, explicación para
-- el paciente generada por IA, recomendaciones, firma digital, código QR
-- de verificación, el reporte adjunto del analizador- vivía 100% en
-- localStorage. Lo único que SÍ llegaba a Postgres era, indirectamente,
-- un valor numérico/textual por examen vía la tabla `resultado`
-- (ClinicContext.tsx `syncCapturaResultados`) -el documento del informe en
-- sí nunca se guardaba.
--
-- Diseño: se sigue el mismo patrón ya usado para `plantilla_informe`
-- (migración 0011) -columnas reales para los campos que de verdad importa
-- poder consultar o filtrar (estado, categoría, título, fechas, QR), y una
-- columna JSONB (`datos_json`) para el resto de la estructura, que es
-- grande, anidada y específica del frontend (parámetros, firma digital,
-- reporte adjunto del analizador, snapshot de datos del paciente, flags de
-- qué incluir al imprimir). Mismo estándar de auditoría ya aplicado a
-- `orden` en la migración 0013: usuario + fecha en creación, publicación
-- y eliminación lógica -un informe clínico nunca se borra físicamente
-- (informe técnico, sección 4.3: "Pacientes, órdenes, resultados e
-- informes clínicos no deberían eliminarse físicamente").
--
-- Un informe puede originarse sin una orden real en Postgres todavía
-- (id_orden nullable) -ej. un informe cargado manualmente sin pasar por
-- el flujo de creación de orden real-, pero cuando sí la tiene, queda
-- enlazado. También se agrega `resultado.id_informe`: hasta ahora el
-- enlace "qué resultados pertenecen a qué informe" solo existía de forma
-- transitoria en el estado de React (`resultadosRemotos`), nunca en la
-- base de datos.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS informe_clinico (
    id_informe              SERIAL PRIMARY KEY,
    id_orden                INTEGER REFERENCES orden(id_orden) ON DELETE SET NULL,
    numero_informe          TEXT NOT NULL UNIQUE,
    categoria               TEXT NOT NULL DEFAULT 'laboratorio',
    titulo                  TEXT NOT NULL,
    estado                  TEXT NOT NULL DEFAULT 'borrador'
                             CHECK (estado IN ('borrador', 'revision', 'publicado', 'entregado')),
    fecha_muestra           TIMESTAMP,
    fecha_emision           TIMESTAMP,
    hallazgos_clinicos      TEXT,
    conclusiones_medico     TEXT,
    explicacion_paciente    TEXT,
    recomendaciones         TEXT[] DEFAULT '{}',
    codigo_verificacion_qr  TEXT UNIQUE,
    -- Resto de MedicalReport (parameters, signature, attachedAnalyzerReport,
    -- snapshot de datos del paciente, flags de impresión, etc.) — ver
    -- server/routes/informes.ts para la lista exacta de claves que guarda.
    datos_json              JSONB NOT NULL DEFAULT '{}'::jsonb,
    id_usuario_creacion     INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    fecha_creacion          TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion     TIMESTAMP NOT NULL DEFAULT NOW(),
    id_usuario_publicacion  INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    fecha_publicacion       TIMESTAMP,
    eliminado               BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_eliminacion       TIMESTAMP,
    id_usuario_eliminacion  INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    motivo_eliminacion      TEXT
);

CREATE INDEX IF NOT EXISTS idx_informe_orden ON informe_clinico (id_orden);
CREATE INDEX IF NOT EXISTS idx_informe_estado ON informe_clinico (estado);
CREATE INDEX IF NOT EXISTS idx_informe_eliminado ON informe_clinico (eliminado);

ALTER TABLE resultado
    ADD COLUMN IF NOT EXISTS id_informe INTEGER REFERENCES informe_clinico(id_informe) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_resultado_informe ON resultado (id_informe);

COMMIT;
