/**
 * Limpieza de datos de EJEMPLO que versiones anteriores guardaron en el
 * navegador (localStorage). Antes el sistema arrancaba con pacientes,
 * informes, personal y mensajes inventados y los persistía; en modo real esos
 * registros no deben seguir apareciendo.
 *
 * Solo se eliminan los registros cuyo `id` es EXACTAMENTE el de un dato de
 * ejemplo conocido: lo que el personal creó de verdad (otros ids) se conserva.
 */

export interface FuenteDeEjemplo {
  /** Clave de localStorage donde se guarda el arreglo. */
  clave: string;
  /** Ids de los registros de ejemplo que se deben quitar. */
  ids: string[];
}

/** Devuelve el JSON sin los registros de ejemplo; `null` si no hubo cambios. */
export function quitarRegistrosDeEjemplo(json: string | null, ids: Set<string>): string | null {
  if (!json) return null;
  let datos: unknown;
  try { datos = JSON.parse(json); } catch { return null; }
  if (!Array.isArray(datos)) return null;
  const filtrados = datos.filter((r) => !(r && typeof r === 'object' && typeof (r as { id?: unknown }).id === 'string' && ids.has((r as { id: string }).id)));
  if (filtrados.length === datos.length) return null;
  return JSON.stringify(filtrados);
}

/** Quita de localStorage los registros de ejemplo. Devuelve cuántos registros eliminó. */
export function limpiarDatosDeEjemplo(fuentes: FuenteDeEjemplo[], almacen: Pick<Storage, 'getItem' | 'setItem'> = localStorage): number {
  let eliminados = 0;
  for (const f of fuentes) {
    try {
      const antes = almacen.getItem(f.clave);
      const despues = quitarRegistrosDeEjemplo(antes, new Set(f.ids));
      if (despues !== null) {
        eliminados += (JSON.parse(antes as string) as unknown[]).length - (JSON.parse(despues) as unknown[]).length;
        almacen.setItem(f.clave, despues);
      }
    } catch { /* almacenamiento no disponible */ }
  }
  return eliminados;
}
