-- ============================================================
-- VACLINIC - Migración 0001: Esquema inicial (equivalente a src/db/schema.ts)
-- Curso: Seminario de TI / Aseguramiento de la Calidad de Software - UMG
-- Traduce a SQL puro las 13 tablas ya definidas en Drizzle (schema.ts),
-- que hasta ahora existían solo como definición TypeScript sin usarse.
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario       SERIAL PRIMARY KEY,
    uid              TEXT UNIQUE,                 -- Firebase Auth UID
    nombre_completo  TEXT NOT NULL,
    correo           TEXT NOT NULL UNIQUE,
    contrasena_hash  TEXT NOT NULL,
    rol              TEXT NOT NULL,
    especialidad     TEXT,
    numero_colegiado TEXT,
    pin_code         TEXT,                        -- ver migración 0002: se elimina el uso como credencial única
    estado           BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paciente (
    id_paciente             SERIAL PRIMARY KEY,
    nombre_completo         TEXT NOT NULL,
    dni                     TEXT,
    fecha_nacimiento        DATE NOT NULL,
    genero                  TEXT,
    telefono_whatsapp       TEXT NOT NULL,
    correo                  TEXT,
    direccion               TEXT,
    es_menor_edad           BOOLEAN NOT NULL DEFAULT FALSE,
    nombre_encargado_legal  TEXT,
    telefono_encargado_legal TEXT,
    fecha_registro          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medico_tratante (
    id_medico         SERIAL PRIMARY KEY,
    nombre_completo   TEXT NOT NULL,
    numero_colegiado  TEXT NOT NULL UNIQUE,
    telefono          TEXT,
    correo            TEXT,
    especialidad      TEXT,
    estado_suscripcion TEXT NOT NULL DEFAULT 'Activa'
);

CREATE TABLE IF NOT EXISTS paciente_medico_autorizacion (
    id_autorizacion   SERIAL PRIMARY KEY,
    id_paciente       INTEGER NOT NULL REFERENCES paciente(id_paciente) ON DELETE RESTRICT,
    id_medico         INTEGER NOT NULL REFERENCES medico_tratante(id_medico) ON DELETE RESTRICT,
    fecha_autorizacion TIMESTAMP NOT NULL DEFAULT NOW(),
    estado            TEXT NOT NULL DEFAULT 'Activa'
);

CREATE TABLE IF NOT EXISTS orden (
    id_orden         SERIAL PRIMARY KEY,
    numero_orden     TEXT NOT NULL UNIQUE,
    id_paciente      INTEGER NOT NULL REFERENCES paciente(id_paciente) ON DELETE RESTRICT,
    id_recepcionista INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    id_medico        INTEGER REFERENCES medico_tratante(id_medico) ON DELETE SET NULL,
    fecha_registro   TIMESTAMP NOT NULL DEFAULT NOW(),
    estado           TEXT NOT NULL DEFAULT 'Registrada',
    total_cobrado    NUMERIC(10,2) DEFAULT 0,
    sede             TEXT DEFAULT 'Sede Central'
);

CREATE TABLE IF NOT EXISTS codigo_consulta (
    id_codigo        SERIAL PRIMARY KEY,
    id_orden         INTEGER NOT NULL UNIQUE REFERENCES orden(id_orden) ON DELETE CASCADE,
    codigo           TEXT NOT NULL UNIQUE,
    fecha_generacion TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_vigencia   DATE NOT NULL,
    estado           TEXT NOT NULL DEFAULT 'Vigente'
);

CREATE TABLE IF NOT EXISTS examen (
    id_examen             SERIAL PRIMARY KEY,
    codigo_examen         TEXT UNIQUE,
    nombre_examen         TEXT NOT NULL,
    categoria             TEXT,
    tipo_muestra          TEXT NOT NULL,
    contenedor_requerido  TEXT,
    precio                NUMERIC(10,2) DEFAULT 0,
    unidad_medida         TEXT,
    tiempo_entrega_horas  INTEGER DEFAULT 24,
    metodo                TEXT
);

CREATE TABLE IF NOT EXISTS rango_referencia (
    id_rango           SERIAL PRIMARY KEY,
    id_examen          INTEGER NOT NULL REFERENCES examen(id_examen) ON DELETE CASCADE,
    id_administrador   INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    genero             TEXT DEFAULT 'Ambos',
    edad_minima        INTEGER DEFAULT 0,
    edad_maxima        INTEGER DEFAULT 120,
    valor_minimo       NUMERIC(10,2),
    valor_maximo       NUMERIC(10,2),
    texto_referencia   TEXT,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detalle_orden (
    id_detalle       SERIAL PRIMARY KEY,
    id_orden         INTEGER NOT NULL REFERENCES orden(id_orden) ON DELETE CASCADE,
    id_examen        INTEGER NOT NULL REFERENCES examen(id_examen) ON DELETE RESTRICT,
    precio_unitario  NUMERIC(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS resultado (
    id_resultado          SERIAL PRIMARY KEY,
    id_detalle            INTEGER NOT NULL UNIQUE REFERENCES detalle_orden(id_detalle) ON DELETE CASCADE,
    id_analista            INTEGER REFERENCES usuario(id_usuario) ON DELETE SET NULL,
    valor_capturado        TEXT NOT NULL,
    estado                 TEXT NOT NULL DEFAULT 'Borrador',
    esta_fuera_de_rango    BOOLEAN DEFAULT FALSE,
    interpretacion_clinica TEXT,
    fecha_captura          TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_publicacion      TIMESTAMP,
    validado_por_nombre    TEXT
);

CREATE TABLE IF NOT EXISTS historial_auditoria (
    id_registro    SERIAL PRIMARY KEY,
    id_resultado   INTEGER REFERENCES resultado(id_resultado) ON DELETE SET NULL,
    id_usuario     INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    accion         TEXT NOT NULL,
    valor_anterior TEXT,
    valor_nuevo    TEXT,
    motivo_cambio  TEXT NOT NULL,
    ip_origen      TEXT,
    fecha_hora     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notificacion (
    id_notificacion SERIAL PRIMARY KEY,
    id_resultado    INTEGER REFERENCES resultado(id_resultado) ON DELETE SET NULL,
    canal           TEXT NOT NULL DEFAULT 'WhatsApp',
    destinatario    TEXT NOT NULL,
    mensaje         TEXT,
    estado_envio    TEXT NOT NULL DEFAULT 'Pendiente',
    intentos        INTEGER NOT NULL DEFAULT 0,
    fecha_envio     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reporte_administrativo (
    id_reporte         SERIAL PRIMARY KEY,
    id_administrador   INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    rango_fecha_inicio DATE NOT NULL,
    rango_fecha_fin    DATE NOT NULL,
    tipo_reporte       TEXT NOT NULL,
    parametros_filtro  TEXT,
    fecha_generacion   TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;
