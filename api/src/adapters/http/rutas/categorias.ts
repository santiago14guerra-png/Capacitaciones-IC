import { Hono } from 'hono';
import {
  cambiarEstadoCategoria,
  categoriasAdmin,
  categoriasPublicas,
  crearCategoria,
  ordenarCategoriasAdmin,
  reasignarFichas,
  renombrarCategoria,
} from '../../../application/categorias.js';
import type { Contexto } from '../../../application/contexto.js';
import type { Entorno } from '../app.js';
import { cuerpoJson } from '../cuerpo.js';

export const rutasCategorias = (ctx: Contexto) =>
  new Hono<Entorno>().get('/categorias', async (c) => c.json(await categoriasPublicas(ctx)));

/** Se montan bajo /admin, ya protegidas por soloPersonal. */
export const rutasCategoriasAdmin = (ctx: Contexto) =>
  new Hono<Entorno>()
    .get('/', async (c) => c.json(await categoriasAdmin(ctx)))
    .post('/', async (c) => c.json(await crearCategoria(ctx, await cuerpoJson(c)), 201))
    .put('/orden', async (c) => c.json(await ordenarCategoriasAdmin(ctx, await cuerpoJson(c))))
    .put('/:id', async (c) =>
      c.json(await renombrarCategoria(ctx, c.req.param('id'), await cuerpoJson(c))),
    )
    .post('/:id/activar', async (c) =>
      c.json(await cambiarEstadoCategoria(ctx, c.req.param('id'), true)),
    )
    .post('/:id/desactivar', async (c) =>
      c.json(await cambiarEstadoCategoria(ctx, c.req.param('id'), false)),
    )
    .post('/:id/reasignar', async (c) =>
      c.json(await reasignarFichas(ctx, c.req.param('id'), await cuerpoJson(c))),
    );
