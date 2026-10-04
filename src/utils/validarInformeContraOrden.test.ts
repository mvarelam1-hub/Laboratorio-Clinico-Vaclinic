import { describe, it, expect } from 'vitest';
import { validarInformeContraOrden } from './validarInformeContraOrden';

describe('validarInformeContraOrden', () => {
  const orden = { examCodes: ['QUI-27', 'HEM-10'] };
  it('acepta filas de los exámenes de la orden', () => {
    const r = validarInformeContraOrden(orden, [{ name: 'Glucosa', examCode: 'QUI-27' }]);
    expect(r.ok).toBe(true);
    expect(r.sinCapturar).toEqual(['HEM-10']);
  });
  it('rechaza filas de otro examen', () => {
    const r = validarInformeContraOrden(orden, [{ name: 'Colesterol', examCode: 'QUI-99' }]);
    expect(r.ok).toBe(false);
    expect(r.fueraDeOrden).toEqual(['Colesterol']);
  });
  it('rechaza filas manuales sin código de examen', () => {
    expect(validarInformeContraOrden(orden, [{ name: 'Fila manual' }]).ok).toBe(false);
  });
  it('rechaza si no hay orden o no tiene exámenes', () => {
    expect(validarInformeContraOrden(undefined, []).ok).toBe(false);
    expect(validarInformeContraOrden({ examCodes: [] }, []).ok).toBe(false);
  });

  it('bloquea si la orden tiene saldo pendiente (cancelado = pagado)', () => {
    const r = validarInformeContraOrden({ examCodes: ['HEM'], pendingBalance: 75 }, [{ name: 'Hb', examCode: 'HEM' }]);
    expect(r.ok).toBe(false);
    expect(r.motivo).toContain('Q75.00');
  });

  it('permite si el saldo es 0 o no existe', () => {
    expect(validarInformeContraOrden({ examCodes: ['HEM'], pendingBalance: 0 }, [{ name: 'Hb', examCode: 'HEM' }]).ok).toBe(true);
    expect(validarInformeContraOrden({ examCodes: ['HEM'] }, [{ name: 'Hb', examCode: 'HEM' }]).ok).toBe(true);
  });
});
