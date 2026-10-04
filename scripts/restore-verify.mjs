#!/usr/bin/env node
/**
 * Prueba REAL de restauración de un respaldo de VACLINIC.
 *
 * Un respaldo que nunca se restauró no es una garantía. Este script:
 *   1. toma un respaldo (el más reciente de la carpeta, o el que se indique),
 *   2. comprueba su SHA-256 contra el manifiesto (detecta corrupción/alteración),
 *   3. lo descifra si hace falta (GCM autentica: un byte alterado = falla),
 *   4. lo restaura con pg_restore en una base VACÍA de prueba,
 *   5. cuenta las filas de cada tabla y las compara con las del manifiesto
 *      (tomadas en la misma instantánea que el volcado, ver backup-db.mjs).
 * Sale con código 0 solo si TODO coincide; cualquier diferencia → código 1.
 *
 * NUNCA toca la base de producción: la base de destino es siempre
 * RESTORE_DATABASE_URL (una base vacía y desechable). Por seguridad, el
 * script se niega a correr si RESTORE_DATABASE_URL es igual a DATABASE_URL.
 *
 * Uso:
 *   RESTORE_DATABASE_URL=postgres://... node scripts/restore-verify.mjs
 *   node scripts/restore-verify.mjs --file backups/backup-20261004-153045.dump.enc
 *   node scripts/restore-verify.mjs --dir /ruta/backups
 */
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import pg from 'pg';
import {
  compararConteos,
  descifrarArchivo,
  leerClave,
  ordenarRespaldos,
  sha256Archivo
} from './backup-lib.mjs';

function argumento(nombre, porDefecto) {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 ? process.argv[i + 1] : porDefecto;
}

function ejecutar(cmd, args) {
  return new Promise((resolve, reject) => {
    const hijo = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'pipe'] });
    let err = '';
    hijo.stderr.on('data', (d) => (err += d));
    hijo.on('error', (e) => reject(new Error(`No se pudo ejecutar ${cmd}: ${e.message}`)));
    hijo.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} terminó con código ${code}: ${err.trim()}`))));
  });
}

async function main() {
  const destino = process.env.RESTORE_DATABASE_URL;
  if (!destino) throw new Error('Falta RESTORE_DATABASE_URL: una base de datos VACÍA y desechable donde restaurar.');
  if (destino === process.env.DATABASE_URL) {
    throw new Error('RESTORE_DATABASE_URL es igual a DATABASE_URL: se niega a restaurar sobre la base real.');
  }

  let archivo = argumento('file');
  if (!archivo) {
    const carpeta = path.resolve(argumento('dir', './backups'));
    const [masReciente] = ordenarRespaldos(await readdir(carpeta));
    if (!masReciente) throw new Error(`No hay respaldos en ${carpeta}.`);
    archivo = path.join(carpeta, masReciente);
  }
  archivo = path.resolve(archivo);
  const manifiesto = JSON.parse(await readFile(`${archivo}.manifest.json`, 'utf8'));
  console.log(`[verify] Respaldo: ${archivo} (creado ${manifiesto.creado_utc})`);

  const sha = await sha256Archivo(archivo);
  if (sha !== manifiesto.sha256) {
    throw new Error(`SHA-256 no coincide con el manifiesto (esperado ${manifiesto.sha256}, real ${sha}): el archivo se corrompió o fue alterado.`);
  }
  console.log('[verify] SHA-256 coincide con el manifiesto.');

  const temporal = await mkdtemp(path.join(os.tmpdir(), 'vaclinic-restore-'));
  try {
    let dump = archivo;
    if (manifiesto.cifrado) {
      dump = path.join(temporal, 'volcado.dump');
      try {
        await descifrarArchivo(archivo, dump, leerClave());
      } catch (e) {
        if (/authenticate/i.test(e.message)) {
          throw new Error('No se pudo autenticar el respaldo: la BACKUP_ENCRYPTION_KEY es distinta a la usada al cifrarlo, o el archivo fue alterado.');
        }
        throw e;
      }
      console.log('[verify] Descifrado correcto (autenticación GCM válida).');
    }

    const ssl = process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false };
    const cliente = new pg.Client({ connectionString: destino, ssl });
    await cliente.connect();
    try {
      const { rows } = await cliente.query(`SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public'`);
      if (rows[0].n > 0) {
        throw new Error(`La base de destino NO está vacía (${rows[0].n} tablas en public). Use una base nueva para la prueba.`);
      }
    } finally {
      await cliente.end();
    }

    await ejecutar('pg_restore', ['--no-owner', '--no-privileges', '--exit-on-error', '--dbname', destino, dump]);
    console.log('[verify] pg_restore terminó sin errores.');

    const c2 = new pg.Client({ connectionString: destino, ssl });
    await c2.connect();
    const obtenido = {};
    try {
      const { rows: tablas } = await c2.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
      for (const { tablename } of tablas) {
        const { rows } = await c2.query(`SELECT count(*)::bigint AS n FROM "${tablename.replace(/"/g, '""')}"`);
        obtenido[tablename] = Number(rows[0].n);
      }
    } finally {
      await c2.end();
    }

    const { ok, diferencias } = compararConteos(manifiesto.tablas, obtenido);
    if (!ok) {
      for (const d of diferencias) console.error(`[verify] DIFERENCIA ${d.tabla}: esperado ${d.esperado}, restaurado ${d.obtenido}`);
      if (manifiesto.conteos_exactos === false) {
        console.error('[verify] (el manifiesto indica que los conteos NO eran de la misma instantánea: puede ser deriva normal)');
      }
      throw new Error(`La restauración NO coincide con el respaldo (${diferencias.length} tablas con diferencias).`);
    }
    const filas = Object.values(obtenido).reduce((a, b) => a + b, 0);
    console.log(`[verify] OK: ${Object.keys(obtenido).length} tablas y ${filas} filas coinciden exactamente con el manifiesto.`);
  } finally {
    await rm(temporal, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error('[verify] FALLÓ:', e.message);
  process.exit(1);
});
