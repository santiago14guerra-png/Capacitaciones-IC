import type {
  Notificador,
  RepoConsultas,
  Almacen,
  Contadores,
  Cuotas,
  Cupo,
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
  cuotas: Cuotas;
  /** Limita cuántas búsquedas anónimas se escriben por minuto. */
  cupoBusquedas: Cupo;
  archivos: Almacen;
  notificador: Notificador;
  /** URL pública del sitio, para los enlaces de los correos. */
  sitioUrl: string;
  negocio: ConfigNegocio;
}
