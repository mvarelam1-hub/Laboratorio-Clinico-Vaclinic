# Pruebas de API (E11, ACS Fase 2)

Colección de Postman ejecutada con [Newman](https://www.npmjs.com/package/newman)
contra el servidor Express **real** de VACLINIC (`server.ts`), corriendo sobre
una base de datos PostgreSQL **real** (no mockeada) con el esquema completo de
`db/migrations/` y datos de prueba. A diferencia del E10 (pruebas unitarias,
con `pool`/`requireStaffAuth` sustituidos por dobles de prueba), aquí no se
sustituye nada: se prueba la aplicación de punta a punta por HTTP, incluyendo
la base de datos real, los triggers de auditoría reales y el limitador de
tasa real.

## Cómo se preparó el entorno (local, para desarrollo/pruebas)

```bash
# 1. Base de datos de prueba
sudo service postgresql start
sudo -u postgres psql -c "CREATE USER vaclinic WITH PASSWORD 'vaclinic_dev_pw';"
sudo -u postgres psql -c "CREATE DATABASE vaclinic_test OWNER vaclinic;"

# 2. Migraciones + datos de ejemplo (incluye el seed 0099, ya en el repo)
export DATABASE_URL="postgres://vaclinic:vaclinic_dev_pw@localhost:5432/vaclinic_test"
export PGSSLMODE=disable
for f in db/migrations/0001_*.sql db/migrations/0002_*.sql db/migrations/0003_*.sql \
         db/migrations/0004_*.sql db/migrations/0005_*.sql db/migrations/0006_*.sql \
         db/migrations/0007_*.sql db/migrations/0008_*.sql db/migrations/0009_*.sql \
         db/migrations/0099_seed_demo_ficticio.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

# 3. Un código de acceso al Portal para la orden de ejemplo (id_orden=1)
psql "$DATABASE_URL" -c "INSERT INTO codigo_consulta (id_orden, codigo, fecha_generacion, fecha_vigencia, estado) VALUES (1, 'DEMO1234', now(), now() + interval '30 days', 'Vigente');"

# 4. UID de personal para DEV_AUTH_BYPASS_UID (ver ETAPA3_README.md)
psql "$DATABASE_URL" -c "UPDATE usuario SET uid='uid-director-e11' WHERE rol='director_laboratorio';"
psql "$DATABASE_URL" -c "INSERT INTO usuario (uid, nombre_completo, correo, contrasena_hash, rol, estado, permisos_personalizados) VALUES ('uid-recepcionista-e11','Recepcionista Demo E11','recepcionista.e11@vaclinic.test','no-aplica-dev-bypass','recepcionista', true, '{}');"

# 5. Levantar el servidor real (identidad: director, con casi todos los permisos)
DATABASE_URL=$DATABASE_URL PGSSLMODE=disable \
PORTAL_TOKEN_SECRET="cualquier-secreto-largo" \
DEV_AUTH_BYPASS_UID="uid-director-e11" NODE_ENV=development \
npx tsx server.ts
```

## Cómo correr la colección

```bash
# Carpetas 01-04, con el servidor arriba levantado como director:
npx newman run postman/vaclinic.postman_collection.json \
  --folder "01 - Autenticacion de personal" \
  --folder "02 - Ordenes (particion de equivalencia CP-05..CP-07)" \
  --folder "03 - Resultados y Portal - ciclo de vida real (integracion)" \
  --folder "04 - Portal, valores limite de tasa (RF-14)"

# Carpeta 05: requiere REINICIAR el servidor con
# DEV_AUTH_BYPASS_UID=uid-recepcionista-e11 (ver "Limitación" abajo), y luego:
npx newman run postman/vaclinic.postman_collection.json \
  --folder "05 - Autorizacion negativa con rol limitado (ejecutar aparte, servidor con DEV_AUTH_BYPASS_UID=uid-recepcionista-e11)"
```

La colección se genera desde `build_collection.py` (evita errores de JSON
escrito a mano): `python3 postman/build_collection.py > postman/vaclinic.postman_collection.json`.

## Qué cubre cada carpeta

1. **Autenticación de personal** — sin token (401) vs. con identidad válida (200), contra el middleware `requireStaffAuth` real.
2. **Órdenes** — partición de equivalencia de `POST /api/ordenes` (CP-05 a CP-07 del E3): orden válida, `examenesIds` vacío, `idPaciente` faltante, examen inexistente (verifica que la transacción real haga `ROLLBACK`, no solo que el HTTP responda 400).
3. **Resultados y Portal, integración real** — el ciclo de vida completo Borrador → Validado → Publicado → En corrección contra la base real, confirmando en cada paso que el Portal del paciente (`GET /api/portal/orden`) solo expone el resultado cuando está `Publicado` (antes y después de cada transición), y que el trigger real `trg_auditoria_resultado` efectivamente escribe una versión consultable en `GET /:id/historial` — algo que las pruebas unitarias con mocks (E10) no pueden demostrar por sí solas.
4. **Portal, valores límite de tasa (RF-14)** — 20 intentos con código inválido: el intento 20 (acumulado 21 contando el login válido de la carpeta 3) responde `429`, replicando a nivel de API real la misma prueba de valores límite que el E10 hace con un mock del limitador.
5. **Autorización negativa con rol limitado** — el mismo usuario "recepcionista" (sin `validacion_firma_digital`, `admin_bitacora_auditoria` ni `analizadores_panico`) recibe `403` real en las tres rutas protegidas correspondientes.

## Resultado real de la última corrida (12-sep-2026)

- Carpetas 01–04: **37 requests, 48 aserciones, 0 fallos**.
- Carpeta 05: **3 requests, 3 aserciones, 0 fallos**.
- Total: **40 requests / 51 aserciones, 0 fallos**, contra el servidor Express real y PostgreSQL real.

## Limitación conocida (documentada, no oculta)

`DEV_AUTH_BYPASS_UID` (`server/auth-firebase.ts`) se lee de `process.env` en
cada petición, pero su valor es fijo mientras el proceso del servidor está
vivo — no hay forma de "cambiar de usuario" entre peticiones de una misma
corrida de Newman sin reiniciar el servidor con otro valor. Por eso la
carpeta 05 (que necesita un rol con MENOS permisos) se ejecuta en una
segunda corrida, con el servidor reiniciado. Esto es una limitación del
mecanismo de bypass para pruebas locales (documentado así en
`ETAPA3_README.md`), no del diseño de las pruebas: en producción cada
petición trae su propio token real de Firebase, así que esta limitación no
existe fuera de este atajo de desarrollo.
