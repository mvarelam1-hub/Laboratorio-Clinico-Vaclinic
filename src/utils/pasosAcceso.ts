/**
 * Pasos de acceso que llevan los mensajes que se envían al paciente
 * (WhatsApp o correo): el enlace del sitio, que también sirve para instalar
 * VACLINIC como aplicación (PWA, ver public/manifest.webmanifest), y cómo
 * instalarla desde el celular.
 */
export function pasosAcceso(url: string, ultimoPaso: string): string {
  return (
    `1️⃣ Entre al sitio o instale la app: ${url}\n` +
    `2️⃣ Escriba su código de consulta\n` +
    `3️⃣ ${ultimoPaso}\n\n` +
    `📲 Para instalarla: abra ese enlace en su celular y elija «Instalar» o «Agregar a pantalla de inicio».`
  );
}
