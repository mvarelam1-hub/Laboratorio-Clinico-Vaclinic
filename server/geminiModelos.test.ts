import { describe, it, expect } from 'vitest';
import { modelosCandidatos, esErrorDeModelo, MODELO_POR_DEFECTO } from './geminiModelos';

describe('modelosCandidatos', () => {
  it('sin modelo preferido usa el de por defecto y luego los de respaldo', () => {
    const l = modelosCandidatos();
    expect(l[0]).toBe(MODELO_POR_DEFECTO);
    expect(l.length).toBeGreaterThan(1);
  });

  it('el preferido va primero y no se repite si coincide con uno de la lista', () => {
    expect(modelosCandidatos('mi-modelo')[0]).toBe('mi-modelo');
    const l = modelosCandidatos(MODELO_POR_DEFECTO);
    expect(l.filter((m) => m === MODELO_POR_DEFECTO)).toHaveLength(1);
  });

  it('ignora un preferido vacío', () => {
    expect(modelosCandidatos('  ')[0]).toBe(MODELO_POR_DEFECTO);
  });

  it('el modelo antiguo que fallaba ya no es el de por defecto', () => {
    expect(MODELO_POR_DEFECTO).not.toBe('gemini-3.7-flash');
  });
});

describe('esErrorDeModelo', () => {
  it('reconoce modelo inexistente o retirado', () => {
    expect(esErrorDeModelo(new Error('models/gemini-3.7-flash is not found for API version v1beta'))).toBe(true);
    expect(esErrorDeModelo({ status: 404, message: 'x' })).toBe(true);
    expect(esErrorDeModelo(new Error('This model is no longer available'))).toBe(true);
  });

  it('no confunde con otros fallos (red, cuota, clave)', () => {
    expect(esErrorDeModelo(new Error('fetch failed'))).toBe(false);
    expect(esErrorDeModelo({ status: 429, message: 'quota exceeded' })).toBe(false);
    expect(esErrorDeModelo({ status: 403, message: 'API key invalid' })).toBe(false);
    expect(esErrorDeModelo(null)).toBe(false);
  });
});
