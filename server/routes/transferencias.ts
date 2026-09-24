/**
 * Transferencias de muestra / manifiestos de cadena de custodia
 * (SampleTransferManifest) — tercer módulo de los 9 migrados desde
 * localStorage (ver db/migrations/0011_modulos_restantes.sql, tabla
 * `transferencia_muestra`).
 *
 * El frontend (ClinicContext.tsx `addSampleTransfer`,
 * MultisiteManager.tsx) por ahora solo CREA manifiestos y los lista;
 * no existe ninguna acción de UI para cambiar su estado o registrar
 * la llegada real. Por eso PATCH /:id se implementa aquí (extensión
 * natural del esquema real, igual de necesaria que crear/listar para
 * que el módulo no quede a medias) pero, de forma honesta, todavía no
 * está conectado desde ningún componente — queda documentado como tal
 * en el commit, igual que se hizo con `rol_permiso_default`.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';

export const transferenciasRouter = Router();
transferenciasRouter.use(requireStaffAuth);

const ESTADOS_VALIDOS = ['en_transito', 'entregado', 'retrasado'];
const CONTROLES_VALIDOS = ['2_8_grados', 'congelado_menos_20', 'temperatura_ambiente'];

function generarCodigoManifiesto(): string {
  return `MAN-4D-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
}

transferenciasRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id_transferencia, codigo_manifiesto, sede_origen, sede_destino, nombre_mensajero,
            hora_salida, hora_llegada_estimada, hora_llegada_real, estado, control_temperatura,
            temperatura_registrada, cantidad_muestras, codigos_muestras, fecha_creacion
     FROM transferencia_muestra
     ORDER BY fecha_creacion DESC`
  );
  return res.json(rows);
}));

transferenciasRouter.post('/', requirePermission('flebotomia_manifiestos'), asyncHandler(async (req, res) => {
  const {
    originBranch, destinationBranch, courierName, departureTime, estimatedArrivalTime,
    status, temperatureControl, temperatureLogged, samplesCount, samplesCodes
  } = req.body || {};

  if (!originBranch || !destinationBranch || !courierName) {
    return res.status(400).json({ error: 'originBranch, destinationBranch y courierName son obligatorios.' });
  }
  if (String(originBranch) === String(destinationBranch)) {
    return res.status(400).json({ error: 'La sede de origen y destino no pueden ser la misma.' });
  }
  const estadoFinal = ESTADOS_VALIDOS.includes(status) ? status : 'en_transito';
  const controlFinal = CONTROLES_VALIDOS.includes(temperatureControl) ? temperatureControl : '2_8_grados';

  // Reintenta una vez si el código generado colisiona con el UNIQUE de
  // codigo_manifiesto (probabilidad mínima, pero real: 900 combinaciones/año).
  for (let intento = 0; intento < 2; intento++) {
    const codigo = generarCodigoManifiesto();
    try {
      const { rows } = await pool.query(
        `INSERT INTO transferencia_muestra
           (codigo_manifiesto, sede_origen, sede_destino, nombre_mensajero, hora_salida,
            hora_llegada_estimada, estado, control_temperatura, temperatura_registrada,
            cantidad_muestras, codigos_muestras)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          codigo, originBranch, destinationBranch, courierName,
          departureTime || new Date().toISOString(),
          estimatedArrivalTime || new Date(Date.now() + 45 * 60000).toISOString(),
          estadoFinal, controlFinal, temperatureLogged ?? null,
          Number(samplesCount) || 0, Array.isArray(samplesCodes) ? samplesCodes : []
        ]
      );
      return res.status(201).json(rows[0]);
    } catch (err: any) {
      if (err?.code === '23505' && intento === 0) continue; // colisión de código único, reintentar
      throw err;
    }
  }
  return res.status(500).json({ error: 'No se pudo generar un código de manifiesto único.' });
}));

transferenciasRouter.patch('/:id', requirePermission('flebotomia_manifiestos'), asyncHandler(async (req, res) => {
  const idTransferencia = Number(req.params.id);
  const { status, actualArrivalTime, temperatureLogged } = req.body || {};

  if (status !== undefined && !ESTADOS_VALIDOS.includes(status)) {
    return res.status(400).json({ error: `estado inválido. Usa ${ESTADOS_VALIDOS.join(', ')}.` });
  }

  const { rows } = await pool.query(
    `UPDATE transferencia_muestra
     SET estado = COALESCE($1, estado),
         hora_llegada_real = COALESCE($2, hora_llegada_real),
         temperatura_registrada = COALESCE($3, temperatura_registrada)
     WHERE id_transferencia = $4
     RETURNING *`,
    [status || null, actualArrivalTime || null, temperatureLogged ?? null, idTransferencia]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Manifiesto de transferencia no encontrado.' });
  return res.json(rows[0]);
}));
