import { describe, it, expect } from 'vitest';
import { sanearEntrada, construirPrompt, validarSalida, textoParaInforme, parsearRango, describirDesviacion } from './iaInterpretacion';

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

describe('parsearRango', () => {
  it('entiende intervalos, topes y pisos', () => {
    expect(parsearRango('70-100')).toEqual({ min: 70, max: 100 });
    expect(parsearRango('3,5 – 5,0')).toEqual({ min: 3.5, max: 5 });
    expect(parsearRango('< 200')).toEqual({ max: 200 });
    expect(parsearRango('Deseable: <=200 mg/dL')).toEqual({ max: 200 });
    expect(parsearRango('≥ 40')).toEqual({ min: 40 });
    expect(parsearRango('hasta 5,2')).toEqual({ max: 5.2 });
  });
  it('con varios niveles toma el primero mencionado', () => {
    expect(parsearRango('Deseable < 200; limítrofe 200-239')).toEqual({ max: 200 });
  });
  it('devuelve null si no se entiende', () => {
    expect(parsearRango('Negativo')).toBeNull();
    expect(parsearRango('')).toBeNull();
    expect(parsearRango(undefined)).toBeNull();
  });
});

describe('describirDesviacion', () => {
  it('cuantifica cuánto se pasa del límite superior', () => {
    const d = describirDesviacion({ name: 'Colesterol Total', value: '245', unit: 'mg/dL', referenceRange: '< 200' });
    expect(d).toBe('45 mg/dL por encima del límite superior (200), 22.5 % sobre el límite');
  });
  it('cuantifica cuánto queda bajo el límite inferior', () => {
    const d = describirDesviacion({ name: 'Hemoglobina', value: '9', unit: 'g/dL', referenceRange: '13-17' });
    expect(d).toBe('4 g/dL por debajo del límite inferior (13), 30.8 % bajo el límite');
  });
  it('si está dentro del intervalo lo dice', () => {
    expect(describirDesviacion({ name: 'Glucosa', value: '92', unit: 'mg/dL', referenceRange: '70-100' })).toBe('dentro del intervalo de referencia');
  });
  it('null si el valor no es numérico o no hay rango entendible', () => {
    expect(describirDesviacion({ name: 'EGO', value: 'Positivo', referenceRange: 'Negativo' })).toBeNull();
    expect(describirDesviacion({ name: 'X', value: '5' })).toBeNull();
  });
});

describe('construirPrompt: interpretación profesional y concisa', () => {
  const r = sanearEntrada({ edad: 50, genero: 'M', parametros: [{ name: 'Colesterol Total (TC)', value: '245', unit: 'mg/dL', referenceRange: '< 200', status: 'high' }] });
  if (!r.ok || !r.entrada) throw new Error('no debería fallar');
  const p = construirPrompt(r.entrada);
  it('entrega a la IA la desviación ya calculada para que la cifra sea exacta', () => {
    expect(p).toContain('desviación calculada: 45 mg/dL por encima del límite superior (200), 22.5 % sobre el límite');
  });
  it('pide registro profesional, una oración por prueba y conclusión breve', () => {
    expect(p).toMatch(/profesional/i);
    expect(p).toMatch(/Una sola oración por prueba/);
    expect(p).toMatch(/Máximo 2 oraciones/);
  });
  it('mantiene las prohibiciones de no diagnosticar ni recetar', () => {
    expect(p).toMatch(/NO diagnostiques/);
    expect(p).toMatch(/NO recomiendes medicamentos/);
  });
});
