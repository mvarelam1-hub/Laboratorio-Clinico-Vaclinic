-- ============================================================
-- VACLINIC - Migración 0008: soporte para autenticación real
-- Etapa 3: cuentas individuales de personal (Firebase Auth) y
-- acceso seguro de paciente (código + PIN con hash, con bloqueo por intentos).
-- ============================================================

BEGIN;

-- Nombres de rol unificados: el mismo catálogo que ya usa el frontend
-- (src/shared/permissions.ts) y que ahora también usará el backend.
ALTER TABLE usuario
    ADD CONSTRAINT chk_usuario_rol
    CHECK (rol IN (
        'director_laboratorio', 'bioanalista_senior', 'bioanalista',
        'tecnico_flebotomista', 'recepcionista', 'auditor_calidad',
        'administrador_ti', 'sistema'
    ));

-- Permisos individuales que sobrescriben el rol (equivalente de
-- LabStaffUser.customPermissions en el frontend, ahora también en servidor).
ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS permisos_personalizados JSONB NOT NULL DEFAULT '{}'::jsonb;

-- El PIN de 4 dígitos deja de ser la credencial: ya no se usa para autenticar,
-- solo queda como referencia histórica. La autenticación real es Firebase Auth
-- (columna `uid`, ya existía) verificada en el backend.
COMMENT ON COLUMN usuario.pin_code IS
    'OBSOLETO desde Etapa 3: ya no se usa para autenticar. La autenticación real es Firebase Auth (columna uid) verificada por el backend.';

-- Acceso seguro del paciente: código + PIN con hash (nunca texto plano),
-- con bloqueo temporal tras varios intentos fallidos.
ALTER TABLE paciente
    ADD COLUMN IF NOT EXISTS pin_hash TEXT,
    ADD COLUMN IF NOT EXISTS intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP;

COMMIT;
