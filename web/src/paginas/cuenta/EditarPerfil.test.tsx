import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, SESION_CLIENTE, simularApi } from '../../prueba/utilidades';

describe('HU-23 · editar mi perfil', () => {
  it('carga los datos actuales y guarda los cambios sin pedir otra autorización', async () => {
    const llamadas = simularApi({
      'GET /sesion': {
        ...SESION_CLIENTE,
        perfil: { ...SESION_CLIENTE.perfil, versionPoliticaDatos: '0.1-borrador' },
      },
      'PUT /mi/perfil': {},
    });
    renderizar('/cuenta/perfil', { conSesion: true });
    const direccion = (await screen.findByLabelText('Dirección')) as HTMLInputElement;
    expect(direccion.value).toBe('Calle 1');
    fireEvent.change(direccion, { target: { value: 'Carrera 7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(llamadas.find((l) => l.metodo === 'PUT')).toBeTruthy());
    const cuerpo = llamadas.find((l) => l.metodo === 'PUT')!.cuerpo;
    expect(cuerpo).toMatchObject({ direccion: 'Carrera 7', nombres: 'Ana' });
    expect(cuerpo).not.toHaveProperty('autorizaDatos');
    expect(await screen.findByText(/Datos actualizados/)).toBeTruthy();
  });
});
