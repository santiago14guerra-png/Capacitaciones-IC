import { esquemaGuardarFicha, normalizar, type DatosFicha, type FichaAdminDto } from '@ic/shared';
import type { Actor } from '../domain/actor.js';
import { noEncontrado, validacion } from '../domain/errores.js';
import type { Ficha } from '../domain/ficha.js';
import { sanearHtml } from '../domain/html.js';
import type { Contexto } from './contexto.js';

const unicos = (xs: string[]) => {
  const vistos = new Set<string>();
  return xs.filter((x) => {
    const k = normalizar(x);
    return !vistos.has(k) && !!vistos.add(k);
  });
};

/** Valida con el esquema compartido, sanea el HTML y verifica la categoría. */
export async function leerDatosFicha(ctx: Contexto, cuerpo: unknown): Promise<DatosFicha> {
  const d = esquemaGuardarFicha.parse(cuerpo);
  const datos = {
    ...d,
    respuestaHtml: sanearHtml(d.respuestaHtml),
    etiquetas: unicos(d.etiquetas),
    normas: unicos(d.normas),
  };
  if (datos.categoriaId) {
    const c = await ctx.categorias.obtener(datos.categoriaId);
    if (!c || !c.activa)
      throw validacion('Revise los datos', { categoriaId: 'Elija una categoría activa' });
  }
  return datos;
}

export const aFichaAdmin = (f: Ficha): FichaAdminDto => ({ ...f });

/** HU-05: crea una ficha como borrador o publicada; registra autor y fechas (CA5). */
export async function crearFicha(
  ctx: Contexto,
  actor: Actor,
  cuerpo: unknown,
): Promise<FichaAdminDto> {
  const { publicar, ...d } = await leerDatosFicha(ctx, cuerpo);
  const ahora = ctx.reloj.ahora().toISOString();
  const ficha: Ficha = {
    ...d,
    id: ctx.ids.nuevo(),
    estado: publicar ? 'PUBLICADA' : 'BORRADOR',
    publicadaAlgunaVez: publicar,
    autor: actor.sub,
    creadaEn: ahora,
    actualizadaEn: ahora,
    vigenteA: publicar ? ahora : undefined,
  };
  await ctx.fichas.guardar(ficha);
  return aFichaAdmin(ficha);
}

export async function obtenerFichaAdmin(ctx: Contexto, id: string): Promise<FichaAdminDto> {
  const f = await ctx.fichas.obtener(id);
  if (!f) throw noEncontrado('La ficha no existe');
  return aFichaAdmin(f);
}
