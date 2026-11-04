import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, simularApi } from '../prueba/utilidades';

const ficha = (n: number) => ({
  id: `f${n}`,
  titulo: `Ficha ${n}`,
  resumen: `Resumen ${n}`,
  categoriaId: 'a',
  categoriaNombre: 'Arrendamientos',
  etiquetas: [],
  precio: 10000,
  vigenteA: '2026-10-01T00:00:00Z',
});
const api = {
  'GET /categorias': [
    { id: 'arrendamientos', nombre: 'Arrendamientos', orden: 0, activa: true },
    { id: 'pensionados', nombre: 'Pensionados', orden: 1, activa: true },
  ],
  'GET /fichas': {
    elementos: Array.from({ length: 8 }, (_, i) => ficha(i + 1)),
    pagina: 1,
    totalPaginas: 1,
    total: 8,
  },
  'GET /config': { correo: 'contacto@ejemplo.co', whatsapp: '573001112233', tarifas: {} },
};

describe('HU-01 · página de inicio', () => {
  it('CA1: nombre, propuesta de valor y buscador', async () => {
    simularApi(api);
    renderizar('/');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Respuestas para Personas Naturales' }),
    ).toBeTruthy();
    expect(screen.getByRole('search')).toBeTruthy();
  });

  it('CA2: «Cómo funciona» con tres pasos', async () => {
    simularApi(api);
    renderizar('/');
    const seccion = screen.getByRole('heading', { name: 'Cómo funciona' }).parentElement!;
    expect(within(seccion).getAllByRole('listitem')).toHaveLength(3);
  });

  it('CA3: cada categoría abre el catálogo filtrado', async () => {
    simularApi(api);
    renderizar('/');
    const enlace = await screen.findByRole('link', { name: 'Pensionados' });
    expect(enlace.getAttribute('href')).toBe('/catalogo?categoria=pensionados');
  });

  it('CA4: muestra las seis fichas más recientes con título, resumen y precio', async () => {
    const llamadas = simularApi(api);
    renderizar('/');
    const seccion = (await screen.findByRole('heading', { name: 'Respuestas recientes' })).closest(
      'section',
    )!;
    expect(within(seccion).getAllByRole('article')).toHaveLength(6);
    expect(seccion.textContent).toContain('Resumen 1');
    expect(llamadas.find((l) => l.ruta === '/fichas')!.url.searchParams.get('orden')).toBe(
      'recientes',
    );
  });

  it('CA5: el pie tiene correo, WhatsApp y política de datos', async () => {
    simularApi(api);
    renderizar('/');
    const pie = screen.getByRole('contentinfo');
    await waitFor(() =>
      expect(within(pie).getByRole('link', { name: 'contacto@ejemplo.co' })).toBeTruthy(),
    );
    expect(
      within(pie).getByRole('link', { name: 'Escribirnos por WhatsApp' }).getAttribute('href'),
    ).toBe('https://wa.me/573001112233');
    expect(
      within(pie).getByRole('link', { name: 'Política de tratamiento de datos' }),
    ).toBeTruthy();
  });
});
