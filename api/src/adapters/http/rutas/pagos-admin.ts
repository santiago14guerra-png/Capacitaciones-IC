import { Hono } from 'hono';
import { urlComprobante } from '../../../application/comprobantes.js';
import type { Contexto } from '../../../application/contexto.js';
import { bandejaPagos, decidirPago } from '../../../application/pagos.js';
import type { Entorno } from '../app.js';
import { cuerpoJson } from '../cuerpo.js';

/** Bajo /admin/pagos, protegidas por soloPersonal. */
export const rutasPagosAdmin = (ctx: Contexto) =>
  new Hono<Entorno>()
    .get('/', async (c) => c.json(await bandejaPagos(ctx, c.req.query('estado'))))
    .post('/:id/decision', async (c) =>
      c.json(await decidirPago(ctx, c.var.actor!, c.req.param('id'), await cuerpoJson(c))),
    )
    .get('/:id/comprobante', async (c) =>
      c.json(await urlComprobante(ctx, c.var.actor, c.req.param('id'))),
    );
