import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, SESION_CLIENTE, simularApi } from '../../prueba/utilidades';

const api = {
  'GET /sesion': SESION_CLIENTE,
  'GET /categorias': [{ id: 'a', nombre: 'Arrendamientos', orden: 0, activa: true }],
  'GET /buscar': {
    consulta: 'arriendo',
    terminos: ['arriendo'],
    total: 1,
    elementos: [
      {
        id: 'f1',
        titulo: 'Ingresos por arriendo',
        resumen: '',
        categoriaId: 'a',
        categoriaNombre: 'A',
        etiquetas: [],
        precio: 0,
        vigenteA: '2026-10-01T00:00:00Z',
      },
    ],
  },
};

describe('HU-15 · enviar consulta', () => {
  it('sugiere fichas mientras escribe el asunto, sin registrar la búsqueda', async () => {
    const llamadas = simularApi(api);
    renderizar('/consultas/nueva', { conSesion: true });
    fireEvent.change(await screen.findByLabelText('Asunto'), {
      target: { value: 'arriendo de local' },
    });
    expect(
      await screen.findByRole('link', { name: 'Ingresos por arriendo' }, { timeout: 2000 }),
    ).toBeTruthy();
    expect(llamadas.find((l) => l.ruta === '/buscar')!.url.searchParams.get('sugerencia')).toBe(
      '1',
    );
  });

  it('valida los campos y muestra el radicado y la fecha al enviar', async () => {
    const llamadas = simularApi({
      ...api,
      'POST /consultas': {
        id: 'c1',
        radicado: 'RAD-000045',
        recibidaEn: '2026-11-02T15:00:00Z',
        estado: 'RECIBIDA',
        categoriaId: 'a',
        categoriaNombre: 'A',
        asunto: 'x',
        descripcion: 'y',
        tieneAdjunto: false,
      },
    });
    renderizar('/consultas/nueva', { conSesion: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Enviar consulta' }));
    expect(await screen.findAllByText('Este campo es obligatorio')).toHaveLength(3);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Asunto'), { target: { value: 'Arriendo' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Mi caso' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar consulta' }));
    expect(await screen.findByText('RAD-000045')).toBeTruthy();
    await waitFor(() =>
      expect(llamadas.find((l) => l.metodo === 'POST')!.cuerpo).toEqual({
        categoriaId: 'a',
        asunto: 'Arriendo',
        descripcion: 'Mi caso',
      }),
    );
  });
});
