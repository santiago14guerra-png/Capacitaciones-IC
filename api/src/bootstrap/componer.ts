import { randomUUID } from 'node:crypto';
import type { Contexto } from '../application/contexto.js';
import type { DirectorioUsuarios, Reloj } from '../application/puertos.js';
import { RepoPerfilesDynamo } from '../adapters/dynamodb/repo-perfiles.js';
import type { Tabla } from '../adapters/dynamodb/tabla.js';

export interface Piezas {
  tabla: Tabla;
  directorio: DirectorioUsuarios;
  reloj?: Reloj;
}

/** Arma el contexto con los adaptadores de DynamoDB. Lo comparten Lambda, local y pruebas. */
export function componer({
  tabla,
  directorio,
  reloj = { ahora: () => new Date() },
}: Piezas): Contexto {
  return {
    reloj,
    directorio,
    ids: { nuevo: () => randomUUID() },
    perfiles: new RepoPerfilesDynamo(tabla),
  };
}
