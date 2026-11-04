import type { Actor } from '../domain/actor.js';

/** Verifica un token y devuelve el actor; null si es inválido o venció. */
export interface VerificadorToken {
  verificar(token: string): Promise<Actor | null>;
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
