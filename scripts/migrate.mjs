#!/usr/bin/env node
/**
 * Runner de migraciones de VACLINIC.
 *
 * ANTES: las migraciones de db/migrations/ se aplicaban a mano con
 * `psql "$DATABASE_URL" -f ...` (README.md), una por una y en orden, sin
 * ningún registro en la base de datos de cuáles ya se habían corrido. Así
 * fue como se aplicaron 0001–0009 en Neon (producción) el 12-sep-2026.
 * Ese proceso manual es frágil: exige tener psql, tener la cadena de
 * conexión de producción a mano, y recordar exactamente qué falta.
 *
 * AHORA: este script se ejecuta automáticamente en cada arranque del
 * servidor (`npm start`, ver package.json) y también a mano con
 * `npm run migrate`. Lleva un registro real en la tabla `schema_migrations`
 * y aplica, en orden, solo las migraciones que falten. Es idempotente:
 * correrlo N veces contra la misma base es seguro y no hace nada nuevo.
 *
 * Reglas (declaradas explícitamente, no implícitas):
 *  - Se aplican los archivos db/migrations/NNNN_*.sql en orden numérico.
 *  - 0099_seed_demo_ficticio.sql (datos FICTICIOS de prueba) NUNCA se
 *    aplica salvo con `--seed` explícito. Jamás en producción.
 *  - Cada archivo se envía a PostgreSQL como UNA sola consulta: si el
 *    archivo no trae BEGIN/COMMIT propios, PostgreSQL lo ejecuta en una
 *    transacción implícita (todo o nada); si los trae (0001–0009, 0011),
 *    el propio archivo controla su transacción. El registro en
 *    schema_migrations solo se escribe si el archivo terminó sin error.
 *  - Línea base ("baseline"): si `schema_migrations` está vacía pero la base
 *    ya tiene el esquema (existe la tabla `paciente`), se asume que
 *    0001–0009 ya fueron aplicadas a mano (el estado real de Neon antes de
 *    que existiera este runner) y se registran sin re-ejecutarlas —
 *    re-ejecutarlas fallaría, porque 0001 no usa IF NOT EXISTS. Esto se
 *    hace UNA sola vez y queda anotado en la columna `nota`.
 *
 * Uso:
 *   node scripts/migrate.mjs            # aplica las pendientes
 *   node scripts/migrate.mjs --status   # solo muestra el estado, no cambia nada
 *   node scripts/migrate.mjs --seed     # además aplica 0099 (SOLO desarrollo)
 *
 * Lee DATABASE_URL (y PGSSLMODE) del entorno, igual que server/db.ts.
 */
import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

export const DIRECTORIO_MIGRACIONES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'db',
  'migrations'
);

/** Versión hasta la cual se asume aplicado a mano cuando se detecta un esquema sin registro. */
export const ULTIMA_VERSION_LINEA_BASE = '0009';

const PATRON_MIGRACION = /^(\d{4})_[\w-]+\.sql$/;

/** Extrae la versión ("0010") del nombre de archivo, o null si no es una migración válida. */
export function versionDeArchivo(nombre) {
  const m = PATRON_MIGRACION.exec(nombre);
  return m ? m[1] : null;
}

/** Los seeds (0099) son datos ficticios de prueba: nunca van a producción salvo --seed. */
export function esSemilla(nombre) {
  return versionDeArchivo(nombre) === '0099';
}

/**
 * Ordena y filtra los archivos del directorio de migraciones. Función pura,
 * probada en server/migrate.test.ts.
 */
export function ordenarMigraciones(nombres, { incluirSemillas = false } = {}) {
  return nombres
    .filter((n) => versionDeArchivo(n) !== null)
    .filter((n) => incluirSemillas || !esSemilla(n))
    .sort((a, b) => versionDeArchivo(a).localeCompare(versionDeArchivo(b)));
}

/** Devuelve las migraciones (ya ordenadas) cuya versión no está en `aplicadas`. */
export function seleccionarPendientes(ordenadas, aplicadas) {
  const hechas = new Set(aplicadas);
  return ordenadas.filter((n) => !hechas.has(versionDeArchivo(n)));
}

/** Versiones que la línea base marca como aplicadas a mano (<= 0009). */
export function versionesDeLineaBase(ordenadas) {
  return ordenadas
    .map(versionDeArchivo)
    .filter((v) => v <= ULTIMA_VERSION_LINEA_BASE);
}

function crearPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Falta la variable de entorno DATABASE_URL (ver .env.example).');
  }
  return new pg.Pool({
    connectionString,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
    max: 1
  });
}

async function asegurarTablaDeControl(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     TEXT PRIMARY KEY,
      nombre      TEXT NOT NULL,
      aplicada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      nota        TEXT
    )
  `);
}

async function versionesAplicadas(client) {
  const { rows } = await client.query('SELECT version FROM schema_migrations ORDER BY version');
  return rows.map((r) => r.version);
}

async function existeEsquemaPrevio(client) {
  const { rows } = await client.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'paciente'"
  );
  return rows.length > 0;
}

async function registrarLineaBase(client, ordenadas) {
  const versiones = versionesDeLineaBase(ordenadas);
  for (const v of versiones) {
    const nombre = ordenadas.find((n) => versionDeArchivo(n) === v);
    await client.query(
      'INSERT INTO schema_migrations (version, nombre, nota) VALUES ($1, $2, $3) ON CONFLICT (version) DO NOTHING',
      [v, nombre, 'línea base: aplicada a mano con psql antes de existir este runner']
    );
  }
  return versiones;
}

async function aplicarMigracion(client, nombre) {
  const version = versionDeArchivo(nombre);
  const sql = await readFile(path.join(DIRECTORIO_MIGRACIONES, nombre), 'utf8');
  // El INSERT de registro va en la MISMA consulta simple que el archivo:
  // si el archivo no trae BEGIN/COMMIT, todo (migración + registro) es una
  // sola transacción implícita; si los trae, el registro se escribe justo
  // después de su COMMIT y solo si nada falló antes.
  const registro = `INSERT INTO schema_migrations (version, nombre) VALUES ('${version}', '${nombre.replace(/'/g, "''")}');`;
  await client.query(`${sql}\n${registro}`);
}

export async function ejecutar({ soloEstado = false, incluirSemillas = false, log = console.log } = {}) {
  const nombres = await readdir(DIRECTORIO_MIGRACIONES);
  const ordenadas = ordenarMigraciones(nombres, { incluirSemillas });

  const pool = crearPool();
  const client = await pool.connect();
  try {
    await asegurarTablaDeControl(client);

    let aplicadas = await versionesAplicadas(client);
    if (aplicadas.length === 0 && (await existeEsquemaPrevio(client))) {
      if (soloEstado) {
        log('[migrate] Esquema existente sin registro: al ejecutar se registrará la línea base 0001–0009 sin re-aplicarla.');
      } else {
        const base = await registrarLineaBase(client, ordenadas);
        log(`[migrate] Línea base registrada (aplicadas a mano previamente): ${base.join(', ')}`);
        aplicadas = await versionesAplicadas(client);
      }
    }

    const pendientes = seleccionarPendientes(ordenadas, aplicadas);
    log(`[migrate] Aplicadas: ${aplicadas.length} | Pendientes: ${pendientes.length}${pendientes.length ? ' -> ' + pendientes.join(', ') : ''}`);

    if (soloEstado) return { aplicadas, pendientes, ejecutadas: [] };

    const ejecutadas = [];
    for (const nombre of pendientes) {
      const inicio = Date.now();
      await aplicarMigracion(client, nombre);
      ejecutadas.push(nombre);
      log(`[migrate] OK ${nombre} (${Date.now() - inicio} ms)`);
    }
    if (ejecutadas.length === 0) log('[migrate] Base de datos al día, nada que aplicar.');
    return { aplicadas, pendientes, ejecutadas };
  } finally {
    client.release();
    await pool.end();
  }
}

const esEntradaPrincipal =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (esEntradaPrincipal) {
  const args = new Set(process.argv.slice(2));
  const incluirSemillas = args.has('--seed');
  if (incluirSemillas && process.env.NODE_ENV === 'production') {
    console.error('[migrate] --seed está prohibido con NODE_ENV=production (datos ficticios).');
    process.exit(2);
  }
  ejecutar({ soloEstado: args.has('--status'), incluirSemillas })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[migrate] ERROR:', err.message);
      process.exit(1);
    });
}
