import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, SESION_ADMIN, SESION_CLIENTE, simularApi } from '../../prueba/utilidades';

describe('menús del panel y de la cuenta', () => {
  it('el panel enlaza todas sus secciones', async () => {
    simularApi({ 'GET /sesion': SESION_ADMIN });
    renderizar('/panel', { conSesion: true });
    const menu = await screen.findByRole('navigation', { name: 'Panel' });
    expect(
      within(menu)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual([
      '/panel',
      '/panel/pagos',
      '/panel/consultas',
      '/panel/fichas',
      '/panel/categorias',
      '/panel/indicadores',
      '/panel/siigo',
    ]);
  });

  it('la cuenta del cliente enlaza biblioteca, consultas y perfil', async () => {
    simularApi({ 'GET /sesion': SESION_CLIENTE });
    renderizar('/cuenta', { conSesion: true });
    await screen.findByRole('heading', { name: 'Mi cuenta' });
    for (const nombre of ['Mi biblioteca', 'Mis consultas', 'Mi perfil']) {
      expect(screen.getByRole('heading', { name: nombre })).toBeTruthy();
    }
  });
});
