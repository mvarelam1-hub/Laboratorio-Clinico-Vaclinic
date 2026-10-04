import { describe, it, expect } from 'vitest';
import { calcularAlertasReales } from './alertasReales';
import type { MedicalReport } from '../types';
import type { ReagentInventoryItem } from '../types/reagentInventory';

const informe = (params: any[], extra: Partial<MedicalReport> = {}) =>
  ({ id: 'r1', reportNumber: 'INF-1', patientName: 'Ana Real', status: 'publicado', emissionDate: '2026-10-01T10:00:00Z', sampleDate: '2026-10-01', parameters: params, ...extra }) as MedicalReport;
const reactivo = (extra: Partial<ReagentInventoryItem>) =>
  ({ id: 'x1', name: 'Glucosa', lotNumber: 'L1', expirationDate: '2027-12-31', currentStock: 50, minStockAlert: 10, unit: 'Kits', updatedAt: '2026-10-01T00:00:00Z', ...extra }) as ReagentInventoryItem;
const AHORA = new Date('2026-10-04T12:00:00Z');

describe('calcularAlertasReales', () => {
  it('sin datos no hay alertas (nunca inventa)', () => {
    expect(calcularAlertasReales([], [], AHORA)).toEqual([]);
  });
  it('un parámetro crítico genera una alerta con paciente e informe', () => {
    const a = calcularAlertasReales([informe([{ id: 'p', name: 'Glucosa', value: 485, unit: 'mg/dL', status: 'critical' }, { id: 'q', name: 'HDL', value: 40, status: 'low' }])], [], AHORA);
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({ tipo: 'critico', referencia: 'r1' });
    expect(a[0].titulo).toContain('485 mg/dL');
    expect(a[0].detalle).toContain('Ana Real');
  });
  it('bajo/alto sin ser crítico NO es alerta de pánico', () => {
    expect(calcularAlertasReales([informe([{ id: 'p', name: 'LDL', value: 142, status: 'high' }])], [], AHORA)).toEqual([]);
  });
  it('reactivo vencido, por vencer y de stock bajo; uno sano no genera nada', () => {
    const a = calcularAlertasReales([], [
      reactivo({ id: 'a', expirationDate: '2026-09-01' }),
      reactivo({ id: 'b', expirationDate: '2026-10-20' }),
      reactivo({ id: 'c', currentStock: 10 }),
      reactivo({ id: 'd' })
    ], AHORA);
    expect(a.map((x) => x.id).sort()).toEqual(['porvenc-b', 'stock-c', 'venc-a']);
  });
  it('minStockAlert 0 desactiva la alerta de stock', () => {
    expect(calcularAlertasReales([], [reactivo({ currentStock: 0, minStockAlert: 0 })], AHORA)).toEqual([]);
  });
});
