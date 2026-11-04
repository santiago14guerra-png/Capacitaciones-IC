import type { Actor } from '../domain/actor.js';
import type { Perfil } from '../domain/perfil.js';

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
