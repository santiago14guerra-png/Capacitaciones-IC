import type {
  DirectorioUsuarios,
  RepoCategorias,
  RepoFichas,
  RepoPerfiles,
  Sistema,
} from './puertos.js';

/** Todo lo que necesitan los casos de uso. Lo arma bootstrap/componer.ts. */
export interface Contexto extends Sistema {
  directorio: DirectorioUsuarios;
  perfiles: RepoPerfiles;
  categorias: RepoCategorias;
  fichas: RepoFichas;
}
