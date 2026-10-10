-- Correo real para la cuenta de administrador de arranque.
-- La cuenta nació con admin.sistemas@vaclinic.local, un dominio que no existe y
-- no puede recibir correo (la recuperación de contraseña/usuario no le llegaba).
-- Se cambia SOLO si la cuenta de arranque sigue existiendo y el correo nuevo
-- no lo usa otra cuenta; si ya se editó a mano desde Usuarios y roles, no hace nada.
BEGIN;

UPDATE usuario
   SET correo = 'mvarelam1@miumg.edu.gt'
 WHERE correo = 'admin.sistemas@vaclinic.local'
   AND NOT EXISTS (SELECT 1 FROM usuario WHERE correo = 'mvarelam1@miumg.edu.gt');

COMMIT;
