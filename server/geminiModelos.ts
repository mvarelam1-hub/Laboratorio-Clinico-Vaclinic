/**
 * Modelos de Gemini para las funciones de IA del servidor.
 *
 * Los nombres de modelo de Google cambian con el tiempo (los viejos dejan de
 * existir). Si el modelo configurado ya no existe, la interpretación IA
 * fallaba siempre con «no se pudo obtener respuesta». Por eso se prueba el
 * modelo elegido y, solo si el error es de modelo inexistente o retirado,
 * los siguientes de esta lista.
 */
export const MODELO_POR_DEFECTO = 'gemini-3.8-flash';
export const MODELOS_RESPALDO = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];

/** Modelo preferido (variable GEMINI_MODEL) primero, luego el de por defecto y los de respaldo, sin repetir. */
export function modelosCandidatos(preferido?: string | null): string[] {
  const lista = [preferido?.trim(), MODELO_POR_DEFECTO, ...MODELOS_RESPALDO].filter((m): m is string => !!m);
  return [...new Set(lista)];
}

/** ¿El error indica que el modelo no existe o ya no está disponible (y no, por ejemplo, un fallo de red o de cuota)? */
export function esErrorDeModelo(err: unknown): boolean {
  const e = err as { status?: number; code?: number; message?: string } | null;
  if (e?.status === 404 || e?.code === 404) return true;
  const texto = String(e?.message ?? '');
  return /not[ _]found|no longer available|is not supported|decommission|deprecated|shut ?down|retired/i.test(texto);
}
