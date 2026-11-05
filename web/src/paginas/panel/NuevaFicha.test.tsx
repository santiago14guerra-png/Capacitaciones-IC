import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, SESION_ADMIN, simularApi } from '../../prueba/utilidades';

const cats = [
  {
    id: 'pensionados',
    nombre: 'Pensionados',
    orden: 0,
    activa: true,
    fichasPublicadas: 0,
    fichasTotal: 0,
  },
];
const escribir = (etiqueta: string, valor: string) =>
  fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
const respuesta = (html: string) => {
  const editor = screen.getByRole('textbox', { name: 'Respuesta completa' });
  editor.innerHTML = html;
  fireEvent.input(editor);
};

describe('HU-05 · crear ficha', () => {
  it('CA2: para publicar marca los campos obligatorios y no envía', async () => {
    const llamadas = simularApi({ 'GET /sesion': SESION_ADMIN, 'GET /admin/categorias': cats });
    renderizar('/panel/fichas/nueva', { conSesion: true });
    await screen.findByRole('heading', { name: 'Nueva ficha' });
    fireEvent.click(screen.getByLabelText(/Publicada/));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Revise los campos marcados.')).toBeTruthy();
    expect(screen.getByLabelText('Título').getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText('Indique el precio (0 si es gratuita)')).toBeTruthy();
    expect(llamadas.some((l) => l.metodo === 'POST')).toBe(false);
  });

  it('CA1, CA3 y CA6: arma los datos, muestra la vista previa y guarda', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/categorias': cats,
      'POST /admin/fichas': (c: object) => ({ ...c, id: 'f1', estado: 'PUBLICADA' }),
    });
    renderizar('/panel/fichas/nueva', { conSesion: true });
    await screen.findByRole('heading', { name: 'Nueva ficha' });
    escribir('Título', '¿Debo declarar?');
    escribir('Pregunta del caso', 'Soy pensionado.');
    escribir('Resumen público', 'Depende de los topes.');
    respuesta('<p><b>Texto</b> completo</p>');
    escribir('Categoría', 'pensionados');
    escribir('Precio en COP', '25.000');
    escribir('Etiquetas', 'pensión, renta ,');
    escribir('Normas de referencia', 'Norma A\n\nNorma B');
    fireEvent.click(screen.getByLabelText(/Publicada/));

    fireEvent.click(screen.getByRole('button', { name: 'Vista previa' }));
    expect(await screen.findByText(/así verá la ficha un cliente/)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: '¿Debo declarar?' })).toBeTruthy();
    expect(screen.getByText('completo', { exact: false })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Volver a editar' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(llamadas.some((l) => l.metodo === 'POST')).toBe(true));
    expect(llamadas.find((l) => l.metodo === 'POST')!.cuerpo).toEqual({
      titulo: '¿Debo declarar?',
      pregunta: 'Soy pensionado.',
      resumen: 'Depende de los topes.',
      respuestaHtml: '<p><b>Texto</b> completo</p>',
      categoriaId: 'pensionados',
      etiquetas: ['pensión', 'renta'],
      normas: ['Norma A', 'Norma B'],
      precio: 25000,
      publicar: true,
    });
    expect(await screen.findByText(/Se guardó/)).toBeTruthy();
  });
});
