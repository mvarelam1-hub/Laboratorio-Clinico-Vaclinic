# Respaldos y restauración de la base de datos

La base de datos real (PostgreSQL en Neon) contiene datos clínicos de
pacientes. Este documento explica cómo se respalda, cómo se **prueba** que el
respaldo sirve, y qué hacer en una emergencia.

> Antes de esto, el único "respaldo" era `createBackupSnapshot()` del frontend
> (`src/services/backupService.ts`), una copia en el `localStorage` del
> navegador: no protege contra la pérdida de la base de datos real.

## Qué hay

| Pieza | Para qué |
|---|---|
| `scripts/backup-db.mjs` (`npm run backup`) | `pg_dump` consistente + cifrado AES-256-GCM + manifiesto (SHA-256 y filas por tabla) + retención |
| `scripts/restore-verify.mjs` (`npm run backup:verify`) | Restaura el respaldo en una base **vacía y desechable** y compara conteos con el manifiesto |
| `.github/workflows/backup-diario.yml` | Corre ambos todos los días a las 02:00 (Guatemala) y guarda el archivo cifrado 30 días |

## Configuración (una sola vez)

En GitHub: **Settings → Secrets and variables → Actions → New repository secret**

1. `DATABASE_URL`: la cadena de conexión **directa** de Neon (la que **no** lleva
   `-pooler` en el host). El pooler no conserva la instantánea de PostgreSQL y
   el manifiesto no sería exacto.
2. `BACKUP_ENCRYPTION_KEY`: 64 caracteres hex (`openssl rand -hex 32`).
   **Guárdala también fuera de GitHub** (gestor de contraseñas). Sin esta clave
   un respaldo cifrado es irrecuperable, y quien tenga el archivo + la clave
   puede leer todos los datos: trátala como un secreto de producción.

Luego, en la pestaña **Actions → Respaldo diario… → Run workflow** haz una
corrida manual y confirma que termina en verde. La primera vez es la prueba
de que todo quedó bien configurado.

> Aviso de GitHub: los workflows programados se **desactivan solos tras 60
> días sin actividad** en el repositorio. Si el proyecto queda quieto, vuelve
> a activarlo en la pestaña Actions.

## Qué garantiza cada corrida

1. Volcado consistente: los conteos y el volcado salen de la **misma
   instantánea**, aunque haya órdenes registrándose mientras corre.
2. SHA-256 del archivo en el manifiesto (detecta corrupción).
3. Cifrado autenticado (GCM): un solo byte alterado hace fallar el descifrado.
4. Restauración real en PostgreSQL 17 limpio y comparación de **todas** las
   tablas. Si algo no coincide, el job falla y GitHub envía correo.

## Restauración de emergencia (se perdió o se dañó la base real)

1. Descarga el artefacto `respaldo-vaclinic-…` de la última corrida verde
   (Actions → la corrida → *Artifacts*), y descomprímelo.
2. Crea un proyecto/base **nueva y vacía** en Neon (no restaures encima de la
   dañada hasta confirmar que el respaldo está bien).
3. Verifica primero (no cambia nada en producción):
   ```bash
   export BACKUP_ENCRYPTION_KEY=...           # la clave guardada
   export RESTORE_DATABASE_URL=postgres://...  # la base NUEVA y vacía
   npm run backup:verify -- --dir ./carpeta-del-artefacto
   ```
   Termina con `OK: N tablas y M filas coinciden exactamente`.
4. Apunta `DATABASE_URL` del servidor (Render) a esa base y reinicia: el runner
   de migraciones (`npm start`) detecta que el esquema ya está al día.
5. Los datos nuevos posteriores al respaldo (hasta 24 h) se perdieron: avisa al
   personal para que re-registre lo de ese día.

## Límites conocidos (honestos)

- **RPO de 24 h**: el respaldo es diario. Neon además ofrece restauración a un
  punto en el tiempo (PITR) según el plan; actívala para reducir esa ventana.
  Este respaldo es la copia **independiente** (fuera de Neon) por si falla el
  proveedor o la cuenta.
- Los artefactos de GitHub Actions viven 30 días y en la misma plataforma que el
  código. Para una copia fuera de GitHub, descarga uno cada semana o copia el
  archivo cifrado a un almacenamiento externo (el archivo ya está cifrado).
- Cambiar `BACKUP_ENCRYPTION_KEY` hace ilegibles los respaldos viejos **y** los
  secretos TOTP ya guardados (`server/crypto-aes.ts` usa la misma clave).
- `pg_dump` respalda la base de datos; no respalda variables de entorno ni
  secretos de Render/GitHub: guárdalos también por separado.

## Uso local (desarrollo)

```bash
DATABASE_URL=postgres://... PGSSLMODE=disable BACKUP_ENCRYPTION_KEY=$(openssl rand -hex 32) \
  npm run backup -- --out ./backups --keep 7
```

`--no-encrypt` existe solo para desarrollo. La carpeta `backups/` no debe
subirse a Git (agrégala a `.gitignore`).
