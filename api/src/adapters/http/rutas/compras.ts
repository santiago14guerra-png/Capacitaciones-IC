import { Hono } from 'hono';
import {
  confirmarComprobante,
  prepararComprobante,
  urlComprobante,
} from '../../../application/comprobantes.js';
import { misCompras, obtenerCompra, solicitarCompra } from '../../../application/compras.js';
import type { Contexto } from '../../../application/contexto.js';
import type { Entorno } from '../app.js';
import { cuerpoJson } from '../cuerpo.js';

export const rutasCompras = (ctx: Contexto) =>
  new Hono<Entorno>()
    .post('/fichas/:id/compra', async (c) =>
      c.json(await solicitarCompra(ctx, c.var.actor, c.req.param('id')), 201),
    )
    .get('/compras', async (c) => c.json(await misCompras(ctx, c.var.actor)))
    .get('/compras/:id', async (c) =>
      c.json(await obtenerCompra(ctx, c.var.actor, c.req.param('id'))),
    )
    .post('/compras/:id/comprobante/subida', async (c) =>
      c.json(await prepararComprobante(ctx, c.var.actor, c.req.param('id'), await cuerpoJson(c))),
    )
    .post('/compras/:id/comprobante', async (c) =>
      c.json(await confirmarComprobante(ctx, c.var.actor, c.req.param('id'), await cuerpoJson(c))),
    )
    .get('/compras/:id/comprobante', async (c) =>
      c.json(await urlComprobante(ctx, c.var.actor, c.req.param('id'))),
    );
