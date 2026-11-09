import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, simularApi } from '../prueba/utilidades';

const resultado = {
  consulta: 'pension',
  terminos: ['pension'],
  total: 1,
  elementos: [
    {
      id: 'f1',
      titulo: 'Pensión de vejez',
      resumen: 'Cuándo declarar la pensión',
      categoriaId: 'p',
      categoriaNombre: 'Pensionados',
      etiquetas: [],
      precio: 20000,
      vigenteA: '2026-10-01T00:00:00Z',
    },
  ],
};

describe('HU-09 · búsqueda', () => {
  it('CA3: resalta el término sin importar tildes', async () => {
    simularApi({ 'GET /fichas': resultado });
    const { container } = renderizar('/buscar?q=pension');
    await screen.findByText(/1 respuesta para/);
    expect([...container.querySelectorAll('mark')].map((m) => m.textContent)).toEqual([
      'Pensión',
      'pensión',
    ]);
  });

  it('CA4: con menos de 3 letras no busca y lo indica', async () => {
    const llamadas = simularApi({ 'GET /fichas': resultado });
    renderizar('/buscar?q=pe');
    expect(await screen.findByText('Escriba al menos 3 letras para buscar.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Escriba su duda'), { target: { value: 'ab' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(llamadas.filter((l) => l.ruta === '/fichas')).toHaveLength(0);
  });

  it('envía la búsqueda desde la caja', async () => {
    const llamadas = simularApi({ 'GET /fichas': resultado });
    const { enrutador } = renderizar('/buscar');
    fireEvent.change(screen.getByLabelText('Escriba su duda'), { target: { value: ' pensión ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await waitFor(() => expect(enrutador.state.location.search).toBe('?q=pensi%C3%B3n'));
    await waitFor(() => expect(llamadas.at(-1)!.url.searchParams.get('q')).toBe('pensión'));
  });
});
