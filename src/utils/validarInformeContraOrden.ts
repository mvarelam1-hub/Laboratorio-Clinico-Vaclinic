/**
 * Regla de modo real: un informe solo puede contener resultados de los
 * exámenes que ya estaban en la orden (los que el paciente ordenó y pagó al
 * registrarla). No se agregan, editan ni envían filas de otros exámenes.
 * "Cancelado" = pagado: si la orden aún tiene saldo pendiente, tampoco se
 * ingresan ni se envían resultados hasta que se liquide.
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

/** Saldo pendiente de la orden (0 si está pagada o el dato no existe). */
export function saldoPendienteDeOrden(orden: { pendingBalance?: number } | undefined | null): number {
  const n = Number(orden?.pendingBalance);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function validarInformeContraOrden(
  orden: { examCodes?: string[]; pendingBalance?: number } | undefined | null,
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
  const saldo = saldoPendienteDeOrden(orden);
  if (saldo > 0) {
    return {
      ok: false,
      motivo: `La orden tiene un saldo pendiente de Q${saldo.toFixed(2)}. Los resultados se ingresan y envían cuando los exámenes están cancelados (pagados): liquida la orden en Órdenes.`,
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
