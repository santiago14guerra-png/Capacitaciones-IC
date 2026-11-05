import {
  esquemaGuardarPerfil,
  esquemaPerfil,
  VERSION_POLITICA_DATOS,
  type PerfilDto,
} from '@ic/shared';
import { exigirSesion, type Actor } from '../domain/actor.js';
import type { Contexto } from './contexto.js';

/**
 * HU-02 CA6 y HU-23: guarda los datos de facturación del usuario autenticado.
 * La fecha de autorización (HU-02 CA4) se fija la primera vez y no cambia al editar.
 * El correo sale de Cognito, nunca del cuerpo de la petición.
 */
export async function guardarPerfil(
  ctx: Contexto,
  a: Actor | null,
  cuerpo: unknown,
): Promise<PerfilDto> {
  const actor = exigirSesion(a);
  const previo = await ctx.perfiles.obtener(actor.sub);
  // HU-23: al editar, la autorización ya consta; solo se exige al crear el perfil (HU-02 CA4).
  const datos = previo
    ? esquemaPerfil.parse(cuerpo)
    : (({ autorizaDatos: _, ...d }) => d)(esquemaGuardarPerfil.parse(cuerpo));
  const ahora = ctx.reloj.ahora().toISOString();
  const perfil: PerfilDto = {
    ...datos,
    sub: actor.sub,
    correo: previo?.correo ?? (await ctx.directorio.correo(actor)),
    autorizacionDatosEn: previo?.autorizacionDatosEn ?? ahora,
    versionPoliticaDatos: previo?.versionPoliticaDatos ?? VERSION_POLITICA_DATOS,
    actualizadoEn: ahora,
  };
  await ctx.perfiles.guardar(perfil);
  return perfil;
}
