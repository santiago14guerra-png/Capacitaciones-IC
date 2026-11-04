import {
  ESTADOS_COMPRA,
  esquemaDecisionPago,
  type CompraAdminDto,
  type EstadoCompra,
} from '@ic/shared';
import type { Actor } from '../domain/actor.js';
import { partesIdCompra, type Compra } from '../domain/compra.js';
import { conflicto, noEncontrado } from '../domain/errores.js';
import { correoPagoAprobado, correoPagoRechazado } from '../domain/correos.js';
import { avisar } from './avisos.js';
import { aCompraDto } from './compras.js';
import type { Contexto } from './contexto.js';

const aAdmin = (ctx: Contexto, c: Compra): CompraAdminDto => {
  const { datosBancarios: _, ...dto } = aCompraDto(ctx, c);
  return {
    ...dto,
    clienteNombre: c.clienteNombre,
    clienteCorreo: c.clienteCorreo,
    comprobanteSubidoEn: c.comprobanteSubidoEn,
    decididaPor: c.decididaPor,
    decididaEn: c.decididaEn,
  };
};

/** HU-13: bandeja de pagos. Por defecto, los que esperan verificación, del más antiguo al más nuevo. */
export async function bandejaPagos(ctx: Contexto, estadoCrudo?: string): Promise<CompraAdminDto[]> {
  const estado = (ESTADOS_COMPRA as readonly string[]).includes(estadoCrudo ?? '')
    ? (estadoCrudo as EstadoCompra)
    : 'EN_VERIFICACION';
  const compras = await ctx.compras.listarPorEstado(estado);
  const orden = estado === 'EN_VERIFICACION' ? 1 : -1;
  return compras
    .sort((a, b) => orden * a.actualizadaEn.localeCompare(b.actualizadaEn))
    .map((c) => aAdmin(ctx, c));
}

/**
 * HU-13: aprobar habilita el acceso de inmediato; rechazar exige un motivo que ve el cliente.
 * La escritura es condicional: dos personas no pueden decidir el mismo pago.
 */
export async function decidirPago(
  ctx: Contexto,
  actor: Actor,
  id: string,
  cuerpo: unknown,
): Promise<CompraAdminDto> {
  const d = esquemaDecisionPago.parse(cuerpo);
  const p = partesIdCompra(id);
  const compra = p ? await ctx.compras.obtener(p.sub, p.fichaId) : null;
  if (!compra) throw noEncontrado('El pago no existe');
  if (compra.estado !== 'EN_VERIFICACION')
    throw conflicto('Este pago ya fue decidido o aún no tiene comprobante');
  const ahora = ctx.reloj.ahora().toISOString();
  const nueva: Compra = {
    ...compra,
    actualizadaEn: ahora,
    decididaPor: actor.sub,
    decididaEn: ahora,
    ...(d.decision === 'APROBAR'
      ? { estado: 'APROBADA', aprobadaEn: ahora, motivoRechazo: undefined }
      : { estado: 'RECHAZADA', motivoRechazo: d.motivo }),
  };
  if (!(await ctx.compras.reemplazar(nueva, compra)))
    throw conflicto('Otra persona acaba de decidir este pago');
  // CA3: quién, cuándo y qué; la referencia identifica el pago sin datos del cliente.
  console.log(
    JSON.stringify({
      evento: 'decision-pago',
      usuario: actor.sub,
      referencia: compra.referencia,
      estado: nueva.estado,
      fecha: ahora,
    }),
  );
  // HU-18: aviso al cliente con un enlace a la plataforma.
  const correo = nueva.estado === 'APROBADA' ? correoPagoAprobado : correoPagoRechazado;
  await avisar(ctx, correo(compra.clienteCorreo, compra.referencia, ctx.sitioUrl, id));
  return aAdmin(ctx, nueva);
}
