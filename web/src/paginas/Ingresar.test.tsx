import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ErrorAuth } from '../lib/autenticacion/tipos';
import { renderizar, SESION_CLIENTE, simularApi, transporteFalso } from '../prueba/utilidades';

const llenar = (correo: string, clave: string) => {
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: correo } });
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: clave } });
  fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
};

describe('HU-03 · Ingresar', () => {
  beforeEach(() => {
    simularApi({ 'GET /sesion': SESION_CLIENTE });
  });

  it('CA1: al ingresar muestra el nombre en el encabezado y vuelve a la página de origen', async () => {
    const { enrutador } = renderizar('/ingresar?volver=/cuenta');
    llenar('ana@correo.co', 'clave1234');
    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/cuenta'));
    expect(await screen.findByRole('link', { name: /Ana/ })).toBeTruthy();
  });

  it('CA2: muestra un mensaje genérico ante credenciales incorrectas', async () => {
    const transporte = transporteFalso({
      ingresar: async () => {
        throw new ErrorAuth('CREDENCIALES');
      },
    });
    renderizar('/ingresar', { transporte });
    llenar('ana@correo.co', 'mala');
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Correo o contraseña incorrectos',
    );
  });

  it('CA3: informa que debe esperar cuando Cognito bloquea la cuenta', async () => {
    const transporte = transporteFalso({
      ingresar: async () => {
        throw new ErrorAuth('BLOQUEADO');
      },
    });
    renderizar('/ingresar', { transporte });
    llenar('ana@correo.co', 'mala');
    expect((await screen.findByRole('alert')).textContent).toContain('Espere unos minutos');
  });

  it('no permite redirigir a otro sitio con el parámetro volver', async () => {
    const { enrutador } = renderizar('/ingresar?volver=//malicioso.com');
    llenar('ana@correo.co', 'clave1234');
    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/'));
  });
});

describe('HU-03 · Cerrar sesión', () => {
  it('CA4: invalida en el servidor, borra la sesión local y las páginas privadas piden ingresar', async () => {
    simularApi({ 'GET /sesion': SESION_CLIENTE });
    const { transporte, enrutador } = renderizar('/cuenta', { conSesion: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }));
    await waitFor(() => expect(transporte.salir).toHaveBeenCalled());
    expect(localStorage.getItem('ic.sesion')).toBeNull();
    await enrutador.navigate('/cuenta');
    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/ingresar'));
    expect(enrutador.state.location.search).toBe('?volver=%2Fcuenta');
  });
});
