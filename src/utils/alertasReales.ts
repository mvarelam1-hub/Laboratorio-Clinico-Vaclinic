import type { MedicalReport } from '../types';
import type { ReagentInventoryItem } from '../types/reagentInventory';

export type TipoAlerta = 'critico' | 'reactivo';

export interface AlertaReal {
  id: string;
  tipo: TipoAlerta;
  titulo: string;
  detalle: string;
  /** ISO. */
  fecha: string;
  /** id del informe / reactivo, para abrirlo. */
  referencia: string;
}

const DIAS_AVISO_VENCIMIENTO = 30;

/**
 * Alertas calculadas SOLO con datos reales del laboratorio:
 *  - valores críticos (de pánico) ya capturados en informes,
 *  - reactivos con existencias por debajo del mínimo, o vencidos / por vencer.
 * No hay alertas "de relleno": sin datos que las justifiquen, la lista queda vacía.
 */
export function calcularAlertasReales(
  informes: MedicalReport[],
  reactivos: ReagentInventoryItem[],
  ahora: Date = new Date()
): AlertaReal[] {
  const alertas: AlertaReal[] = [];

  for (const inf of informes) {
    for (const p of inf.parameters || []) {
      if (p.status !== 'critical') continue;
      const valor = `${p.value ?? ''} ${p.unit ?? ''}`.trim();
      alertas.push({
        id: `crit-${inf.id}-${p.id ?? p.name}`,
        tipo: 'critico',
        titulo: `Valor crítico: ${p.name} ${valor}`.trim(),
        detalle: `${inf.patientName || 'Paciente sin nombre'} · Informe ${inf.reportNumber}${inf.status === 'borrador' ? ' (borrador)' : ''}`,
        fecha: inf.emissionDate || inf.sampleDate,
        referencia: inf.id
      });
    }
  }

  const limite = new Date(ahora.getTime() + DIAS_AVISO_VENCIMIENTO * 86_400_000);
  for (const r of reactivos) {
    if (r.expirationDate) {
      const vence = new Date(`${r.expirationDate}T23:59:59`);
      if (!Number.isNaN(vence.getTime())) {
        if (vence < ahora) {
          alertas.push({ id: `venc-${r.id}`, tipo: 'reactivo', titulo: `Reactivo vencido: ${r.name}`, detalle: `Lote ${r.lotNumber || '—'} · venció el ${r.expirationDate}`, fecha: `${r.expirationDate}T00:00:00.000Z`, referencia: r.id });
        } else if (vence <= limite) {
          alertas.push({ id: `porvenc-${r.id}`, tipo: 'reactivo', titulo: `Reactivo por vencer: ${r.name}`, detalle: `Lote ${r.lotNumber || '—'} · vence el ${r.expirationDate}`, fecha: `${r.expirationDate}T00:00:00.000Z`, referencia: r.id });
        }
      }
    }
    if (r.minStockAlert > 0 && r.currentStock <= r.minStockAlert) {
      alertas.push({
        id: `stock-${r.id}`, tipo: 'reactivo',
        titulo: `Existencias bajas: ${r.name}`,
        detalle: `Quedan ${r.currentStock} ${r.unit} (mínimo ${r.minStockAlert})`,
        fecha: r.updatedAt || ahora.toISOString(), referencia: r.id
      });
    }
  }

  return alertas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}
