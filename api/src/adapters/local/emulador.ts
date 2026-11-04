import { CreateTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { AddressInfo } from 'node:net';
import dynalite from 'dynalite';
import { definicionTabla } from '../dynamodb/esquema.js';
import { Tabla } from '../dynamodb/tabla.js';

/** DynamoDB en memoria para pruebas y desarrollo. Nunca se empaqueta en la Lambda. */
export async function iniciarEmulador(nombre = 'ic-local') {
  const servidor = dynalite({ createTableMs: 0, deleteTableMs: 0, updateTableMs: 0 });
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', () => ok()));
  const { port } = servidor.address() as AddressInfo;
  const config = {
    endpoint: `http://127.0.0.1:${port}`,
    region: 'us-east-1',
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
  };
  await new DynamoDBClient(config).send(new CreateTableCommand(definicionTabla(nombre)));
  return { tabla: new Tabla(nombre, config), cerrar: () => servidor.close() };
}
