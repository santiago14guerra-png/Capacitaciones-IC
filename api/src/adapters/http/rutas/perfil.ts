import { Hono } from 'hono';
import type { Contexto } from '../../../application/contexto.js';
import { guardarPerfil } from '../../../application/perfil.js';
import type { Entorno } from '../app.js';
import { cuerpoJson } from '../cuerpo.js';

export const rutasPerfil = (ctx: Contexto) =>
  new Hono<Entorno>().put('/perfil', async (c) =>
    c.json(await guardarPerfil(ctx, c.var.actor, await cuerpoJson(c))),
  );
