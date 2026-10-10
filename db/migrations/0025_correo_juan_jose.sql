-- Corrige el correo (usuario de acceso) de Juan José Flores.
-- Se registró como jjfloresf5@miumg.edu.gt, pero su correo real es
-- jfloresf5@miumg.edu.gt, así que ni el enlace de recuperación ni el
-- recordatorio de usuario le llegaban. Solo cambia si la cuenta con el
-- correo viejo existe y el correo nuevo no lo usa otra cuenta; si ya se
-- corrigió a mano desde Usuarios y roles, no hace nada.
BEGIN;

UPDATE usuario
   SET correo = 'jfloresf5@miumg.edu.gt'
 WHERE correo = 'jjfloresf5@miumg.edu.gt'
   AND NOT EXISTS (SELECT 1 FROM usuario WHERE correo = 'jfloresf5@miumg.edu.gt');

COMMIT;
