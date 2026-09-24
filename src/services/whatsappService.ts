/**
 * WhatsApp Helper Service for VACLINIC
 * Official Phone / WhatsApp: 5612 5563 (Guatemala +502)
 */

export const VACLINIC_WHATSAPP_NUMBER = '50256125563';
export const VACLINIC_WHATSAPP_DISPLAY = '5612 5563';

export interface WhatsAppMessageOptions {
  patientName?: string;
  nationalId?: string;
  accessCode?: string;
  orderNumber?: string;
  studyName?: string;
  topic?: 'recuperar_pin' | 'estado_orden' | 'envio_resultados' | 'duda_preparacion' | 'consulta_general';
  customNotes?: string;
}

/**
 * Builds the official WhatsApp link with pre-composed, structured message
 */
export function buildWhatsAppLink(options: WhatsAppMessageOptions = {}): string {
  const {
    patientName,
    nationalId,
    accessCode,
    orderNumber,
    studyName,
    topic = 'recuperar_pin',
    customNotes
  } = options;

  let message = '';

  switch (topic) {
    case 'recuperar_pin':
      message = `Hola VACLINIC Laboratorio Clínico 👋\n\nNecesito ayuda para consultar mis resultados: no encuentro o no me llegó mi *código único de consulta* del Portal de Pacientes.\n\n` +
        `📋 *Mis datos:*` +
        (patientName ? `\n• Nombre: ${patientName}` : '') +
        (nationalId ? `\n• DNI / DPI: ${nationalId}` : '') +
        (accessCode ? `\n• Código anterior o asignado: ${accessCode}` : '') +
        (orderNumber ? `\n• No. de Orden / Boleta: ${orderNumber}` : '') +
        (studyName ? `\n• Estudio realizado: ${studyName}` : '') +
        `\n\n¿Me podrían reenviar mi código o confirmar mi acceso por favor? Muchas gracias.`;
      break;

    case 'estado_orden':
      message = `Hola VACLINIC 👋\n\nQuisiera consultar el *procedimiento y estado actual de mi orden* de laboratorio:\n\n` +
        (orderNumber ? `• No. de Orden: *${orderNumber}*\n` : '') +
        (patientName ? `• Paciente: ${patientName}\n` : '') +
        (studyName ? `• Examen: ${studyName}\n` : '') +
        (accessCode ? `• Código único de consulta: ${accessCode}\n` : '') +
        `\n¿Me confirman en qué etapa se encuentra el análisis y cuándo estarán listos mis resultados? Gracias.`;
      break;

    case 'envio_resultados':
      message = `Hola VACLINIC 👋\n\nFavor de enviarme mis *Resultados Oficiales en PDF / WhatsApp*:\n\n` +
        (patientName ? `• Paciente: *${patientName}*\n` : '') +
        (orderNumber ? `• No. de Orden / Informe: ${orderNumber}\n` : '') +
        (accessCode ? `• Código único de consulta: ${accessCode}\n` : '') +
        (studyName ? `• Estudio: ${studyName}\n` : '') +
        `\nYa revisé en el portal y quisiera tener la copia en mi WhatsApp. ¡Muchas gracias!`;
      break;

    case 'duda_preparacion':
      message = `Hola VACLINIC 👋\n\nTengo dudas sobre la *preparación previa* para mis estudios:\n\n` +
        (studyName ? `• Examen: *${studyName}*\n` : '') +
        (patientName ? `• Paciente: ${patientName}\n` : '') +
        `\n¿Podrían orientarme sobre ayuno, recolección o indicaciones especiales? Gracias.`;
      break;

    default:
      message = `Hola VACLINIC Laboratorio Clínico 👋\n\nTengo una consulta sobre mis servicios y resultados de laboratorio.` +
        (patientName ? `\n• Paciente: ${patientName}` : '') +
        (customNotes ? `\n• Detalle: ${customNotes}` : '');
      break;
  }

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${VACLINIC_WHATSAPP_NUMBER}?text=${encoded}`;
}
