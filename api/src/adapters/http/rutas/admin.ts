import { Hono } from 'hono';
import type { Contexto } from '../../../application/contexto.js';
import type { Entorno } from '../app.js';
import { soloPersonal } from '../admin.js';
import { rutasCategoriasAdmin } from './categorias.js';
import { rutasConsultasAdmin } from './consultas-admin.js';
import { rutasFichasAdmin } from './fichas-admin.js';
import { rutasPagosAdmin } from './pagos-admin.js';

/** Rutas del panel. Cada historia agrega las suyas con `admin.route(...)`. */
export function rutasAdmin(ctx: Contexto) {
  const admin = new Hono<Entorno>();
  admin.use('*', soloPersonal(ctx.reloj.ahora));
  admin.get('/yo', (c) => c.json({ sub: c.var.actor!.sub, grupos: c.var.actor!.grupos }));
  admin.route('/categorias', rutasCategoriasAdmin(ctx));
  admin.route('/fichas', rutasFichasAdmin(ctx));
  admin.route('/pagos', rutasPagosAdmin(ctx));
  admin.route('/consultas', rutasConsultasAdmin(ctx));
  return admin;
}
