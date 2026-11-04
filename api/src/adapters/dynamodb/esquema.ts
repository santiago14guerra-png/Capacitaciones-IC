import type { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';

/** Misma definición que crea CDK; se usa en pruebas y en desarrollo local. */
export const definicionTabla = (TableName: string): CreateTableCommandInput => ({
  TableName,
  BillingMode: 'PAY_PER_REQUEST',
  KeySchema: [
    { AttributeName: 'pk', KeyType: 'HASH' },
    { AttributeName: 'sk', KeyType: 'RANGE' },
  ],
  AttributeDefinitions: ['pk', 'sk', 'gsi1pk', 'gsi1sk', 'gsi2pk', 'gsi2sk'].map((n) => ({
    AttributeName: n,
    AttributeType: 'S' as const,
  })),
  GlobalSecondaryIndexes: ['gsi1', 'gsi2'].map((n) => ({
    IndexName: n,
    KeySchema: [
      { AttributeName: `${n}pk`, KeyType: 'HASH' as const },
      { AttributeName: `${n}sk`, KeyType: 'RANGE' as const },
    ],
    Projection: { ProjectionType: 'ALL' as const },
  })),
});
