# Etapa 3 — Backend de seguridad (VACLINIC)

Este paquete agrega el backend que faltaba (Etapa 2) y las correcciones de seguridad
de la Etapa 3, **probadas con peticiones HTTP reales**, no solo escritas.

## Qué se corrigió (con evidencia)

| Falla del diagnóstico | Antes | Ahora |
|---|---|---|
| PIN compartido hardcodeado (`1234`, `admin`, ...) y `isStaffAuthenticated` en `true` por defecto | Cualquiera entraba al panel de personal | El backend exige un token de Firebase Authentication válido **y** que ese usuario exista y esté `activo` en la tabla `usuario` (`server/auth-firebase.ts`). Probado: sin token → 401; token de un UID no registrado → 403. |
| "Ocultar botón" como única autorización | `hasPermission()` solo vivía en el frontend | La misma función (`src/shared/permissions.ts`) ahora corre también en el servidor (`server/permissions-middleware.ts`) y rechaza la petición HTTP directamente. Probado: un `bioanalista` (sin el permiso `validacion_publicacion`) recibe 403 al intentar publicar, aunque mande la petición directo con `curl`, sin pasar por ninguna pantalla. |
| Login de paciente comparando PIN/código en texto plano contra un arreglo cargado completo en el navegador | Cualquiera con DevTools leía el código de cualquier paciente | `POST /api/portal/login` valida el **código único de consulta** contra la base de datos (nunca expone la lista de pacientes ni códigos al navegador), rechaza códigos vencidos/no vigentes, limita los intentos por IP (20 cada 15 min), y devuelve un token que solo sirve para LA orden de ese paciente (`server/token.ts` + `GET /api/portal/orden`). Probado con curl: código incorrecto → 401 genérico; código vencido → 401 específico; 21° intento en 15 min → 429; token ajeno o inventado → 401. **Ver "Etapa 3.6" más abajo:** se revirtió una versión intermedia que agregaba un PIN de dos factores no contemplado en la tesis ni en la pantalla real. |
| Ningún resultado dejaba rastro real de quién corrigió qué y por qué | Se sobrescribía el objeto en el estado de React | Cada transición de estado (`validar`/`publicar`/`corregir`) corre dentro de una transacción real que fija `app.current_user_id`/`app.motivo_cambio` para el trigger de auditoría de la Etapa 2. Probado: `GET /api/resultados/1/historial` devuelve las 5 versiones reales del mismo resultado, cada una con el responsable y motivo correctos. |
| Logs de servidor con nombre del paciente | `console.log` imprimía `patientName` | Se quitaron esos campos de los logs en `server.ts`. |

## Etapa 3.5 — Frontend de personal ya usa Firebase real (actualización)

Al revisar quién usaba realmente `StaffAuthModal.tsx` encontré que **nadie**:
no está importado en ningún lado. La pantalla que la app SÍ muestra es
`StaffLoginView.tsx` (activada desde `App.tsx` cuando `role === 'personal'`),
y tenía una falla peor que el PIN compartido documentado antes:

```ts
const isValidPassword =
  cleanPass === 'admin' || cleanPass === '1234' || cleanPass === 'admin1234' ||
  cleanPass === 'lis2026' || cleanPass === 'password' ||
  (matchedUser && matchedUser.pinCode === cleanPass);

if ((cleanUser === 'admin' || matchedUser) && (isValidPassword || cleanPass.length > 0)) {
  // ...entra igual...
```

El `|| cleanPass.length > 0` al final aceptaba **cualquier contraseña no
vacía** para el usuario `admin` o para cualquier usuario ya listado — y
además había botones de "Acceso Rápido de Prueba" que autocompletaban esas
credenciales en la propia pantalla de login. Y aún si esa pantalla hubiera
sido perfecta, no importaba: `isStaffAuthenticated` arrancaba en `true` y
`role` arrancaba en `'personal'` por defecto en `ClinicContext.tsx`, así que
abrir la app por primera vez, con el localStorage vacío, entraba directo al
panel completo de personal sin pasar por ningún login.

Se corrigió todo esto:

| Falla | Antes | Ahora |
|---|---|---|
| `role`/`isStaffAuthenticated` por defecto | `'personal'` / `true` — sin login | `'paciente'` / `false` — hay que autenticarse |
| `StaffLoginView.tsx` | Cualquier contraseña no vacía, o 5 contraseñas fijas, con botones que las autocompletaban | `signInWithEmailAndPassword` de Firebase real + verificación contra `GET /api/auth/whoami` |
| Fuente de verdad de la sesión | Un booleano en `localStorage` editable desde DevTools | `onAuthStateChanged` de Firebase (persistido por el propio SDK) revalidado contra el backend en cada cambio (`ClinicContext.tsx`) |
| Cerrar sesión (`logoutStaff`) | Solo cambiaba el booleano local | También cierra la sesión real de Firebase (`signOut`) |

Archivos nuevos/tocados: `src/services/firebaseConfig.ts` (se agregó
`getFirebaseAuth()`), `src/services/staffAuthService.ts` (nuevo — llama a
`/api/auth/whoami` y nunca asume éxito si el backend no responde),
`src/components/staff/StaffLoginView.tsx` (reescrito), `src/context/ClinicContext.tsx`
(defaults + efecto de `onAuthStateChanged` + `logoutStaff`), `src/types.ts`
(campo opcional `firebaseUid` en `LabStaffUser`).

**Lo que esto NO prueba todavía:** no pude iniciar sesión con una cuenta
real de Firebase desde este entorno — la salida de red hacia
`identitytoolkit.googleapis.com` está bloqueada por la política del sandbox
de desarrollo en el que trabajo (confirmado con
`curl $HTTPS_PROXY/__agentproxy/status`, no es una falla de la app). Lo que
sí verifiqué: `npx tsc --noEmit` sin errores nuevos, `npx vite build` compila
el bundle completo, y las respuestas de `/api/auth/whoami` que el código
nuevo espera (200 con perfil, 401 sin token, 401 con token inválido, 403 con
UID no registrado) contra el servidor real de esta máquina con curl. Falta
que crees las cuentas reales en Firebase Console y pruebes el login desde un
navegador de verdad — eso no lo puedo hacer yo sin esas credenciales.

**Riesgo abierto documentado:** el login biométrico (WebAuthn, ya existente
en `BiometricSecuritySection.tsx` vía `loginStaffUser()`) sigue sin pasar por
Firebase — es una vía de acceso que el backend no puede verificar hoy.
Cerrarla del todo requeriría emitir un Firebase Custom Token tras la
verificación WebAuthn; queda pendiente y está comentado en el código
(`loginStaffUser` en `ClinicContext.tsx`).

## Etapa 3.6 — Portal del paciente alineado a la tesis: código único, sin PIN (actualización)

Una versión intermedia de este paquete (mencionada en la sección anterior)
había agregado un PIN de paciente como segundo factor para
`POST /api/portal/login`, además del código único. Al leer la tesis
completa (capítulo 4, RF07 y el caso de uso "Consultar resultado mediante
código único") quedó claro que **ese PIN no está en el documento de
origen ni en la pantalla real** (`PatientPortalWelcomeView.tsx` solo pide
un código/DNI, nunca tuvo un campo de PIN). Mantenerlo habría significado
construir una funcionalidad no pedida y forzar un cambio de UI no
solicitado.

Se revirtió a lo que la tesis y la pantalla real especifican:

| Antes (versión intermedia, no alineada) | Ahora (alineado a la tesis) |
|---|---|
| `POST /api/portal/login` exigía `{ codigo, pin }` | Exige solo `{ codigo }` |
| Bloqueo de 15 min tras 5 PIN fallidos, por paciente | Límite de 20 intentos / 15 min **por IP** (el código es el único secreto; no hay una cuenta de paciente conocida contra la cual contar intentos antes de validar) |
| Registro de paciente generaba y devolvía un `pinAsignado` | El registro ya no genera PIN; el único mecanismo de acceso es el código único que se genera al registrar la ORDEN |
| Columnas `paciente.pin_hash`, `intentos_fallidos`, `bloqueado_hasta` en uso | Migración `0009_paciente_sin_pin_alineado_tesis.sql`: se marcan con `COMMENT ON COLUMN` como no usadas (no se eliminan, por si se decide agregar un segundo factor real en el futuro) |

Archivos tocados en esta corrección: `server/routes/portal.ts` (reescrito),
`server/routes/pacientes.ts` (se quitó la generación de PIN),
`db/migrations/0009_paciente_sin_pin_alineado_tesis.sql` (nueva). Probado
con curl contra la base de datos local: código válido → 200 + token;
código inexistente → 401 genérico; código vencido → 401 específico; sin
código → 400; 21 peticiones seguidas desde la misma IP → 429 en la
petición 21.

**Nota:** este cambio también se decidió junto con actualizar la tesis
para reflejar que las notificaciones son *push* (Firebase Cloud
Messaging), no WhatsApp automático — ver el documento
`VACLINIC_Tesis_alineada_FCM.docx` entregado aparte, y la sección
correspondiente del mensaje de esta etapa.

## Lo que NO se tocó todavía (para no romper la app que ya funciona)

- **El resto de la app (pacientes, órdenes, informes en pantalla) sigue leyendo
  y escribiendo en `localStorage`, no en esta API nueva.** Migrar todo
  `ClinicContext.tsx` (~2965 líneas, ~30 claves de localStorage) a que hable
  con esta API es un trabajo grande por sí solo — corresponde a la Etapa 4
  ("verificación del flujo clínico") para no arriesgar romper pantallas que
  hoy sí funcionan, aunque sea contra datos locales. Esto incluye el Portal
  del Paciente: `PatientPortalWelcomeView.tsx` pide un único código (código
  o DNI) y ya coincide en forma con el backend (`POST /api/portal/login`
  ahora también exige solo `{ codigo }`, ver "Etapa 3.6"), pero la pantalla
  real sigue leyendo el resultado desde el arreglo completo en memoria, no
  desde `GET /api/portal/orden`. Conectar esa pantalla (y el resto de
  sub-componentes del portal: biomarcadores, tendencias, comparador,
  asistente IA, todos anclados a los datos completos en memoria) a la API
  real, sin romper nada de lo que hoy funciona, es el trabajo de la Etapa 4.

## Cómo se probó (sin credenciales reales de Firebase)

Como no cuento con la cuenta de servicio de Firebase Admin del proyecto,
usé `DEV_AUTH_BYPASS_UID` — una puerta que el propio código bloquea por
completo si `NODE_ENV=production` (ver `server/auth-firebase.ts`), pensada
solo para poder probar el resto de la lógica (permisos, auditoría, portal)
sin esa credencial. En producción esto se reemplaza por
`FIREBASE_ADMIN_CREDENTIALS_JSON` real y el bypass queda inerte.

## Variables de entorno nuevas (ver `.env.example`)

```
DATABASE_URL=...                       # Postgres (Neon en producción)
FIREBASE_ADMIN_CREDENTIALS_JSON=...    # JSON de la cuenta de servicio de Firebase Admin
PORTAL_TOKEN_SECRET=...                # cadena aleatoria larga
```

## Cómo correrlo

```bash
npm install
export DATABASE_URL=postgres://usuario:password@host:5432/db
export FIREBASE_ADMIN_CREDENTIALS_JSON='{...}'
export PORTAL_TOKEN_SECRET=$(openssl rand -hex 32)
npm run dev
```

Aplica antes las migraciones de `db/migrations/` (0001 a 0008, en orden) contra esa
misma base de datos.
