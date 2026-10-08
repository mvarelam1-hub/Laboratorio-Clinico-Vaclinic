import { describe, it, expect } from 'vitest';
import { sanearEntrada, construirPrompt, validarSalida, textoParaInforme } from './iaInterpretacion';

describe('sanearEntrada', () => {
  it('rechaza si no hay ningún resultado capturado', () => {
    const r = sanearEntrada({ parametros: [{ name: 'Glucosa', value: '' }] });
    expect(r.ok).toBe(false);
  });
  it('conserva solo campos permitidos y nunca datos de identificación', () => {
    const r = sanearEntrada({
      patientName: 'Ana Pérez', nationalId: '123', edad: 34, genero: 'F',
      parametros: [{ name: 'Glucosa', value: '92', unit: 'mg/dL', referenceRange: '70-100', status: 'normal', nombre: 'x', phone: '5555' }]
    });
    expect(r.ok).toBe(true);
    if (r.ok && r.entrada) {
      expect(JSON.stringify(r.entrada)).not.toMatch(/Ana|123|5555/);
      expect(r.entrada.parametros[0]).toEqual({ name: 'Glucosa', value: '92', unit: 'mg/dL', referenceRange: '70-100', status: 'normal' });
    }
  });
});

describe('construirPrompt', () => {
  it('prohíbe diagnosticar y no incluye identificación', () => {
    const r = sanearEntrada({ edad: 40, genero: 'M', parametros: [{ name: 'Hemoglobina', value: '9', unit: 'g/dL', referenceRange: '13-17', status: 'low' }] });
    if (!r.ok || !r.entrada) throw new Error("no debería fallar");
    const p = construirPrompt(r.entrada);
    expect(p).toMatch(/NO diagnostiques/);
    expect(p).toMatch(/Hemoglobina: 9 g\/dL/);
    expect(p).toMatch(/por debajo del rango/);
  });
});

describe('validarSalida', () => {
  const buena = {
    resumen: 'Se midieron dos pruebas y una está por debajo del rango de referencia.',
    valores: [{ nombre: 'Hemoglobina', significado: 'Mide la proteína que transporta oxígeno; este valor está por debajo del rango. Coméntelo con su médico.' }],
    recordatorio: 'Texto informativo; su médico debe interpretar los resultados.'
  };
  it('acepta una explicación sin conclusiones', () => {
    expect(validarSalida(buena).ok).toBe(true);
  });
  it('rechaza diagnósticos y tratamientos', () => {
    expect(validarSalida({ ...buena, resumen: 'El paciente padece anemia.' }).ok).toBe(false);
    expect(validarSalida({ ...buena, resumen: 'Se confirma un diagnóstico de anemia.' }).ok).toBe(false);
    expect(validarSalida({ ...buena, valores: [{ nombre: 'Hb', significado: 'Debe tomar 200 mg de hierro.' }] }).ok).toBe(false);
    expect(validarSalida({ ...buena, resumen: 'Requiere tratamiento inmediato.' }).ok).toBe(false);
  });
  it('rechaza salida vacía', () => {
    expect(validarSalida({}).ok).toBe(false);
    expect(validarSalida(null).ok).toBe(false);
  });
  it('arma el texto para el informe', () => {
    const v = validarSalida(buena);
    if (!v.ok || !v.salida) throw new Error("debería ser ok");
    expect(textoParaInforme(v.salida)).toContain('• Hemoglobina:');
  });
});
