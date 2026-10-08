import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import {
  cifrarArchivo,
  descifrarArchivo,
  compararConteos,
  esArchivoRespaldo,
  leerClave,
  nombreRespaldo,
  ordenarRespaldos,
  seleccionarParaBorrar,
  sha256Archivo
} from '../scripts/backup-lib.mjs';

/**
 * Pruebas de la lógica pura de los respaldos (scripts/backup-lib.mjs). La
 * ejecución real contra PostgreSQL (pg_dump → cifrado → pg_restore → conteos)
 * se verificó contra un Postgres local y corre a diario en CI
 * (.github/workflows/backup-diario.yml); aquí no, porque esta suite no usa BD.
 */

describe('nombreRespaldo / esArchivoRespaldo', () => {
  it('genera un nombre ordenable en UTC y distingue cifrado de no cifrado', () => {
    const f = new Date(Date.UTC(2026, 9, 4, 15, 30, 45));
    expect(nombreRespaldo(f, true)).toBe('backup-20261004-153045.dump.enc');
    expect(nombreRespaldo(f, false)).toBe('backup-20261004-153045.dump');
  });

  it('solo reconoce archivos con el patrón propio', () => {
    expect(esArchivoRespaldo('backup-20261004-153045.dump.enc')).toBe(true);
    expect(esArchivoRespaldo('backup-20261004-153045.dump.enc.manifest.json')).toBe(false);
    expect(esArchivoRespaldo('notas-importantes.txt')).toBe(false);
  });
});

describe('retención (seleccionarParaBorrar)', () => {
  const nombres = [
    'backup-20261001-020000.dump.enc',
    'backup-20261003-020000.dump.enc',
    'backup-20261002-020000.dump.enc',
    'backup-20261004-020000.dump.enc',
    'mis-fotos.zip'
  ];

  it('ordena del más reciente al más antiguo ignorando archivos ajenos', () => {
    expect(ordenarRespaldos(nombres)[0]).toBe('backup-20261004-020000.dump.enc');
    expect(ordenarRespaldos(nombres)).toHaveLength(4);
  });

  it('conserva los N más recientes y devuelve solo los más viejos para borrar', () => {
    expect(seleccionarParaBorrar(nombres, 2)).toEqual([
      'backup-20261002-020000.dump.enc',
      'backup-20261001-020000.dump.enc'
    ]);
  });

  it('nunca borra archivos ajenos, aunque haya muchos', () => {
    expect(seleccionarParaBorrar(nombres, 1)).not.toContain('mis-fotos.zip');
  });

  it('con una retención inválida (0, negativa, NaN) no borra nada', () => {
    expect(seleccionarParaBorrar(nombres, 0)).toEqual([]);
    expect(seleccionarParaBorrar(nombres, -3)).toEqual([]);
    expect(seleccionarParaBorrar(nombres, NaN)).toEqual([]);
  });
});

describe('leerClave', () => {
  it('acepta 32 bytes en hex', () => {
    expect(leerClave(randomBytes(32).toString('hex'))).toHaveLength(32);
  });
  it('rechaza una clave ausente o de longitud incorrecta', () => {
    expect(() => leerClave('')).toThrow(/BACKUP_ENCRYPTION_KEY/);
    expect(() => leerClave('abcd')).toThrow(/32 bytes/);
  });
});

describe('cifrado de archivos (AES-256-GCM, streaming)', () => {
  let dir: string;
  beforeEach(async () => { dir = await mkdtemp(path.join(os.tmpdir(), 'bk-test-')); });
  afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

  it('cifra y descifra devolviendo exactamente los mismos bytes (archivo de varios MB)', async () => {
    const clave = randomBytes(32);
    const original = randomBytes(3 * 1024 * 1024 + 17);
    const a = path.join(dir, 'a.dump'), b = path.join(dir, 'a.enc'), c = path.join(dir, 'a.out');
    await writeFile(a, original);
    await cifrarArchivo(a, b, clave);
    expect((await readFile(b)).subarray(0, 6).toString()).toBe('VACBK1');
    expect((await readFile(b)).equals(original)).toBe(false);
    await descifrarArchivo(b, c, clave);
    expect((await readFile(c)).equals(original)).toBe(true);
  });

  it('dos cifrados del mismo archivo producen salidas distintas (IV aleatorio)', async () => {
    const clave = randomBytes(32);
    const a = path.join(dir, 'a'), b1 = path.join(dir, 'b1'), b2 = path.join(dir, 'b2');
    await writeFile(a, 'datos clínicos');
    await cifrarArchivo(a, b1, clave);
    await cifrarArchivo(a, b2, clave);
    expect((await readFile(b1)).equals(await readFile(b2))).toBe(false);
  });

  it('con una clave equivocada el descifrado falla (no entrega basura)', async () => {
    const a = path.join(dir, 'a'), b = path.join(dir, 'b');
    await writeFile(a, 'datos clínicos');
    await cifrarArchivo(a, b, randomBytes(32));
    await expect(descifrarArchivo(b, path.join(dir, 'c'), randomBytes(32))).rejects.toThrow(/authenticate/i);
  });

  it('un solo byte alterado en el cuerpo hace fallar la autenticación', async () => {
    const clave = randomBytes(32);
    const a = path.join(dir, 'a'), b = path.join(dir, 'b');
    await writeFile(a, randomBytes(4096));
    await cifrarArchivo(a, b, clave);
    const buf = await readFile(b);
    buf[100] ^= 0xff;
    await writeFile(b, buf);
    await expect(descifrarArchivo(b, path.join(dir, 'c'), clave)).rejects.toThrow(/authenticate/i);
  });

  it('rechaza un archivo truncado o que no es un respaldo de VACLINIC', async () => {
    const clave = randomBytes(32);
    const corto = path.join(dir, 'corto'), ajeno = path.join(dir, 'ajeno');
    await writeFile(corto, 'xx');
    await writeFile(ajeno, randomBytes(200));
    await expect(descifrarArchivo(corto, path.join(dir, 'o1'), clave)).rejects.toThrow(/truncado|corto/);
    await expect(descifrarArchivo(ajeno, path.join(dir, 'o2'), clave)).rejects.toThrow(/VACBK1/);
  });

  it('sha256Archivo coincide con el hash conocido de un contenido fijo', async () => {
    const a = path.join(dir, 'a');
    await writeFile(a, 'abc');
    expect(await sha256Archivo(a)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

describe('compararConteos', () => {
  it('ok cuando todas las tablas coinciden', () => {
    expect(compararConteos({ paciente: 5, orden: 3 }, { paciente: 5, orden: 3 })).toEqual({ ok: true, diferencias: [] });
  });
  it('reporta una tabla con distinto número de filas', () => {
    const r = compararConteos({ paciente: 5 }, { paciente: 4 });
    expect(r.ok).toBe(false);
    expect(r.diferencias).toEqual([{ tabla: 'paciente', esperado: 5, obtenido: 4 }]);
  });
  it('una tabla que falta en la restauración cuenta como diferencia (no se ignora)', () => {
    const r = compararConteos({ paciente: 5, orden: 3 }, { paciente: 5 });
    expect(r.ok).toBe(false);
    expect(r.diferencias[0]).toEqual({ tabla: 'orden', esperado: 3, obtenido: null });
  });
});
