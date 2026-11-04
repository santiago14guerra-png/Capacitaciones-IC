import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, SESION_ADMIN, SESION_CLIENTE, simularApi } from '../../prueba/utilidades';

describe('HU-04 · panel', () => {
  it('CA1: el personal ve el enlace «Panel»', async () => {
    simularApi({ 'GET /sesion': SESION_ADMIN });
    renderizar('/', { conSesion: true });
    expect(await screen.findByRole('link', { name: 'Panel' })).toBeTruthy();
  });

  it('CA1: un cliente no ve el enlace y si abre la URL no ve el panel', async () => {
    simularApi({ 'GET /sesion': SESION_CLIENTE });
    renderizar('/panel', { conSesion: true });
    expect(await screen.findByText('No tiene permiso para ver esta página')).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Panel' })).toBeNull();
  });

  it('CA2: un visitante que abre el panel va a ingresar', async () => {
    simularApi({});
    const { enrutador } = renderizar('/panel');
    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/ingresar'));
  });
});
