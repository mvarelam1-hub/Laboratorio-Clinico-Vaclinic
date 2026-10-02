# Mejoras de estructura profesional (rama `feature/mejoras-estructura-profesional`)

Este documento registra, honestamente, qué se corrigió y qué se dejó
pendiente a propósito al revisar VACLINIC con la pregunta "¿qué le falta
a este programa para tener una estructura profesional y ser implementable
en serio?". Cada punto está verificado contra el código real del
repositorio en el momento de escribirse, no es una lista aspiracional.

## 1. RBAC dinámico (cerrado)

Hasta esta rama, `server/routes/roles.ts` permitía editar y guardar en
Postgres (`rol_permiso_default`) los permisos de un rol, pero
`hasPermission()` (`src/shared/permissions.ts`) siempre resolvía contra el
arreglo estático `INITIAL_ROLES_CONFIG`, nunca contra esa tabla. Era un
hallazgo documentado honestamente en el propio código en vez de fabricar
un wiring falso.

Se cerró con `server/rolePermissionsCache.ts`: una caché en memoria del
catálogo de roles EFECTIVO (estático + ediciones guardadas), cargada al
arrancar el servidor, refrescada cada 60s y de inmediato cuando se guarda
una edición desde `PUT /api/roles/:roleId/permisos`. `hasPermission()`
ahora acepta un tercer parámetro opcional (`rolesConfig`); el frontend
sigue llamándola sin ese parámetro (solo oculta botones, nunca fue el
límite de seguridad real, cero cambio de comportamiento), y el backend
(`permissions-middleware.ts`, `episodios.ts`, `resultados.ts`) le pasa el
catálogo efectivo en cada verificación real.

Cubierto con pruebas: `server/rolePermissionsCache.test.ts` (5 casos) y
ampliación de `src/shared/permissions.test.ts` y
`server/routes/roles.test.ts`.

## 2. TypeScript sin tipos reales de React (parcialmente cerrado, hallazgo documentado)

El proyecto no tenía instalados `@types/react` ni `@types/react-dom`. Sin
ellos, TypeScript trata como `any` implícito todo lo que viene de
`react`/`react-dom` (`createContext`, `useState`, JSX, props de
componentes), así que `npm run lint` (`tsc --noEmit`) nunca detectó un
error de tipos real en el uso de React en ninguno de los ~60 componentes
del proyecto, incluido el contexto global `ClinicContext`.

Se instalaron ambos paquetes (`package.json`). Esto por sí solo no rompe
nada en tiempo de ejecución (son solo tipos, de desarrollo) — pero revela
**50 errores de tipos reales y preexistentes**, no introducidos por este
cambio (confirmado comparando contra `main` antes de este cambio, donde
sin los tipos de React solo había 1 error no relacionado, de
`LabPerformancePdfModal.tsx`/`CatalogTest`).

Ejemplos reales (lista completa reproducible con `npx tsc --noEmit` tras
esta rama):

- `ClinicContext.tsx` usa `.name`/`.role` sobre `LabStaffUser` en varios
  puntos, propiedades que no existen en ese tipo (probablemente deberían
  ser `.nombreCompleto`/`.roleId`, a juzgar por el resto del código).
- `PatientOrdersView.tsx` / `PatientResultsView.tsx` leen
  `isSensitiveResultUnlocked`, `unlockSensitiveResult` y
  `verifyPatientPinForSensitiveResult` de `ClinicContextType`, que no
  declara esas tres propiedades.
- Varios componentes (`BiometricSecuritySection.tsx`,
  `StaffLoginView.tsx`) construyen un objeto de auditoría que no calza
  con `Omit<LabAuditLog, "id" | "timestamp">`.
- `LabPerformancePdfModal.tsx` importa `CatalogTest` de `types.ts`, que no
  lo exporta (error preexistente, ya presente incluso sin esta rama).

**Decisión deliberada**: NO se corrigieron estos 50 errores en esta rama.
Son errores de tipos en componentes de React que no se pueden probar
visualmente en esta sesión de trabajo (no hay forma de abrir la
aplicación en un navegador real y confirmar que un cambio no rompe algo);
"corregirlos" sin esa verificación habría significado adivinar la
intención original del código, exactamente lo que este proyecto se
propuso no hacer. Quedan documentados aquí como hallazgo real de calidad
para que el equipo los revise uno por uno, con contexto de cada
componente.

Por la misma razón, **no se activó** `"strict": true` ni
`"noImplicitAny": true` en `tsconfig.json` en esta rama: activarlos revela
decenas de errores adicionales (ya no solo de React sino de lógica
general), lo cual es un proyecto de calidad en sí mismo, no un cambio
seguro de hacer a ciegas junto con las demás mejoras de esta rama.

## 3. Seguridad HTTP (cerrado, con límite documentado)

- `helmet` se agregó como middleware global en `server.ts`, justo después
  de `app.disable("x-powered-by")` (el único endurecimiento de cabeceras
  que existía antes, por el hallazgo real TC-11). Añade, entre otras,
  HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options` y
  `Referrer-Policy`.
- `contentSecurityPolicy` se dejó **desactivado explícitamente** (no por
  descuido): el mismo proceso de Express sirve el SPA de React, y la CSP
  por defecto de `helmet` puede bloquear scripts/estilos del bundle sin
  una política afinada contra el build real — activarla a ciegas, sin
  poder abrir la aplicación completa en un navegador en esta sesión,
  arriesgaba dejar el Portal del Paciente o el panel de personal en
  blanco en producción. Queda como el siguiente paso natural de este
  mismo hallazgo.
- El límite de tasa en el login del Portal del Paciente
  (`server/routes/portal.ts`, `checkRateLimit`) **ya existía** y está bien
  documentado en el propio archivo — no se duplicó ni se tocó.

## 4. Limpieza de CI (cerrado)

El repositorio tenía tres workflows de GitHub Actions:
`ci-cd-e12.yml` (el real: 4 etapas, build+unitarias, pruebas de sistema
con pytest+Selenium, deploy a staging), y además `ci.yml` y
`node.js.yml`, ambos sin relación con el pipeline real documentado en el
resto del proyecto (ETAPA3_README.md, DevOps2) — el segundo, de hecho,
trae en su propio nombre de archivo la plantilla por defecto que genera
GitHub ("Node.js CI"). Tener los tres generaba confusión real sobre cuál
pipeline protege la rama principal. Se eliminaron `ci.yml` y
`node.js.yml`, y se actualizó la referencia en `docs/ESTRATEGIA_RAMAS.md`
(que citaba `ci.yml` por nombre) para que apunte a `ci-cd-e12.yml`.

## 5. `.env.example` (cerrado)

Tenía al inicio dos variables de una plantilla genérica anterior del
proyecto (`GEMINI_API_KEY` con comentarios de "AI Studio", y `APP_URL`).
Se verificó contra el código real: `GEMINI_API_KEY` sí se usa
(`server.ts`, `getGenAI()`), así que se conservó con un comentario que
describe su uso real; `APP_URL` no aparece en ningún archivo `.ts`/`.tsx`
del proyecto, así que se eliminó por no corresponder a nada real.

## 6. Pendiente, fuera de alcance de esta rama (sin tocar)

Esto NO se hizo en esta rama, a propósito, porque requiere una decisión o
una acción que no se puede sustituir desde aquí:

- Activar *branch protection* en GitHub sobre `main` (exigir que
  `ci-cd-e12` pase y al menos una aprobación) — requiere permisos de
  administrador del repositorio.
- Agregar a Juan José y a Josue como colaboradores reales del
  repositorio, para que las futuras Pull Requests tengan revisión
  genuina (hallazgo ya documentado en el trabajo de ACS, E9).
- Consolidar los dos repositorios paralelos
  (`mvarelam1-hub/vaclinic` y `mvarelam1-hub/Laboratorio-Clinico-Vaclinic`)
  en uno solo.
- Contenerizar el backend con un `Dockerfile` propio (más allá del que ya
  existe para el microservicio de notificaciones en la otra rama
  `feature/e9-docker-microservicio-notificaciones` del repo
  `vaclinic`).
- SonarQube/SonarCloud (E12 de ACS).
