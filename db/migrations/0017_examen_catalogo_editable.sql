-- ============================================================
-- VACLINIC - Migración 0017: catálogo de exámenes editable desde el
-- backend real (antes 100% de solo lectura).
--
-- Contexto (Fase 1 - Persistencia): server/routes/examenes.ts solo
-- exponía GET / y GET /:id -ya lo documentaba un comentario propio del
-- archivo, señalando explícitamente que faltaban rutas de escritura
-- protegidas por catalogo_tarifas_editar/catalogo_rangos_editar-. Mientras
-- tanto, ClinicContext.tsx (addCatalogTest/updateCatalogTest/
-- bulkUpdateCatalogTests/deleteCatalogTest) mutaba LabCatalogItem 100% en
-- localStorage, sin tocar nunca la tabla `examen`. Esto es un riesgo de
-- negocio real, no solo un hueco técnico: POST /api/ordenes calcula
-- total_cobrado leyendo examen.precio (ver migración 0016) -si alguien
-- "actualiza" un precio en el catálogo desde la UI, la orden real se sigue
-- cobrando con el precio viejo que quedó en Postgres, un desfase
-- silencioso entre lo que el usuario ve y lo que de verdad se factura.
--
-- Diseño: igual patrón que configuracion_laboratorio/informe_clinico -
-- columnas reales para lo que ya se filtra o muestra en el catálogo
-- (nombre técnico, nombre de categoría, tipo de resultado, estado,
-- visibilidad de venta, perfil/fábrica), JSONB para el resto de
-- LabCatalogItem que no tiene necesidad de columna propia (rango de
-- referencia textual, min/max, instrucciones al paciente, ayuno,
-- significancia clínica, rango de pánico, parámetros incluidos).
--
-- `tipo_muestra`, `contenedor_requerido`, `metodo`, `unidad_medida` y
-- `tiempo_entrega_horas` YA EXISTEN desde la migración 0001 y ya
-- corresponden 1:1 a sampleType/tubeType/methodology/unit/deliveryTime de
-- LabCatalogItem -no se duplican aquí-.
--
-- Nunca se agrega una ruta DELETE física: igual que orden/informe_clinico,
-- un examen del catálogo no se borra -se desactiva (`estado = 'Inactivo'`,
-- ya cubierto por el PATCH general)-, porque detalle_orden.id_examen tiene
-- ON DELETE RESTRICT (migración 0001): un examen ya usado en alguna orden
-- real no podría borrarse de todas formas sin violar esa integridad.
-- ============================================================

BEGIN;

ALTER TABLE examen
    ADD COLUMN IF NOT EXISTS nombre_tecnico TEXT,
    ADD COLUMN IF NOT EXISTS categoria_nombre TEXT,
    ADD COLUMN IF NOT EXISTS tipo_resultado TEXT NOT NULL DEFAULT 'Numérico'
        CHECK (tipo_resultado IN ('Numérico', 'Texto', 'Opciones')),
    ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'Activo'
        CHECK (estado IN ('Activo', 'Inactivo')),
    ADD COLUMN IF NOT EXISTS visible_venta BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS es_perfil BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS es_fabrica BOOLEAN NOT NULL DEFAULT FALSE,
    -- { description, referenceRange, minVal, maxVal, fasting,
    --   requiresFasting, patientInstructions, panicRange, parametersCount,
    --   includedParameters, clinicalSignificance } -ver LabCatalogItem.
    ADD COLUMN IF NOT EXISTS datos_adicionales JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS id_usuario_ultima_mod INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW();

-- Los 161 exámenes ya sembrados por la migración 0010 (catálogo de fábrica
-- de src/data/factoryCatalog.ts) quedan marcados como tales -mismo
-- concepto que LabCatalogItem.isFactory en el frontend, que hoy distingue
-- "de fábrica" (no editable/eliminable desde cero) de "personalizado".
UPDATE examen SET es_fabrica = TRUE WHERE codigo_examen IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_examen_estado ON examen (estado);
CREATE INDEX IF NOT EXISTS idx_examen_categoria ON examen (categoria);

COMMIT;
