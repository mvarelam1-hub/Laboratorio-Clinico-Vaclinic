# VACLINIC

Sistema de gestión de laboratorio clínico (LIS). Arquitectura cliente-servidor
separada: frontend React 19 + Vite + TypeScript (`src/`), backend Express +
TypeScript (`server.ts`, `server/`), base de datos PostgreSQL (`db/migrations/`).

Proyecto propio del equipo (Grupo 3), originado como Proyecto de Graduación /
Seminario de Tecnologías de Información, UMG. Evaluado en el curso
Aseguramiento de la Calidad de Software (ACS) como aplicación bajo prueba
("origen: desarrollo propio del equipo", enunciado ACS sección 2.2).

## Instalación

```bash
npm install
cp .env.example .env.local   # completar DATABASE_URL, FIREBASE_ADMIN_CREDENTIALS_JSON, PORTAL_TOKEN_SECRET
```

Aplicar las migraciones contra una base PostgreSQL (con `DATABASE_URL` en el entorno):

```bash
npm run migrate          # aplica en orden solo las migraciones de db/migrations/ que falten
npm run migrate:status   # muestra cuáles están aplicadas y cuáles pendientes, sin cambiar nada
npm run migrate -- --seed   # SOLO desarrollo: además carga 0099 (datos ficticios); bloqueado si NODE_ENV=production
```

El runner (`scripts/migrate.mjs`) registra cada migración aplicada en la tabla
`schema_migrations`, es idempotente y **se ejecuta automáticamente en cada
arranque con `npm start`** (así un despliegue en Render aplica por sí solo las
migraciones nuevas, sin `psql` ni credenciales a mano). Si encuentra una base que
ya tiene el esquema pero ninguna fila de registro (el caso de Neon, donde 0001–0009
se aplicaron a mano antes de existir el runner), registra esas nueve como línea
base sin re-ejecutarlas y continúa con las siguientes. `GET /api/health` reporta la
última migración registrada, para verificar un despliegue sin acceso a la base.

## Ejecución

```bash
npm run dev      # levanta el servidor Express + Vite (desarrollo)
npm run build    # compila frontend (vite build) y backend (esbuild) a dist/
npm run start    # ejecuta el build de producción (dist/server.cjs)
npm run lint     # tsc --noEmit
```

## Línea base de pruebas automatizadas (declarada para el curso ACS, sección 2.4)

**Al 12 de septiembre de 2026 este repositorio no trae pruebas automatizadas
propias.** No existe framework de pruebas configurado en `package.json`
(no hay `jest`, `vitest`, `mocha` ni script `test`), ni archivos `*.test.*`
o `*.spec.*` en el código fuente. La única verificación automatizada
existente es de tipos estáticos (`npm run lint` → `tsc --noEmit`), que no
constituye una prueba unitaria.

Esta línea base es intencionalmente cero: las pruebas unitarias, de API,
de carga y el pipeline de CI/CD se construyen como parte de los entregables
del curso ACS (Fase 2, E10-E14), no antes. Cualquier prueba automatizada que
aparezca en el historial de commits a partir de esa fecha es trabajo propio
del equipo para ese curso.

## Estructura

- `src/` — frontend React (componentes por dominio: `staff/`, `patient/`, `laboratory/`, `news/`, `chat/`)
- `server/` — backend Express (rutas por dominio: `ordenes.ts`, `pacientes.ts`, `resultados.ts`, `portal.ts`, `auditoria.ts`) y middleware de autenticación/autorización
- `server.ts` — punto de entrada del servidor, monta las rutas de `server/routes/` y expone endpoints de notificaciones push (Firebase Cloud Messaging) y de asistencia con IA (Gemini)
- `db/migrations/` — esquema PostgreSQL versionado (tablas, restricciones, funciones, disparadores, procedimientos, vistas)
- `src/shared/permissions.ts` — catálogo único de roles y permisos, compartido entre frontend y backend
