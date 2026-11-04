import { describe, expect, it } from 'vitest';
import { fechaBogota, rangoBogota } from './periodo.js';

describe('periodo en hora de Colombia', () => {
  it('incluye el día completo de la fecha final', () =>
    expect(rangoBogota('2026-11-01', '2026-11-30')).toEqual({
      desde: '2026-11-01T05:00:00.000Z',
      hasta: '2026-12-01T04:59:59.999Z',
    }));
  it('una compra a las 11 p. m. del 30 es del 30, no del 1', () =>
    expect(fechaBogota('2026-12-01T04:00:00.000Z')).toBe('2026-11-30'));
  it('rechaza periodos invertidos o de más de un año', () => {
    expect(() => rangoBogota('2026-11-02', '2026-11-01')).toThrow();
    expect(() => rangoBogota('2025-01-01', '2026-11-01')).toThrow();
  });
});
