import { Hono } from 'hono';
import type { Contexto } from '../../../application/contexto.js';
import { crearFicha, obtenerFichaAdmin } from '../../../application/fichas-admin.js';
import type { Entorno } from '../app.js';
import { cuerpoJson } from '../cuerpo.js';

/** Se montan bajo /admin/fichas, ya protegidas por soloPersonal. */
export const rutasFichasAdmin = (ctx: Contexto) =>
  new Hono<Entorno>()
    .post('/', async (c) => c.json(await crearFicha(ctx, c.var.actor!, await cuerpoJson(c)), 201))
    .get('/:id', async (c) => c.json(await obtenerFichaAdmin(ctx, c.req.param('id'))));
