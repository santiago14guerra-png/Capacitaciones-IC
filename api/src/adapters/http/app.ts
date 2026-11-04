import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import type { VerificadorToken } from '../../application/puertos.js';
import type { Actor } from '../../domain/actor.js';
import { ErrorDominio } from '../../domain/errores.js';

export type Entorno = { Variables: { actor: Actor | null } };

export interface Dependencias {
  verificador: VerificadorToken;
}

export function crearApp({ verificador }: Dependencias) {
  const app = new Hono<Entorno>().basePath('/api');

  app.use('*', async (c, next) => {
    const encabezado = c.req.header('authorization');
    const token = encabezado?.startsWith('Bearer ') ? encabezado.slice(7) : null;
    c.set('actor', token ? await verificador.verificar(token) : null);
    // Si llegó un token inválido en una ruta pública, se trata como visitante.
    await next();
    c.header('Cache-Control', 'no-store');
  });

  app.get('/salud', (c) => c.json({ estado: 'ok' }));

  app.onError((e, c) => {
    if (e instanceof ErrorDominio) {
      return c.json({ error: e.codigo, mensaje: e.message, campos: e.campos }, e.estadoHttp as 400);
    }
    if (e instanceof ZodError) {
      const campos: Record<string, string> = {};
      for (const i of e.issues) campos[i.path.join('.')] ??= i.message;
      return c.json({ error: 'VALIDACION', mensaje: 'Revise los datos', campos }, 422);
    }
    if (e instanceof HTTPException) return e.getResponse();
    // El mensaje original puede contener datos; solo se registra el tipo y la ruta.
    console.error(JSON.stringify({ evento: 'error', tipo: e.name, ruta: c.req.path }));
    return c.json({ error: 'INTERNO', mensaje: 'Ocurrió un error. Intente de nuevo.' }, 500);
  });

  return app;
}
