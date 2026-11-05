import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, simularApi } from '../../prueba/utilidades';

describe('HU-25 · política y términos', () => {
  it.each([
    ['/privacidad', 'Política de tratamiento de datos personales'],
    ['/terminos', 'Términos y condiciones de uso'],
  ])('%s se marca como borrador pendiente del abogado', async (ruta, titulo) => {
    simularApi({});
    renderizar(ruta);
    expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeTruthy();
    expect(screen.getByRole('note').textContent).toContain(
      'Borrador pendiente de revisión del abogado',
    );
  });

  it('el pie de página enlaza la política desde cualquier página', async () => {
    simularApi({});
    renderizar('/');
    const enlace = await screen.findByRole('link', { name: 'Política de tratamiento de datos' });
    expect(enlace.getAttribute('href')).toBe('/privacidad');
  });

  it('la política incluye los derechos y plazos de la Ley 1581', async () => {
    simularApi({});
    renderizar('/privacidad');
    const texto = (await screen.findByRole('article')).textContent!;
    expect(texto).toContain('diez (10) días hábiles');
    expect(texto).toContain('quince (15) días hábiles');
    expect(texto).toContain('Superintendencia de Industria y Comercio');
  });
});
