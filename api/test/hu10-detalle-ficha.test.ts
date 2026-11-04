import { beforeAll, describe, expect, it } from 'vitest';
import { invalidarCatalogo } from '../src/application/catalogo.js';
import { sembrarCategorias } from '../src/application/categorias.js';
import { ADMIN, CLIENTE, prepararEntorno } from './entorno.js';
import { fichaDePrueba } from './fabricas.js';

const e = prepararEntorno();
const SECRETO = 'TEXTO-SECRETO-DE-LA-RESPUESTA';

beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.ctx.fichas.guardar(
    fichaDePrueba({
      id: 'paga',
      categoriaId: 'pensionados',
      precio: 30000,
      respuestaHtml: `<p>${SECRETO}</p>`,
      normas: ['Norma 1'],
      etiquetas: ['pensión'],
    }),
  );
  await e.ctx.fichas.guardar(
    fichaDePrueba({
      id: 'gratis',
      categoriaId: 'pensionados',
      precio: 0,
      respuestaHtml: '<p>libre</p>',
    }),
  );
  for (let i = 0; i < 4; i++)
    await e.ctx.fichas.guardar(fichaDePrueba({ id: `rel-${i}`, categoriaId: 'pensionados' }));
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'otra', categoriaId: 'arrendamientos' }));
  await e.ctx.fichas.guardar(
    fichaDePrueba({ id: 'borrador', estado: 'BORRADOR', categoriaId: 'pensionados' }),
  );
  invalidarCatalogo(e.ctx);
});

describe('HU-10 · detalle de ficha', () => {
  it('CA1: muestra título, pregunta, resumen, categoría, etiquetas, normas, precio y vigencia', async () => {
    const r = await e.json('/fichas/paga');
    expect(r.datos).toMatchObject({
      titulo: expect.any(String),
      pregunta: expect.any(String),
      resumen: expect.any(String),
      categoriaNombre: 'Pensionados',
      etiquetas: ['pensión'],
      normas: ['Norma 1'],
      precio: 30000,
      vigenteA: expect.any(String),
    });
  });

  it('CA2: sin acceso la respuesta no viaja en la respuesta HTTP', async () => {
    for (const token of [undefined, CLIENTE]) {
      const r = await e.pedir('/fichas/paga', { token });
      const cuerpo = await r.text();
      expect(cuerpo).not.toContain(SECRETO);
      expect(JSON.parse(cuerpo)).toMatchObject({ tieneAcceso: false });
      expect(JSON.parse(cuerpo)).not.toHaveProperty('respuestaHtml');
    }
  });

  it('CA4: una ficha gratuita se ve completa con sesión, no sin ella', async () => {
    expect((await e.json('/fichas/gratis')).datos.respuestaHtml).toBeUndefined();
    const r = await e.json('/fichas/gratis', { token: CLIENTE });
    expect(r.datos).toMatchObject({ tieneAcceso: true, respuestaHtml: '<p>libre</p>' });
  });

  it('el personal ve la respuesta y los borradores; los clientes no ven borradores', async () => {
    expect((await e.json('/fichas/paga', { token: ADMIN })).datos.respuestaHtml).toContain(SECRETO);
    expect((await e.json('/fichas/borrador', { token: CLIENTE })).estado).toBe(404);
    expect((await e.json('/fichas/borrador', { token: ADMIN })).estado).toBe(200);
    expect((await e.json('/fichas/no-existe')).estado).toBe(404);
  });

  it('CA5: hasta tres fichas relacionadas de la misma categoría, sin incluirse a sí misma', async () => {
    const rel = (await e.json('/fichas/paga')).datos.relacionadas as {
      id: string;
      categoriaId: string;
    }[];
    expect(rel).toHaveLength(3);
    expect(rel.every((f) => f.categoriaId === 'pensionados' && f.id !== 'paga')).toBe(true);
    expect(rel.map((f) => f.id)).not.toContain('borrador');
  });
});
