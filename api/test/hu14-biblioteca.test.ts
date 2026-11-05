import { beforeAll, describe, expect, it } from 'vitest';
import { sembrarCategorias } from '../src/application/categorias.js';
import { ADMIN, CLIENTE, OTRO_CLIENTE, prepararEntorno } from './entorno.js';
import { fichaDePrueba } from './fabricas.js';
import { compraEnVerificacion } from './flujo-compra.js';

const e = prepararEntorno();
beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.ctx.fichas.guardar(
    fichaDePrueba({ id: 'a', titulo: 'Aprobada', respuestaHtml: '<p>mía</p>' }),
  );
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'p', titulo: 'Pendiente' }));
  await compraEnVerificacion(e, CLIENTE, 'a');
  e.reloj.avanzar(1);
  await e.json('/admin/compras/ana.a', {
    metodo: 'PATCH',
    token: ADMIN,
    cuerpo: { decision: 'APROBAR' },
  });
  await compraEnVerificacion(e, CLIENTE, 'p');
});

describe('HU-14 · mi biblioteca', () => {
  it('lista las fichas aprobadas con fecha de compra y el estado de las pendientes', async () => {
    const r = await e.json('/mi/biblioteca', { token: CLIENTE });
    expect(
      r.datos.map((c: { fichaTitulo: string; estado: string }) => [c.fichaTitulo, c.estado]),
    ).toEqual([
      ['Pendiente', 'EN_VERIFICACION'],
      ['Aprobada', 'APROBADA'],
    ]);
    expect(r.datos[1].aprobadaEn).toBe(e.reloj.ahora().toISOString());
    expect(r.datos[0]).not.toHaveProperty('datosBancarios');
  });

  it('cada cliente ve solo sus compras', async () => {
    expect((await e.json('/mi/biblioteca', { token: OTRO_CLIENTE })).datos).toEqual([]);
    expect((await e.json('/mi/biblioteca')).estado).toBe(401);
  });

  it('una ficha despublicada sigue disponible para quien la compró, «En revisión»', async () => {
    await e.json('/admin/fichas/a/despublicar', { token: ADMIN, cuerpo: {} });
    const lista = (await e.json('/mi/biblioteca', { token: CLIENTE })).datos;
    expect(lista.find((c: { fichaId: string }) => c.fichaId === 'a').fichaEnRevision).toBe(true);
    const ficha = await e.json('/fichas/a', { token: CLIENTE });
    expect(ficha.datos).toMatchObject({
      tieneAcceso: true,
      enRevision: true,
      respuestaHtml: '<p>mía</p>',
    });
    expect((await e.json('/fichas/a', { token: OTRO_CLIENTE })).estado).toBe(404);
  });
});
