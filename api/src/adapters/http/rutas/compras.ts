import { Hono } from 'hono';
import { obtenerCompra, solicitarCompra } from '../../../application/compras.js';
import type { Contexto } from '../../../application/contexto.js';
import type { Entorno } from '../app.js';

export const rutasCompras = (ctx: Contexto) =>
  new Hono<Entorno>()
    .post('/fichas/:id/compra', async (c) =>
      c.json(await solicitarCompra(ctx, c.var.actor, c.req.param('id')), 201),
    )
    .get('/compras/:id', async (c) =>
      c.json(await obtenerCompra(ctx, c.var.actor, c.req.param('id'))),
    );
