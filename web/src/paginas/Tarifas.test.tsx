import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, simularApi } from '../prueba/utilidades';

describe('HU-24 · tarifas y alcance', () => {
  it('explica consulta rápida y asesoría con su tarifa, sin inventar valores', async () => {
    simularApi({
      'GET /config': {
        correo: 'x',
        whatsapp: 'y',
        tarifas: {
          consultaRapida: '[PENDIENTE: tarifa de la consulta rápida]',
          asesoria: '$ 120.000',
        },
      },
    });
    renderizar('/tarifas');
    expect(screen.getByRole('heading', { name: 'Consulta rápida' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Asesoría' })).toBeTruthy();
    await waitFor(() => expect(screen.getByText('$ 120.000')).toBeTruthy());
    expect(screen.getByText('[PENDIENTE: tarifa de la consulta rápida]').tagName).toBe('MARK');
    expect(screen.getByRole('link', { name: 'Enviar mi consulta' }).getAttribute('href')).toBe(
      '/consultas/nueva',
    );
  });
});
