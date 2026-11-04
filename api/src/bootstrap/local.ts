import { serve } from '@hono/node-server';
import { crearApp } from '../adapters/http/app.js';
import { verificadorDev } from '../adapters/local/token-dev.js';

/** Desarrollo local: misma app que en Lambda, con DynamoDB emulado y tokens de desarrollo. */
const puerto = Number(process.env.PUERTO ?? 3001);
const app = crearApp({ verificador: verificadorDev });

serve({ fetch: app.fetch, port: puerto, hostname: '127.0.0.1' }, () =>
  console.log(`API local en http://127.0.0.1:${puerto}/api`),
);
