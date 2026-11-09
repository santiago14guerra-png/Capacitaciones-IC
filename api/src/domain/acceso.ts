import { esPersonal, type Actor } from './actor.js';
import type { FichaMeta } from './ficha.js';

/**
 * Quién puede leer la respuesta completa (HU-10 CA2 y CA4, ADR 0002):
 * el personal; cualquier usuario con sesión si la ficha es gratuita y está publicada;
 * y quien tenga una compra aprobada de esa ficha, aunque luego se haya despublicado.
 */
export function tieneAcceso(
  actor: Actor | null,
  ficha: FichaMeta,
  compraAprobada: boolean,
): boolean {
  if (esPersonal(actor)) return true;
  if (!actor) return false;
  if (compraAprobada) return true;
  return ficha.estado === 'PUBLICADA' && ficha.precio === 0;
}

/** Una ficha no publicada solo la ven el personal y quienes ya la compraron. */
export const puedeVerFicha = (actor: Actor | null, ficha: FichaMeta, compraAprobada: boolean) =>
  ficha.estado === 'PUBLICADA' || esPersonal(actor) || compraAprobada;
