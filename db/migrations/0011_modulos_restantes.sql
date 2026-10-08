-- ============================================================
-- VACLINIC - Migración 0011: los 9 módulos que hasta ahora existían
-- SOLO en localStorage del frontend, sin ninguna tabla real. A diferencia
-- de pacientes/órdenes/resultados (que ya tenían backend probado y solo
-- faltaba conectarlo), aquí no existía ningún esquema -se diseña desde cero
-- a partir del modelo de datos real que ya usa el frontend (ver
-- src/types.ts, src/types/reagentInventory.ts y src/context/ClinicContext.tsx).
--
-- Alcance y decisiones de diseño (declaradas explícitamente, no implícitas):
--  1) Carpetas de órdenes: tabla nueva + FK real en `orden`.
--  2) Episodios 4D: tabla nueva con FK a `paciente` (el frontend no los
--     enlaza con `orden` hoy; se agrega esa FK como opcional/nullable
--     porque el episodio se crea en un paso separado de la orden).
--  3) Transferencias de muestra: tabla nueva, sin FK real (las sucursales
--     -BranchSiteId- no tienen tabla propia en este esquema; se guardan
--     como texto, igual que ya hace `orden.sede`).
--  4) Perfiles personalizados: tabla nueva; los tests embebidos se
--     guardan como JSONB porque dependen de LabCatalogItem, que es un
--     catálogo del FRONTEND (factoryCatalog.ts) sin ids reales de la
--     tabla `examen` -normalizarlos exigiría antes migrar ese catálogo,
--     fuera de alcance de este cambio.
--  5) Personal/roles: se REUTILIZA `usuario` (ya tenía casi todo:
--     rol con CHECK real, permisos_personalizados JSONB) en vez de crear
--     una tabla paralela -antes esto era un sistema de identidad
--     "LabStaffUser" separado del real; ahora es el mismo. Se agrega
--     `rol_permiso_default` para persistir ediciones a los permisos por
--     rol (ver nota de alcance en el comentario de esa tabla: no cambia
--     todavía la autorización real del servidor, solo la configuración).
--     Se REUTILIZA `historial_auditoria` (ya existía, ya tenía trigger
--     real de auditoría de resultados) como la bitácora general también,
--     en vez de crear una tabla de auditoría paralela.
--  6) Reactivos: tabla + su bitácora de movimientos (alto volumen,
--     append-only, tabla propia).
--  7) Plantillas de informe: tabla nueva; `defaultParameters` como JSONB
--     (mismo argumento que perfiles personalizados: son snapshots de
--     ReportParameter, no filas con id propio).
--  8) Chat interno: tabla nueva (alto volumen).
--  9) Preferencias de notificación de paciente: tabla nueva, 1:1 con
--     `paciente` -CORRIGE un defecto real del frontend, donde hoy es un
--     único objeto global compartido por cualquiera que use el navegador,
--     no una preferencia por paciente a pesar de su nombre.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1) Carpetas de órdenes (OrderFolder)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carpeta_orden (
    id_carpeta    SERIAL PRIMARY KEY,
    nombre        TEXT NOT NULL,
    color         TEXT NOT NULL DEFAULT 'slate',
    icono         TEXT DEFAULT 'Folder',
    descripcion   TEXT,
    es_sistema    BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE orden
    ADD COLUMN IF NOT EXISTS id_carpeta INTEGER REFERENCES carpeta_orden(id_carpeta) ON DELETE SET NULL;

-- Carpetas de sistema (no se pueden borrar, igual que INITIAL_ORDER_FOLDERS
-- en el frontend: 'folder-all' es solo una vista, no una carpeta real).
INSERT INTO carpeta_orden (id_carpeta, nombre, color, icono, es_sistema)
VALUES (1, 'Sin asignar', 'slate', 'FolderOpen', TRUE)
ON CONFLICT (id_carpeta) DO NOTHING;
SELECT setval('carpeta_orden_id_carpeta_seq', GREATEST((SELECT MAX(id_carpeta) FROM carpeta_orden), 1));

-- ------------------------------------------------------------
-- 2) Episodios 4D (LabEpisode)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS episodio_4d (
    id_episodio         SERIAL PRIMARY KEY,
    numero_episodio      TEXT NOT NULL UNIQUE,
    id_paciente          INTEGER NOT NULL REFERENCES paciente(id_paciente) ON DELETE RESTRICT,
    id_orden             INTEGER REFERENCES orden(id_orden) ON DELETE SET NULL,
    tipo_paciente        TEXT,
    programa_salud       TEXT,
    origen               TEXT,
    medico_referente      TEXT,
    sede                 TEXT DEFAULT 'Sede Central',
    hora_admision        TIMESTAMP NOT NULL DEFAULT NOW(),
    hora_flebotomia       TIMESTAMP,
    hora_inicio_analizador TIMESTAMP,
    hora_validacion       TIMESTAMP,
    dimension_actual      TEXT NOT NULL DEFAULT 'D1_admision'
                             CHECK (dimension_actual IN ('D1_admision', 'D2_flebotomia', 'D3_analizadores', 'D4_validacion')),
    prioridad            TEXT NOT NULL DEFAULT 'rutina'
                             CHECK (prioridad IN ('rutina', 'urgente', 'stat_panico')),
    pruebas_solicitadas   TEXT[] NOT NULL DEFAULT '{}',
    codigos_tubo          TEXT[] NOT NULL DEFAULT '{}',
    tipo_muestra          TEXT,
    tat_objetivo_minutos   INTEGER NOT NULL DEFAULT 180,
    tat_transcurrido_minutos INTEGER NOT NULL DEFAULT 0,
    marca_duplicidad       BOOLEAN NOT NULL DEFAULT FALSE,
    detalle_duplicidad     TEXT,
    transferido           BOOLEAN NOT NULL DEFAULT FALSE,
    sede_destino          TEXT,
    notas                TEXT
);
CREATE INDEX IF NOT EXISTS idx_episodio_paciente ON episodio_4d(id_paciente);

-- ------------------------------------------------------------
-- 3) Transferencias de muestra entre sedes (SampleTransferManifest)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transferencia_muestra (
    id_transferencia     SERIAL PRIMARY KEY,
    codigo_manifiesto     TEXT NOT NULL UNIQUE,
    sede_origen          TEXT NOT NULL,
    sede_destino         TEXT NOT NULL,
    nombre_mensajero      TEXT NOT NULL,
    hora_salida          TIMESTAMP NOT NULL,
    hora_llegada_estimada  TIMESTAMP NOT NULL,
    hora_llegada_real      TIMESTAMP,
    estado               TEXT NOT NULL DEFAULT 'en_transito'
                             CHECK (estado IN ('en_transito', 'entregado', 'retrasado')),
    control_temperatura    TEXT NOT NULL
                             CHECK (control_temperatura IN ('2_8_grados', 'congelado_menos_20', 'temperatura_ambiente')),
    temperatura_registrada NUMERIC(5,2),
    cantidad_muestras      INTEGER NOT NULL DEFAULT 0,
    codigos_muestras       TEXT[] NOT NULL DEFAULT '{}',
    fecha_creacion         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 4) Perfiles personalizados de catálogo (LabCustomProfile)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfil_personalizado (
    id_perfil        SERIAL PRIMARY KEY,
    codigo           TEXT NOT NULL UNIQUE,
    nombre           TEXT NOT NULL,
    nombre_categoria  TEXT,
    precio           NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_regular    NUMERIC(10,2),
    descripcion      TEXT,
    ids_examenes      TEXT[] NOT NULL DEFAULT '{}',
    nombres_examenes   TEXT[] NOT NULL DEFAULT '{}',
    -- ProfileTestItem[] completo tal como lo usa el frontend (JSONB porque
    -- depende del catálogo LabCatalogItem, que todavía no es real -ver nota
    -- de alcance al inicio del archivo).
    pruebas          JSONB NOT NULL DEFAULT '[]'::jsonb,
    estado           TEXT NOT NULL DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    basado_en        TEXT,
    creado_por       TEXT,
    notas            TEXT,
    es_perfil_fabrica BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5) Personal y roles: se extiende `usuario` (ya existía) en vez de
--    duplicar un sistema de identidad paralelo.
-- ------------------------------------------------------------
ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS nombre_usuario TEXT,
    ADD COLUMN IF NOT EXISTS telefono TEXT,
    ADD COLUMN IF NOT EXISTS sede_asignada TEXT DEFAULT 'todas',
    ADD COLUMN IF NOT EXISTS color_avatar TEXT,
    ADD COLUMN IF NOT EXISTS texto_sello_firma TEXT,
    ADD COLUMN IF NOT EXISTS url_imagen_firma TEXT,
    ADD COLUMN IF NOT EXISTS doble_factor_habilitado BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS notas TEXT,
    ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_nombre_usuario ON usuario(nombre_usuario) WHERE nombre_usuario IS NOT NULL;

-- `contrasena_hash` es un remanente de ANTES de que la Etapa 3 (migración
-- 0008) pivotara la autenticación real de personal a Firebase Auth (`uid`).
-- No se usa en ningún lado del backend actual (verificado: 0 referencias en
-- server/) y bloquearía crear personal nuevo por la API real (que enlaza
-- por `uid`, no por contraseña) si se deja NOT NULL.
ALTER TABLE usuario ALTER COLUMN contrasena_hash DROP NOT NULL;
COMMENT ON COLUMN usuario.contrasena_hash IS
    'OBSOLETO desde Etapa 3 (ver migración 0008): la autenticación real de personal es Firebase Auth (columna uid). Este campo ya no se usa en el backend.';

-- Credenciales biométricas (StaffBiometricCredential[]) — tabla propia
-- porque un usuario puede tener varias (huella + rostro + llave física).
CREATE TABLE IF NOT EXISTS credencial_biometrica (
    id_credencial     SERIAL PRIMARY KEY,
    id_usuario        INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    credential_id      TEXT NOT NULL UNIQUE,
    raw_id_base64      TEXT,
    nombre            TEXT NOT NULL,
    etiqueta_dedo      TEXT,
    tipo              TEXT NOT NULL CHECK (tipo IN ('fingerprint', 'facial', 'passkey', 'hardware_token')),
    fecha_creacion     TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_ultimo_uso    TIMESTAMP,
    info_dispositivo    TEXT,
    algoritmo         TEXT,
    transportes        TEXT[],
    es_webauthn_nativo  BOOLEAN DEFAULT FALSE,
    aaguid            TEXT
);

-- Overrides persistidos de LOS PERMISOS POR DEFECTO DE UN ROL (equivalente
-- real de `updateRolePermissions` en ClinicContext.tsx). NOTA DE ALCANCE
-- IMPORTANTE, declarada honestamente: esta tabla persiste la CONFIGURACIÓN
-- deseada -las rutas nuevas de este módulo sí leen/escriben aquí de
-- verdad-, pero la AUTORIZACIÓN real del servidor (hasPermission en
-- src/shared/permissions.ts, usada por requirePermission en cada ruta
-- protegida) sigue leyendo los permisos por defecto fijos en código
-- (INITIAL_ROLES_CONFIG), no esta tabla. Cambiarlo requeriría volver
-- asíncrona una función pura compartida por 15+ rutas ya probadas y por el
-- frontend -un refactor de seguridad más grande, deliberadamente fuera de
-- alcance de este cambio para no arriesgar la autorización real sin una
-- revisión aparte. Sirve hoy para que la pantalla de administración de
-- roles guarde y muestre configuraciones reales, no solo simuladas.
CREATE TABLE IF NOT EXISTS rol_permiso_default (
    id_rol       TEXT NOT NULL,
    id_permiso   TEXT NOT NULL,
    habilitado   BOOLEAN NOT NULL DEFAULT FALSE,
    actualizado_por INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id_rol, id_permiso)
);

-- Bitácora general de administración (creación/edición de personal, roles,
-- catálogo, episodios, etc.) — REUTILIZA `historial_auditoria`, que ya
-- existía con un trigger real de auditoría de resultados, en vez de crear
-- una tabla de bitácora paralela. `modulo`/`severidad` son nuevas y
-- nullable a propósito: las filas que ya inserta el trigger
-- trg_auditoria_resultado no las traen y deben seguir funcionando igual.
ALTER TABLE historial_auditoria
    ADD COLUMN IF NOT EXISTS modulo TEXT,
    ADD COLUMN IF NOT EXISTS severidad TEXT DEFAULT 'info' CHECK (severidad IN ('info', 'warning', 'critical'));

-- `motivo_cambio` es NOT NULL desde la migración 0001 (pensado para
-- resultados, donde una corrección siempre exige motivo); un evento
-- administrativo genérico (ej. "Rol actualizado") no siempre tiene un
-- "motivo" real que dar -se relaja para permitir reutilizar esta tabla.
ALTER TABLE historial_auditoria ALTER COLUMN motivo_cambio DROP NOT NULL;

-- ------------------------------------------------------------
-- 6) Reactivos e insumos (ReagentInventoryItem + ReagentMovementLog)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reactivo (
    id_reactivo       SERIAL PRIMARY KEY,
    codigo            TEXT NOT NULL UNIQUE,
    nombre            TEXT NOT NULL,
    categoria         TEXT NOT NULL,
    pruebas_asociadas  TEXT[] NOT NULL DEFAULT '{}',
    numero_lote        TEXT NOT NULL,
    fecha_vencimiento   DATE NOT NULL,
    stock_actual       NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock_minimo_alerta NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock_optimo       NUMERIC(10,2) NOT NULL DEFAULT 0,
    unidad            TEXT NOT NULL,
    condicion_almacenamiento TEXT
                             CHECK (condicion_almacenamiento IN ('refrigerado_2_8', 'congelado_menos_20', 'temperatura_ambiente', 'protegido_luz')),
    proveedor         TEXT,
    ubicacion         TEXT,
    costo_por_unidad    NUMERIC(10,2) DEFAULT 0,
    pruebas_por_unidad  NUMERIC(10,2) DEFAULT 1,
    estado            TEXT NOT NULL DEFAULT 'optimo'
                             CHECK (estado IN ('optimo', 'bajo_stock', 'critico', 'vencido')),
    notas             TEXT,
    fecha_ultimo_reabasto TIMESTAMP,
    fecha_actualizacion  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimiento_reactivo (
    id_movimiento    SERIAL PRIMARY KEY,
    id_reactivo      INTEGER NOT NULL REFERENCES reactivo(id_reactivo) ON DELETE CASCADE,
    tipo            TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida_consumo', 'ajuste', 'baja_vencimiento')),
    cantidad         NUMERIC(10,2) NOT NULL,
    stock_anterior    NUMERIC(10,2) NOT NULL,
    stock_nuevo       NUMERIC(10,2) NOT NULL,
    motivo          TEXT,
    id_operador      INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    fecha           TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_movimiento_reactivo_reactivo ON movimiento_reactivo(id_reactivo);

-- ------------------------------------------------------------
-- 7) Plantillas de informe (ReportTemplate)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plantilla_informe (
    id_plantilla       TEXT PRIMARY KEY, -- el frontend genera y reutiliza su propio id (upsert real, ver addTemplate)
    nombre             TEXT NOT NULL,
    categoria          TEXT NOT NULL,
    descripcion        TEXT,
    -- ReportParameter[] sin id propio, tal como los guarda el frontend hoy.
    parametros_default  JSONB NOT NULL DEFAULT '[]'::jsonb,
    recomendaciones_default TEXT[] NOT NULL DEFAULT '{}',
    tipo_muestra        TEXT,
    tipo_tubo          TEXT,
    tubos_requeridos     TEXT[],
    notas_preanaliticas   TEXT,
    regla_alerta_panico   TEXT,
    estandar_cumplimiento TEXT,
    puntaje_cumplimiento  NUMERIC(5,2),
    fecha_ultima_auditoria TIMESTAMP,
    fecha_creacion       TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 8) Chat interno (LabChatMessage)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mensaje_chat (
    id_mensaje        SERIAL PRIMARY KEY,
    id_canal          TEXT NOT NULL, -- id de canal fijo, o id de conversación directa
    id_emisor         INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    id_destinatario     INTEGER REFERENCES usuario(id_usuario) ON DELETE CASCADE, -- solo en mensajes directos (1 a 1)
    contenido         TEXT NOT NULL,
    prioridad         TEXT NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('normal', 'urgente', 'panico')),
    id_episodio_referencia INTEGER REFERENCES episodio_4d(id_episodio) ON DELETE SET NULL,
    leido_por          INTEGER[] NOT NULL DEFAULT '{}', -- ids de usuario.id_usuario que ya lo leyeron
    reacciones         JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{emoji, count, users}], igual forma que el frontend
    fecha             TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mensaje_chat_canal ON mensaje_chat(id_canal, fecha);

-- ------------------------------------------------------------
-- 9) Preferencias de notificación por PACIENTE (PatientNotificationPreferences)
--    CORRIGE un defecto real: en el frontend hoy es UN SOLO objeto global
--    (localStorage, sin id_paciente), no una preferencia por paciente a
--    pesar del nombre del tipo. Aquí sí queda 1:1 con `paciente`.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preferencia_notificacion_paciente (
    id_paciente          INTEGER PRIMARY KEY REFERENCES paciente(id_paciente) ON DELETE CASCADE,
    push_web_habilitado    BOOLEAN NOT NULL DEFAULT TRUE,
    push_firebase_habilitado BOOLEAN NOT NULL DEFAULT FALSE,
    alertas_whatsapp       BOOLEAN NOT NULL DEFAULT TRUE,
    alertas_correo         BOOLEAN NOT NULL DEFAULT FALSE,
    solo_alertas_criticas    BOOLEAN NOT NULL DEFAULT FALSE,
    consejos_salud_habilitado BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_actualizacion      TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;
