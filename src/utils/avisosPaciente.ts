import { pasosAcceso } from './pasosAcceso';

/**
 * Los dos avisos del recorrido de una orden que se envían al paciente
 * (WhatsApp o correo), ambos con el enlace del sitio y cómo instalar la app:
 *  1) al RECIBIR la muestra, para que siga el procedimiento de su orden;
 *  2) cuando TERMINARON los exámenes y los resultados están listos.
 */
export interface DatosAviso {
  nombre: string;
  laboratorio: string;
  numeroOrden?: string;
  codigoConsulta: string;
  url: string;
  /** Línea de contacto ya formateada (puede ir vacía). */
  contacto?: string;
}

const lineaOrden = (n?: string) => (n ? `📄 *N.º de orden:* *${n}*\n` : '');

export function mensajeMuestraRecibida(d: DatosAviso): string {
  return `👋 Hola, *${d.nombre.trim()}*. Le escribimos de *${d.laboratorio}*.\n\n` +
    `✅ *Recibimos su muestra* y ya está en proceso.\n` +
    lineaOrden(d.numeroOrden) +
    `🔑 *Su código de consulta:* *${d.codigoConsulta}*\n\n` +
    `*Puede ver el avance del procedimiento (muestra recibida, resultados ingresados y validados):*\n` +
    `${pasosAcceso(d.url, 'Consulte el seguimiento de su orden')}\n\n` +
    `Le avisaremos por este medio cuando sus resultados estén listos.${d.contacto ?? ''}`;
}

export function mensajeResultadosListos(d: DatosAviso): string {
  return `👋 Hola, *${d.nombre.trim()}*.\n\n` +
    `✅ Sus resultados de *${d.laboratorio}* ya están *listos*.\n` +
    lineaOrden(d.numeroOrden) +
    `🔑 *Su código de consulta:* *${d.codigoConsulta}*\n\n` +
    `*Para descargar su informe:*\n` +
    `${pasosAcceso(d.url, 'Toque "Descargar informe"')}\n\n` +
    `También puede recogerlo impreso en recepción.${d.contacto ?? ''}`;
}
