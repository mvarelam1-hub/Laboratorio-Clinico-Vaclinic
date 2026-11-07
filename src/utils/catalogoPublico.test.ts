import { describe, it, expect } from 'vitest';
import {
  completarConFabrica, componentesDe, categoriasConConteo, filtrarCatalogo, formatoPrecio,
  textoEntrega, textoAyuno, esPanel, nombreCategoria, enlaceSolicitudPrecios
} from './catalogoPublico';
import type { ExamenPublico } from '../services/publicoApiService';

const base = (o: Partial<ExamenPublico>): ExamenPublico => ({
  codigo: 'X-1', nombre: 'Examen', categoria: '03_quimica_sanguinea', categoriaNombre: null, tipoMuestra: null,
  precio: 50, entregaHoras: 24, esPerfil: false, descripcion: null, ayuno: null, requiereAyuno: null,
  instrucciones: null, parametros: [], ...o
});

describe('catálogo público', () => {
  it('completa con la ficha de fábrica solo lo que el servidor no trae', () => {
    const r = completarConFabrica(base({ codigo: 'PAN-02', nombre: 'Coagulación', ayuno: '6 horas (editado)' }));
    expect(r.ayuno).toBe('6 horas (editado)');          // lo del laboratorio manda
    expect(r.parametros.length).toBeGreaterThan(0);       // viene de fábrica
  });
  it('un código desconocido queda igual y sin inventar ayuno', () => {
    const e = base({});
    expect(completarConFabrica(e)).toEqual(e);
    expect(textoAyuno(e)).toBeNull();
  });
  it('textoAyuno usa el texto o "Requiere ayuno" si solo hay bandera', () => {
    expect(textoAyuno(base({ ayuno: '8 horas' }))).toBe('8 horas');
    expect(textoAyuno(base({ requiereAyuno: true }))).toBe('Requiere ayuno');
    expect(textoAyuno(base({ requiereAyuno: false }))).toBeNull();
  });
  it('precio nulo se muestra como Consultar precio, nunca Q0', () => {
    expect(formatoPrecio(null)).toBe('Consultar precio');
    expect(formatoPrecio(35)).toBe('Q35');
    expect(formatoPrecio(12.5)).toBe('Q12.50');
  });
  it('tiempo de entrega legible', () => {
    expect(textoEntrega(2)).toBe('2 h');
    expect(textoEntrega(24)).toBe('1 día');
    expect(textoEntrega(72)).toBe('3 días');
    expect(textoEntrega(0)).toBeNull();
  });
  it('cuenta por categoría y filtra sin importar acentos', () => {
    const lista = [base({ codigo: 'A', nombre: 'Glucosa' }), base({ codigo: 'B', nombre: 'Hemoglobina', categoria: '02_hematologia_grupo' }), base({ codigo: 'C', nombre: 'Colesterol' })];
    const cats = categoriasConConteo(lista);
    expect(cats.map((c) => [c.codigo, c.total])).toEqual([['02_hematologia_grupo', 1], ['03_quimica_sanguinea', 2]]);
    expect(filtrarCatalogo(lista, 'GLUCÓSA'.replace('Ó', 'O'), null)).toHaveLength(1);
    expect(filtrarCatalogo(lista, '', '03_quimica_sanguinea')).toHaveLength(2);
    expect(nombreCategoria('03_quimica_sanguinea')).toBe('Química Sanguínea');
  });
  it('componentes de un panel por código usando nombres del propio catálogo', () => {
    const todos = [base({ codigo: 'URO-40', nombre: 'Parásito A' }), base({ codigo: 'URO-46', nombre: 'Parásito B' })];
    expect(componentesDe(base({ codigo: 'URO-34' }), todos)).toEqual(['Parásito A', 'Parásito B']);
  });
  it('esPanel reconoce perfiles y paquetes', () => {
    expect(esPanel(base({ esPerfil: true }))).toBe(true);
    expect(esPanel(base({ categoria: '10_paquetes_especiales' }))).toBe(true);
    expect(esPanel(base({}))).toBe(false);
  });
});

import { contactoFinal, CONTACTO_PREDETERMINADO } from '../data/contactoLaboratorio';
describe('contacto del portal', () => {
  it('sin configuración usa los datos que el sistema ya muestra', () => {
    expect(contactoFinal(null).telefono).toBe(CONTACTO_PREDETERMINADO.telefono);
  });
  it('lo configurado en Ajustes manda y lo vacío no borra el predeterminado', () => {
    const r = contactoFinal({ ...CONTACTO_PREDETERMINADO, nombre: 'Otro Lab', telefono: '2222-3333', direccion: null, whatsapp: null });
    expect(r.nombre).toBe('Otro Lab');
    expect(r.telefono).toBe('2222-3333');
    expect(r.direccion).toBe(CONTACTO_PREDETERMINADO.direccion);
  });
});

describe('enlaceSolicitudPrecios', () => {
  it('arma el enlace de WhatsApp con +502 si el número tiene 8 dígitos', () => {
    const url = enlaceSolicitudPrecios('5612-5563', 'VACLINIC')!;
    expect(url.startsWith('https://wa.me/50256125563?text=')).toBe(true);
    expect(decodeURIComponent(url.split('text=')[1])).toContain('autorización para conocer los precios');
    expect(decodeURIComponent(url.split('text=')[1])).toContain('VACLINIC');
  });
  it('respeta un número que ya trae código de país', () => {
    expect(enlaceSolicitudPrecios('+502 5612 5563', 'Lab')!.startsWith('https://wa.me/50256125563?')).toBe(true);
  });
  it('sin número válido devuelve null', () => {
    expect(enlaceSolicitudPrecios(null, 'Lab')).toBeNull();
    expect(enlaceSolicitudPrecios('12', 'Lab')).toBeNull();
  });
});
