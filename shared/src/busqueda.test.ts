import { describe, expect, it } from 'vitest';
import { resaltar, terminosBusqueda } from './busqueda.js';

describe('búsqueda compartida (HU-09)', () => {
  it('normaliza, quita palabras vacías y plurales', () => {
    expect(terminosBusqueda('¿Cómo declaro las PENSIONES de mi papá?')).toEqual([
      'declaro',
      'pension',
      'papa',
    ]);
  });
  it('si solo hay palabras vacías, las conserva', () =>
    expect(terminosBusqueda('de la')).toEqual(['de', 'la']));
  it('resalta sin importar tildes y conserva el texto original', () => {
    const s = resaltar('Pensión de vejez y pensiones', ['pension']);
    expect(s.filter((x) => x.marcado).map((x) => x.texto)).toEqual(['Pensión', 'pensiones']);
    expect(s.map((x) => x.texto).join('')).toBe('Pensión de vejez y pensiones');
  });
});
