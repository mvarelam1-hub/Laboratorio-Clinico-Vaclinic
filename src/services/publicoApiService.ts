/**
 * Cliente de la información PÚBLICA del laboratorio (server/routes/publico.ts):
 * contacto, catálogo de pruebas con precio, perfiles y las noticias/promociones
 * que el laboratorio publicó. No requiere sesión.
 */

export interface LaboratorioPublico {
  nombre: string | null; eslogan: string | null; direccion: string | null; ciudad: string | null;
  departamento: string | null; telefono: string | null; telefonoSecundario: string | null;
  whatsapp: string | null; email: string | null; website: string | null;
}

export interface ExamenPublico {
  codigo: string; nombre: string; categoria: string | null; categoriaNombre: string | null;
  tipoMuestra: string | null; precio: number | null; entregaHoras: number | null; esPerfil: boolean;
  descripcion: string | null; ayuno: string | null; requiereAyuno: boolean | null;
  instrucciones: string | null; parametros: string[];
}

export interface PerfilPublico {
  codigo: string; nombre: string; categoriaNombre: string | null; precio: number | null;
  descripcion: string | null; examenes: string[];
}

export interface CatalogoPublico { examenes: ExamenPublico[]; perfiles: PerfilPublico[]; }

export interface ContenidoPublico {
  id: number; titulo: string; resumen: string; cuerpo: string; etiqueta: string | null;
  fuente: string | null; enlace: string | null; fechaPublicacion: string; vigenteHasta: string | null;
}
export interface ContenidoPublicoRespuesta { noticias: ContenidoPublico[]; promociones: ContenidoPublico[]; }

async function pedir<T>(ruta: string): Promise<T> {
  const r = await fetch(`/api/publico/${ruta}`);
  if (!r.ok) throw new Error('No se pudo cargar la información. Inténtalo de nuevo en un momento.');
  return r.json() as Promise<T>;
}

export const obtenerLaboratorioPublico = () => pedir<LaboratorioPublico>('laboratorio');
export const obtenerCatalogoPublico = () => pedir<CatalogoPublico>('catalogo');
export const obtenerContenidoPublico = () => pedir<ContenidoPublicoRespuesta>('contenido');
