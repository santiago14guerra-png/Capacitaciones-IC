import { Hono } from 'hono';
import { urlAdjunto } from '../../../application/consultas.js';
import {
  bandejaConsultas,
  consultaAdmin,
  gestionarConsulta,
} from '../../../application/consultas-admin.js';
import type { Contexto } from '../../../application/contexto.js';
import type { Entorno } from '../app.js';
import { cuerpoJson } from '../cuerpo.js';

/** Bajo /admin/consultas, protegidas por soloPersonal. */
export const rutasConsultasAdmin = (ctx: Contexto) =>
  new Hono<Entorno>()
    .get('/', async (c) => c.json(await bandejaConsultas(ctx, c.req.query())))
    .get('/:id', async (c) => c.json(await consultaAdmin(ctx, c.req.param('id'))))
    .put('/:id', async (c) =>
      c.json(
        (await gestionarConsulta(ctx, c.var.actor!, c.req.param('id'), await cuerpoJson(c)))
          .consulta,
      ),
    )
    .get('/:id/adjunto', async (c) =>
      c.json(await urlAdjunto(ctx, c.var.actor, c.req.param('id'))),
    );
