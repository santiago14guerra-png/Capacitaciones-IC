import { randomUUID } from 'node:crypto';
import type { Contexto } from '../application/contexto.js';
import type { DirectorioUsuarios, Reloj } from '../application/puertos.js';
import { RepoBusquedasDynamo } from '../adapters/dynamodb/repo-busquedas.js';
import { ContadoresDynamo, RepoComprasDynamo } from '../adapters/dynamodb/repo-compras.js';
import { RepoCategoriasDynamo } from '../adapters/dynamodb/repo-categorias.js';
import { RepoFichasDynamo } from '../adapters/dynamodb/repo-fichas.js';
import { RepoPerfilesDynamo } from '../adapters/dynamodb/repo-perfiles.js';
import type { Tabla } from '../adapters/dynamodb/tabla.js';
import { configNegocio, type ConfigNegocio } from '../domain/negocio.js';

export interface Piezas {
  tabla: Tabla;
  directorio: DirectorioUsuarios;
  reloj?: Reloj;
  negocio?: ConfigNegocio;
}

/** Arma el contexto con los adaptadores de DynamoDB. Lo comparten Lambda, local y pruebas. */
export function componer({
  tabla,
  directorio,
  reloj = { ahora: () => new Date() },
  negocio = configNegocio(),
}: Piezas): Contexto {
  const ids = { nuevo: () => randomUUID() };
  return {
    reloj,
    directorio,
    ids,
    perfiles: new RepoPerfilesDynamo(tabla),
    categorias: new RepoCategoriasDynamo(tabla),
    fichas: new RepoFichasDynamo(tabla),
    busquedas: new RepoBusquedasDynamo(tabla, ids.nuevo),
    compras: new RepoComprasDynamo(tabla),
    contadores: new ContadoresDynamo(tabla),
    negocio,
  };
}
