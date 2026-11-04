import { handle } from 'hono/aws-lambda';
import { crearAlmacenS3 } from '../adapters/aws/almacen-s3.js';
import { crearDirectorioCognito } from '../adapters/aws/directorio-cognito.js';
import { crearVerificadorCognito } from '../adapters/aws/verificador-cognito.js';
import { Tabla } from '../adapters/dynamodb/tabla.js';
import { crearApp } from '../adapters/http/app.js';
import { configNegocio } from '../domain/negocio.js';
import { componer } from './componer.js';

/** Composición para AWS. Nunca importa adaptadores locales (token sin firma, emulador). */
const requerida = (nombre: string) => {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
};

const userPoolId = requerida('USER_POOL_ID');
const ctx = componer({
  tabla: new Tabla(requerida('TABLA')),
  directorio: crearDirectorioCognito(userPoolId),
  archivos: crearAlmacenS3(requerida('BUCKET_ARCHIVOS')),
  negocio: configNegocio(process.env),
});

const app = crearApp({
  ...ctx,
  verificador: crearVerificadorCognito(userPoolId, requerida('CLIENT_ID')),
});

export const handler = handle(app);
