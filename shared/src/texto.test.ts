import { describe, expect, it } from 'vitest';
import { aSlug, normalizar } from './texto.js';

describe('texto', () => {
  it('quita tildes y mayúsculas pero conserva la ñ', () => {
    expect(normalizar('PENSIÓN Ñoño Güera')).toBe('pension ñoño guera');
  });
  it('genera identificadores para URL', () => {
    expect(aSlug('  Sucesiones y herencias ')).toBe('sucesiones-y-herencias');
    expect(aSlug('Obligaciones con la DIAN')).toBe('obligaciones-con-la-dian');
    expect(aSlug('Año gravable')).toBe('ano-gravable');
  });
});
