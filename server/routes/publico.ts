/**
 * Información PÚBLICA del laboratorio para el Portal del Paciente (sin sesión).
 *
 * Todo es de solo lectura y limitado a lo que el laboratorio ya muestra al
 * público: catálogo de pruebas vendibles (el precio solo con sesión del
 * portal), perfiles/paneles
 * activos, datos de contacto y las noticias/promociones que el personal marcó
 * como "publicado". Nunca se expone nada de pacientes, órdenes ni personal.
 *
 * Va montado ANTES de requireStaffAuth (ver routes/index.ts).
 */
import { Router } from 'express';
import { pool } from '../db';
import { asyncHandler } from '../asyncHandler';
import { obtenerNoticiasExternas } from '../noticiasExternas';
import { verifyPortalToken } from '../token';

export const publicoRouter = Router();

// Los datos cambian poco: el navegador puede reutilizarlos 1 minuto.
publicoRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'public, max-age=60');
  next();
});

const texto = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s : null;
};

/** Datos de contacto/identidad que el laboratorio ya configuró en Ajustes. */
publicoRouter.get('/laboratorio', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT nombre_laboratorio, eslogan, direccion, ciudad, departamento_estado,
            telefono, telefono_secundario, whatsapp_numero, email, website
     FROM configuracion_laboratorio WHERE id_laboratorio = 1`
  );
  const f = rows[0] || {};
  return res.json({
    nombre: texto(f.nombre_laboratorio),
    eslogan: texto(f.eslogan),
    direccion: texto(f.direccion),
    ciudad: texto(f.ciudad),
    departamento: texto(f.departamento_estado),
    telefono: texto(f.telefono),
    telefonoSecundario: texto(f.telefono_secundario),
    whatsapp: texto(f.whatsapp_numero),
    email: texto(f.email),
    website: texto(f.website),
  });
}));

/**
 * Los precios NO son públicos: solo los recibe quien trae una sesión vigente
 * del portal (la que se abre con un código de consulta de una orden del
 * laboratorio). Se valida aquí, en el servidor: ocultarlos solo en pantalla no
 * sirve porque se verían en la respuesta de la red.
 */
function puedeVerPrecios(req: any): boolean {
  const cabecera = String(req.headers?.authorization || '');
  if (!cabecera.startsWith('Bearer ')) return false;
  try {
    return !!verifyPortalToken(cabecera.slice(7));
  } catch {
    return false;
  }
}

/**
 * Catálogo vendible: solo exámenes activos y visibles para la venta. El precio
 * 0 significa "sin precio definido" → se devuelve null (nunca "Q0"). Sin sesión
 * del portal el precio siempre es null y `preciosVisibles` es false.
 */
publicoRouter.get('/catalogo', asyncHandler(async (req, res) => {
  const verPrecios = puedeVerPrecios(req);
  // La respuesta cambia según la sesión: no se comparte en cachés públicas.
  res.set('Vary', 'Authorization');
  res.set('Cache-Control', verPrecios ? 'private, no-store' : 'public, max-age=60');
  const { rows } = await pool.query(
    `SELECT codigo_examen, nombre_examen, categoria, categoria_nombre, tipo_muestra, precio,
            tiempo_entrega_horas, es_perfil, datos_adicionales
     FROM examen
     WHERE estado = 'Activo' AND visible_venta = TRUE AND codigo_examen IS NOT NULL
     ORDER BY categoria, nombre_examen`
  );
  const examenes = rows.map((r: any) => {
    const extra = r.datos_adicionales || {};
    const precio = Number(r.precio);
    return {
      codigo: r.codigo_examen,
      nombre: r.nombre_examen,
      categoria: r.categoria,
      categoriaNombre: texto(r.categoria_nombre),
      tipoMuestra: texto(r.tipo_muestra),
      precio: verPrecios && Number.isFinite(precio) && precio > 0 ? precio : null,
      entregaHoras: r.tiempo_entrega_horas ?? null,
      esPerfil: !!r.es_perfil,
      descripcion: texto(extra.description),
      ayuno: texto(extra.fasting),
      requiereAyuno: typeof extra.requiresFasting === 'boolean' ? extra.requiresFasting : null,
      instrucciones: texto(extra.patientInstructions),
      parametros: Array.isArray(extra.includedParameters) ? extra.includedParameters.map(String) : [],
    };
  });

  // Perfiles armados por el laboratorio (tabla perfil_personalizado).
  const perf = await pool.query(
    `SELECT codigo, nombre, nombre_categoria, precio, descripcion, nombres_examenes
     FROM perfil_personalizado
     WHERE estado = 'Activo'
     ORDER BY nombre`
  );
  const perfiles = perf.rows.map((p: any) => ({
    codigo: p.codigo,
    nombre: p.nombre,
    categoriaNombre: texto(p.nombre_categoria),
    precio: verPrecios && Number(p.precio) > 0 ? Number(p.precio) : null,
    descripcion: texto(p.descripcion),
    examenes: Array.isArray(p.nombres_examenes) ? p.nombres_examenes.map(String) : [],
  }));

  return res.json({ examenes, perfiles, preciosVisibles: verPrecios });
}));

/** Noticias y promociones YA publicadas (y promociones aún vigentes). */
publicoRouter.get('/contenido', asyncHandler(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT id_contenido, tipo, titulo, resumen, cuerpo, etiqueta, fuente, enlace,
            to_char(fecha_publicacion, 'YYYY-MM-DD') AS fecha_publicacion,
            to_char(vigente_hasta, 'YYYY-MM-DD') AS vigente_hasta
     FROM contenido_publico
     WHERE publicado = TRUE
       AND fecha_publicacion <= CURRENT_DATE
       AND (vigente_hasta IS NULL OR vigente_hasta >= CURRENT_DATE)
     ORDER BY fecha_publicacion DESC, id_contenido DESC
     LIMIT 100`
  );
  const mapear = (r: any) => ({
    id: r.id_contenido,
    titulo: r.titulo,
    resumen: r.resumen || '',
    cuerpo: r.cuerpo || '',
    etiqueta: texto(r.etiqueta),
    fuente: texto(r.fuente),
    enlace: texto(r.enlace),
    fechaPublicacion: r.fecha_publicacion,
    vigenteHasta: r.vigente_hasta,
  });
  return res.json({
    noticias: rows.filter((r: any) => r.tipo === 'noticia').map(mapear),
    promociones: rows.filter((r: any) => r.tipo === 'promocion').map(mapear),
  });
}));

/**
 * Titulares de salud de una fuente externa (LabMedica en Español). Se leen del
 * feed público de la fuente y se renuevan solos cada 30 minutos; ver
 * server/noticiasExternas.ts. Si la fuente no responde, devuelve lo último
 * guardado o una lista vacía (nunca un error).
 */
publicoRouter.get('/noticias-externas', asyncHandler(async (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=600');
  return res.json(await obtenerNoticiasExternas());
}));
