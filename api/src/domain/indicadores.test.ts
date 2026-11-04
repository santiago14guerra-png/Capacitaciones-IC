import { describe, expect, it } from 'vitest';
import type { Compra } from './compra.js';
import type { Consulta } from './consulta.js';
import { calcularIndicadores, lunesDe } from './indicadores.js';

const consulta = (recibidaEn: string, extra: Partial<Consulta> = {}) =>
  ({ recibidaEn, categoriaId: 'renta', estado: 'RECIBIDA', ...extra }) as Consulta;

describe('HU-21 · indicadores', () => {
  it('agrupa por semana desde el lunes, en hora de Colombia', () => {
    expect(lunesDe('2026-11-04T15:00:00Z')).toBe('2026-11-02');
    expect(lunesDe('2026-11-09T03:00:00Z')).toBe('2026-11-02'); // domingo 8, 10 p. m. en Bogotá
  });

  it('calcula tiempo de respuesta, temas, búsquedas sin resultado y porcentajes', () => {
    const r = calcularIndicadores({
      desde: '2026-11-01',
      hasta: '2026-11-30',
      consultas: [
        consulta('2026-11-02T15:00:00Z', {
          estado: 'RESPONDIDA',
          respondidaEn: '2026-11-03T15:00:00Z',
        }),
        consulta('2026-11-03T15:00:00Z', {
          estado: 'ESCALADA',
          respondidaEn: '2026-11-03T17:00:00Z',
          categoriaId: 'arr',
        }),
        consulta('2026-11-10T15:00:00Z'),
      ],
      ventas: [{ valor: 30000 }, { valor: 20000 }, { valor: 10000 }] as Compra[],
      busquedas: [
        { termino: 'sucesion', fecha: '', resultados: 0 },
        { termino: 'sucesion', fecha: '', resultados: 0 },
        { termino: 'renta', fecha: '', resultados: 3 },
      ],
      nombreCategoria: (id) => ({ renta: 'Declaración de renta', arr: 'Arrendamientos' })[id] ?? '',
    });
    expect(r).toEqual({
      desde: '2026-11-01',
      hasta: '2026-11-30',
      consultasPorSemana: [
        { semana: '2026-11-02', total: 2 },
        { semana: '2026-11-09', total: 1 },
      ],
      tiempoRespuestaHoras: 13,
      temas: [
        { categoria: 'Declaración de renta', total: 2 },
        { categoria: 'Arrendamientos', total: 1 },
      ],
      busquedasSinResultado: [{ termino: 'sucesion', veces: 2 }],
      ventas: { cantidad: 3, valor: 60000 },
      autoservicioPct: 50,
      cobroPct: 60,
    });
  });

  it('sin datos no inventa porcentajes', () => {
    const r = calcularIndicadores({
      desde: 'a',
      hasta: 'b',
      consultas: [],
      ventas: [],
      busquedas: [],
      nombreCategoria: () => '',
    });
    expect([r.tiempoRespuestaHoras, r.autoservicioPct, r.cobroPct]).toEqual([null, null, null]);
  });
});
