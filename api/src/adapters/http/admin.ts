import { createMiddleware } from 'hono/factory';
import { exigirPersonal } from '../../domain/actor.js';
import type { Entorno } from './app.js';

/**
 * HU-04 CA2 y CA4: toda ruta /admin exige grupo administrador o director (verificado en el
 * servidor) y deja en CloudWatch quién hizo qué y cuándo, sin datos personales del cliente.
 */
export const soloPersonal = (ahora: () => Date) =>
  createMiddleware<Entorno>(async (c, next) => {
    const actor = exigirPersonal(c.var.actor);
    await next();
    console.log(
      JSON.stringify({
        evento: 'accion-admin',
        usuario: actor.sub,
        grupos: actor.grupos,
        metodo: c.req.method,
        ruta: c.req.path,
        estado: c.res.status,
        fecha: ahora().toISOString(),
      }),
    );
  });
