#!/usr/bin/env node
/**
 * Respaldo real de la base de datos de VACLINIC (PostgreSQL / Neon).
 *
 * ANTES: el único "respaldo" del sistema era createBackupSnapshot() en el
 * frontend (src/services/backupService.ts): una copia en el localStorage del
 * propio navegador. Si se pierde la base de datos real (Neon) o se borra el
 * navegador, esos datos clínicos no se podían recuperar de ningún lado.
 *
 * AHORA: este script genera un volcado completo y consistente de la base
 * con pg_dump (formato "custom", comprimido, restaurable con pg_restore),
 * lo cifra con AES-256-GCM (BACKUP_ENCRYPTION_KEY, mismo formato de clave
 * que server/crypto-aes.ts), escribe un manifiesto con el SHA-256 y los
 * conteos exactos de filas por tabla, y aplica una retención para no llenar
 * el disco. scripts/restore-verify.mjs es el contrapunto: restaura el
 * respaldo en una base vacía y comprueba que los conteos coinciden — un
 * respaldo que nunca se probó restaurar no es un respaldo.
 *
 * Consistencia: los conteos del manifiesto y el volcado se toman de la MISMA
 * instantánea (pg_export_snapshot + pg_dump --snapshot), así que coinciden
 * aunque haya pacientes registrando órdenes mientras corre el respaldo.
 * Requiere una conexión DIRECTA a PostgreSQL (en Neon, la cadena SIN
 * "-pooler"): el pooler en modo transacción no conserva la instantánea.
 *
 * Uso:
 *   node scripts/backup-db.mjs                    # ./backups, conserva 14
 *   node scripts/backup-db.mjs --out /ruta --keep 30
 *   node scripts/backup-db.mjs --no-encrypt       # SOLO desarrollo
 *
 * Lee DATABASE_URL, PGSSLMODE y BACKUP_ENCRYPTION_KEY del entorno.
 */
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';
import {
  cifrarArchivo,
  leerClave,
  nombreRespaldo,
  seleccionarParaBorrar,
  sha256Archivo
} from './backup-lib.mjs';

function argumento(nombre, porDefecto) {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 ? process.argv[i + 1] : porDefecto;
}

function ejecutar(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const hijo = spawn(cmd, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'inherit', 'pipe'] });
    let err = '';
    hijo.stderr.on('data', (d) => (err += d));
    hijo.on('error', (e) => reject(new Error(`No se pudo ejecutar ${cmd}: ${e.message} (¿está instalado el cliente de PostgreSQL?)`)));
    hijo.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} terminó con código ${code}: ${err.trim()}`))));
  });
}

function version(cmd) {
  return new Promise((resolve) => {
    const h = spawn(cmd, ['--version']);
    let out = '';
    h.stdout.on('data', (d) => (out += d));
    h.on('error', () => resolve(null));
    h.on('close', () => resolve(out.trim() || null));
  });
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DATABASE_URL.');
  const cifrar = !process.argv.includes('--no-encrypt');
  const clave = cifrar ? leerClave() : null;
  const carpeta = path.resolve(argumento('out', './backups'));
  const conservar = Number(argumento('keep', '14'));
  await mkdir(carpeta, { recursive: true });

  const ssl = process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false };
  const cliente = new pg.Client({ connectionString: url, ssl });
  await cliente.connect();

  const ahora = new Date();
  const nombreFinal = nombreRespaldo(ahora, cifrar);
  const rutaDump = path.join(carpeta, nombreRespaldo(ahora, false)); // volcado en claro (temporal si se cifra)
  const rutaFinal = path.join(carpeta, nombreFinal);

  let conteos = {};
  let conteosExactos = true;
  try {
    // Instantánea compartida entre los conteos y pg_dump.
    await cliente.query('BEGIN ISOLATION LEVEL REPEATABLE READ, READ ONLY');
    let snapshotId = null;
    try {
      snapshotId = (await cliente.query('SELECT pg_export_snapshot() AS id')).rows[0].id;
    } catch {
      conteosExactos = false; // p. ej. pooler: se respalda igual pero se avisa en el manifiesto.
    }
    const { rows: tablas } = await cliente.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
    );
    for (const { tablename } of tablas) {
      const { rows } = await cliente.query(`SELECT count(*)::bigint AS n FROM "${tablename.replace(/"/g, '""')}"`);
      conteos[tablename] = Number(rows[0].n);
    }

    const args = ['--format=custom', '--no-owner', '--no-privileges', '--file', rutaDump];
    if (snapshotId) args.push(`--snapshot=${snapshotId}`);
    args.push(url);
    await ejecutar('pg_dump', args, { PGSSLMODE: process.env.PGSSLMODE || 'require' });
  } finally {
    await cliente.query('ROLLBACK').catch(() => {});
    await cliente.end().catch(() => {});
  }

  if (cifrar) {
    const tmp = `${rutaFinal}.partial`;
    await cifrarArchivo(rutaDump, tmp, clave);
    await rename(tmp, rutaFinal);
    await rm(rutaDump);
  }

  const manifiesto = {
    archivo: nombreFinal,
    creado_utc: ahora.toISOString(),
    cifrado: cifrar,
    sha256: await sha256Archivo(rutaFinal),
    pg_dump: await version('pg_dump'),
    conteos_exactos: conteosExactos,
    tablas: conteos
  };
  await writeFile(`${rutaFinal}.manifest.json`, JSON.stringify(manifiesto, null, 2) + '\n');

  // Retención: borra respaldos viejos Y su manifiesto.
  const existentes = await readdir(carpeta);
  for (const viejo of seleccionarParaBorrar(existentes, conservar)) {
    await rm(path.join(carpeta, viejo), { force: true });
    await rm(path.join(carpeta, `${viejo}.manifest.json`), { force: true });
  }

  const totalFilas = Object.values(conteos).reduce((a, b) => a + b, 0);
  console.log(`[backup] OK ${rutaFinal}`);
  console.log(`[backup] ${Object.keys(conteos).length} tablas, ${totalFilas} filas, sha256 ${manifiesto.sha256.slice(0, 16)}…`);
  if (!conteosExactos) console.warn('[backup] AVISO: no se pudo exportar una instantánea (¿conexión por pooler?). Usa la cadena de conexión directa.');
  if (!cifrar) console.warn('[backup] AVISO: respaldo SIN cifrar (--no-encrypt). Solo para desarrollo.');
}

main().catch((e) => {
  console.error('[backup] FALLÓ:', e.message);
  process.exit(1);
});
