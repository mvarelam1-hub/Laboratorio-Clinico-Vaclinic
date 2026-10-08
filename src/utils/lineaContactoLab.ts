/**
 * Línea de identificación legal/contacto del laboratorio armada SOLO con lo
 * configurado en Ajustes (nunca teléfonos ni números de registro inventados).
 */
export function lineaContactoLab(
  ajustes: { phone?: string; whatsappNumber?: string; sanitaryLicense?: string; city?: string } | undefined | null,
  incluirRegistro = true
): string {
  const a = ajustes || {};
  const partes: string[] = [];
  if (a.city && a.city.trim()) partes.push(a.city.trim());
  const tel = (a.phone || a.whatsappNumber || '').trim();
  if (tel) partes.push(`Tel. ${tel}`);
  if (incluirRegistro && a.sanitaryLicense && a.sanitaryLicense.trim()) partes.push(`Registro sanitario: ${a.sanitaryLicense.trim()}`);
  return partes.join(' • ');
}
