import {
  ESTADOS_FICHA,
  esquemaGuardarFicha,
  normalizar,
  type DatosFicha,
  type EstadoFicha,
  type FichaAdminDto,
  type FichaAdminResumenDto,
} from '@ic/shared';
import type { Actor } from '../domain/actor.js';
import { conflicto, noEncontrado, validacion } from '../domain/errores.js';
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

async function exigirFicha(ctx: Contexto, id: string) {
  const f = await ctx.fichas.obtener(id);
  if (!f) throw noEncontrado('La ficha no existe');
  return f;
}

/** HU-06 CA1: lista del panel con filtro por estado y búsqueda por título. */
export async function listarFichasAdmin(
  ctx: Contexto,
  filtro: { estado?: string; q?: string },
): Promise<FichaAdminResumenDto[]> {
  const estados = ESTADOS_FICHA.filter((e) => !filtro.estado || e === filtro.estado);
  const [listas, categorias] = await Promise.all([
    Promise.all(estados.map((e) => ctx.fichas.listarPorEstado(e))),
    ctx.categorias.listar(),
  ]);
  const q = normalizar(filtro.q?.trim() ?? '');
  const nombre = new Map(categorias.map((c) => [c.id, c.nombre]));
  return listas
    .flat()
    .filter((f) => !q || normalizar(f.titulo).includes(q))
    .sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))
    .map((f) => ({
      id: f.id,
      titulo: f.titulo,
      categoriaId: f.categoriaId,
      categoriaNombre: nombre.get(f.categoriaId) ?? '',
      estado: f.estado,
      precio: f.precio,
      actualizadaEn: f.actualizadaEn,
      publicadaAlgunaVez: f.publicadaAlgunaVez,
    }));
}

/**
 * HU-06: editar. Guardar publicada actualiza «Vigente a» (CA2). Quitar la publicación de una
 * ficha que ya estuvo publicada la deja DESPUBLICADA, no borrador: quien la compró la conserva.
 */
export async function editarFicha(
  ctx: Contexto,
  id: string,
  cuerpo: unknown,
): Promise<FichaAdminDto> {
  const previa = await exigirFicha(ctx, id);
  const { publicar, ...d } = await leerDatosFicha(ctx, cuerpo);
  const ahora = ctx.reloj.ahora().toISOString();
  const estado: EstadoFicha = publicar
    ? 'PUBLICADA'
    : previa.publicadaAlgunaVez
      ? 'DESPUBLICADA'
      : 'BORRADOR';
  const ficha: Ficha = {
    ...previa,
    ...d,
    estado,
    publicadaAlgunaVez: previa.publicadaAlgunaVez || publicar,
    actualizadaEn: ahora,
    vigenteA: publicar ? ahora : previa.vigenteA,
  };
  await ctx.fichas.guardar(ficha);
  return aFichaAdmin(ficha);
}

/** HU-06 CA3: deja de verse en catálogo y búsqueda, pero no se borra. */
export async function despublicarFicha(ctx: Contexto, id: string): Promise<FichaAdminDto> {
  const f = await exigirFicha(ctx, id);
  if (f.estado !== 'PUBLICADA') throw conflicto('La ficha no está publicada');
  const nueva = {
    ...f,
    estado: 'DESPUBLICADA' as const,
    actualizadaEn: ctx.reloj.ahora().toISOString(),
  };
  await ctx.fichas.guardarMeta(nueva);
  return aFichaAdmin(nueva);
}

/** HU-06 CA4: solo se eliminan borradores que nunca se publicaron. */
export async function eliminarFicha(ctx: Contexto, id: string) {
  const f = await exigirFicha(ctx, id);
  if (f.estado !== 'BORRADOR' || f.publicadaAlgunaVez) {
    throw conflicto(
      'Solo se pueden eliminar borradores que nunca se publicaron. Use «Despublicar».',
    );
  }
  await ctx.fichas.borrar(id);
}
