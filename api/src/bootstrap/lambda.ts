import { handle } from 'hono/aws-lambda';
import { crearVerificadorCognito } from '../adapters/aws/verificador-cognito.js';
import { crearApp } from '../adapters/http/app.js';

/** Composición para AWS. Nunca importa adaptadores locales (token sin firma, emulador). */
const requerida = (nombre: string) => {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
};

const app = crearApp({
  verificador: crearVerificadorCognito(requerida('USER_POOL_ID'), requerida('CLIENT_ID')),
});

export const handler = handle(app);
