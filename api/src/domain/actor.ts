import { GRUPOS, type Grupo } from '@ic/shared';
import { ErrorDominio, prohibido } from './errores.js';

/** Usuario autenticado. Los grupos vienen del token ya verificado. */
export interface Actor {
  sub: string;
  /** Nombre de usuario en Cognito (un UUID). El correo se obtiene con DirectorioUsuarios. */
  usuario: string;
  grupos: Grupo[];
}

export const esPersonal = (a?: Actor | null) =>
  !!a && (a.grupos.includes(GRUPOS.administrador) || a.grupos.includes(GRUPOS.director));

export function exigirSesion(a: Actor | null | undefined): Actor {
  if (!a) throw new ErrorDominio('NO_AUTENTICADO', 'Debe iniciar sesión');
  return a;
}

export function exigirGrupo(a: Actor | null | undefined, ...grupos: Grupo[]): Actor {
  const actor = exigirSesion(a);
  if (!actor.grupos.some((g) => grupos.includes(g))) throw prohibido();
  return actor;
}

export const exigirPersonal = (a: Actor | null | undefined) =>
  exigirGrupo(a, GRUPOS.administrador, GRUPOS.director);
