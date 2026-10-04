export interface DatosMensajeResultados {
  paciente: string;
  codigoConsulta?: string;
  urlPortal: string;
  laboratorio: string;
  telefonoLab?: string;
}

/** Mensaje (texto plano) para avisar que los resultados están listos. Solo usa datos reales. */
export function mensajeResultadosListos(d: DatosMensajeResultados): string {
  const lineas = [
    `Hola ${d.paciente.trim()}, sus resultados en ${d.laboratorio} ya están disponibles.`,
    '',
    `Consúltelos en: ${d.urlPortal}`,
    d.codigoConsulta ? `Código de consulta: ${d.codigoConsulta}` : 'Solicite su código de consulta en recepción.',
    d.telefonoLab ? `Dudas: ${d.telefonoLab}` : ''
  ].filter((l, i, arr) => !(l === '' && (i === arr.length - 1)));
  return lineas.join('\n');
}

/** Enlace wa.me solo si el teléfono tiene al menos 8 dígitos; si no, null. */
export function enlaceWhatsApp(telefono: string | undefined, mensaje: string): string | null {
  const digitos = (telefono || '').replace(/\D/g, '');
  if (digitos.length < 8) return null;
  // Teléfonos locales de 8 dígitos (Guatemala) llevan el prefijo del país.
  const completo = digitos.length === 8 ? `502${digitos}` : digitos;
  return `https://wa.me/${completo}?text=${encodeURIComponent(mensaje)}`;
}
