import { DynamoDBClient, type DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  type QueryCommandInput,
  type UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';

export type Item = Record<string, unknown>;

/** Envoltura mínima sobre DynamoDB: una sola tabla y paginación resuelta. */
export class Tabla {
  private readonly doc: DynamoDBDocumentClient;

  constructor(
    readonly nombre: string,
    config: DynamoDBClientConfig = {},
  ) {
    this.doc = DynamoDBDocumentClient.from(new DynamoDBClient(config), {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  async obtener<T>(pk: string, sk: string): Promise<T | null> {
    const r = await this.doc.send(new GetCommand({ TableName: this.nombre, Key: { pk, sk } }));
    return (r.Item as T) ?? null;
  }

  async poner(
    item: Item,
    condicion?: string,
    valores?: Item,
    nombres?: Record<string, string>,
  ): Promise<void> {
    await this.doc.send(
      new PutCommand({
        TableName: this.nombre,
        Item: item,
        ConditionExpression: condicion,
        ExpressionAttributeValues: valores,
        ExpressionAttributeNames: nombres,
      }),
    );
  }

  async actualizar(
    pk: string,
    sk: string,
    entrada: Omit<UpdateCommandInput, 'TableName' | 'Key'>,
  ): Promise<Item> {
    const r = await this.doc.send(
      new UpdateCommand({
        TableName: this.nombre,
        Key: { pk, sk },
        ReturnValues: 'ALL_NEW',
        ...entrada,
      }),
    );
    return r.Attributes ?? {};
  }

  async borrar(pk: string, sk: string): Promise<void> {
    await this.doc.send(new DeleteCommand({ TableName: this.nombre, Key: { pk, sk } }));
  }

  async consultar<T>(entrada: Omit<QueryCommandInput, 'TableName'>): Promise<T[]> {
    const items: T[] = [];
    let ExclusiveStartKey: Item | undefined;
    do {
      const r = await this.doc.send(
        new QueryCommand({ TableName: this.nombre, ...entrada, ExclusiveStartKey }),
      );
      items.push(...((r.Items ?? []) as T[]));
      ExclusiveStartKey = r.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
  }

  consultarIndice<T>(
    indice: 'gsi1' | 'gsi2',
    pk: string,
    extra?: Omit<QueryCommandInput, 'TableName'>,
  ) {
    return this.consultar<T>({
      IndexName: indice,
      KeyConditionExpression: '#p = :p',
      ExpressionAttributeNames: { '#p': `${indice}pk` },
      ExpressionAttributeValues: { ':p': pk },
      ...extra,
    });
  }
}

export const esCondicionFallida = (e: unknown) =>
  (e as { name?: string })?.name === 'ConditionalCheckFailedException';
