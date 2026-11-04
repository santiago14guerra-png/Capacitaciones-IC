import { AVISO_ASESORIA } from '@ic/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, SESION_CLIENTE, simularApi } from '../prueba/utilidades';

const base = {
  id: 'f1',
  titulo: 'Pensión y renta',
  resumen: 'Resumen',
  pregunta: '¿Debo declarar?',
  categoriaId: 'p',
  categoriaNombre: 'Pensionados',
  etiquetas: ['pensión'],
  normas: ['Norma 1'],
  precio: 30000,
  vigenteA: '2026-10-01T00:00:00Z',
  estado: 'PUBLICADA',
  enRevision: false,
  relacionadas: [
    {
      id: 'r1',
      titulo: 'Relacionada',
      resumen: 'x',
      categoriaId: 'p',
      categoriaNombre: 'Pensionados',
      etiquetas: [],
      precio: 0,
      vigenteA: '2026-10-01T00:00:00Z',
    },
  ],
};

describe('HU-10 · detalle de ficha', () => {
  it('CA1, CA5 y CA6: muestra los datos, relacionadas y el aviso de asesoría', async () => {
    simularApi({ 'GET /fichas/f1': { ...base, tieneAcceso: false } });
    renderizar('/fichas/f1');
    expect(await screen.findByRole('heading', { level: 1, name: 'Pensión y renta' })).toBeTruthy();
    const pagina = document.body.textContent!;
    for (const t of [
      '¿Debo declarar?',
      'Pensionados',
      '#pensión',
      'Norma 1',
      'Vigente a',
      AVISO_ASESORIA,
    ]) {
      expect(pagina).toContain(t);
    }
    expect(screen.getByRole('link', { name: 'Relacionada' })).toBeTruthy();
  });

  it('CA2 y CA3: sin acceso muestra el bloque bloqueado y lleva a ingresar con regreso', async () => {
    simularApi({ 'GET /fichas/f1': { ...base, tieneAcceso: false } });
    const { enrutador } = renderizar('/fichas/f1');
    fireEvent.click(await screen.findByRole('link', { name: 'Obtener respuesta' }));
    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/ingresar'));
    expect(enrutador.state.location.search).toBe('?volver=%2Ffichas%2Ff1');
  });

  it('CA4: con acceso muestra la respuesta saneada', async () => {
    simularApi({
      'GET /sesion': SESION_CLIENTE,
      'GET /fichas/f1': {
        ...base,
        precio: 0,
        tieneAcceso: true,
        respuestaHtml: '<p>Completa<img src=x onerror=alert(1)></p>',
      },
    });
    const { container } = renderizar('/fichas/f1', { conSesion: true });
    expect(await screen.findByText('Completa')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
  });
});
