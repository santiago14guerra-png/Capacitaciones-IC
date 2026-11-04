import { describe, expect, it } from 'vitest';
import { formatoReferencia, idCompra, partesIdCompra } from './compra.js';

describe('compra', () => {
  it('formatea la referencia con seis dígitos', () => {
    expect(formatoReferencia(123)).toBe('RPN-000123');
    expect(formatoReferencia(1234567)).toBe('RPN-1234567');
  });
  it('el identificador público lleva a la llave', () => {
    const id = idCompra({ sub: 'a1b2-c3', fichaId: 'f-9' });
    expect(partesIdCompra(id)).toEqual({ sub: 'a1b2-c3', fichaId: 'f-9' });
    expect(partesIdCompra('sinpunto')).toBeNull();
  });
});
