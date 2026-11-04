import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, respuestaError, SESION_ADMIN, simularApi } from '../../prueba/utilidades';

const consulta = {
  id: 'c1',
  radicado: 'RAD-000001',
  categoriaId: 'a',
  categoriaNombre: 'Arrendamientos',
  asunto: 'Arriendo',
  descripcion: 'Mi caso',
  estado: 'RECIBIDA',
  tieneAdjunto: false,
  recibidaEn: '2026-10-01T00:00:00Z',
  clienteNombre: 'Ana Ruiz',
  clienteCorreo: 'ana@correo.co',
  atrasada: true,
};

describe('HU-16 · bandeja de consultas', () => {
  it('resalta las de más de 48 horas y filtra por estado', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /categorias': [],
      'GET /admin/consultas': [consulta],
    });
    renderizar('/panel/consultas', { conSesion: true });
    expect((await screen.findByRole('link', { name: 'RAD-000001' })).closest('tr')!.className).toBe(
      'fila-alerta',
    );
    expect(screen.getByText(/1 consulta lleva más de 48 horas/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'EN_ANALISIS' } });
    await waitFor(() =>
      expect(llamadas.at(-1)!.url.searchParams.get('estado')).toBe('EN_ANALISIS'),
    );
  });

  it('muestra los errores de la API junto a la clasificación', async () => {
    simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/consultas/c1': consulta,
      'PUT /admin/consultas/c1': () =>
        respuestaError(422, 'VALIDACION', 'Revise los datos', {
          clasificacion: 'Clasifique la consulta como consulta rápida o asesoría',
        }),
    });
    renderizar('/panel/consultas/c1', { conSesion: true });
    fireEvent.change(await screen.findByLabelText('Estado'), { target: { value: 'EN_ANALISIS' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(
      await screen.findByText('Clasifique la consulta como consulta rápida o asesoría'),
    ).toBeTruthy();
  });

  it('al responder envía clasificación, estado y respuesta', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/consultas/c1': consulta,
      'PUT /admin/consultas/c1': {
        ...consulta,
        estado: 'RESPONDIDA',
        clasificacion: 'CONSULTA_RAPIDA',
        atrasada: false,
      },
    });
    renderizar('/panel/consultas/c1', { conSesion: true });
    fireEvent.click(await screen.findByLabelText('Consulta rápida'));
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'RESPONDIDA' } });
    const editor = await screen.findByRole('textbox', { name: /Respuesta/ });
    editor.innerHTML = '<p>Así se declara</p>';
    fireEvent.input(editor);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() =>
      expect(llamadas.find((l) => l.metodo === 'PUT')?.cuerpo).toEqual({
        estado: 'RESPONDIDA',
        clasificacion: 'CONSULTA_RAPIDA',
        respuestaHtml: '<p>Así se declara</p>',
      }),
    );
  });
});
