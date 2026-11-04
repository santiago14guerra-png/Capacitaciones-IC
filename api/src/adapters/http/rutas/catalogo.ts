import type { ConfigPublicaDto } from '@ic/shared';
import { Hono } from 'hono';
import { buscarFichas } from '../../../application/busqueda.js';
import { catalogo } from '../../../application/catalogo.js';
import type { Contexto } from '../../../application/contexto.js';
import type { Entorno } from '../app.js';

export const rutasCatalogo = (ctx: Contexto) =>
  new Hono<Entorno>()
    .get('/config', (c) =>
      c.json<ConfigPublicaDto>({
        correo: ctx.negocio.contactoCorreo,
        whatsapp: ctx.negocio.contactoWhatsapp,
        tarifas: ctx.negocio.tarifas,
      }),
    )
    .get('/buscar', async (c) =>
      c.json(
        await buscarFichas(ctx, c.req.query('q') ?? '', {
          registrar: c.req.query('sugerencia') !== '1',
        }),
      ),
    )
    .get('/fichas', async (c) =>
      c.json(
        await catalogo(ctx, {
          categorias: c.req.queries('categoria') ?? [],
          orden: c.req.query('orden'),
          pagina: Number(c.req.query('pagina') ?? 1),
        }),
      ),
    );
