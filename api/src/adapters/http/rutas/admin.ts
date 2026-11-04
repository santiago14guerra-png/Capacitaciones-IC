import { Hono } from 'hono';
import type { Contexto } from '../../../application/contexto.js';
import type { Entorno } from '../app.js';
import { exportarSiigo } from '../../../application/exportacion-siigo.js';
import { indicadores } from '../../../application/indicadores.js';
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
  admin.get('/exportaciones/siigo', async (c) => {
    const { nombre, contenido } = await exportarSiigo(ctx, c.req.query());
    return c.body(contenido as Uint8Array<ArrayBuffer>, 200, {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="${nombre}"`,
    });
  });
  admin.get('/indicadores', async (c) => c.json(await indicadores(ctx, c.req.query())));
  return admin;
}
