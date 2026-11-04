import type { Actor } from '../domain/actor.js';
import type { Categoria } from '../domain/categoria.js';
import type { Ficha, FichaMeta } from '../domain/ficha.js';
import type { Perfil } from '../domain/perfil.js';
import type { EstadoFicha } from '@ic/shared';

/** Verifica un token y devuelve el actor; null si es inválido o venció. */
export interface VerificadorToken {
  verificar(token: string): Promise<Actor | null>;
}

/** Datos de la cuenta que guarda Cognito y no vienen en el token de acceso. */
export interface DirectorioUsuarios {
  correo(actor: Actor): Promise<string>;
}

export interface Reloj {
  ahora(): Date;
}

export interface Ids {
  nuevo(): string;
}

export interface Sistema {
  reloj: Reloj;
  ids: Ids;
}

export interface RepoPerfiles {
  obtener(sub: string): Promise<Perfil | null>;
  guardar(perfil: Perfil): Promise<void>;
}

export interface RepoCategorias {
  listar(): Promise<Categoria[]>;
  obtener(id: string): Promise<Categoria | null>;
  guardar(categoria: Categoria): Promise<void>;
}

export interface RepoFichas {
  listarPorEstado(estado: EstadoFicha): Promise<FichaMeta[]>;
  obtenerMeta(id: string): Promise<FichaMeta | null>;
  obtener(id: string): Promise<Ficha | null>;
  /** Guarda metadatos y contenido. */
  guardar(ficha: Ficha): Promise<void>;
  guardarMeta(meta: FichaMeta): Promise<void>;
  borrar(id: string): Promise<void>;
}
