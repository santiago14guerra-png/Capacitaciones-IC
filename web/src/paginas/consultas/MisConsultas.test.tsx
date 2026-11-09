import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, SESION_CLIENTE, simularApi } from '../../prueba/utilidades';

const c = {
  id: 'c1',
  radicado: 'RAD-000007',
  categoriaId: 'a',
  categoriaNombre: 'Arrendamientos',
  asunto: 'Arriendo',
  descripcion: 'Mi caso',
  estado: 'RESPONDIDA',
  tieneAdjunto: false,
  recibidaEn: '2026-10-01T15:00:00Z',
  respondidaEn: '2026-10-02T15:00:00Z',
  respuestaHtml: '<p>Así se declara</p>',
};

describe('HU-17 · seguimiento de mis consultas', () => {
  it('lista las consultas con radicado, estado y fecha', async () => {
    simularApi({ 'GET /sesion': SESION_CLIENTE, 'GET /mi/consultas': [c] });
    renderizar('/cuenta/consultas', { conSesion: true });
    const fila = (await screen.findByRole('link', { name: 'Arriendo' })).closest('li')!;
    expect(fila.textContent).toContain('RAD-000007');
    expect(fila.textContent).toContain('Respondida');
  });

  it('muestra la respuesta dentro de la plataforma', async () => {
    simularApi({ 'GET /sesion': SESION_CLIENTE, 'GET /mi/consultas/c1': c });
    renderizar('/cuenta/consultas/c1', { conSesion: true });
    expect(await screen.findByText('Así se declara')).toBeTruthy();
  });

  it('si fue escalada muestra las condiciones de la asesoría', async () => {
    simularApi({
      'GET /sesion': SESION_CLIENTE,
      'GET /mi/consultas/c1': {
        ...c,
        estado: 'ESCALADA',
        respuestaHtml: undefined,
        condicionesAsesoria: 'Condiciones X',
      },
    });
    renderizar('/cuenta/consultas/c1', { conSesion: true });
    expect(await screen.findByText('Su caso requiere una asesoría')).toBeTruthy();
    expect(screen.getByText('Condiciones X')).toBeTruthy();
  });
});
