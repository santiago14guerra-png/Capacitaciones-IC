import {
  CLASIFICACIONES,
  ESTADOS_CONSULTA,
  esquemaGestionConsulta,
  LIMITES,
  textoDeHtml,
  type ConsultaAdminDto,
} from '@ic/shared';
import type { Actor } from '../domain/actor.js';
import { erroresGestion, estaAtrasada, type Consulta } from '../domain/consulta.js';
import { conflicto, noEncontrado, validacion } from '../domain/errores.js';
import { sanearHtml } from '../domain/html.js';
import { aConsultaDto } from './consultas.js';
import type { Contexto } from './contexto.js';

export async function aConsultaAdmin(ctx: Contexto, c: Consulta): Promise<ConsultaAdminDto> {
  return {
    ...(await aConsultaDto(ctx, c)),
    clienteNombre: c.clienteNombre,
    clienteCorreo: c.clienteCorreo,
    atrasada: estaAtrasada(c, ctx.reloj.ahora(), LIMITES.horasAlertaConsulta),
    fichaId: c.fichaId,
  };
}

export interface FiltroConsultas {
  estado?: string;
  categoria?: string;
  clasificacion?: string;
  /** `atrasadas` (más de 48 h sin responder) o número de días mínimo desde la recepción. */
  antiguedad?: string;
}

/** HU-16: bandeja con filtro por estado, categoría y antigüedad; primero las atrasadas. */
export async function bandejaConsultas(
  ctx: Contexto,
  f: FiltroConsultas,
): Promise<ConsultaAdminDto[]> {
  const ahora = ctx.reloj.ahora();
  const dias = Number(f.antiguedad);
  const lista = (await ctx.consultas.listarTodas())
    .filter(
      (c) =>
        !f.estado ||
        !(ESTADOS_CONSULTA as readonly string[]).includes(f.estado) ||
        c.estado === f.estado,
    )
    .filter((c) => !f.categoria || c.categoriaId === f.categoria)
    .filter(
      (c) =>
        !f.clasificacion ||
        !(CLASIFICACIONES as readonly string[]).includes(f.clasificacion) ||
        c.clasificacion === f.clasificacion,
    )
    .filter((c) => {
      if (f.antiguedad === 'atrasadas') return estaAtrasada(c, ahora, LIMITES.horasAlertaConsulta);
      if (dias > 0) return ahora.getTime() - new Date(c.recibidaEn).getTime() >= dias * 86_400_000;
      return true;
    });
  const dtos = await Promise.all(lista.map((c) => aConsultaAdmin(ctx, c)));
  return dtos.sort(
    (a, b) => Number(b.atrasada) - Number(a.atrasada) || a.recibidaEn.localeCompare(b.recibidaEn),
  );
}

async function exigir(ctx: Contexto, id: string) {
  const c = await ctx.consultas.obtener(id);
  if (!c) throw noEncontrado('La consulta no existe');
  return c;
}

export const consultaAdmin = async (ctx: Contexto, id: string) =>
  aConsultaAdmin(ctx, await exigir(ctx, id));

/** HU-16: cambia estado, clasificación, respuesta o condiciones de la asesoría. */
export async function gestionarConsulta(
  ctx: Contexto,
  actor: Actor,
  id: string,
  cuerpo: unknown,
): Promise<{ consulta: ConsultaAdminDto; previa: Consulta; nueva: Consulta }> {
  const previa = await exigir(ctx, id);
  const d = esquemaGestionConsulta.parse(cuerpo);
  const respuestaHtml =
    d.respuestaHtml !== undefined ? sanearHtml(d.respuestaHtml) : previa.respuestaHtml;
  const errores = erroresGestion(previa, d, textoDeHtml(respuestaHtml ?? ''));
  if (Object.keys(errores).length) throw validacion('Revise los datos', errores);
  const ahora = ctx.reloj.ahora().toISOString();
  const respondida = d.estado === 'RESPONDIDA' || d.estado === 'ESCALADA';
  const nueva: Consulta = {
    ...previa,
    estado: d.estado,
    clasificacion: d.clasificacion ?? previa.clasificacion,
    respuestaHtml,
    condicionesAsesoria: d.condicionesAsesoria ?? previa.condicionesAsesoria,
    actualizadaEn: ahora,
    // Objetivo 1: se mide con la primera respuesta o escalamiento.
    respondidaEn: previa.respondidaEn ?? (respondida ? ahora : undefined),
    gestionadaPor: actor.sub,
  };
  if (!(await ctx.consultas.reemplazar(nueva, previa)))
    throw conflicto('Otra persona acaba de cambiar esta consulta. Recárguela.');
  return { consulta: await aConsultaAdmin(ctx, nueva), previa, nueva };
}
