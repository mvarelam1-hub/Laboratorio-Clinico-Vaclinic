/**
 * Regla de modo real: un informe solo puede contener resultados de los
 * exámenes que ya estaban en la orden (los que el paciente ordenó y pagó al
 * registrarla). No se agregan, editan ni envían filas de otros exámenes.
 */
import type { ReportParameter } from '../types';

export interface ResultadoValidacionOrden {
  ok: boolean;
  /** Mensaje listo para mostrar al usuario cuando `ok` es false. */
  motivo: string;
  /** Nombres de filas que no pertenecen a ningún examen de la orden. */
  fueraDeOrden: string[];
  /** Códigos de exámenes de la orden que todavía no tienen ninguna fila (informativo). */
  sinCapturar: string[];
}

export function validarInformeContraOrden(
  orden: { examCodes?: string[] } | undefined | null,
  parametros: Pick<ReportParameter, 'name' | 'examCode'>[]
): ResultadoValidacionOrden {
  if (!orden) {
    return {
      ok: false,
      motivo: 'Los resultados solo se ingresan sobre una orden registrada. Abre la orden y pulsa «Ingresar resultados».',
      fueraDeOrden: [],
      sinCapturar: []
    };
  }
  const codigos = new Set((orden.examCodes || []).filter(Boolean));
  if (codigos.size === 0) {
    return {
      ok: false,
      motivo: 'Esta orden no tiene exámenes registrados, por lo que no se pueden ingresar resultados.',
      fueraDeOrden: [],
      sinCapturar: []
    };
  }
  const fuera = parametros.filter((p) => !p.examCode || !codigos.has(p.examCode)).map((p) => p.name || '(fila sin nombre)');
  const usados = new Set(parametros.map((p) => p.examCode).filter(Boolean) as string[]);
  const sinCapturar = [...codigos].filter((c) => !usados.has(c));
  if (fuera.length > 0) {
    return {
      ok: false,
      motivo: `Solo se pueden guardar y enviar resultados de los exámenes que ya estaban en la orden. Estas filas no pertenecen a la orden: ${fuera.slice(0, 5).join(', ')}${fuera.length > 5 ? '…' : ''}.`,
      fueraDeOrden: fuera,
      sinCapturar
    };
  }
  return { ok: true, motivo: '', fueraDeOrden: [], sinCapturar };
}
