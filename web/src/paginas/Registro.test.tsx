import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ErrorAuth } from '../lib/autenticacion/tipos';
import { renderizar, SESION_CLIENTE, simularApi, transporteFalso } from '../prueba/utilidades';

const escribir = (etiqueta: string | RegExp, valor: string) =>
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });

function llenarValido() {
  escribir('Nombres', 'Ana');
  escribir('Apellidos', 'Ruiz');
  escribir('Tipo de documento', 'CC');
  escribir('Número de documento', '43123456');
  escribir('Celular', '3001234567');
  escribir('Ciudad', 'Medellín');
  escribir('Dirección', 'Calle 1');
  escribir('Correo electrónico', 'Ana@Correo.co');
  escribir('Contraseña', 'clave1234');
  escribir('Confirmar contraseña', 'clave1234');
}
const crear = () => screen.getByRole('button', { name: 'Crear cuenta' });
const autorizar = () => fireEvent.click(screen.getByRole('checkbox'));

describe('HU-02 · registro', () => {
  it('CA4: «Crear cuenta» sigue deshabilitado hasta autorizar el tratamiento de datos', async () => {
    simularApi({});
    renderizar('/registro');
    llenarValido();
    expect((crear() as HTMLButtonElement).disabled).toBe(true);
    autorizar();
    expect((crear() as HTMLButtonElement).disabled).toBe(false);
    expect(
      screen.getByRole('link', { name: 'política de tratamiento de datos' }).getAttribute('href'),
    ).toBe('/privacidad');
  });

  it('CA1 y CA3: valida cada campo y muestra el error junto a él', async () => {
    simularApi({});
    const { transporte } = renderizar('/registro');
    llenarValido();
    escribir('Número de documento', '43.123');
    escribir('Correo electrónico', 'ana@');
    escribir('Contraseña', '12345678');
    escribir('Confirmar contraseña', '87654321');
    autorizar();
    fireEvent.click(crear());
    expect(await screen.findByText('El documento debe contener solo números')).toBeTruthy();
    expect(screen.getByText('Escriba un correo válido')).toBeTruthy();
    expect(screen.getByText('Debe tener al menos una letra')).toBeTruthy();
    expect(screen.getByText('Las contraseñas no coinciden')).toBeTruthy();
    expect(screen.getByLabelText('Número de documento').getAttribute('aria-invalid')).toBe('true');
    expect(transporte.registrar).not.toHaveBeenCalled();
  });

  it('CA2: con un correo ya registrado avisa y enlaza a iniciar sesión', async () => {
    simularApi({});
    renderizar('/registro', {
      transporte: transporteFalso({
        registrar: async () => {
          throw new ErrorAuth('CORREO_EXISTE');
        },
      }),
    });
    llenarValido();
    autorizar();
    fireEvent.click(crear());
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).toContain('Este correo ya tiene una cuenta');
    expect(screen.getByRole('link', { name: 'Iniciar sesión' }).getAttribute('href')).toContain(
      '/ingresar?correo=',
    );
  });

  it('CA6: con el código activa la cuenta, inicia sesión, guarda el perfil y regresa', async () => {
    const llamadas = simularApi({ 'PUT /perfil': {}, 'GET /sesion': SESION_CLIENTE });
    const { transporte, enrutador } = renderizar('/registro?volver=/fichas/abc');
    llenarValido();
    autorizar();
    fireEvent.click(crear());
    await screen.findByText(/Enviamos un código/);
    expect(transporte.registrar).toHaveBeenCalledWith('ana@correo.co', 'clave1234');

    escribir('Código de verificación', '123456');
    fireEvent.click(screen.getByRole('button', { name: 'Activar cuenta' }));
    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/fichas/abc'));
    expect(transporte.confirmar).toHaveBeenCalledWith('ana@correo.co', '123456');
    expect(transporte.ingresar).toHaveBeenCalledWith('ana@correo.co', 'clave1234');
    const perfil = llamadas.find((l) => l.metodo === 'PUT' && l.ruta === '/perfil')!;
    expect(perfil.cuerpo).toEqual({
      nombres: 'Ana',
      apellidos: 'Ruiz',
      tipoDocumento: 'CC',
      numeroDocumento: '43123456',
      celular: '3001234567',
      ciudad: 'Medellín',
      direccion: 'Calle 1',
      autorizaDatos: true,
    });
    expect(perfil.cuerpo).not.toHaveProperty('contrasena');
  });

  it('un cliente sin datos de facturación los completa antes de entrar a su cuenta', async () => {
    simularApi({ 'GET /sesion': { ...SESION_CLIENTE, perfil: null } });
    const { enrutador } = renderizar('/cuenta', { conSesion: true });
    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/cuenta/completar'));
    expect(await screen.findByRole('heading', { name: 'Complete sus datos' })).toBeTruthy();
  });
});
