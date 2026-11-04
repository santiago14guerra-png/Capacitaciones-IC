import { serve } from '@hono/node-server';
import { crearApp } from '../adapters/http/app.js';
import {
  CLAVE_DEV,
  CUENTAS_SEMILLA,
  crearAutenticacionDev,
} from '../adapters/local/autenticacion-dev.js';
import { iniciarEmulador } from '../adapters/local/emulador.js';
import { directorioDev, verificadorDev } from '../adapters/local/token-dev.js';
import { componer } from './componer.js';

/** Desarrollo local: misma app que en Lambda, con DynamoDB emulado y autenticación de desarrollo. */
const puerto = Number(process.env.PUERTO ?? 3001);
const { tabla } = await iniciarEmulador();
const ctx = componer({ tabla, directorio: directorioDev });

const app = crearApp({ ...ctx, verificador: verificadorDev }, (a) => {
  a.route('/dev/auth', crearAutenticacionDev());
});

serve({ fetch: app.fetch, port: puerto, hostname: '127.0.0.1' }, () => {
  console.log(`API local en http://127.0.0.1:${puerto}/api`);
  console.log(`Cuentas de prueba (clave ${CLAVE_DEV}):`);
  for (const c of CUENTAS_SEMILLA) console.log(`  ${c.correo.padEnd(26)} ${c.grupos.join(', ')}`);
});
