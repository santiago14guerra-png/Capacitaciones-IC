import { LIMITES, type FichaDetalleDto } from '@ic/shared';
import { puedeVerFicha, tieneAcceso } from '../domain/acceso.js';
import type { Actor } from '../domain/actor.js';
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
  const meta = await ctx.fichas.obtenerMeta(id);
  const compraAprobada = false; // HU-11 a HU-14: compra por par usuario/ficha.
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
    enRevision: meta.estado !== 'PUBLICADA',
    relacionadas,
  };
}
