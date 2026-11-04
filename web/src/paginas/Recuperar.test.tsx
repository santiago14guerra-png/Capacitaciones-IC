import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErrorAuth } from '../lib/autenticacion/tipos';
import { renderizar, simularApi, transporteFalso } from '../prueba/utilidades';

const escribir = (etiqueta: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });

describe('HU-22 · recuperar contraseña', () => {
  it('pide el enlace sin revelar si el correo existe', async () => {
    simularApi({});
    const { transporte } = renderizar('/recuperar');
    escribir('Correo electrónico', 'Ana@Correo.co');
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));
    expect((await screen.findByRole('status')).textContent).toContain(
      'Si ana@correo.co tiene una cuenta',
    );
    expect(transporte.olvido).toHaveBeenCalledWith('ana@correo.co');
  });

  it('desde el enlace del correo restablece con el código y vuelve a ingresar', async () => {
    simularApi({});
    const { transporte, enrutador } = renderizar('/recuperar?correo=ana%40correo.co&codigo=654321');
    escribir('Contraseña nueva', 'nueva1234');
    escribir('Confirmar contraseña nueva', 'nueva1234');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/ingresar'));
    expect(transporte.restablecer).toHaveBeenCalledWith('ana@correo.co', '654321', 'nueva1234');
    expect(await screen.findByText(/Su contraseña se cambió/)).toBeTruthy();
  });

  it('valida la contraseña nueva y muestra si el código no sirve', async () => {
    simularApi({});
    renderizar('/recuperar?correo=ana%40correo.co&codigo=1', {
      transporte: transporteFalso({
        restablecer: async () => {
          throw new ErrorAuth('CODIGO_VENCIDO');
        },
      }),
    });
    escribir('Contraseña nueva', 'abcdefgh');
    escribir('Confirmar contraseña nueva', 'otra');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByText('Debe tener al menos un número')).toBeTruthy();
    expect(screen.getByText('Las contraseñas no coinciden')).toBeTruthy();
    escribir('Contraseña nueva', 'nueva1234');
    escribir('Confirmar contraseña nueva', 'nueva1234');
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect((await screen.findByRole('alert')).textContent).toContain('El código venció');
  });
});
