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
