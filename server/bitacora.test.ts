import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Pruebas unitarias sobre server/bitacora.ts -el helper interno que escribe
 * en la bitácora REAL (`historial_auditoria`). NO existía ningún test para
 * este archivo porque, hasta la convergencia de los dos sistemas de
 * auditoría (ver server/routes/auth.ts, ordenes.ts y examenes.ts),
 * `registrarBitacora()` no tenía ningún punto de llamada real en todo el
 * backend -código muerto desde la migración 0011-.
 *
 * Deliberadamente NO se prueba aquí ninguna ruta pública que lo invoque
 * directamente desde el cliente (no existe ninguna, por diseño: ver el
 * comentario de cabecera de bitacora.ts) -esas pruebas ya viven junto a
 * cada ruta que lo usa como efecto secundario de una acción ya autorizada.
 */

const queryMock = vi.fn();
vi.mock('./db', () => ({
  pool: { query: (...args: any[]) => queryMock(...args) },
}));

beforeEach(() => {
  vi.resetModules();
  queryMock.mockReset();
  queryMock.mockResolvedValue({ rows: [] });
});

describe('registrarBitacora', () => {
  it('inserta en historial_auditoria con los valores provistos', async () => {
    const { registrarBitacora } = await import('./bitacora');
    await registrarBitacora({
      idUsuario: 7,
      accion: 'Inicio de sesión exitoso',
      modulo: 'autenticacion',
      severidad: 'info',
      detalles: 'Rol: director_laboratorio'
    });

    expect(queryMock).toHaveBeenCalledTimes(1);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO historial_auditoria/);
    expect(params).toEqual([7, 'Inicio de sesión exitoso', 'autenticacion', 'info', 'Rol: director_laboratorio', null, null]);
  });

  it('usa severidad "info" por defecto cuando no se especifica', async () => {
    const { registrarBitacora } = await import('./bitacora');
    await registrarBitacora({ idUsuario: 1, accion: 'Examen creado en catálogo', modulo: 'catalogo' });

    const [, params] = queryMock.mock.calls[0];
    expect(params[3]).toBe('info');
  });

  it('incluye valorAnterior y valorNuevo cuando se proveen', async () => {
    const { registrarBitacora } = await import('./bitacora');
    await registrarBitacora({
      idUsuario: 3,
      accion: 'Precio de examen modificado',
      modulo: 'catalogo',
      severidad: 'warning',
      valorAnterior: 'Q50',
      valorNuevo: 'Q75'
    });

    const [, params] = queryMock.mock.calls[0];
    expect(params[5]).toBe('Q50');
    expect(params[6]).toBe('Q75');
  });

  it('propaga el error si la base de datos falla -el llamador decide si lo atrapa o no', async () => {
    queryMock.mockRejectedValueOnce(new Error('conexión perdida'));
    const { registrarBitacora } = await import('./bitacora');
    await expect(
      registrarBitacora({ idUsuario: 1, accion: 'x', modulo: 'seguridad' })
    ).rejects.toThrow('conexión perdida');
  });
});
