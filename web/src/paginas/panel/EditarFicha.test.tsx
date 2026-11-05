import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, SESION_ADMIN, simularApi } from '../../prueba/utilidades';

const ficha = {
  id: 'f1',
  titulo: 'Arriendo',
  pregunta: 'P',
  resumen: 'R',
  respuestaHtml: '<p>x</p>',
  categoriaId: 'a',
  etiquetas: [],
  normas: [],
  precio: 1000,
  estado: 'PUBLICADA',
  publicadaAlgunaVez: true,
  autor: 'd',
  creadaEn: '2026-10-01T00:00:00Z',
  actualizadaEn: '2026-10-01T00:00:00Z',
};
const cats = [
  {
    id: 'a',
    nombre: 'Arrendamientos',
    orden: 0,
    activa: true,
    fichasPublicadas: 1,
    fichasTotal: 1,
  },
];

describe('HU-06 · editar y despublicar', () => {
  it('CA1: lista y filtra por estado', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/fichas': [{ ...ficha, categoriaNombre: 'Arrendamientos' }],
    });
    renderizar('/panel/fichas', { conSesion: true });
    expect(await screen.findByRole('link', { name: 'Arriendo' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'BORRADOR' } });
    await waitFor(() => expect(llamadas.at(-1)!.url.searchParams.get('estado')).toBe('BORRADOR'));
  });

  it('CA3: despublica una ficha publicada; CA4: no ofrece eliminarla', async () => {
    simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/fichas/f1': ficha,
      'GET /admin/categorias': cats,
      'POST /admin/fichas/f1/despublicar': {
        ...ficha,
        estado: 'DESPUBLICADA',
        actualizadaEn: '2026-10-02T00:00:00Z',
      },
    });
    renderizar('/panel/fichas/f1', { conSesion: true });
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Despublicar' }));
    expect((await screen.findByRole('status')).textContent).toContain(
      'Quienes la compraron la conservan',
    );
    expect(screen.getByText('Despublicada')).toBeTruthy();
  });

  it('CA4: elimina un borrador nunca publicado solo después de confirmar', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/fichas/f1': { ...ficha, estado: 'BORRADOR', publicadaAlgunaVez: false },
      'GET /admin/categorias': cats,
      'DELETE /admin/fichas/f1': () => new Response(null, { status: 204 }),
      'GET /admin/fichas': [],
    });
    const { enrutador } = renderizar('/panel/fichas/f1', { conSesion: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }));
    expect(llamadas.some((l) => l.metodo === 'DELETE')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/panel/fichas'));
  });
});
