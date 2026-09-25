# E6 — Notas de despliegue real (Neon + Render)

**Responsable:** Juan José Flores Figueroa — Ingeniero de Plataforma / DevOps

## Qué hice

- Creé el proyecto de base de datos PostgreSQL administrada en Neon.
- Configuré el servicio web en Render, conectado al repositorio de GitHub.
- Cargué las variables de entorno secretas: `DATABASE_URL`, credenciales de Firebase Admin, y el secreto del token de portal.
- Ejecuté las nueve migraciones del proyecto una por una directamente contra la base de datos de producción, verificando cada una por conteo de objetos antes de continuar con la siguiente.

## Hallazgos durante el despliegue

- El primer despliegue quedó en estado "Live" en Render incluso antes de configurar `DATABASE_URL`, porque el servidor no se detiene si falta esa variable. Verifiqué en los logs que el mensaje de error desaparecía después de cargar las tres variables secretas, para confirmar que sí se estaban usando.
- Firebase Authentication devuelve `auth/operation-not-allowed` en producción porque el método de correo/contraseña no está habilitado todavía en la consola de ese proyecto de Firebase — brecha declarada en E6.

## Qué haría distinto

Configuraría las variables de entorno completas antes del primer despliegue, y habilitaría el proveedor de autenticación por correo/contraseña desde el registro inicial del proyecto en Firebase.
