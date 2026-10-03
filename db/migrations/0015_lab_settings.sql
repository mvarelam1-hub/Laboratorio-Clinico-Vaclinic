-- ============================================================
-- VACLINIC - Migración 0015: persistencia de configuración del laboratorio
-- (LabSettings).
--
-- Contexto (Fase 1 - Persistencia): los ajustes del laboratorio
-- (membrete, colores, firmas, márgenes, watermark, etc.) se almacenaban 100%
-- en localStorage (149 líneas en LabSettings interface, ClinicContext.tsx
-- `labSettings`, consumido por 20 archivos del frontend). Estos ajustes son
-- la identidad y branding del reporte impreso: cambios deben ser visibles
-- para todos los usuarios del mismo laboratorio. La sincronización
-- localStorage → localhost solo funcionaba dentro una misma sesión/navegador.
--
-- Diseño: tabla única `configuracion_laboratorio` con:
-- - Columnas reales para los campos que se consultan por filtrado o por
--   frecuencia de acceso (labName, email, phone, paperSize, fontFamily,
--   primaryColor, etc.).
-- - Columna JSONB (`datos_adicionales`) para el resto de la estructura
--   (watermark specifics, margins, signatures, footer modes, etc.) que es
--   específica del frontend y puede cambiar sin afectar queries.
-- - Sin soft-delete: la configuración del laboratorio no se "elimina"
--   -nunca hay motivo de auditoría-, solo se modifica. Revertir cambios
--   es un UPDATE normal. Aunque hay auditoria (user_id, timestamp), es
--   simple: track que cambió y quién, no mantener historial completo.
--
-- Una sola fila por laboratorio (id_laboratorio = 1, valores por defecto
-- iguales a INITIAL_LAB_SETTINGS del frontend).
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS configuracion_laboratorio (
    id_configuracion        SERIAL PRIMARY KEY,
    id_laboratorio          INTEGER NOT NULL DEFAULT 1, -- Always 1 for single-lab first phase

    -- 1. Identidad institucional (columnas reales)
    nombre_laboratorio      TEXT NOT NULL DEFAULT 'VACLINIC',
    nombre_legal            TEXT,
    eslogan                 TEXT,
    nit_ruc                 TEXT,
    registro_sanitario      TEXT,
    acreditacion_iso        TEXT,
    direccion               TEXT,
    ciudad                  TEXT,
    departamento_estado     TEXT,
    telefono                TEXT,
    telefono_secundario     TEXT,
    whatsapp_numero         TEXT,
    email                   TEXT NOT NULL,
    website                 TEXT,
    lista_especialidades    TEXT,

    -- 2. Configuración de página (columnas reales)
    tamaño_papel            TEXT NOT NULL DEFAULT 'letter' -- 'letter' | 'a4' | 'legal'
                             CHECK (tamaño_papel IN ('letter', 'a4', 'legal')),
    orientacion             TEXT NOT NULL DEFAULT 'portrait' -- 'portrait' | 'landscape'
                             CHECK (orientacion IN ('portrait', 'landscape')),
    familia_tipografia      TEXT NOT NULL DEFAULT 'sans' -- 'inter' | 'sans' | 'serif' | 'arial' | 'jakarta' | 'mono'
                             CHECK (familia_tipografia IN ('inter', 'sans', 'serif', 'arial', 'jakarta', 'mono')),
    tamaño_fuente_base_pt   NUMERIC(3,1) NOT NULL DEFAULT 11.0,

    -- 3. Colores (columnas reales)
    color_primario          TEXT NOT NULL DEFAULT '#0d9488', -- Hex color
    preset_color_primario   TEXT NOT NULL DEFAULT 'teal',
    color_secundario        TEXT,
    color_acento            TEXT,
    color_encabezado_tabla  TEXT,
    color_texto_encabezado  TEXT,
    color_valor_critico     TEXT,
    color_valor_bajo        TEXT,
    color_valor_normal      TEXT,
    color_fondo_pagina      TEXT,

    -- 4. Resto de configuración (JSONB)
    -- Incluye:
    --  - headerMode, logoType, logoUrl, logoPosition, bannerImageUrl
    --  - footerMode, footerBannerUrl
    --  - signers array, signatures layout, digital timestamps
    --  - margins (top/bottom/left/right)
    --  - tableDensity, tableHeaderStyle, tableZebraStriping
    --  - watermark settings (preset, custom text, image, position, opacity)
    --  - QR settings (position, size, validation URL)
    --  - legalDisclaimer, confidentialityNotice
    --  - currencySymbol, currencyCode, whatsappTemplate
    --  - flags: autoPrintTubeBarcodes, enableIsoWatermark, showPageNumbers, etc.
    datos_adicionales       JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Auditoría: no soft-delete, solo track cambios
    id_usuario_ultima_mod   INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    fecha_creacion          TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion     TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(id_laboratorio)
);

CREATE INDEX IF NOT EXISTS idx_config_laboratorio ON configuracion_laboratorio (id_laboratorio);

COMMIT;
