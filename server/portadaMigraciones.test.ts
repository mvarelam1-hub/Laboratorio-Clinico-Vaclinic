import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { CLAVES_PORTADA, esClaveAtlas } from './routes/portada';

/**
 * La tabla portada_imagen tiene una restricción CHECK sobre `clave`. Si el
 * servidor acepta una clave que la base rechaza, subir la imagen falla (esto
 * pasó con las imágenes del Atlas). Aquí se comprueba que la restricción más
 * reciente permita TODO lo que el servidor acepta.
 */
const carpeta = join(__dirname, '..', 'db', 'migrations');
const ultima = readdirSync(carpeta)
  .filter((f) => f.endsWith('.sql') && readFileSync(join(carpeta, f), 'utf8').includes('ADD CONSTRAINT portada_imagen_clave_check'))
  .sort()
  .pop()!;
const sql = readFileSync(join(carpeta, ultima), 'utf8');
const definicion = sql.slice(sql.indexOf('ADD CONSTRAINT portada_imagen_clave_check'));

describe('restricción de clave en portada_imagen', () => {
  it('la migración más reciente permite todas las posiciones fijas del servidor', () => {
    const permitidas = [...definicion.matchAll(/'([a-z_0-9]+)'/g)].map((m) => m[1]);
    for (const clave of CLAVES_PORTADA) expect(permitidas).toContain(clave);
  });

  it('permite las claves del Atlas con el mismo patrón que valida el servidor', () => {
    const patron = definicion.match(/clave ~ '([^']+)'/);
    expect(patron).not.toBeNull();
    const re = new RegExp(patron![1]);
    for (const clave of ['atlas_giardia_lamblia', 'atlas_x', 'atlas_cristal_oxalato_calcio']) {
      expect(esClaveAtlas(clave)).toBe(true);
      expect(re.test(clave)).toBe(true);
    }
    for (const clave of ['atlas_', 'atlas_MAYUS', 'atlas_con-guion', 'otro_cosa', 'atlas_' + 'a'.repeat(60)]) {
      expect(esClaveAtlas(clave)).toBe(false);
      expect(re.test(clave)).toBe(false);
    }
  });
});
