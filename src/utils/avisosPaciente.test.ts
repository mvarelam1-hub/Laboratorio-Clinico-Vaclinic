import { describe, it, expect } from 'vitest';
import { mensajeMuestraRecibida, mensajeResultadosListos } from './avisosPaciente';

const base = {
  nombre: ' Ana Pérez ',
  laboratorio: 'VACLINIC',
  numeroOrden: 'ORD-1',
  codigoConsulta: 'ABC123',
  url: 'https://vaclinic.example',
  contacto: '\n📞 Dudas: 5555-5555'
};

describe('aviso de muestra recibida', () => {
  const texto = mensajeMuestraRecibida(base);

  it('dice que se recibió la muestra y lleva orden y código de consulta', () => {
    expect(texto).toContain('Hola, *Ana Pérez*');
    expect(texto).toContain('Recibimos su muestra');
    expect(texto).toContain('*N.º de orden:* *ORD-1*');
    expect(texto).toContain('*Su código de consulta:* *ABC123*');
  });

  it('lleva el enlace para ver el procedimiento y cómo instalar la app', () => {
    expect(texto).toContain('avance del procedimiento');
    expect(texto).toContain('Entre al sitio o instale la app: https://vaclinic.example');
    expect(texto).toContain('Consulte el seguimiento de su orden');
    expect(texto).toContain('Agregar a pantalla de inicio');
  });

  it('no promete resultados todavía y mantiene el contacto', () => {
    expect(texto).not.toContain('ya están *listos*');
    expect(texto).toContain('Dudas: 5555-5555');
  });

  it('sin número de orden omite esa línea', () => {
    expect(mensajeMuestraRecibida({ ...base, numeroOrden: '' })).not.toContain('N.º de orden');
  });
});

describe('aviso de resultados listos', () => {
  const texto = mensajeResultadosListos(base);

  it('avisa que los exámenes terminaron y que el informe está listo', () => {
    expect(texto).toContain('ya están *listos*');
    expect(texto).toContain('*Su código de consulta:* *ABC123*');
  });

  it('lleva el enlace para descargar el informe y cómo instalar la app', () => {
    expect(texto).toContain('Entre al sitio o instale la app: https://vaclinic.example');
    expect(texto).toContain('Toque "Descargar informe"');
    expect(texto).toContain('Agregar a pantalla de inicio');
  });

  it('los dos avisos son distintos', () => {
    expect(mensajeMuestraRecibida(base)).not.toEqual(texto);
  });
});
