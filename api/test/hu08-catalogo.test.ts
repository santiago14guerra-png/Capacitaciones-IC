import { beforeAll, describe, expect, it } from 'vitest';
import { invalidarCatalogo } from '../src/application/catalogo.js';
import { sembrarCategorias } from '../src/application/categorias.js';
import { prepararEntorno } from './entorno.js';
import { fichaDePrueba } from './fabricas.js';

const e = prepararEntorno();

beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  // 14 publicadas en renta, 2 en arrendamientos, más borrador y despublicada que no deben verse.
  for (let i = 0; i < 14; i++) {
    await e.ctx.fichas.guardar(
      fichaDePrueba({ categoriaId: 'declaracion-de-renta', precio: 1000 * (14 - i) }),
    );
  }
  await e.ctx.fichas.guardar(
    fichaDePrueba({ id: 'barata', categoriaId: 'arrendamientos', precio: 0 }),
  );
  await e.ctx.fichas.guardar(
    fichaDePrueba({ id: 'cara', categoriaId: 'arrendamientos', precio: 90000 }),
  );
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'borrador', estado: 'BORRADOR' }));
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'retirada', estado: 'DESPUBLICADA' }));
  invalidarCatalogo(e.ctx);
});

describe('HU-08 · catálogo por categoría', () => {
  it('CA1 y CA5: sin sesión muestra solo publicadas, sin la respuesta completa', async () => {
    const r = await e.json('/fichas?pagina=1');
    expect(r.estado).toBe(200);
    expect(r.datos.total).toBe(16);
    const ids = (await Promise.all([1, 2].map((p) => e.json(`/fichas?pagina=${p}`))))
      .flatMap((x) => x.datos.elementos)
      .map((f: { id: string }) => f.id);
    expect(ids).not.toContain('borrador');
    expect(ids).not.toContain('retirada');
    expect(Object.keys(r.datos.elementos[0]).sort()).toEqual(
      [
        'categoriaId',
        'categoriaNombre',
        'etiquetas',
        'id',
        'precio',
        'resumen',
        'titulo',
        'vigenteA',
      ].sort(),
    );
    expect(JSON.stringify(r.datos)).not.toContain('respuestaHtml');
  });

  it('CA3: 12 fichas por página', async () => {
    const p1 = (await e.json('/fichas')).datos;
    const p2 = (await e.json('/fichas?pagina=2')).datos;
    expect([p1.elementos.length, p2.elementos.length, p1.totalPaginas]).toEqual([12, 4, 2]);
    expect((await e.json('/fichas?pagina=99')).datos.pagina).toBe(2);
  });

  it('CA2: filtra por una o varias categorías', async () => {
    expect((await e.json('/fichas?categoria=arrendamientos')).datos.total).toBe(2);
    expect(
      (await e.json('/fichas?categoria=arrendamientos&categoria=declaracion-de-renta')).datos.total,
    ).toBe(16);
  });

  it('CA2: ordena por más recientes o por precio', async () => {
    const recientes = (await e.json('/fichas?categoria=arrendamientos')).datos.elementos.map(
      (f: { id: string }) => f.id,
    );
    expect(recientes).toEqual(['cara', 'barata']);
    const precio = (
      await e.json('/fichas?categoria=arrendamientos&orden=precio')
    ).datos.elementos.map((f: { id: string }) => f.id);
    expect(precio).toEqual(['barata', 'cara']);
  });

  it('CA4: un filtro sin resultados responde una página vacía', async () => {
    expect((await e.json('/fichas?categoria=pensionados')).datos).toEqual({
      elementos: [],
      pagina: 1,
      totalPaginas: 1,
      total: 0,
    });
  });

  it('expone el contacto como marcador mientras la empresa no lo entregue', async () => {
    const r = await e.json('/config');
    expect(r.datos.correo).toBe('[PENDIENTE: correo institucional]');
  });
});
