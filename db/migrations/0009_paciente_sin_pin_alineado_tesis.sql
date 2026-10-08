-- ============================================================
-- VACLINIC - Migración 0009: alineación con la tesis (capítulo 4).
--
-- La migración 0008 había agregado un PIN de paciente (pin_hash,
-- intentos_fallidos, bloqueado_hasta) como segundo factor para
-- /api/portal/login. Al revisar la tesis (RF07 y el caso de uso
-- "consultar resultado mediante código único"), el mecanismo de acceso
-- del paciente definido en el documento de origen es SOLO el código
-- único de consulta, vigente 12 meses — sin un PIN separado. La pantalla
-- real del Portal del Paciente (PatientPortalWelcomeView.tsx) tampoco
-- tiene ni tuvo nunca un campo de PIN.
--
-- Esta migración no elimina esas columnas (no son destructivas, y podrían
-- reutilizarse si en el futuro se decide agregar un segundo factor real),
-- solo las marca como no usadas, para que quede documentado en el propio
-- esquema por qué existen sin tener un flujo que las llene.
-- ============================================================

BEGIN;

COMMENT ON COLUMN paciente.pin_hash IS
    'NO USADO desde la migración 0009: la tesis y la pantalla real del Portal del Paciente '
    'solo contemplan el código único de consulta (tabla codigo_consulta) como mecanismo de '
    'acceso, sin un PIN separado. Columna conservada, sin eliminar, por si se decide agregar '
    'un segundo factor real en el futuro.';

COMMENT ON COLUMN paciente.intentos_fallidos IS
    'NO USADO desde la migración 0009 (ver comentario de paciente.pin_hash). El límite de '
    'intentos del acceso del paciente ahora se aplica por IP en server/routes/portal.ts, no '
    'por paciente, porque el código es el único secreto y no hay una cuenta de paciente '
    'conocida contra la cual contar intentos antes de validar el código.';

COMMENT ON COLUMN paciente.bloqueado_hasta IS
    'NO USADO desde la migración 0009 (ver comentario de paciente.pin_hash).';

COMMIT;
