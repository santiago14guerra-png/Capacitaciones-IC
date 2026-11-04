import type { CompraDto } from '@ic/shared';
import { esPersonal, exigirSesion, type Actor } from '../domain/actor.js';
import { formatoReferencia, idCompra, partesIdCompra, type Compra } from '../domain/compra.js';
import { conflicto, noEncontrado, validacion } from '../domain/errores.js';
import { nombreCompleto } from '../domain/perfil.js';
import type { Contexto } from './contexto.js';

export function aCompraDto(ctx: Contexto, c: Compra): CompraDto {
  return {
    id: idCompra(c),
    referencia: c.referencia,
    fichaId: c.fichaId,
    fichaTitulo: c.fichaTitulo,
    valor: c.valor,
    estado: c.estado,
    motivoRechazo: c.motivoRechazo,
    tieneComprobante: !!c.comprobanteLlave,
    creadaEn: c.creadaEn,
    actualizadaEn: c.actualizadaEn,
    aprobadaEn: c.aprobadaEn,
    // HU-11: datos para transferir mientras el pago no esté aprobado.
    ...(c.estado !== 'APROBADA' ? { datosBancarios: ctx.negocio.banco } : {}),
  };
}

/** La compra del usuario autenticado; el id de otra persona responde 404, no 403. */
export async function exigirCompraPropia(
  ctx: Contexto,
  a: Actor | null,
  id: string,
): Promise<Compra> {
  const actor = exigirSesion(a);
  const partes = partesIdCompra(id);
  const compra =
    partes && partes.sub === actor.sub
      ? await ctx.compras.obtener(partes.sub, partes.fichaId)
      : null;
  if (!compra) throw noEncontrado('La compra no existe');
  return compra;
}

/**
 * HU-11: solicita la compra de una ficha. Genera una referencia única y queda
 * «Pendiente de pago». Si ya hay una compra en curso la devuelve; tras un rechazo
 * se puede volver a intentar con una referencia nueva.
 */
export async function solicitarCompra(
  ctx: Contexto,
  a: Actor | null,
  fichaId: string,
): Promise<CompraDto> {
  const actor = exigirSesion(a);
  if (esPersonal(actor)) throw conflicto('El personal ya tiene acceso a todas las fichas');
  const ficha = await ctx.fichas.obtenerMeta(fichaId);
  if (!ficha || ficha.estado !== 'PUBLICADA') throw noEncontrado('La respuesta no está disponible');
  if (!ficha.precio) throw conflicto('Esta respuesta es gratuita: solo necesita iniciar sesión');

  const previa = await ctx.compras.obtener(actor.sub, fichaId);
  if (previa?.estado === 'APROBADA') throw conflicto('Ya tiene acceso a esta respuesta');
  if (previa && previa.estado !== 'RECHAZADA') return aCompraDto(ctx, previa);

  const perfil = await ctx.perfiles.obtener(actor.sub);
  if (!perfil) {
    throw validacion('Complete sus datos de facturación antes de comprar', {
      perfil: 'Datos de facturación pendientes',
    });
  }
  const ahora = ctx.reloj.ahora().toISOString();
  const compra: Compra = {
    sub: actor.sub,
    fichaId,
    referencia: formatoReferencia(await ctx.contadores.siguiente('COMPRA')),
    fichaTitulo: ficha.titulo,
    valor: ficha.precio,
    estado: 'PENDIENTE_PAGO',
    clienteNombre: nombreCompleto(perfil),
    clienteCorreo: perfil.correo,
    creadaEn: ahora,
    actualizadaEn: ahora,
  };
  if (!(await ctx.compras.crear(compra))) {
    // Otra petición simultánea la creó primero: se devuelve esa.
    const ganadora = await ctx.compras.obtener(actor.sub, fichaId);
    if (!ganadora) throw conflicto('Intente de nuevo');
    return aCompraDto(ctx, ganadora);
  }
  return aCompraDto(ctx, compra);
}

export async function obtenerCompra(
  ctx: Contexto,
  a: Actor | null,
  id: string,
): Promise<CompraDto> {
  return aCompraDto(ctx, await exigirCompraPropia(ctx, a, id));
}
