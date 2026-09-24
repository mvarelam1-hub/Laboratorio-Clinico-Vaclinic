/**
 * Reactivos e insumos (ReagentInventoryItem + ReagentMovementLog) —
 * sexto módulo de los 9 migrados desde localStorage (ver
 * ClinicContext.tsx addReagent/updateReagent/deleteReagent/
 * registerReagentMovement). Migración real:
 * db/migrations/0011_modulos_restantes.sql (tablas `reactivo` y
 * `movimiento_reactivo`).
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';

export const reactivosRouter = Router();
reactivosRouter.use(requireStaffAuth);

const TIPOS_MOVIMIENTO = ['entrada', 'salida_consumo', 'ajuste', 'baja_vencimiento'];

function calcularEstado(stockActual: number, stockMinimoAlerta: number): 'optimo' | 'bajo_stock' | 'critico' {
  if (stockActual <= Math.floor(stockMinimoAlerta * 0.5)) return 'critico';
  if (stockActual <= stockMinimoAlerta) return 'bajo_stock';
  return 'optimo';
}

reactivosRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM reactivo ORDER BY fecha_actualizacion DESC');
  return res.json(rows);
}));

// Declarado ANTES de '/:id/movimientos' para que Express no confunda el
// literal "movimientos" con un :id.
reactivosRouter.get('/movimientos', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT m.*, r.nombre AS nombre_reactivo, u.nombre_completo AS nombre_operador
     FROM movimiento_reactivo m
     JOIN reactivo r ON r.id_reactivo = m.id_reactivo
     LEFT JOIN usuario u ON u.id_usuario = m.id_operador
     ORDER BY m.fecha DESC`
  );
  return res.json(rows);
}));

reactivosRouter.post('/', requirePermission('qc_calibraciones'), asyncHandler(async (req, res) => {
  const {
    code, name, category, associatedTests, lotNumber, expirationDate,
    currentStock, minStockAlert, optimalStock, unit, storageCondition,
    supplier, location, costPerUnit, testsPerUnit, notes
  } = req.body || {};

  if (!code || !name || !category || !lotNumber || !expirationDate || !unit) {
    return res.status(400).json({ error: 'code, name, category, lotNumber, expirationDate y unit son obligatorios.' });
  }

  const stockInicial = Number(currentStock) || 0;
  const minimo = Number(minStockAlert) || 0;
  const estado = calcularEstado(stockInicial, minimo);

  try {
    const { rows } = await pool.query(
      `INSERT INTO reactivo
         (codigo, nombre, categoria, pruebas_asociadas, numero_lote, fecha_vencimiento,
          stock_actual, stock_minimo_alerta, stock_optimo, unidad, condicion_almacenamiento,
          proveedor, ubicacion, costo_por_unidad, pruebas_por_unidad, estado, notas,
          fecha_ultimo_reabasto)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        String(code).trim(), String(name).trim(), category, Array.isArray(associatedTests) ? associatedTests : [],
        lotNumber, expirationDate, stockInicial, minimo, Number(optimalStock) || 0, unit,
        storageCondition || null, supplier || null, location || null, Number(costPerUnit) || 0,
        Number(testsPerUnit) || 1, estado, notes || null, stockInicial > 0 ? new Date().toISOString() : null
      ]
    );
    const reactivoCreado = rows[0];

    // Movimiento de entrada por el stock inicial, igual que addReagent()
    // ya registraba localmente antes de esta migración.
    if (stockInicial > 0) {
      await pool.query(
        `INSERT INTO movimiento_reactivo (id_reactivo, tipo, cantidad, stock_anterior, stock_nuevo, motivo, id_operador)
         VALUES ($1, 'entrada', $2, 0, $2, 'Ingreso inicial al catálogo', $3)`,
        [reactivoCreado.id_reactivo, stockInicial, req.staffUser!.idUsuario]
      );
    }

    return res.status(201).json(reactivoCreado);
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: `Ya existe un reactivo con el código "${code}".` });
    }
    if (err?.code === '23514') {
      return res.status(400).json({ error: 'storageCondition no es válida.' });
    }
    throw err;
  }
}));

reactivosRouter.patch('/:id', requirePermission('qc_calibraciones'), asyncHandler(async (req, res) => {
  const idReactivo = Number(req.params.id);
  const {
    name, category, associatedTests, lotNumber, expirationDate, minStockAlert, optimalStock,
    unit, storageCondition, supplier, location, costPerUnit, testsPerUnit, notes
  } = req.body || {};

  const { rows: actualRows } = await pool.query('SELECT stock_actual, stock_minimo_alerta FROM reactivo WHERE id_reactivo = $1', [idReactivo]);
  if (actualRows.length === 0) return res.status(404).json({ error: 'Reactivo no encontrado.' });

  const nuevoMinimo = minStockAlert !== undefined ? Number(minStockAlert) : Number(actualRows[0].stock_minimo_alerta);
  const estado = calcularEstado(Number(actualRows[0].stock_actual), nuevoMinimo);

  const { rows } = await pool.query(
    `UPDATE reactivo
     SET nombre = COALESCE($1, nombre), categoria = COALESCE($2, categoria),
         pruebas_asociadas = COALESCE($3, pruebas_asociadas), numero_lote = COALESCE($4, numero_lote),
         fecha_vencimiento = COALESCE($5, fecha_vencimiento), stock_minimo_alerta = COALESCE($6, stock_minimo_alerta),
         stock_optimo = COALESCE($7, stock_optimo), unidad = COALESCE($8, unidad),
         condicion_almacenamiento = COALESCE($9, condicion_almacenamiento), proveedor = COALESCE($10, proveedor),
         ubicacion = COALESCE($11, ubicacion), costo_por_unidad = COALESCE($12, costo_por_unidad),
         pruebas_por_unidad = COALESCE($13, pruebas_por_unidad), notas = COALESCE($14, notas),
         estado = $15, fecha_actualizacion = NOW()
     WHERE id_reactivo = $16
     RETURNING *`,
    [
      name || null, category || null, Array.isArray(associatedTests) ? associatedTests : null,
      lotNumber || null, expirationDate || null, minStockAlert !== undefined ? nuevoMinimo : null,
      optimalStock !== undefined ? Number(optimalStock) : null, unit || null, storageCondition || null,
      supplier || null, location || null, costPerUnit !== undefined ? Number(costPerUnit) : null,
      testsPerUnit !== undefined ? Number(testsPerUnit) : null, notes || null, estado, idReactivo
    ]
  );
  return res.json(rows[0]);
}));

reactivosRouter.delete('/:id', requirePermission('qc_calibraciones'), asyncHandler(async (req, res) => {
  const idReactivo = Number(req.params.id);
  // ON DELETE CASCADE en movimiento_reactivo (ver migración 0011): al
  // eliminar el reactivo se pierde también su bitácora de movimientos,
  // igual que ya ocurría con deleteReagent() en localStorage (no filtraba
  // los reagentMovements asociados; se documenta aquí porque en Postgres
  // real sí es una eliminación irreversible de esas filas).
  const { rowCount } = await pool.query('DELETE FROM reactivo WHERE id_reactivo = $1', [idReactivo]);
  if (rowCount === 0) return res.status(404).json({ error: 'Reactivo no encontrado.' });
  return res.json({ ok: true });
}));

reactivosRouter.post('/:id/movimientos', requirePermission('qc_calibraciones'), asyncHandler(async (req, res) => {
  const idReactivo = Number(req.params.id);
  const { type, quantity, reason } = req.body || {};

  if (!TIPOS_MOVIMIENTO.includes(type)) {
    return res.status(400).json({ error: `type inválido. Usa ${TIPOS_MOVIMIENTO.join(', ')}.` });
  }
  const cantidad = Number(quantity);
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return res.status(400).json({ error: 'quantity debe ser un número mayor que 0.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: reactivoRows } = await client.query('SELECT * FROM reactivo WHERE id_reactivo = $1 FOR UPDATE', [idReactivo]);
    if (reactivoRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reactivo no encontrado.' });
    }
    const reactivo = reactivoRows[0];
    const stockAnterior = Number(reactivo.stock_actual);
    let stockNuevo = stockAnterior;
    if (type === 'entrada') stockNuevo = stockAnterior + cantidad;
    else if (type === 'salida_consumo' || type === 'baja_vencimiento') stockNuevo = Math.max(0, stockAnterior - cantidad);
    else if (type === 'ajuste') stockNuevo = cantidad;

    const nuevoEstado = calcularEstado(stockNuevo, Number(reactivo.stock_minimo_alerta));

    const { rows: actualizado } = await client.query(
      `UPDATE reactivo
       SET stock_actual = $1, estado = $2, fecha_actualizacion = NOW(),
           fecha_ultimo_reabasto = CASE WHEN $3 = 'entrada' THEN NOW() ELSE fecha_ultimo_reabasto END
       WHERE id_reactivo = $4
       RETURNING *`,
      [stockNuevo, nuevoEstado, type, idReactivo]
    );

    const { rows: movimientoRows } = await client.query(
      `INSERT INTO movimiento_reactivo (id_reactivo, tipo, cantidad, stock_anterior, stock_nuevo, motivo, id_operador)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [idReactivo, type, cantidad, stockAnterior, stockNuevo, reason || null, req.staffUser!.idUsuario]
    );

    await client.query('COMMIT');
    return res.status(201).json({ reactivo: actualizado[0], movimiento: movimientoRows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));
