/**
 * POST /api/ia/interpretacion — asistente de interpretación por IA (ver
 * server/iaInterpretacion.ts para las reglas). Solo personal con el permiso
 * "validacion_redaccion". No guarda nada: devuelve el texto para que el
 * personal lo revise y decida si lo usa en el informe.
 */
import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { requireStaffAuth } from '../auth-staff';
import { requirePermission } from '../permissions-middleware';
import { asyncHandler } from '../asyncHandler';
import { registrarBitacora } from '../bitacora';
import { sanearEntrada, construirPrompt, validarSalida, textoParaInforme, especialistasSugeridos, fraseEspecialista } from '../iaInterpretacion';

export const iaRouter = Router();
iaRouter.use(requireStaffAuth);

const MODELO = () => process.env.GEMINI_MODEL || 'gemini-3.7-flash';

iaRouter.post('/interpretacion', requirePermission('validacion_redaccion'), asyncHandler(async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(503).json({
      code: 'IA_NO_CONFIGURADA',
      error: 'La IA no está configurada en el servidor (falta la clave GEMINI_API_KEY).'
    });
  }

  const saneado = sanearEntrada(req.body);
  if (!saneado.ok) return res.status(400).json({ error: saneado.error });

  const entrada = saneado.entrada!;
  const modelo = MODELO();
  let crudo: unknown;
  try {
    const ai = new GoogleGenAI({ apiKey });
    const respuesta = await ai.models.generateContent({
      model: modelo,
      contents: construirPrompt(entrada),
      config: { responseMimeType: 'application/json', temperature: 0.2 }
    });
    crudo = JSON.parse(respuesta.text || '{}');
  } catch (err: any) {
    console.warn('Gemini interpretacion error:', err?.message);
    return res.status(502).json({ code: 'IA_NO_DISPONIBLE', error: 'No se pudo obtener respuesta de la IA en este momento. Intenta de nuevo en unos minutos.' });
  }

  const validada = validarSalida(crudo);
  if (!validada.ok) return res.status(422).json({ code: 'IA_SALIDA_RECHAZADA', error: validada.motivo });

  try {
    await registrarBitacora({
      idUsuario: req.staffUser!.idUsuario,
      accion: 'ia_interpretacion_generada',
      modulo: 'reportes',
      detalles: `Interpretación IA generada (${entrada.parametros.length} parámetros, modelo ${modelo}). Sin datos de identificación enviados.`
    });
  } catch (err) {
    console.warn('No se pudo registrar la bitácora de IA:', (err as Error).message);
  }

  const salida = validada.salida!;
  // Garantiza que el especialista orientativo aparezca aunque la IA lo omita.
  const especialistas = especialistasSugeridos(entrada);
  if (especialistas.length && !especialistas.some((x) => salida.resumen.toLowerCase().includes(x.profesional))) {
    salida.resumen = `${salida.resumen} ${fraseEspecialista(especialistas)}`.trim();
  }
  return res.json({ modelo, ...salida, texto: textoParaInforme(salida) });
}));
