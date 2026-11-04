import type {
  RepoConsultas,
  Almacen,
  Contadores,
  RepoCompras,
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
  compras: RepoCompras;
  consultas: RepoConsultas;
  contadores: Contadores;
  archivos: Almacen;
  negocio: ConfigNegocio;
}
