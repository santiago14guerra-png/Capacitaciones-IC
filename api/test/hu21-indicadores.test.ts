import { beforeAll, describe, expect, it } from 'vitest';
import { invalidarCatalogo } from '../src/application/catalogo.js';
import { sembrarCategorias } from '../src/application/categorias.js';
import { ADMIN, CLIENTE, DIRECTOR, prepararEntorno } from './entorno.js';
import { fichaDePrueba } from './fabricas.js';
import { compraEnVerificacion } from './flujo-compra.js';

const e = prepararEntorno();
beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'f1', precio: 25000 }));
  invalidarCatalogo(e.ctx);
  await compraEnVerificacion(e, CLIENTE, 'f1');
  await e.json('/admin/pagos/ana.f1/decision', { token: ADMIN, cuerpo: { decision: 'APROBAR' } });
  const id = (
    await e.json('/consultas', {
      token: CLIENTE,
      cuerpo: { categoriaId: 'pensionados', asunto: 'A', descripcion: 'B' },
    })
  ).datos.id;
  e.reloj.avanzar(6);
  await e.json(`/admin/consultas/${id}`, {
    metodo: 'PUT',
    token: DIRECTOR,
    cuerpo: { estado: 'RESPONDIDA', clasificacion: 'CONSULTA_RAPIDA', respuestaHtml: '<p>R</p>' },
  });
  await e.json('/buscar?q=herencia yacente');
});

describe('HU-21 · panel de indicadores', () => {
  it('reúne consultas por semana, tiempo de respuesta, temas, búsquedas sin resultado y ventas', async () => {
    const r = await e.json('/admin/indicadores?desde=2026-11-01&hasta=2026-11-30', {
      token: ADMIN,
    });
    expect(r.datos).toEqual({
      desde: '2026-11-01',
      hasta: '2026-11-30',
      consultasPorSemana: [{ semana: '2026-11-02', total: 1 }],
      tiempoRespuestaHoras: 6,
      temas: [{ categoria: 'Pensionados', total: 1 }],
      busquedasSinResultado: [{ termino: 'herencia yacente', veces: 1 }],
      ventas: { cantidad: 1, valor: 25000 },
      autoservicioPct: 50,
      cobroPct: 50,
    });
  });

  it('respeta el periodo y exige personal', async () => {
    const r = await e.json('/admin/indicadores?desde=2026-10-01&hasta=2026-10-31', {
      token: ADMIN,
    });
    expect(r.datos.ventas).toEqual({ cantidad: 0, valor: 0 });
    expect(
      (await e.json('/admin/indicadores?desde=2026-11-01&hasta=2026-11-30', { token: CLIENTE }))
        .estado,
    ).toBe(403);
  });
});
