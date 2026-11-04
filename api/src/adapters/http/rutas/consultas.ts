import { Hono } from 'hono';
import { enviarConsulta, prepararAdjunto, urlAdjunto } from '../../../application/consultas.js';
import type { Contexto } from '../../../application/contexto.js';
import type { Entorno } from '../app.js';
import { cuerpoJson } from '../cuerpo.js';

export const rutasConsultas = (ctx: Contexto) =>
  new Hono<Entorno>()
    .post('/consultas/adjunto/subida', async (c) =>
      c.json(await prepararAdjunto(ctx, c.var.actor, await cuerpoJson(c))),
    )
    .post('/consultas', async (c) =>
      c.json(await enviarConsulta(ctx, c.var.actor, await cuerpoJson(c)), 201),
    )
    .get('/consultas/:id/adjunto', async (c) =>
      c.json(await urlAdjunto(ctx, c.var.actor, c.req.param('id'))),
    );
