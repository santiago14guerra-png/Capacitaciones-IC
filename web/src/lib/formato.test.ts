import { describe, expect, it } from 'vitest';
import { formatoPrecio } from './formato';

describe('formato', () => {
  it('muestra «Gratis» para precio 0 y pesos sin decimales', () => {
    expect(formatoPrecio(0)).toBe('Gratis');
    expect(formatoPrecio(35000).replace(/\s/g, ' ')).toMatch(/\$ ?35\.000/);
  });
});
