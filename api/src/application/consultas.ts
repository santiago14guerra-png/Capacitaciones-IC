import {
  esquemaArchivo,
  esquemaConsulta,
  EXTENSIONES,
  LIMITES,
  TIPOS_ARCHIVO,
  type ConsultaDto,
  type SubidaDto,
} from '@ic/shared';
import { esPersonal, exigirSesion, type Actor } from '../domain/actor.js';
import { formatoRadicado, type Consulta } from '../domain/consulta.js';
import { noEncontrado, validacion } from '../domain/errores.js';
import { nombreCompleto } from '../domain/perfil.js';
import type { Contexto } from './contexto.js';

const prefijoAdjunto = (sub: string) => `consultas/${sub}/`;

export async function aConsultaDto(ctx: Contexto, c: Consulta): Promise<ConsultaDto> {
  const categoria = await ctx.categorias.obtener(c.categoriaId);
  return {
    id: c.id,
    radicado: c.radicado,
    categoriaId: c.categoriaId,
    categoriaNombre: categoria?.nombre ?? '',
    asunto: c.asunto,
    descripcion: c.descripcion,
    estado: c.estado,
    clasificacion: c.clasificacion,
    respuestaHtml: c.respuestaHtml,
    condicionesAsesoria: c.condicionesAsesoria,
    tieneAdjunto: !!c.adjuntoLlave,
    recibidaEn: c.recibidaEn,
    respondidaEn: c.respondidaEn,
  };
}

/** HU-15: URL para el adjunto opcional (JPG, PNG o PDF de máximo 5 MB). */
export async function prepararAdjunto(
  ctx: Contexto,
  a: Actor | null,
  cuerpo: unknown,
): Promise<SubidaDto> {
  const actor = exigirSesion(a);
  const { tipo } = esquemaArchivo.parse(cuerpo);
  const llave = `${prefijoAdjunto(actor.sub)}${ctx.ids.nuevo()}.${EXTENSIONES[tipo]}`;
  return ctx.archivos.firmarSubida(llave, tipo, LIMITES.archivoMaxBytes);
}

/** HU-15: radica la consulta con número y fecha de recepción (objetivo 6: trazabilidad). */
export async function enviarConsulta(
  ctx: Contexto,
  a: Actor | null,
  cuerpo: unknown,
): Promise<ConsultaDto> {
  const actor = exigirSesion(a);
  const d = esquemaConsulta.parse(cuerpo);
  const categoria = await ctx.categorias.obtener(d.categoriaId);
  if (!categoria?.activa)
    throw validacion('Revise los datos', { categoriaId: 'Elija una categoría' });
  if (d.adjuntoLlave) {
    const info =
      d.adjuntoLlave.startsWith(prefijoAdjunto(actor.sub)) && !d.adjuntoLlave.includes('..')
        ? await ctx.archivos.info(d.adjuntoLlave)
        : null;
    if (
      !info ||
      info.tamano > LIMITES.archivoMaxBytes ||
      !(TIPOS_ARCHIVO as readonly string[]).includes(info.tipo)
    ) {
      throw validacion('No recibimos el adjunto. Súbalo de nuevo.', {
        adjuntoLlave: 'Adjunto inválido',
      });
    }
  }
  const perfil = await ctx.perfiles.obtener(actor.sub);
  if (!perfil)
    throw validacion('Complete sus datos antes de enviar la consulta', {
      perfil: 'Datos pendientes',
    });
  const ahora = ctx.reloj.ahora().toISOString();
  const consulta: Consulta = {
    id: ctx.ids.nuevo(),
    radicado: formatoRadicado(await ctx.contadores.siguiente('CONSULTA')),
    sub: actor.sub,
    clienteNombre: nombreCompleto(perfil),
    clienteCorreo: perfil.correo,
    categoriaId: d.categoriaId,
    asunto: d.asunto,
    descripcion: d.descripcion,
    adjuntoLlave: d.adjuntoLlave,
    estado: 'RECIBIDA',
    recibidaEn: ahora,
    actualizadaEn: ahora,
  };
  await ctx.consultas.guardar(consulta);
  return aConsultaDto(ctx, consulta);
}

/** La consulta, si es del usuario o si es personal; si no, 404. */
export async function exigirConsultaVisible(
  ctx: Contexto,
  a: Actor | null,
  id: string,
): Promise<Consulta> {
  const actor = exigirSesion(a);
  const c = await ctx.consultas.obtener(id);
  if (!c || (c.sub !== actor.sub && !esPersonal(actor)))
    throw noEncontrado('La consulta no existe');
  return c;
}

export async function urlAdjunto(ctx: Contexto, a: Actor | null, id: string) {
  const c = await exigirConsultaVisible(ctx, a, id);
  if (!c.adjuntoLlave) throw noEncontrado('La consulta no tiene adjunto');
  return { url: await ctx.archivos.firmarDescarga(c.adjuntoLlave) };
}
