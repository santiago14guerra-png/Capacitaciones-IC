import { Hono } from 'hono';
import type { Contexto } from '../../../application/contexto.js';
import { obtenerSesion } from '../../../application/sesion.js';
import type { Entorno } from '../app.js';

export const rutasSesion = (ctx: Contexto) =>
  new Hono<Entorno>().get('/sesion', async (c) => c.json(await obtenerSesion(ctx, c.var.actor)));
