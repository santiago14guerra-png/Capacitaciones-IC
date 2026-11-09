import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, SESION_CLIENTE, simularApi } from '../../prueba/utilidades';

const c = (id: string, estado: string, extra = {}) => ({
  id: `ana.${id}`,
  referencia: `RPN-${id}`,
  fichaId: id,
  fichaTitulo: `Ficha ${id}`,
  valor: 1000,
  estado,
  tieneComprobante: true,
  creadaEn: '2026-10-01T00:00:00Z',
  actualizadaEn: '2026-10-02T00:00:00Z',
  ...extra,
});

describe('HU-14 · mi biblioteca', () => {
  it('lista fichas aprobadas con fecha, pendientes con estado y despublicadas «En revisión»', async () => {
    simularApi({
      'GET /sesion': SESION_CLIENTE,
      'GET /mi/biblioteca': [
        c('p', 'EN_VERIFICACION'),
        c('a', 'APROBADA', { aprobadaEn: '2026-10-05T15:00:00Z', fichaEnRevision: true }),
      ],
    });
    renderizar('/cuenta/biblioteca', { conSesion: true });
    const aprobada = (await screen.findByRole('link', { name: 'Ficha a' })).closest('li')!;
    expect(aprobada.textContent).toMatch(/Comprada el 5 de octubre de 2026/);
    expect(aprobada.textContent).toContain('En revisión');
    const pendiente = screen.getByText('Ficha p').closest('li')!;
    expect(pendiente.textContent).toContain('En verificación');
    expect(pendiente.textContent).toContain('RPN-p');
  });
});
