import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, simularApi } from '../prueba/utilidades';

const ficha = (n: number) => ({
  id: `f${n}`,
  titulo: `Ficha ${n}`,
  resumen: 'Resumen',
  categoriaId: 'a',
  categoriaNombre: 'Arrendamientos',
  etiquetas: ['arriendo'],
  precio: 0,
  vigenteA: '2026-10-01T00:00:00Z',
});
const categorias = [
  { id: 'a', nombre: 'Arrendamientos', orden: 0, activa: true },
  { id: 'p', nombre: 'Pensionados', orden: 1, activa: true },
];

describe('HU-08 · catálogo', () => {
  it('CA1 y CA5: sin sesión muestra tarjetas con título, categoría, etiquetas, precio y vigencia', async () => {
    simularApi({
      'GET /categorias': categorias,
      'GET /fichas': { elementos: [ficha(1)], pagina: 1, totalPaginas: 1, total: 1 },
    });
    renderizar('/catalogo');
    const tarjeta = (await screen.findByRole('link', { name: 'Ficha 1' })).closest('article')!;
    expect(tarjeta.textContent).toContain('Arrendamientos');
    expect(tarjeta.textContent).toContain('#arriendo');
    expect(tarjeta.textContent).toContain('Gratis');
    expect(tarjeta.textContent).toContain('Vigente a');
  });

  it('CA2 y CA3: filtra por varias categorías, ordena y pagina por la URL', async () => {
    const llamadas = simularApi({
      'GET /categorias': categorias,
      'GET /fichas': { elementos: [ficha(1)], pagina: 1, totalPaginas: 2, total: 13 },
    });
    renderizar('/catalogo');
    fireEvent.click(await screen.findByLabelText('Arrendamientos'));
    fireEvent.click(screen.getByLabelText('Pensionados'));
    fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'precio' } });
    await waitFor(() => {
      const u = llamadas.at(-1)!.url;
      expect(u.searchParams.getAll('categoria')).toEqual(['a', 'p']);
      expect(u.searchParams.get('orden')).toBe('precio');
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Página 2' }));
    await waitFor(() => expect(llamadas.at(-1)!.url.searchParams.get('pagina')).toBe('2'));
  });

  it('CA4: sin resultados muestra un mensaje y la opción «Enviar mi consulta» (Sprint 2)', async () => {
    simularApi({
      'GET /categorias': categorias,
      'GET /fichas': { elementos: [], pagina: 1, totalPaginas: 1, total: 0 },
    });
    renderizar('/catalogo?categoria=p');
    const vacio = (await screen.findByRole('heading', { name: /No encontramos respuestas/ }))
      .parentElement!;
    expect(
      within(vacio).getByRole('link', { name: 'Enviar mi consulta' }).getAttribute('href'),
    ).toBe('/consultas/nueva');
  });
});
