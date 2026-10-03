import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-staff';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';

export const ordenesRouter = Router();
ordenesRouter.use(requireStaffAuth);

ordenesRouter.post('/', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const { idPaciente, examenesIds } = req.body || {};
  if (!idPaciente || !Array.isArray(examenesIds) || examenesIds.length === 0) {
    return res.status(400).json({ error: 'idPaciente y examenesIds (arreglo no vacío) son obligatorios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const numeroOrden = `ORD-${Date.now()}`;
    const { rows: ordenRows } = await client.query(
      `INSERT INTO orden (numero_orden, id_paciente, id_recepcionista, estado)
       VALUES ($1, $2, $3, 'Registrada') RETURNING id_orden, numero_orden`,
      [numeroOrden, idPaciente, req.staffUser!.idUsuario]
    );
    const idOrden = ordenRows[0].id_orden;

    // Se acumulan las filas de detalle_orden creadas (con su codigo_examen)
    // para devolverlas en la respuesta: el frontend las necesita para poder
    // enlazar después cada parámetro de un informe (por examCode) con el
    // id_detalle_orden exacto que exige POST /api/resultados (ver
    // ClinicContext.tsx `addOrder`/`addReport` y src/types.ts `LabOrder.detalleRemoto`).
    const detalleCreado: Array<{ idDetalle: number; idExamen: number; codigoExamen: string | null }> = [];
    for (const idExamen of examenesIds) {
      const { rows: examRows } = await client.query('SELECT precio, codigo_examen FROM examen WHERE id_examen = $1', [idExamen]);
      if (examRows.length === 0) throw new Error(`Examen ${idExamen} no existe en el catálogo.`);
      const { rows: detalleRows } = await client.query(
        `INSERT INTO detalle_orden (id_orden, id_examen, precio_unitario) VALUES ($1, $2, $3) RETURNING id_detalle`,
        [idOrden, idExamen, examRows[0].precio]
      );
      detalleCreado.push({
        idDetalle: detalleRows[0].id_detalle,
        idExamen,
        codigoExamen: examRows[0].codigo_examen ?? null
      });
    }

    // Genera el código único de consulta pública de esta orden (único
    // mecanismo de acceso del paciente al resultado, ver la nota en
    // pacientes.ts y fn_generar_codigo_consulta en la migración 0004).
    // ANTES: esta función ya existía en la base de datos desde esa
    // migración pero nunca se llamaba desde ningún lado — toda orden
    // creada por esta ruta quedaba sin código, es decir, inaccesible desde
    // el Portal del Paciente (POST /api/portal/login).
    const { rows: codigoRows } = await client.query(
      'SELECT fn_generar_codigo_consulta($1) AS codigo',
      [idOrden]
    );

    await client.query('COMMIT');
    return res.status(201).json({ ...ordenRows[0], codigo_consulta: codigoRows[0].codigo, detalle: detalleCreado });
  } catch (err: any) {
    await client.query('ROLLBACK');
    return res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}));

// Listado general de órdenes (historial). Deliberadamente abierto a
// cualquier personal autenticado -sin requirePermission adicional-, porque
// recepción, bioanalistas, director y auditoría necesitan verlo por
// distintos motivos; lo que sí está protegido por permiso es CREAR,
// VALIDAR o PUBLICAR (abajo y en resultados.ts).
//
// Excluye `eliminada = TRUE` (migración 0013): una orden eliminada
// lógicamente no debe reaparecer en el listado general -el borrado sigue
// pareciendo definitivo desde la UI, igual que antes de esta migración-,
// pero el registro permanece en la base de datos para auditoría y se puede
// seguir consultando por id (GET /:id más abajo, que no filtra por esto).
ordenesRouter.get('/', asyncHandler(async (req, res) => {
  const limite = Math.min(Number(req.query.limite) || 100, 500);
  const { rows } = await pool.query(
    `SELECT o.id_orden, o.numero_orden, o.fecha_registro, o.estado, o.total_cobrado, o.sede,
            o.archivada, o.fecha_archivo, o.id_carpeta,
            p.id_paciente, p.nombre_completo AS paciente_nombre
     FROM orden o
     JOIN paciente p ON p.id_paciente = o.id_paciente
     WHERE o.eliminada = FALSE
     ORDER BY o.fecha_registro DESC
     LIMIT $1`,
    [limite]
  );
  return res.json(rows);
}));

// Alimenta directamente el dashboard con la vista de la Etapa 2 — el
// backend no reimplementa la lógica de "qué está pendiente", la reutiliza.
// IMPORTANTE: estas dos rutas de segmento fijo deben registrarse ANTES que
// la ruta genérica "/:id" (más abajo) — si no, Express interpretaría
// "pendientes-validacion" y "resultados-criticos" como un :id literal y
// esta ruta nunca se alcanzaría.
ordenesRouter.get('/pendientes-validacion', requirePermission('validacion_redaccion'), asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM vw_ordenes_pendientes_validacion ORDER BY fecha_registro ASC');
  return res.json(rows);
}));

ordenesRouter.get('/resultados-criticos', requirePermission('analizadores_panico'), asyncHandler(async (_req, res) => {
  const { rows } = await pool.query('SELECT * FROM vw_resultados_criticos');
  return res.json(rows);
}));

ordenesRouter.get('/:id', asyncHandler(async (req, res) => {
  const idOrden = Number(req.params.id);
  const { rows: ordenRows } = await pool.query(
    `SELECT o.*, p.nombre_completo AS paciente_nombre
     FROM orden o JOIN paciente p ON p.id_paciente = o.id_paciente
     WHERE o.id_orden = $1`,
    [idOrden]
  );
  if (ordenRows.length === 0) return res.status(404).json({ error: 'Orden no encontrada.' });

  const { rows: detalleRows } = await pool.query(
    `SELECT d.id_detalle, d.id_examen, d.precio_unitario, e.nombre_examen, e.codigo_examen,
            r.id_resultado, r.estado AS estado_resultado, r.valor_capturado
     FROM detalle_orden d
     JOIN examen e ON e.id_examen = d.id_examen
     LEFT JOIN resultado r ON r.id_detalle = d.id_detalle
     WHERE d.id_orden = $1`,
    [idOrden]
  );
  return res.json({ ...ordenRows[0], detalle: detalleRows });
}));

// ------------------------------------------------------------
// Ciclo de vida de la orden: archivar / restaurar / eliminar
// (migración 0013). ANTES: ClinicContext.tsx manejaba las 7 funciones de
// este ciclo (updateOrder, deleteOrder, archiveOrder, restoreOrder,
// bulk*) 100% en el navegador, sin ninguna de estas rutas -y
// deleteOrder/bulkDeleteOrders hacían además un borrado físico del
// arreglo local, lo que habría significado perder la orden para
// siempre de haber existido sincronización-. AHORA: archivar/restaurar
// usan las columnas ya existentes desde la migración 0003
// (archivada/fecha_archivo), completadas aquí con el usuario
// responsable; "eliminar" NUNCA borra la fila, solo la marca
// `eliminada = TRUE` (eliminación lógica, informe técnico sección 4.3).
//
// updateOrder (edición general de campos como estado/sede/prioridad)
// queda deliberadamente fuera de esta migración: el `estado` del
// frontend (Pendiente/En Proceso/Listo/Entregado) no corresponde al
// `estado` real de la tabla orden (Registrada/En proceso/Completada/
// Cancelada, ver migración 0002), y columnas como prioridad, método de
// pago o datos biométricos todavía no existen en `orden` -mapearlas
// sin definir antes esa correspondencia arriesgaría introducir un
// estado clínico incorrecto. Queda pendiente junto con el resto de
// columnas de pago/prioridad/biometría ya señaladas como brecha en
// esta fase.
//
// Se reutiliza el permiso 'admision_crear_ordenes' (igual que
// carpetas.ts para mover/eliminar carpetas): no existe en el catálogo
// un permiso más específico para archivar/eliminar órdenes, y crear uno
// nuevo implicaría tocar el catálogo de roles/permisos (src/shared/
// permissions.ts) y la migración de rol_permiso_default, fuera del
// alcance de esta pieza.

ordenesRouter.patch('/:id/archivar', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idOrden = Number(req.params.id);
  const { rows } = await pool.query(
    `UPDATE orden
     SET archivada = TRUE, fecha_archivo = NOW(), id_usuario_archivo = $1
     WHERE id_orden = $2 AND eliminada = FALSE
     RETURNING id_orden, archivada, fecha_archivo, id_usuario_archivo`,
    [req.staffUser!.idUsuario, idOrden]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada o ya eliminada.' });
  return res.json(rows[0]);
}));

ordenesRouter.patch('/:id/restaurar', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idOrden = Number(req.params.id);
  const { rows } = await pool.query(
    `UPDATE orden
     SET archivada = FALSE, fecha_archivo = NULL, id_usuario_archivo = NULL
     WHERE id_orden = $1 AND eliminada = FALSE
     RETURNING id_orden, archivada`,
    [idOrden]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada o ya eliminada.' });
  return res.json(rows[0]);
}));

ordenesRouter.delete('/:id', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idOrden = Number(req.params.id);
  const { motivo } = req.body || {};
  const { rows } = await pool.query(
    `UPDATE orden
     SET eliminada = TRUE, fecha_eliminacion = NOW(), id_usuario_eliminacion = $1,
         motivo_eliminacion = $2
     WHERE id_orden = $3 AND eliminada = FALSE
     RETURNING id_orden, eliminada, fecha_eliminacion`,
    [req.staffUser!.idUsuario, (motivo && String(motivo).trim()) || null, idOrden]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada o ya estaba eliminada.' });
  return res.json({ ok: true, ...rows[0] });
}));

ordenesRouter.patch('/archivar-varias', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const { idsOrdenes } = req.body || {};
  if (!Array.isArray(idsOrdenes) || idsOrdenes.length === 0) {
    return res.status(400).json({ error: 'idsOrdenes (arreglo no vacío) es obligatorio.' });
  }
  const { rowCount } = await pool.query(
    `UPDATE orden SET archivada = TRUE, fecha_archivo = NOW(), id_usuario_archivo = $1
     WHERE id_orden = ANY($2::int[]) AND eliminada = FALSE`,
    [req.staffUser!.idUsuario, idsOrdenes.map(Number)]
  );
  return res.json({ ok: true, actualizadas: rowCount });
}));

ordenesRouter.patch('/restaurar-varias', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const { idsOrdenes } = req.body || {};
  if (!Array.isArray(idsOrdenes) || idsOrdenes.length === 0) {
    return res.status(400).json({ error: 'idsOrdenes (arreglo no vacío) es obligatorio.' });
  }
  const { rowCount } = await pool.query(
    `UPDATE orden SET archivada = FALSE, fecha_archivo = NULL, id_usuario_archivo = NULL
     WHERE id_orden = ANY($1::int[]) AND eliminada = FALSE`,
    [idsOrdenes.map(Number)]
  );
  return res.json({ ok: true, actualizadas: rowCount });
}));

ordenesRouter.patch('/eliminar-varias', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const { idsOrdenes, motivo } = req.body || {};
  if (!Array.isArray(idsOrdenes) || idsOrdenes.length === 0) {
    return res.status(400).json({ error: 'idsOrdenes (arreglo no vacío) es obligatorio.' });
  }
  const { rowCount } = await pool.query(
    `UPDATE orden
     SET eliminada = TRUE, fecha_eliminacion = NOW(), id_usuario_eliminacion = $1,
         motivo_eliminacion = $2
     WHERE id_orden = ANY($3::int[]) AND eliminada = FALSE`,
    [req.staffUser!.idUsuario, (motivo && String(motivo).trim()) || null, idsOrdenes.map(Number)]
  );
  return res.json({ ok: true, actualizadas: rowCount });
}));
