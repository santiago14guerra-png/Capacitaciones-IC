import { describe, expect, it } from 'vitest';
import { anonimizar } from './anonimizar.js';

const perfil = {
  nombres: 'María José',
  apellidos: 'Peña Gómez',
  numeroDocumento: '43123456',
  correo: 'maria.pena@correo.co',
  celular: '3001234567',
  direccion: 'Calle 10 # 20-30',
};

describe('HU-20 · anonimizar', () => {
  it('quita nombres sin importar tildes ni mayúsculas', () =>
    expect(anonimizar('Soy MARIA JOSE PEÑA y mi mamá es Gomez', perfil)).toBe(
      'Soy [cliente] y mi mamá es [cliente]',
    ));
  it('quita documento con o sin puntos', () =>
    expect(
      anonimizar('Mi cédula es 43.123.456 y la de mi hijo es C.C. 1.017.222.333', perfil),
    ).toBe('Mi cédula es [documento] y la de mi hijo es C.C. [documento]'));
  it('quita correos y celulares, propios y de terceros', () =>
    expect(
      anonimizar(
        'Escriban a maria.pena@correo.co o a otro@x.com, cel 300 123 4567 o +57 315-555-1234',
        perfil,
      ),
    ).toBe('Escriban a [correo] o a [correo], cel [celular] o [celular]'));
  it('quita la dirección', () =>
    expect(anonimizar('Vivo en calle 10  # 20-30, Medellín', perfil)).toBe(
      'Vivo en [dirección], Medellín',
    ));
  it('no toca valores, años ni normas', () => {
    const t = 'Ingresos de $ 45.000.000 en 2025, artículo 206 del Estatuto, 1.400 UVT.';
    expect(anonimizar(t, perfil)).toBe(t);
  });
  it('no confunde palabras que contienen el nombre', () =>
    expect(anonimizar('Mariano vive en Josefina', perfil)).toBe('Mariano vive en Josefina'));
});
