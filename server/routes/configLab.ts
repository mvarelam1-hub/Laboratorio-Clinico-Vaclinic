/**
 * Rutas para configuración del laboratorio: persistencia real de LabSettings.
 *
 * Patrón: una sola fila (id_laboratorio = 1), columnas reales para
 * identidad + configuración de página + colores, JSONB para el resto.
 *
 * Rutas:
 * - GET /api/config-lab (fetch current or create default)
 * - PATCH /api/config-lab (update with JSONB merge, never overwrite)
 *
 * NO soft-delete, NO list filtering, NO publish transitions. Auditoría
 * simple: user_id + timestamp en updates.
 */

import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-staff';

export const configLabRouter = Router();

// Middleware: requiere autenticación
configLabRouter.use(requireStaffAuth);

/**
 * GET /api/config-lab: fetch current lab configuration.
 *
 * Si no existe aún, crea una fila con defaults (dados en la migración 0015)
 * y retorna eso. Nunca retorna 404.
 */
configLabRouter.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM configuracion_laboratorio WHERE id_laboratorio = 1`
    );

    if (result.rows.length === 0) {
      // Crear fila con defaults si no existe (email es NOT NULL sin valor por defecto en 0015: sin '' el INSERT fallaba en una base nueva)
      const inserted = await pool.query(
        `INSERT INTO configuracion_laboratorio (id_laboratorio, email)
         VALUES (1, '')
         RETURNING *`
      );
      return res.status(200).json(inserted.rows[0]);
    }

    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching lab config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/config-lab: update lab configuration.
 *
 * Body puede contener columnas reales (nombre_laboratorio, email, etc.)
 * y/o datos_adicionales (JSONB). Si ambas están presentes, se actualiza
 * cada una por separado:
 * - Columnas reales: reemplazo directo (UPDATE col = $val)
 * - datos_adicionales: MERGE con || (UPDATE datos_adicionales = datos_adicionales || $val::jsonb)
 *
 * Nunca sobrescribe datos_adicionales existentes si el body tiene un subset.
 */
configLabRouter.patch('/', async (req: Request, res: Response) => {
  try {
    const {
      nombre_laboratorio,
      nombre_legal,
      eslogan,
      nit_ruc,
      registro_sanitario,
      acreditacion_iso,
      direccion,
      ciudad,
      departamento_estado,
      telefono,
      telefono_secundario,
      whatsapp_numero,
      email,
      website,
      lista_especialidades,
      tamaño_papel,
      orientacion,
      familia_tipografia,
      tamaño_fuente_base_pt,
      color_primario,
      preset_color_primario,
      color_secundario,
      color_acento,
      color_encabezado_tabla,
      color_texto_encabezado,
      color_valor_critico,
      color_valor_bajo,
      color_valor_normal,
      color_fondo_pagina,
      // Resto va a datos_adicionales
      ...datosAdicionales
    } = req.body;

    // Separar columnas reales de JSONB
    const updateClauses: string[] = [];
    const updateParams: any[] = [];
    let paramIndex = 1;

    // Columnas reales (cada una es opcional)
    const realFields = [
      'nombre_laboratorio',
      'nombre_legal',
      'eslogan',
      'nit_ruc',
      'registro_sanitario',
      'acreditacion_iso',
      'direccion',
      'ciudad',
      'departamento_estado',
      'telefono',
      'telefono_secundario',
      'whatsapp_numero',
      'email',
      'website',
      'lista_especialidades',
      'tamaño_papel',
      'orientacion',
      'familia_tipografia',
      'tamaño_fuente_base_pt',
      'color_primario',
      'preset_color_primario',
      'color_secundario',
      'color_acento',
      'color_encabezado_tabla',
      'color_texto_encabezado',
      'color_valor_critico',
      'color_valor_bajo',
      'color_valor_normal',
      'color_fondo_pagina'
    ];

    const fieldValues: any = {
      nombre_laboratorio,
      nombre_legal,
      eslogan,
      nit_ruc,
      registro_sanitario,
      acreditacion_iso,
      direccion,
      ciudad,
      departamento_estado,
      telefono,
      telefono_secundario,
      whatsapp_numero,
      email,
      website,
      lista_especialidades,
      tamaño_papel,
      orientacion,
      familia_tipografia,
      tamaño_fuente_base_pt,
      color_primario,
      preset_color_primario,
      color_secundario,
      color_acento,
      color_encabezado_tabla,
      color_texto_encabezado,
      color_valor_critico,
      color_valor_bajo,
      color_valor_normal,
      color_fondo_pagina
    };

    for (const field of realFields) {
      if (fieldValues[field] !== undefined) {
        updateClauses.push(`${field} = $${paramIndex}`);
        updateParams.push(fieldValues[field]);
        paramIndex++;
      }
    }

    // JSONB merge si hay datos_adicionales
    if (Object.keys(datosAdicionales).length > 0) {
      const jsonbStr = JSON.stringify(datosAdicionales);
      updateClauses.push(
        `datos_adicionales = datos_adicionales || $${paramIndex}::jsonb`
      );
      updateParams.push(jsonbStr);
      paramIndex++;
    }

    // Siempre actualizar fecha_actualizacion y id_usuario
    updateClauses.push(`fecha_actualizacion = NOW()`);
    updateClauses.push(`id_usuario_ultima_mod = $${paramIndex}`);
    updateParams.push(req.staffUser?.idUsuario || null);

    if (updateClauses.length === 2) {
      // Solo timestamp y user, sin cambios reales
      return res.status(200).json({
        message: 'No changes to apply',
        updated: false
      });
    }

    const sql = `
      UPDATE configuracion_laboratorio
      SET ${updateClauses.join(', ')}
      WHERE id_laboratorio = 1
      RETURNING *
    `;

    const result = await pool.query(sql, updateParams);

    if (result.rows.length === 0) {
      // No existe aún, crear
      const inserted = await pool.query(
        `INSERT INTO configuracion_laboratorio (id_laboratorio, email, id_usuario_ultima_mod)
         VALUES (1, '', $1)
         RETURNING *`,
        [req.staffUser?.idUsuario || null]
      );
      return res.status(200).json(inserted.rows[0]);
    }

    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating lab config:', error);
    res.status(500).json({ error: error.message });
  }
});
