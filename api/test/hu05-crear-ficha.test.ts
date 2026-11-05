import { beforeAll, describe, expect, it } from 'vitest';
import { sembrarCategorias } from '../src/application/categorias.js';
import { ADMIN, CLIENTE, DIRECTOR, prepararEntorno } from './entorno.js';

const e = prepararEntorno();
beforeAll(() => sembrarCategorias(e.ctx));

const completa = {
  titulo: '¿Debo declarar renta si soy pensionado?',
  pregunta: 'Soy pensionado y recibo una mesada mensual. ¿Debo declarar?',
  resumen: 'Depende de los topes de ingresos y patrimonio del año gravable.',
  respuestaHtml: '<p><strong>Respuesta</strong> de ejemplo</p><script>alert(1)</script>',
  categoriaId: 'pensionados',
  etiquetas: ['pensión', 'Pensión', 'renta'],
  normas: ['Norma de ejemplo'],
  precio: 25000,
  publicar: true,
};

describe('HU-05 · crear ficha', () => {
  it('solo el personal crea fichas', async () => {
    expect((await e.json('/admin/fichas', { token: CLIENTE, cuerpo: completa })).estado).toBe(403);
  });

  it('CA2: para publicar exige los campos obligatorios', async () => {
    const r = await e.json('/admin/fichas', {
      token: DIRECTOR,
      cuerpo: { ...completa, titulo: '', respuestaHtml: '<p> </p>', precio: null },
    });
    expect(r.estado).toBe(422);
    expect(Object.keys(r.datos.campos).sort()).toEqual(['precio', 'respuestaHtml', 'titulo']);
  });

  it('CA2: un borrador se guarda incompleto y no aparece para clientes (CA4)', async () => {
    const r = await e.json('/admin/fichas', {
      token: DIRECTOR,
      cuerpo: {
        ...completa,
        titulo: 'Borrador',
        resumen: '',
        precio: null,
        categoriaId: '',
        publicar: false,
      },
    });
    expect(r.estado).toBe(201);
    expect(r.datos).toMatchObject({ estado: 'BORRADOR', publicadaAlgunaVez: false });
    expect(r.datos.vigenteA).toBeUndefined();
    const publicadas = await e.ctx.fichas.listarPorEstado('PUBLICADA');
    expect(publicadas.map((f) => f.id)).not.toContain(r.datos.id);
  });

  it('CA1, CA4 y CA5: publica, sanea el HTML, quita etiquetas repetidas y registra autor y fechas', async () => {
    const r = await e.json('/admin/fichas', { token: DIRECTOR, cuerpo: completa });
    expect(r.estado).toBe(201);
    const ahora = e.reloj.ahora().toISOString();
    expect(r.datos).toMatchObject({
      estado: 'PUBLICADA',
      publicadaAlgunaVez: true,
      autor: 'director',
      creadaEn: ahora,
      actualizadaEn: ahora,
      vigenteA: ahora,
      etiquetas: ['pensión', 'renta'],
      respuestaHtml: '<p><strong>Respuesta</strong> de ejemplo</p>',
    });
    const publicadas = await e.ctx.fichas.listarPorEstado('PUBLICADA');
    expect(publicadas.map((f) => f.id)).toContain(r.datos.id);
    // La respuesta no está en el ítem de metadatos que leen catálogo y búsqueda.
    expect(publicadas[0]).not.toHaveProperty('respuestaHtml');
    expect(
      (await e.json(`/admin/fichas/${r.datos.id}`, { token: ADMIN })).datos.respuestaHtml,
    ).toContain('Respuesta');
  });

  it('CA3: precio 0 es válido (ficha gratuita) y no acepta negativos', async () => {
    expect(
      (await e.json('/admin/fichas', { token: DIRECTOR, cuerpo: { ...completa, precio: 0 } }))
        .estado,
    ).toBe(201);
    expect(
      (await e.json('/admin/fichas', { token: DIRECTOR, cuerpo: { ...completa, precio: -5 } }))
        .estado,
    ).toBe(422);
  });

  it('rechaza una categoría inexistente', async () => {
    const r = await e.json('/admin/fichas', {
      token: DIRECTOR,
      cuerpo: { ...completa, categoriaId: 'nada' },
    });
    expect(r.estado).toBe(422);
    expect(r.datos.campos).toHaveProperty('categoriaId');
  });
});
