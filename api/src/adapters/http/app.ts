import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import type { Contexto } from '../../application/contexto.js';
import type { VerificadorToken } from '../../application/puertos.js';
import type { Actor } from '../../domain/actor.js';
import { ErrorDominio } from '../../domain/errores.js';
import { rutasSesion } from './rutas/sesion.js';

export type Entorno = { Variables: { actor: Actor | null } };

export interface Dependencias extends Contexto {
  verificador: VerificadorToken;
}

/** Misma app en Lambda, en local y en pruebas. `extras` monta rutas solo de desarrollo. */
export function crearApp(deps: Dependencias, extras?: (app: Hono<Entorno>) => void) {
  const app = new Hono<Entorno>().basePath('/api');

  app.use('*', async (c, next) => {
    const encabezado = c.req.header('authorization');
    const token = encabezado?.startsWith('Bearer ') ? encabezado.slice(7) : null;
    // Si llegó un token inválido o vencido, se trata como visitante; las rutas privadas responden 401.
    c.set('actor', token ? await deps.verificador.verificar(token) : null);
    await next();
    c.header('Cache-Control', 'no-store');
  });

  app.get('/salud', (c) => c.json({ estado: 'ok' }));
  app.route('/', rutasSesion(deps));
  extras?.(app);

  app.notFound((c) => c.json({ error: 'NO_ENCONTRADO', mensaje: 'Ruta no encontrada' }, 404));
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
