import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, simularApi } from '../prueba/utilidades';

describe('logo de la empresa', () => {
  it('aparece en el encabezado como enlace al inicio y en el pie', async () => {
    simularApi({});
    renderizar('/privacidad');
    const inicio = screen.getByRole('link', {
      name: /Capacitaciones IC · Respuestas para Personas Naturales/,
    });
    expect(inicio.getAttribute('href')).toBe('/');
    expect(within(inicio).getByRole('img', { name: 'Capacitaciones IC' })).toBeTruthy();
    expect(
      within(screen.getByRole('contentinfo')).getByRole('img', { name: 'Capacitaciones IC' }),
    ).toBeTruthy();
  });
});
