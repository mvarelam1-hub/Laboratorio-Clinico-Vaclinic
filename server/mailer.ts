/**
 * Envío de correos transaccionales (recuperación de contraseña).
 *
 * Usa la API HTTP de Resend (https://resend.com) con `fetch`, así que no
 * agrega ninguna dependencia nueva. Variables de entorno:
 *   RESEND_API_KEY  clave de la API (secreto, solo en el servidor)
 *   MAIL_FROM       remitente verificado, ej. "VACLINIC <no-responder@tu-dominio.com>"
 *   APP_BASE_URL    URL pública del sistema, para armar el enlace del correo
 *                   (si falta, se usa PUBLIC_BASE_URL y después la URL de Render)
 *
 * Si falta alguna, `enviarCorreo` NO falla: responde `{ enviado: false }` y la
 * recuperación manual por un administrador sigue disponible.
 */

const URL_BASE_POR_DEFECTO = 'https://laboratorio-clinico-vaclinic.onrender.com';

export interface ResultadoCorreo {
  enviado: boolean;
  motivo?: string;
}

export function correoConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

/** Base del enlace: viene del entorno, nunca de la petición (evita enlaces falsos por cabecera Host). */
export function urlBase(): string {
  return (process.env.APP_BASE_URL || process.env.PUBLIC_BASE_URL || URL_BASE_POR_DEFECTO).replace(/\/+$/, '');
}

export async function enviarCorreo(params: { para: string; asunto: string; texto: string; html: string }): Promise<ResultadoCorreo> {
  if (!correoConfigurado()) {
    return { enviado: false, motivo: 'El envío de correo no está configurado en el servidor.' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [params.para],
        subject: params.asunto,
        text: params.texto,
        html: params.html
      })
    });
    if (!res.ok) {
      return { enviado: false, motivo: `El proveedor de correo respondió ${res.status}.` };
    }
    return { enviado: true };
  } catch (err) {
    return { enviado: false, motivo: `No se pudo contactar al proveedor de correo: ${(err as Error).message}` };
  }
}

export function plantillaRecuperacion(params: { nombre: string; enlace: string; minutos: number }): { asunto: string; texto: string; html: string } {
  const { nombre, enlace, minutos } = params;
  const asunto = 'Recupera tu contraseña de VACLINIC';
  const texto = [
    `Hola ${nombre},`,
    '',
    `Recibimos una solicitud para restablecer tu contraseña de VACLINIC. Abre este enlace en los próximos ${minutos} minutos:`,
    enlace,
    '',
    'El enlace se puede usar una sola vez. Si no fuiste tú, ignora este mensaje: tu contraseña no cambia.'
  ].join('\n');
  const html = `<p>Hola ${escaparHtml(nombre)},</p>
<p>Recibimos una solicitud para restablecer tu contraseña de VACLINIC. El enlace vence en <strong>${minutos} minutos</strong> y se puede usar una sola vez.</p>
<p><a href="${escaparHtml(enlace)}">Restablecer mi contraseña</a></p>
<p>Si no fuiste tú, ignora este mensaje: tu contraseña no cambia.</p>`;
  return { asunto, texto, html };
}

function escaparHtml(valor: string): string {
  return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
