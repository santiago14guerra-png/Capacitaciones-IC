import { Hono } from 'hono';
import type { Contexto } from '../../../application/contexto.js';
import {
  crearFicha,
  despublicarFicha,
  editarFicha,
  eliminarFicha,
  listarFichasAdmin,
  obtenerFichaAdmin,
} from '../../../application/fichas-admin.js';
import type { Entorno } from '../app.js';
import { cuerpoJson } from '../cuerpo.js';

/** Se montan bajo /admin/fichas, ya protegidas por soloPersonal. */
export const rutasFichasAdmin = (ctx: Contexto) =>
  new Hono<Entorno>()
    .get('/', async (c) => c.json(await listarFichasAdmin(ctx, c.req.query())))
    .post('/', async (c) => c.json(await crearFicha(ctx, c.var.actor!, await cuerpoJson(c)), 201))
    .get('/:id', async (c) => c.json(await obtenerFichaAdmin(ctx, c.req.param('id'))))
    .put('/:id', async (c) =>
      c.json(await editarFicha(ctx, c.req.param('id'), await cuerpoJson(c))),
    )
    .post('/:id/despublicar', async (c) => c.json(await despublicarFicha(ctx, c.req.param('id'))))
    .delete('/:id', async (c) => {
      await eliminarFicha(ctx, c.req.param('id'));
      return c.body(null, 204);
    });
