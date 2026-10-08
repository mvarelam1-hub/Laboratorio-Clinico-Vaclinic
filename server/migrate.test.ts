import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readdirSync } from 'node:fs';
import {
  versionDeArchivo,
  esSemilla,
  ordenarMigraciones,
  seleccionarPendientes,
  versionesDeLineaBase,
  DIRECTORIO_MIGRACIONES,
  ULTIMA_VERSION_LINEA_BASE,
  asegurarAdministradorDeArranque
} from '../scripts/migrate.mjs';

/**
 * Pruebas unitarias del runner de migraciones (scripts/migrate.mjs): solo
 * la lógica pura de selección/orden. La ejecución real contra PostgreSQL
 * (línea base, idempotencia, rollback de una migración que falla) se
 * verificó a mano contra un Postgres local antes de commitear el runner;
 * no se automatiza aquí porque el resto de la suite corre sin base de datos.
 */

describe('versionDeArchivo / esSemilla', () => {
  it('extrae la versión de un nombre válido', () => {
    expect(versionDeArchivo('0010_catalogo_examenes_real.sql')).toBe('0010');
  });

  it('ignora archivos que no son migraciones', () => {
    expect(versionDeArchivo('README.md')).toBeNull();
    expect(versionDeArchivo('10_sin_ceros.sql')).toBeNull();
    expect(versionDeArchivo('0010_notas.txt')).toBeNull();
  });

  it('0099 es la semilla de datos ficticios', () => {
    expect(esSemilla('0099_seed_demo_ficticio.sql')).toBe(true);
    expect(esSemilla('0011_modulos_restantes.sql')).toBe(false);
  });
});

describe('ordenarMigraciones', () => {
  const desordenadas = [
    '0011_modulos_restantes.sql',
    'notas.md',
    '0001_initial_schema.sql',
    '0099_seed_demo_ficticio.sql',
    '0010_catalogo_examenes_real.sql'
  ];

  it('ordena por versión y excluye la semilla por defecto', () => {
    expect(ordenarMigraciones(desordenadas)).toEqual([
      '0001_initial_schema.sql',
      '0010_catalogo_examenes_real.sql',
      '0011_modulos_restantes.sql'
    ]);
  });

  it('incluye la semilla solo si se pide explícitamente, y al final', () => {
    const r = ordenarMigraciones(desordenadas, { incluirSemillas: true });
    expect(r[r.length - 1]).toBe('0099_seed_demo_ficticio.sql');
    expect(r).toHaveLength(4);
  });
});

describe('seleccionarPendientes', () => {
  it('devuelve solo lo que no está aplicado, conservando el orden', () => {
    const ordenadas = ['0001_a.sql', '0002_b.sql', '0010_c.sql', '0011_d.sql'];
    expect(seleccionarPendientes(ordenadas, ['0001', '0002'])).toEqual(['0010_c.sql', '0011_d.sql']);
  });

  it('no devuelve nada si todo está aplicado', () => {
    expect(seleccionarPendientes(['0001_a.sql'], ['0001'])).toEqual([]);
  });
});

describe('versionesDeLineaBase', () => {
  it('marca como línea base solo hasta 0009 (lo aplicado a mano en Neon)', () => {
    const ordenadas = ['0001_a.sql', '0009_b.sql', '0010_c.sql', '0011_d.sql'];
    expect(ULTIMA_VERSION_LINEA_BASE).toBe('0009');
    expect(versionesDeLineaBase(ordenadas)).toEqual(['0001', '0009']);
  });
});

describe('asegurarAdministradorDeArranque', () => {
  const ADMIN_INITIAL_PASSWORD_ORIGINAL = process.env.ADMIN_INITIAL_PASSWORD;

  beforeEach(() => {
    process.env.ADMIN_INITIAL_PASSWORD = 'ClaveDeArranque123!';
  });
  afterEach(() => {
    process.env.ADMIN_INITIAL_PASSWORD = ADMIN_INITIAL_PASSWORD_ORIGINAL;
  });

  function fakeClient(filas: any[]) {
    return { query: vi.fn().mockResolvedValueOnce({ rows: filas }).mockResolvedValue({ rows: [] }) };
  }

  it('no hace nada si ya existe un usuario administrador_ti (idempotente)', async () => {
    const client = fakeClient([{ '?column?': 1 }]);
    const resultado = await asegurarAdministradorDeArranque(client, () => {});
    expect(resultado.creado).toBe(false);
    expect(client.query).toHaveBeenCalledTimes(1); // solo el SELECT, nunca el INSERT
  });

  it('crea la cuenta de arranque si no existe ningún administrador_ti', async () => {
    const client = fakeClient([]);
    const resultado = await asegurarAdministradorDeArranque(client, () => {});
    expect(resultado.creado).toBe(true);
    expect(client.query).toHaveBeenCalledTimes(2);
    const [, params] = (client.query as any).mock.calls[1];
    expect(params[2]).toMatch(/^[0-9a-f]+:[0-9a-f]+$/); // contrasena_hash en formato salt:hash
  });

  it('no crea nada (y avisa) si falta ADMIN_INITIAL_PASSWORD', async () => {
    delete process.env.ADMIN_INITIAL_PASSWORD;
    const client = fakeClient([]);
    const resultado = await asegurarAdministradorDeArranque(client, () => {});
    expect(resultado.creado).toBe(false);
    expect(client.query).toHaveBeenCalledTimes(1); // solo el SELECT
  });
});

describe('directorio real db/migrations', () => {
  it('todas las migraciones reales del repositorio se reconocen y quedan en orden', () => {
    const reales = ordenarMigraciones(readdirSync(DIRECTORIO_MIGRACIONES), { incluirSemillas: true });
    const versiones = reales.map(versionDeArchivo);
    expect(versiones).toEqual([...versiones].sort());
    expect(versiones).toContain('0010');
    expect(versiones).toContain('0011');
    // No debe haber dos archivos con la misma versión: el runner usa la
    // versión como clave primaria en schema_migrations.
    expect(new Set(versiones).size).toBe(versiones.length);
  });
});
