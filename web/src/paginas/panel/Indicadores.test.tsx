import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, SESION_ADMIN, simularApi } from '../../prueba/utilidades';

describe('HU-21 · panel de indicadores', () => {
  it('muestra consultas, tiempo de respuesta, temas, búsquedas sin resultado y ventas', async () => {
    simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/indicadores': {
        desde: '2026-11-01',
        hasta: '2026-11-30',
        consultasPorSemana: [{ semana: '2026-11-02', total: 3 }],
        tiempoRespuestaHoras: 13.5,
        temas: [{ categoria: 'Pensionados', total: 3 }],
        busquedasSinResultado: [{ termino: 'herencia yacente', veces: 4 }],
        ventas: { cantidad: 2, valor: 50000 },
        autoservicioPct: 40,
        cobroPct: null,
      },
    });
    renderizar('/panel/indicadores', { conSesion: true });
    expect(await screen.findByText('13,5 h')).toBeTruthy();
    const t = document.body.textContent!;
    for (const x of [
      'Semana del 2 de noviembre de 2026',
      'Pensionados',
      'herencia yacente',
      '2 pagos aprobados',
      '40 %',
    ]) {
      expect(t).toContain(x);
    }
    expect(screen.getByText('—')).toBeTruthy();
  });
});
