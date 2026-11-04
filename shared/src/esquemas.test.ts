import { describe, expect, it } from 'vitest';
import { esquemaRegistro } from './esquemas.js';

const base = {
  nombres: 'Ana',
  apellidos: 'Ruiz',
  tipoDocumento: 'CC',
  numeroDocumento: '123456',
  correo: 'ana@correo.co',
  celular: '3001234567',
  direccion: 'Calle 1',
  ciudad: 'Medellín',
  contrasena: 'clave1234',
  confirmacion: 'clave1234',
  autorizaDatos: true,
};
const errores = (d: unknown) =>
  esquemaRegistro.safeParse(d).error?.issues.map((i) => i.path.join('.')) ?? [];

describe('registro (HU-02)', () => {
  it('acepta datos válidos', () => expect(errores(base)).toEqual([]));
  it('exige solo dígitos salvo pasaporte', () => {
    expect(errores({ ...base, numeroDocumento: 'AB12' })).toContain('numeroDocumento');
    expect(errores({ ...base, tipoDocumento: 'PASAPORTE', numeroDocumento: 'AB12' })).toEqual([]);
  });
  it('exige contraseña con letra y número', () => {
    const c = { contrasena: '12345678', confirmacion: '12345678' };
    expect(errores({ ...base, ...c })).toContain('contrasena');
  });
  it('detecta contraseñas distintas', () =>
    expect(errores({ ...base, confirmacion: 'otra12345' })).toContain('confirmacion'));
  it('exige la autorización de datos', () =>
    expect(errores({ ...base, autorizaDatos: false })).toContain('autorizaDatos'));
  it('rechaza correo inválido', () =>
    expect(errores({ ...base, correo: 'x@' })).toContain('correo'));
});

describe('ficha (HU-05)', async () => {
  const { esquemaGuardarFicha } = await import('./esquemas.js');
  const vacia = {
    titulo: '',
    pregunta: '',
    resumen: '',
    respuestaHtml: '<p><br></p>',
    categoriaId: '',
    etiquetas: [],
    normas: [],
    precio: null,
    publicar: false,
  };
  const campos = (d: unknown) =>
    esquemaGuardarFicha
      .safeParse(d)
      .error?.issues.map((i) => i.path.join('.'))
      .sort() ?? [];

  it('CA2: un borrador puede guardarse incompleto', () => expect(campos(vacia)).toEqual([]));
  it('CA2: para publicar exige los campos obligatorios', () =>
    expect(campos({ ...vacia, publicar: true })).toEqual([
      'categoriaId',
      'precio',
      'pregunta',
      'respuestaHtml',
      'resumen',
      'titulo',
    ]));
  it('CA3: el precio es un entero mayor o igual a 0', () => {
    expect(campos({ ...vacia, precio: -1 })).toEqual(['precio']);
    expect(campos({ ...vacia, precio: 10.5 })).toEqual(['precio']);
    expect(campos({ ...vacia, precio: 0 })).toEqual([]);
  });
  it('CA1: límites de 120 caracteres en título y 300 en resumen', () =>
    expect(campos({ ...vacia, titulo: 'x'.repeat(121), resumen: 'x'.repeat(301) })).toEqual([
      'resumen',
      'titulo',
    ]));
});
