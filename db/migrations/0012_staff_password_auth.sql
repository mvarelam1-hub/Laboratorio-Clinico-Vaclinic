-- ============================================================
-- VACLINIC - Migración 0012: autenticación propia de personal, sin Firebase
-- (reemplaza lo descrito en el comentario de 0008_paciente_auth_y_permisos.sql
-- sobre "Firebase Auth (columna uid)" para la parte de PERSONAL; el acceso
-- del PACIENTE -código + PIN hasheado, ver 0009- no cambia en absoluto).
--
-- Contexto real: Firebase Authentication exigía una dependencia externa
-- (firebase-admin) y una cuenta de servicio de Google
-- (FIREBASE_ADMIN_CREDENTIALS_JSON) solo para verificar quién inicia
-- sesión. Se reemplaza por un esquema propio construido únicamente con el
-- módulo `crypto` de Node (ver server/password.ts, server/totp.ts,
-- server/session.ts, server/crypto-aes.ts):
--   1) `usuario.contrasena_hash` (ya existía desde 0001, pero con datos de
--      relleno) vuelve a ser la credencial real: ahora guarda un hash
--      scrypt real en formato "salt:hash".
--   2) Segundo factor TOTP opcional (obligatorio para
--      director_laboratorio/administrador_ti, ver MANDATORY_TOTP_ROLES en
--      server/totp.ts): el secreto se guarda CIFRADO (AES-256-GCM, nunca en
--      texto plano) en `usuario.totp_secret`.
--   3) `must_change_password`: fuerza a todo usuario recién creado (incluida
--      la cuenta de arranque que crea scripts/migrate.mjs) a fijar su propia
--      contraseña antes de poder usar el sistema normalmente.
--   4) `sesion_personal`: a diferencia de un ID token de Firebase (que
--      Firebase emite/revoca y este backend nunca controlaba), la sesión
--      ahora es propia y necesita su propio registro para poder revocarla
--      individualmente en un logout, sin esperar a que venza su firma.
-- ============================================================

BEGIN;

ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS totp_secret TEXT,
    ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN usuario.uid IS
    'OBSOLETO desde esta migración: Firebase Authentication fue reemplazado por autenticación propia (server/auth-staff.ts). Columna conservada solo como referencia histórica/de migración (vinculaba la cuenta a su UID de Firebase); ya NO se usa para autenticar.';

COMMENT ON COLUMN usuario.contrasena_hash IS
    'Hash scrypt real de la contraseña del personal, formato "salt:hash" (ambos en hexadecimal) — ver server/password.ts. Antes de esta migración contenía cadenas de relleno sin uso real (la autenticación era Firebase Authentication).';

COMMENT ON COLUMN usuario.totp_secret IS
    'Secreto TOTP (RFC 6238) del usuario, CIFRADO con AES-256-GCM (server/crypto-aes.ts) antes de guardarse — nunca en texto plano. NULL mientras el usuario no haya completado el enrolamiento (POST /api/auth/totp/confirm).';

COMMENT ON COLUMN usuario.totp_enabled IS
    'TRUE solo después de confirmar el primer código TOTP válido (POST /api/auth/totp/confirm). Obligatorio para los roles de server/totp.ts::MANDATORY_TOTP_ROLES, opcional para el resto.';

COMMENT ON COLUMN usuario.must_change_password IS
    'TRUE mientras el usuario deba cambiar su contraseña inicial antes de operar con normalidad (cuentas recién creadas y la cuenta de arranque de scripts/migrate.mjs). Mientras es TRUE, la sesión emitida es "limitada": solo acepta /api/auth/change-password y /api/auth/logout (ver server/routes/index.ts).';

-- Sesiones de personal: registro necesario para poder revocar una sesión
-- individual (logout) antes de que venza su firma HMAC de 8 horas (ver
-- server/session.ts). No se reutiliza ninguna tabla existente porque esto
-- no existía en absoluto con Firebase Auth (Firebase llevaba sus propias
-- sesiones, fuera del control de este backend).
CREATE TABLE IF NOT EXISTS sesion_personal (
    id            SERIAL PRIMARY KEY,
    id_usuario    INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    session_id    TEXT NOT NULL UNIQUE,
    creado        TIMESTAMP NOT NULL DEFAULT NOW(),
    expira        TIMESTAMP NOT NULL,
    revocado_en   TIMESTAMP,
    user_agent    TEXT
);

CREATE INDEX IF NOT EXISTS idx_sesion_personal_session_id ON sesion_personal(session_id);
CREATE INDEX IF NOT EXISTS idx_sesion_personal_id_usuario ON sesion_personal(id_usuario);

COMMIT;
