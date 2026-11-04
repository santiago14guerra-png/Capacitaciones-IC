import type { SesionDto } from '@ic/shared';
import { exigirSesion, type Actor } from '../domain/actor.js';
import type { Contexto } from './contexto.js';

/** HU-03 CA1: quién inició sesión, sus grupos y su perfil (para mostrar su nombre). */
export async function obtenerSesion(ctx: Contexto, a: Actor | null): Promise<SesionDto> {
  const actor = exigirSesion(a);
  const perfil = await ctx.perfiles.obtener(actor.sub);
  return {
    sub: actor.sub,
    correo: perfil?.correo ?? (await ctx.directorio.correo(actor)),
    grupos: actor.grupos,
    perfil,
  };
}
