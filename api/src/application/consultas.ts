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
import { exigirCuotaSubidas } from './subidas.js';

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
  await exigirCuotaSubidas(ctx, actor.sub);
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
  let adjuntoVersion: string | undefined;
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
    adjuntoVersion = info.version;
  }
  const perfil = await ctx.perfiles.obtener(actor.sub);
  if (!perfil)
    throw validacion('Complete sus datos antes de enviar la consulta', {
      perfil: 'Datos pendientes',
    });
  // Doble envío (doble clic, reintento de red): si la misma consulta llegó hace menos de dos
  // minutos, se devuelve la ya radicada en lugar de crear otra.
  const hace = ctx.reloj.ahora().getTime() - 2 * 60_000;
  const repetida = (await ctx.consultas.listarDeUsuario(actor.sub)).find(
    (c) =>
      c.asunto === d.asunto &&
      c.descripcion === d.descripcion &&
      c.categoriaId === d.categoriaId &&
      c.adjuntoLlave === d.adjuntoLlave &&
      new Date(c.recibidaEn).getTime() >= hace,
  );
  if (repetida) return aConsultaDto(ctx, repetida);
  if (d.adjuntoLlave) await ctx.archivos.conservar(d.adjuntoLlave, adjuntoVersion);
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
    adjuntoVersion,
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
  return { url: await ctx.archivos.firmarDescarga(c.adjuntoLlave, c.adjuntoVersion) };
}

/**
 * HU-17: lo que ve el cliente. La respuesta solo cuando la consulta está respondida o
 * cerrada, y las condiciones solo si se escaló: nunca un borrador del director.
 */
async function aConsultaCliente(ctx: Contexto, c: Consulta): Promise<ConsultaDto> {
  const dto = await aConsultaDto(ctx, c);
  const abierta = c.estado === 'RECIBIDA' || c.estado === 'EN_ANALISIS';
  return {
    ...dto,
    respuestaHtml: abierta ? undefined : dto.respuestaHtml,
    condicionesAsesoria: abierta ? undefined : dto.condicionesAsesoria,
  };
}

export async function misConsultas(ctx: Contexto, a: Actor | null): Promise<ConsultaDto[]> {
  const actor = exigirSesion(a);
  const lista = await ctx.consultas.listarDeUsuario(actor.sub);
  const dtos = await Promise.all(lista.map((c) => aConsultaCliente(ctx, c)));
  return dtos.sort((x, y) => y.recibidaEn.localeCompare(x.recibidaEn));
}

export async function miConsulta(ctx: Contexto, a: Actor | null, id: string): Promise<ConsultaDto> {
  const actor = exigirSesion(a);
  const c = await ctx.consultas.obtener(id);
  if (!c || c.sub !== actor.sub) throw noEncontrado('La consulta no existe');
  return aConsultaCliente(ctx, c);
}
