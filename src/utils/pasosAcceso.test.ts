import { describe, it, expect } from 'vitest';
import { pasosAcceso } from './pasosAcceso';

describe('pasosAcceso', () => {
  it('lleva el enlace del sitio y explica cómo instalar la aplicación', () => {
    const texto = pasosAcceso('https://vaclinic.example', 'Descargue su informe cuando esté listo');
    expect(texto).toContain('1️⃣ Entre al sitio o instale la app: https://vaclinic.example');
    expect(texto).toContain('2️⃣ Escriba su código de consulta');
    expect(texto).toContain('3️⃣ Descargue su informe cuando esté listo');
    expect(texto).toContain('Instalar');
    expect(texto).toContain('Agregar a pantalla de inicio');
  });

  it('el enlace queda solo en el paso 1 (una sola vez), para que se abra bien en WhatsApp', () => {
    const texto = pasosAcceso('https://vaclinic.example', 'x');
    expect(texto.split('https://vaclinic.example')).toHaveLength(2);
  });
});
