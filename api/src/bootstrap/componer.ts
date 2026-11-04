import { randomUUID } from 'node:crypto';
import type { Contexto } from '../application/contexto.js';
import type { Almacen, DirectorioUsuarios, Reloj } from '../application/puertos.js';
import { RepoBusquedasDynamo } from '../adapters/dynamodb/repo-busquedas.js';
import { ContadoresDynamo, RepoComprasDynamo } from '../adapters/dynamodb/repo-compras.js';
import { RepoConsultasDynamo } from '../adapters/dynamodb/repo-consultas.js';
import { RepoCategoriasDynamo } from '../adapters/dynamodb/repo-categorias.js';
import { RepoFichasDynamo } from '../adapters/dynamodb/repo-fichas.js';
import { RepoPerfilesDynamo } from '../adapters/dynamodb/repo-perfiles.js';
import type { Tabla } from '../adapters/dynamodb/tabla.js';
import { configNegocio, type ConfigNegocio } from '../domain/negocio.js';

export interface Piezas {
  tabla: Tabla;
  directorio: DirectorioUsuarios;
  archivos: Almacen;
  reloj?: Reloj;
  negocio?: ConfigNegocio;
}

/** Arma el contexto con los adaptadores de DynamoDB. Lo comparten Lambda, local y pruebas. */
export function componer({
  tabla,
  directorio,
  archivos,
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
    consultas: new RepoConsultasDynamo(tabla),
    contadores: new ContadoresDynamo(tabla),
    archivos,
    negocio,
  };
}
