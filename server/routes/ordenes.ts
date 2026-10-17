import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-staff';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';
import { registrarBitacora } from '../bitacora';

export const ordenesRouter = Router();
ordenesRouter.use(requireStaffAuth);

const PRIORIDADES_VALIDAS = ['rutina', 'urgente', 'stat_panico'];
const METODOS_PAGO_VALIDOS = ['efectivo', 'tarjeta', 'transferencia', 'seguro', 'por_cobrar'];
const ESTADOS_FLUJO_VALIDOS = ['Pendiente', 'En Proceso', 'Listo', 'Entregado'];

ordenesRouter.post('/', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const {
    idPaciente, examenesIds,
    // Metadata de pago/prioridad/biometría (migración 0016) — opcionales,
    // todas tienen default en la propia tabla si no se envían.
    prioridad, metodoPago, promoAplicada, sedeCama,
    esAltoRiesgo, biometriaAutorizada, datosBiometricos
  } = req.body || {};
  if (!idPaciente || !Array.isArray(examenesIds) || examenesIds.length === 0) {
    return res.status(400).json({ error: 'idPaciente y examenesIds (arreglo no vacío) son obligatorios.' });
  }
  if (prioridad !== undefined && !PRIORIDADES_VALIDAS.includes(prioridad)) {
    return res.status(400).json({ error: `prioridad inválida. Valores permitidos: ${PRIORIDADES_VALIDAS.join(', ')}.` });
  }
  if (metodoPago !== undefined && metodoPago !== null && !METODOS_PAGO_VALIDOS.includes(metodoPago)) {
    return res.status(400).json({ error: `metodoPago inválido. Valores permitidos: ${METODOS_PAGO_VALIDOS.join(', ')}.` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // N.º de orden corto y legible: ORD-AAMMDD-NNN (día en hora de Guatemala + correlativo del día).
    // El candado de transacción evita que dos órdenes simultáneas tomen el mismo correlativo
    // (numero_orden es UNIQUE). Las órdenes antiguas (ORD-<milisegundos>) no se tocan.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', ['numero_orden']);
    const { rows: diaRows } = await client.query(
      "SELECT to_char(now() AT TIME ZONE 'America/Guatemala', 'YYMMDD') AS dia"
    );
    const dia: string = diaRows?.[0]?.dia ?? new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const { rows: sigRows } = await client.query(
      `SELECT COALESCE(MAX(substring(numero_orden FROM '[0-9]+$')::int), 0) + 1 AS siguiente
       FROM orden WHERE numero_orden LIKE $1`,
      [`ORD-${dia}-%`]
    );
    const siguiente = Number(sigRows?.[0]?.siguiente) || 1;
    const numeroOrden = `ORD-${dia}-${String(siguiente).padStart(3, '0')}`;

    // Se acumulan las filas de detalle_orden creadas (con su codigo_examen)
    // para devolverlas en la respuesta: el frontend las necesita para poder
    // enlazar después cada parámetro de un informe (por examCode) con el
    // id_detalle_orden exacto que exige POST /api/resultados (ver
    // ClinicContext.tsx `addOrder`/`addReport` y src/types.ts `LabOrder.detalleRemoto`).
    // Se resuelven los precios ANTES del INSERT de `orden` para poder fijar
    // total_cobrado de una vez (antes quedaba siempre en 0, el default de
    // la columna — ninguna ruta lo escribía nunca).
    const examenesResueltos: Array<{ idExamen: number; precio: number; codigoExamen: string | null }> = [];
    for (const idExamen of examenesIds) {
      const { rows: examRows } = await client.query('SELECT precio, codigo_examen FROM examen WHERE id_examen = $1', [idExamen]);
      if (examRows.length === 0) throw new Error(`Examen ${idExamen} no existe en el catálogo.`);
      examenesResueltos.push({ idExamen, precio: Number(examRows[0].precio) || 0, codigoExamen: examRows[0].codigo_examen ?? null });
    }
    const totalCobrado = examenesResueltos.reduce((sum, e) => sum + e.precio, 0);

    const { rows: ordenRows } = await client.query(
      `INSERT INTO orden (
         numero_orden, id_paciente, id_recepcionista, estado, total_cobrado,
         prioridad, metodo_pago, saldo_pendiente, promo_aplicada, sede_cama,
         es_alto_riesgo, biometria_autorizada, datos_biometricos
       )
       VALUES ($1, $2, $3, 'Registrada', $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
       RETURNING id_orden, numero_orden`,
      [
        numeroOrden, idPaciente, req.staffUser!.idUsuario, totalCobrado,
        prioridad || 'rutina', metodoPago || null,
        metodoPago === 'por_cobrar' ? totalCobrado : 0,
        promoAplicada || null, sedeCama || null,
        esAltoRiesgo === true, biometriaAutorizada === true,
        datosBiometricos ? JSON.stringify(datosBiometricos) : null
      ]
    );
    const idOrden = ordenRows[0].id_orden;

    const detalleCreado: Array<{ idDetalle: number; idExamen: number; codigoExamen: string | null }> = [];
    for (const e of examenesResueltos) {
      const { rows: detalleRows } = await client.query(
        `INSERT INTO detalle_orden (id_orden, id_examen, precio_unitario) VALUES ($1, $2, $3) RETURNING id_detalle`,
        [idOrden, e.idExamen, e.precio]
      );
      detalleCreado.push({ idDetalle: detalleRows[0].id_detalle, idExamen: e.idExamen, codigoExamen: e.codigoExamen });
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
//
// ANTES: ningún componente del frontend llamaba a esta ruta -`orders` en
// ClinicContext.tsx solo se poblaba al crear/editar una orden en esa misma
// sesión del navegador (addOrder/updateOrder), nunca se hidrataba desde
// Postgres al cargar la página-, así que una orden creada en otra
// computadora o navegador era invisible hasta que alguien la tocara
// localmente. AHORA: el SELECT trae todo lo necesario para reconstruir un
// LabOrder completo sin round-trips adicionales (ver
// ClinicContext.tsx `syncOrdersFromServer` y
// ordenesApiService.ts `obtenerOrdenesRemotas`):
//   - dni/teléfono/correo del paciente (antes solo se traía el nombre)
//   - el código de consulta pública (tabla codigo_consulta)
//   - el estado del informe clínico más reciente de la orden (si existe),
//     para poder derivar `reportStatus` sin una segunda llamada
//   - el detalle de exámenes de la orden (detalle_orden + examen) como un
//     arreglo JSON agregado, para poder reconstruir testsList/testsCount/
//     detalleRemoto/examCodes
ordenesRouter.get('/', asyncHandler(async (req, res) => {
  const limite = Math.min(Number(req.query.limite) || 100, 500);
  const { rows } = await pool.query(
    `SELECT o.id_orden, o.numero_orden, o.fecha_registro, o.estado, o.total_cobrado, o.sede,
            o.archivada, o.fecha_archivo, o.id_carpeta,
            o.prioridad, o.estado_flujo, o.metodo_pago, o.saldo_pendiente, o.promo_aplicada,
            o.sede_cama, o.es_alto_riesgo, o.biometria_autorizada, o.datos_biometricos,
            p.id_paciente, p.nombre_completo AS paciente_nombre, p.dni AS paciente_dni,
            p.telefono_whatsapp AS paciente_telefono, p.correo AS paciente_correo,
            cc.codigo AS codigo_consulta,
            ic.estado AS informe_estado,
            COALESCE(
              (SELECT json_agg(json_build_object(
                 'idDetalle', d.id_detalle, 'idExamen', d.id_examen,
                 'codigoExamen', e.codigo_examen, 'nombreExamen', e.nombre_examen
               ) ORDER BY d.id_detalle)
               FROM detalle_orden d
               JOIN examen e ON e.id_examen = d.id_examen
               WHERE d.id_orden = o.id_orden),
              '[]'::json
            ) AS examenes
     FROM orden o
     JOIN paciente p ON p.id_paciente = o.id_paciente
     LEFT JOIN codigo_consulta cc ON cc.id_orden = o.id_orden
     LEFT JOIN LATERAL (
       SELECT estado FROM informe_clinico ic2
       WHERE ic2.id_orden = o.id_orden
       ORDER BY ic2.fecha_creacion DESC
       LIMIT 1
     ) ic ON true
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

/**
 * GET /api/ordenes/papelera — lista las órdenes eliminadas lógicamente
 * (eliminada = TRUE, migración 0013). ANTES: esta consulta no existía en
 * ningún router -se podía ELIMINAR una orden (eliminada = TRUE) y hasta
 * restaurarla desde el archivo (PATCH /:id/restaurar, que en realidad
 * deshace un ARCHIVADO, no una eliminación), pero nunca listarla de vuelta
 * ni revertir la eliminación: la "Papelera" de la UI (TrashOrdersView) no
 * tenía ninguna fuente de datos real y permanecía vacía para siempre,
 * aunque el registro siguiera vivo y recuperable en Postgres. Mismo
 * segmento fijo que /pendientes-validacion y /resultados-criticos:
 * registrada ANTES de GET /:id para no ser interpretada como un id.
 */
ordenesRouter.get('/papelera', requirePermission('admision_crear_ordenes'), asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT o.id_orden, o.numero_orden, o.fecha_registro, o.estado, o.total_cobrado, o.sede,
            o.archivada, o.fecha_archivo, o.id_carpeta,
            o.prioridad, o.estado_flujo, o.metodo_pago, o.saldo_pendiente, o.promo_aplicada,
            o.sede_cama, o.es_alto_riesgo, o.biometria_autorizada, o.datos_biometricos,
            o.fecha_eliminacion, o.motivo_eliminacion, u.nombre_completo AS eliminado_por,
            p.id_paciente, p.nombre_completo AS paciente_nombre
     FROM orden o
     JOIN paciente p ON p.id_paciente = o.id_paciente
     LEFT JOIN usuario u ON u.id_usuario = o.id_usuario_eliminacion
     WHERE o.eliminada = TRUE
     ORDER BY o.fecha_eliminacion DESC
     LIMIT 500`
  );
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
// Se reutiliza el permiso 'admision_crear_ordenes' (igual que
// carpetas.ts para mover/eliminar carpetas): no existe en el catálogo
// un permiso más específico para archivar/eliminar órdenes, y crear uno
// nuevo implicaría tocar el catálogo de roles/permisos (src/shared/
// permissions.ts) y la migración de rol_permiso_default, fuera del
// alcance de esta pieza.
//
// updateOrder (edición general: estado operativo/prioridad/pago/
// biometría) SÍ se implementa, más abajo (PATCH /:id) -resuelto en la
// migración 0016 agregando `estado_flujo` como columna separada de
// `estado` (ver esa migración para el porqué de NO reutilizar `estado`:
// son dos vocabularios distintos que no corresponden 1:1, y mezclarlos
// habría arriesgado una transición clínica incorrecta).

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

/**
 * PATCH /:id/restaurar-papelera — contraparte real de DELETE /:id: revierte
 * `eliminada = TRUE` y limpia los metadatos de eliminación. No existía
 * ninguna ruta que hiciera esto -ver el comentario de GET /papelera arriba-,
 * así que hasta ahora una orden eliminada quedaba eliminada para siempre
 * desde el punto de vista de la API, aunque la fila siguiera en la tabla.
 */
ordenesRouter.patch('/:id/restaurar-papelera', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idOrden = Number(req.params.id);
  const { rows } = await pool.query(
    `UPDATE orden
     SET eliminada = FALSE, fecha_eliminacion = NULL, id_usuario_eliminacion = NULL, motivo_eliminacion = NULL
     WHERE id_orden = $1 AND eliminada = TRUE
     RETURNING id_orden, eliminada`,
    [idOrden]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada o no estaba en la papelera.' });
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

// Contraparte masiva de /:id/restaurar-papelera -ver ese comentario arriba.
ordenesRouter.patch('/restaurar-varias-papelera', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const { idsOrdenes } = req.body || {};
  if (!Array.isArray(idsOrdenes) || idsOrdenes.length === 0) {
    return res.status(400).json({ error: 'idsOrdenes (arreglo no vacío) es obligatorio.' });
  }
  const { rowCount } = await pool.query(
    `UPDATE orden
     SET eliminada = FALSE, fecha_eliminacion = NULL, id_usuario_eliminacion = NULL, motivo_eliminacion = NULL
     WHERE id_orden = ANY($1::int[]) AND eliminada = TRUE`,
    [idsOrdenes.map(Number)]
  );
  return res.json({ ok: true, actualizadas: rowCount });
}));

/**
 * PATCH /api/ordenes/:id — edición general de la orden (migración 0016):
 * estado operativo (estado_flujo), prioridad, método de pago, saldo
 * pendiente, promoción aplicada, cama/sede física, y la autorización
 * biométrica de alto riesgo. Mismo patrón que informes.ts: solo
 * actualiza las columnas presentes en el body, nunca pisa las demás.
 *
 * Registrada DELIBERADAMENTE al final del router -después de
 * /archivar-varias, /restaurar-varias y /eliminar-varias- porque
 * Express resuelve rutas en orden de registro y '/:id' coincide con
 * cualquier segmento único: de ir antes, una petición a
 * PATCH /archivar-varias habría caído aquí tratando "archivar-varias"
 * como un id numérico inválido, nunca llegando a su ruta real.
 *
 * `datosBiometricos` se reemplaza entero si se envía (no es un merge
 * JSONB parcial como datos_json de informe_clinico) — es el registro de
 * auditoría de un único evento de autorización, no una estructura que se
 * vaya completando con PATCHes sucesivos.
 */
ordenesRouter.patch('/:id', requirePermission('admision_crear_ordenes'), asyncHandler(async (req, res) => {
  const idOrden = Number(req.params.id);
  const {
    status, prioridad, metodoPago, saldoPendiente, promoAplicada, sedeCama,
    esAltoRiesgo, biometriaAutorizada, datosBiometricos, sede
  } = req.body || {};

  if (status !== undefined && !ESTADOS_FLUJO_VALIDOS.includes(status)) {
    return res.status(400).json({ error: `status inválido. Valores permitidos: ${ESTADOS_FLUJO_VALIDOS.join(', ')}.` });
  }
  if (prioridad !== undefined && !PRIORIDADES_VALIDAS.includes(prioridad)) {
    return res.status(400).json({ error: `prioridad inválida. Valores permitidos: ${PRIORIDADES_VALIDAS.join(', ')}.` });
  }
  if (metodoPago !== undefined && metodoPago !== null && !METODOS_PAGO_VALIDOS.includes(metodoPago)) {
    return res.status(400).json({ error: `metodoPago inválido. Valores permitidos: ${METODOS_PAGO_VALIDOS.join(', ')}.` });
  }

  const clauses: string[] = [];
  const params: any[] = [];
  let i = 1;

  const addClause = (column: string, value: any, isJsonb = false) => {
    clauses.push(`${column} = $${i}${isJsonb ? '::jsonb' : ''}`);
    params.push(isJsonb ? JSON.stringify(value) : value);
    i++;
  };

  if (status !== undefined) addClause('estado_flujo', status);
  if (prioridad !== undefined) addClause('prioridad', prioridad);
  if (metodoPago !== undefined) addClause('metodo_pago', metodoPago);
  if (saldoPendiente !== undefined) addClause('saldo_pendiente', saldoPendiente);
  if (promoAplicada !== undefined) addClause('promo_aplicada', promoAplicada);
  if (sedeCama !== undefined) addClause('sede_cama', sedeCama);
  if (sede !== undefined) addClause('sede', sede);
  if (esAltoRiesgo !== undefined) addClause('es_alto_riesgo', esAltoRiesgo === true);
  if (biometriaAutorizada !== undefined) addClause('biometria_autorizada', biometriaAutorizada === true);
  if (datosBiometricos !== undefined) addClause('datos_biometricos', datosBiometricos, true);

  if (clauses.length === 0) {
    return res.status(400).json({ error: 'No se recibió ningún campo para actualizar.' });
  }
  if (!Number.isFinite(idOrden)) {
    return res.status(404).json({ error: 'Orden no encontrada.' });
  }

  params.push(idOrden);
  const { rows } = await pool.query(
    `UPDATE orden SET ${clauses.join(', ')}
     WHERE id_orden = $${i} AND eliminada = FALSE
     RETURNING id_orden, numero_orden, estado_flujo, prioridad, metodo_pago, saldo_pendiente,
               promo_aplicada, sede_cama, sede, es_alto_riesgo, biometria_autorizada, datos_biometricos`,
    params
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Orden no encontrada o eliminada.' });

  // Bitácora REAL (historial_auditoria) -efecto secundario "best effort" de
  // una acción ya autorizada por requirePermission('admision_crear_ordenes')
  // de arriba, nunca un endpoint de bitácora expuesto directamente (ver el
  // comentario de diseño en server/bitacora.ts). Solo se registra cuando el
  // PATCH toca banderas de riesgo/autorización biométrica -el resto de
  // campos (estado_flujo, metodoPago, etc.) son operativos de rutina, no
  // eventos de seguridad.
  if (biometriaAutorizada !== undefined || esAltoRiesgo !== undefined) {
    try {
      await registrarBitacora({
        idUsuario: req.staffUser!.idUsuario,
        accion: 'Actualización de riesgo/autorización biométrica en orden',
        modulo: 'seguridad',
        severidad: (rows[0].es_alto_riesgo || rows[0].biometria_autorizada) ? 'warning' : 'info',
        detalles: `Orden ${rows[0].numero_orden}`,
        valorNuevo: `esAltoRiesgo=${rows[0].es_alto_riesgo}, biometriaAutorizada=${rows[0].biometria_autorizada}`
      });
    } catch (err) {
      console.error('No se pudo registrar la actualización biométrica en la bitácora de auditoría:', err);
    }
  }

  return res.json(rows[0]);
}));
