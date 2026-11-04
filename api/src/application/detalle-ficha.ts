import { LIMITES, type FichaDetalleDto } from '@ic/shared';
import { puedeVerFicha, tieneAcceso } from '../domain/acceso.js';
import type { Actor } from '../domain/actor.js';
import { idCompra } from '../domain/compra.js';
import { noEncontrado } from '../domain/errores.js';
import { aResumen, fichasPublicadas, masRecientes, nombresCategorias } from './catalogo.js';
import type { Contexto } from './contexto.js';

/**
 * HU-10: detalle de ficha. La respuesta completa solo se lee de la base y se incluye si el
 * usuario tiene acceso; en otro caso nunca sale del servidor (CA2).
 */
export async function detalleFicha(
  ctx: Contexto,
  actor: Actor | null,
  id: string,
): Promise<FichaDetalleDto> {
  const [meta, compra] = await Promise.all([
    ctx.fichas.obtenerMeta(id),
    actor ? ctx.compras.obtener(actor.sub, id) : Promise.resolve(null),
  ]);
  const compraAprobada = compra?.estado === 'APROBADA';
  if (!meta || !puedeVerFicha(actor, meta, compraAprobada))
    throw noEncontrado('La respuesta no existe o ya no está disponible');
  const acceso = tieneAcceso(actor, meta, compraAprobada);
  const [categorias, publicadas, completa] = await Promise.all([
    nombresCategorias(ctx),
    fichasPublicadas(ctx),
    acceso ? ctx.fichas.obtener(id) : Promise.resolve(null),
  ]);
  const relacionadas = publicadas
    .filter((f) => f.categoriaId === meta.categoriaId && f.id !== meta.id)
    .sort(masRecientes)
    .slice(0, LIMITES.fichasRelacionadas)
    .map((f) => aResumen(f, categorias));
  return {
    ...aResumen(meta, categorias),
    pregunta: meta.pregunta,
    normas: meta.normas,
    estado: meta.estado,
    tieneAcceso: acceso,
    ...(acceso && completa ? { respuestaHtml: completa.respuestaHtml } : {}),
    ...(compra
      ? { compra: { id: idCompra(compra), estado: compra.estado, referencia: compra.referencia } }
      : {}),
    enRevision: meta.estado !== 'PUBLICADA',
    relacionadas,
  };
}
