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
      'PATCH /admin/consultas/c1': () =>
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
      'PATCH /admin/consultas/c1': {
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
      expect(llamadas.find((l) => l.metodo === 'PATCH')?.cuerpo).toEqual({
        estado: 'RESPONDIDA',
        clasificacion: 'CONSULTA_RAPIDA',
        respuestaHtml: '<p>Así se declara</p>',
      }),
    );
  });
});

describe('HU-20 · convertir una respuesta en ficha', () => {
  it('crea el borrador y abre la ficha para revisarla', async () => {
    const respondida = {
      ...consulta,
      estado: 'RESPONDIDA',
      clasificacion: 'CONSULTA_RAPIDA',
      respuestaHtml: '<p>R</p>',
      atrasada: false,
    };
    simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/consultas/c1': respondida,
      'POST /admin/consultas/c1/ficha': { id: 'nueva' },
    });
    const { enrutador } = renderizar('/panel/consultas/c1', { conSesion: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Convertir en ficha' }));
    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/panel/fichas/nueva'));
  });

  it('si ya se convirtió, enlaza la ficha en vez de ofrecer otra', async () => {
    simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/consultas/c1': {
        ...consulta,
        estado: 'RESPONDIDA',
        respuestaHtml: '<p>R</p>',
        fichaId: 'f9',
      },
    });
    renderizar('/panel/consultas/c1', { conSesion: true });
    expect((await screen.findByRole('link', { name: 'Abrir la ficha' })).getAttribute('href')).toBe(
      '/panel/fichas/f9',
    );
    expect(screen.queryByRole('button', { name: 'Convertir en ficha' })).toBeNull();
  });
});

describe('HU-16 · confirmación al guardar', () => {
  it('muestra «Cambios guardados.» aunque cambie el estado', async () => {
    simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/consultas/c1': consulta,
      'PATCH /admin/consultas/c1': {
        ...consulta,
        estado: 'EN_ANALISIS',
        clasificacion: 'ASESORIA',
        atrasada: false,
      },
    });
    renderizar('/panel/consultas/c1', { conSesion: true });
    fireEvent.click(await screen.findByLabelText('Asesoría'));
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'EN_ANALISIS' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Cambios guardados.')).toBeTruthy();
  });
});
