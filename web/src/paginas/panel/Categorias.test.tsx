import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, respuestaError, SESION_ADMIN, simularApi } from '../../prueba/utilidades';

const cats = [
  {
    id: 'a',
    nombre: 'Arrendamientos',
    orden: 0,
    activa: true,
    fichasPublicadas: 2,
    fichasTotal: 2,
  },
  { id: 'p', nombre: 'Pensionados', orden: 1, activa: true, fichasPublicadas: 0, fichasTotal: 0 },
];

describe('HU-07 · panel de categorías', () => {
  it('CA1 y CA4: al bajar una categoría envía el nuevo orden completo', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/categorias': cats,
      'PUT /admin/categorias/orden': [cats[1], cats[0]],
    });
    renderizar('/panel/categorias', { conSesion: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Bajar Arrendamientos' }));
    await waitFor(() =>
      expect(llamadas.some((l) => l.ruta === '/admin/categorias/orden')).toBe(true),
    );
    expect(llamadas.find((l) => l.ruta === '/admin/categorias/orden')!.cuerpo).toEqual({
      ids: ['p', 'a'],
    });
  });

  it('CA2: si tiene fichas publicadas informa cuántas y pide reasignarlas', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/categorias': cats,
      'POST /admin/categorias/a/desactivar': () =>
        respuestaError(
          409,
          'CONFLICTO',
          'La categoría tiene 2 fichas publicadas. Reasígnelas a otra categoría antes de desactivarla.',
        ),
      'POST /admin/categorias/a/reasignar': { movidas: 2 },
    });
    renderizar('/panel/categorias', { conSesion: true });
    fireEvent.click((await screen.findAllByRole('button', { name: 'Desactivar' }))[0]!);
    const dialogo = await screen.findByRole('alertdialog');
    expect(dialogo.textContent).toContain('2 fichas publicadas');
    fireEvent.change(screen.getByLabelText('Reasignar sus fichas a'), { target: { value: 'p' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reasignar y desactivar' }));
    await waitFor(() =>
      expect(llamadas.find((l) => l.ruta === '/admin/categorias/a/reasignar')?.cuerpo).toEqual({
        destinoId: 'p',
      }),
    );
  });
});
