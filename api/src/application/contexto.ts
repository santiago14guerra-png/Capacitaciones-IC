import type {
  DirectorioUsuarios,
  RepoBusquedas,
  RepoCategorias,
  RepoFichas,
  RepoPerfiles,
  Sistema,
} from './puertos.js';
import type { ConfigNegocio } from '../domain/negocio.js';

/** Todo lo que necesitan los casos de uso. Lo arma bootstrap/componer.ts. */
export interface Contexto extends Sistema {
  directorio: DirectorioUsuarios;
  perfiles: RepoPerfiles;
  categorias: RepoCategorias;
  fichas: RepoFichas;
  busquedas: RepoBusquedas;
  negocio: ConfigNegocio;
}
