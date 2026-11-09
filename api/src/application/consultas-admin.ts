import {
  CLASIFICACIONES,
  ESTADOS_CONSULTA,
  esquemaGestionConsulta,
  LIMITES,
  textoDeHtml,
  type ConsultaAdminDto,
} from '@ic/shared';
import type { FichaAdminDto } from '@ic/shared';
import type { Actor } from '../domain/actor.js';
import { anonimizar } from '../domain/anonimizar.js';
import type { Ficha } from '../domain/ficha.js';
import { erroresGestion, estaAtrasada, type Consulta } from '../domain/consulta.js';
import { conflicto, noEncontrado, validacion } from '../domain/errores.js';
import { sanearHtml } from '../domain/html.js';
import { correoConsultaRespondida } from '../domain/correos.js';
import { avisar } from './avisos.js';
import { invalidarCatalogo } from './catalogo.js';
import { aFichaAdmin } from './fichas-admin.js';
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
  // HU-18: avisa al responder o escalar (no al guardar de nuevo en el mismo estado).
  if (respondida && nueva.estado !== previa.estado) {
    await avisar(
      ctx,
      correoConsultaRespondida(
        nueva.clienteCorreo,
        nueva.radicado,
        ctx.sitioUrl,
        nueva.id,
        nueva.estado === 'ESCALADA',
      ),
    );
  }
  return { consulta: await aConsultaAdmin(ctx, nueva), previa, nueva };
}

/**
 * HU-20: convierte la respuesta de una consulta en una ficha BORRADOR, anonimizando los
 * datos del cliente. Nunca se publica sola: el director la revisa, completa resumen y
 * precio y la publica desde el panel. Una consulta genera una sola ficha.
 */
export async function convertirEnFicha(
  ctx: Contexto,
  actor: Actor,
  id: string,
): Promise<FichaAdminDto> {
  const c = await exigir(ctx, id);
  if (c.fichaId) throw conflicto('Esta consulta ya se convirtió en ficha');
  if (
    !c.respuestaHtml ||
    !textoDeHtml(c.respuestaHtml) ||
    (c.estado !== 'RESPONDIDA' && c.estado !== 'CERRADA')
  ) {
    throw conflicto('Solo se convierten consultas respondidas');
  }
  const perfil = (await ctx.perfiles.obtener(c.sub)) ?? {
    correo: c.clienteCorreo,
    nombres: c.clienteNombre,
  };
  const limpio = (t: string) => anonimizar(t, perfil);
  const categoria = await ctx.categorias.obtener(c.categoriaId);
  const ahora = ctx.reloj.ahora().toISOString();
  const ficha: Ficha = {
    id: ctx.ids.nuevo(),
    titulo: limpio(c.asunto).slice(0, LIMITES.tituloMax),
    pregunta: limpio(c.descripcion),
    resumen: '',
    respuestaHtml: sanearHtml(limpio(c.respuestaHtml)),
    categoriaId: categoria?.activa ? categoria.id : '',
    etiquetas: [],
    normas: [],
    precio: null,
    estado: 'BORRADOR',
    publicadaAlgunaVez: false,
    autor: actor.sub,
    creadaEn: ahora,
    actualizadaEn: ahora,
    origenConsultaId: c.id,
  };
  // Primero se marca la consulta (condicional): si otra persona ya la convirtió, no se duplica.
  if (!(await ctx.consultas.reemplazar({ ...c, fichaId: ficha.id, actualizadaEn: ahora }, c))) {
    throw conflicto('La consulta cambió. Recárguela e intente de nuevo.');
  }
  await ctx.fichas.guardar(ficha);
  invalidarCatalogo(ctx);
  return aFichaAdmin(ficha);
}
