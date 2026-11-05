import { LIMITES } from '@ic/shared';
import { limiteExcedido } from '../domain/errores.js';
import type { Contexto } from './contexto.js';

/** Cada URL de subida cuenta contra la cuota diaria de la cuenta, aunque no se use. */
export async function exigirCuotaSubidas(ctx: Contexto, sub: string) {
  const dia = ctx.reloj.ahora().toISOString().slice(0, 10);
  if (!(await ctx.cuotas.consumirSubida(sub, dia, LIMITES.subidasPorDia))) {
    throw limiteExcedido('Alcanzó el límite de archivos por hoy. Intente de nuevo mañana.');
  }
}
