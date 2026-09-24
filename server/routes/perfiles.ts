/**
 * Perfiles personalizados (LabCustomProfile) — cuarto módulo de los 9
 * migrados desde localStorage (ver ClinicContext.tsx addCustomProfile/
 * updateCustomProfile/deleteCustomProfile). Migración real:
 * db/migrations/0011_modulos_restantes.sql (tabla `perfil_personalizado`).
 *
 * `pruebas` se guarda como JSONB porque su forma real (ProfileTestItem[])
 * depende del catálogo de exámenes del frontend (LabCatalogItem), que
 * todavía no tiene su propia tabla real -misma nota de alcance que ya
 * aparece en la migración 0011-.
 */
import { Router } from 'express';
import { pool } from '../db';
import { requireStaffAuth } from '../auth-firebase';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';

export const perfilesRouter = Router();
perfilesRouter.use(requireStaffAuth);

function aArregloTexto(valor: unknown): string[] {
  return Array.isArray(valor) ? valor.map(String) : [];
}

perfilesRouter.get('/', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id_perfil, codigo, nombre, nombre_categoria, precio, precio_regular, descripcion,
            ids_examenes, nombres_examenes, pruebas, estado, basado_en, creado_por, notas,
            es_perfil_fabrica, fecha_creacion
     FROM perfil_personalizado
     ORDER BY fecha_creacion DESC`
  );
  return res.json(rows);
}));

perfilesRouter.post('/', requirePermission('catalogo_perfiles_crear'), asyncHandler(async (req, res) => {
  const {
    code, name, categoryName, price, regularPrice, description,
    testIds, testNames, tests, status, basedOn, createdBy, notes
  } = req.body || {};

  if (!code || !String(code).trim() || !name || !String(name).trim()) {
    return res.status(400).json({ error: 'code y name son obligatorios.' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO perfil_personalizado
         (codigo, nombre, nombre_categoria, precio, precio_regular, descripcion,
          ids_examenes, nombres_examenes, pruebas, estado, basado_en, creado_por, notas)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        String(code).trim(), String(name).trim(), categoryName || null,
        Number(price) || 0, regularPrice !== undefined ? Number(regularPrice) : null,
        description || null, aArregloTexto(testIds), aArregloTexto(testNames),
        JSON.stringify(Array.isArray(tests) ? tests : []),
        status === 'Inactivo' ? 'Inactivo' : 'Activo',
        basedOn || null, createdBy || null, notes || null
      ]
    );
    return res.status(201).json(rows[0]);
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: `Ya existe un perfil con el código "${code}".` });
    }
    throw err;
  }
}));

perfilesRouter.patch('/:id', requirePermission('catalogo_perfiles_crear'), asyncHandler(async (req, res) => {
  const idPerfil = Number(req.params.id);
  const {
    name, categoryName, price, regularPrice, description,
    testIds, testNames, tests, status, basedOn, notes
  } = req.body || {};

  const { rows } = await pool.query(
    `UPDATE perfil_personalizado
     SET nombre = COALESCE($1, nombre),
         nombre_categoria = COALESCE($2, nombre_categoria),
         precio = COALESCE($3, precio),
         precio_regular = COALESCE($4, precio_regular),
         descripcion = COALESCE($5, descripcion),
         ids_examenes = COALESCE($6, ids_examenes),
         nombres_examenes = COALESCE($7, nombres_examenes),
         pruebas = COALESCE($8, pruebas),
         estado = COALESCE($9, estado),
         basado_en = COALESCE($10, basado_en),
         notas = COALESCE($11, notas)
     WHERE id_perfil = $12
     RETURNING *`,
    [
      name || null, categoryName || null,
      price !== undefined ? Number(price) : null,
      regularPrice !== undefined ? Number(regularPrice) : null,
      description || null,
      testIds !== undefined ? aArregloTexto(testIds) : null,
      testNames !== undefined ? aArregloTexto(testNames) : null,
      tests !== undefined ? JSON.stringify(tests) : null,
      status === 'Activo' || status === 'Inactivo' ? status : null,
      basedOn || null, notes || null, idPerfil
    ]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Perfil no encontrado.' });
  return res.json(rows[0]);
}));

perfilesRouter.delete('/:id', requirePermission('catalogo_perfiles_crear'), asyncHandler(async (req, res) => {
  const idPerfil = Number(req.params.id);
  const { rows: existente } = await pool.query('SELECT es_perfil_fabrica FROM perfil_personalizado WHERE id_perfil = $1', [idPerfil]);
  if (existente.length === 0) return res.status(404).json({ error: 'Perfil no encontrado.' });
  if (existente[0].es_perfil_fabrica) {
    return res.status(400).json({ error: 'No se puede eliminar un perfil de fábrica.' });
  }
  await pool.query('DELETE FROM perfil_personalizado WHERE id_perfil = $1', [idPerfil]);
  return res.json({ ok: true });
}));
