import {
  aSlug,
  esquemaCategoria,
  esquemaOrdenCategorias,
  esquemaReasignarCategoria,
  normalizar,
  type CategoriaAdminDto,
  type CategoriaDto,
} from '@ic/shared';
import { CATEGORIAS_INICIALES, ordenarCategorias, type Categoria } from '../domain/categoria.js';
import { ErrorDominio, noEncontrado, validacion } from '../domain/errores.js';
import type { FichaMeta } from '../domain/ficha.js';
import { invalidarCatalogo } from './catalogo.js';
import type { Contexto } from './contexto.js';

/** HU-07 CA4: categorías activas en el orden del panel, para inicio y catálogo. */
export async function categoriasPublicas(ctx: Contexto): Promise<CategoriaDto[]> {
  return ordenarCategorias((await ctx.categorias.listar()).filter((c) => c.activa));
}

async function todasLasFichas(ctx: Contexto): Promise<FichaMeta[]> {
  const estados = ['BORRADOR', 'PUBLICADA', 'DESPUBLICADA'] as const;
  return (await Promise.all(estados.map((e) => ctx.fichas.listarPorEstado(e)))).flat();
}

export async function categoriasAdmin(ctx: Contexto): Promise<CategoriaAdminDto[]> {
  const [cs, fichas] = await Promise.all([ctx.categorias.listar(), todasLasFichas(ctx)]);
  return ordenarCategorias(cs).map((c) => ({
    ...c,
    fichasPublicadas: fichas.filter((f) => f.categoriaId === c.id && f.estado === 'PUBLICADA')
      .length,
    fichasTotal: fichas.filter((f) => f.categoriaId === c.id).length,
  }));
}

async function exigir(ctx: Contexto, id: string) {
  const c = await ctx.categorias.obtener(id);
  if (!c) throw noEncontrado('La categoría no existe');
  return c;
}

function nombreLibre(cs: Categoria[], nombre: string, excepto?: string) {
  if (cs.some((c) => c.id !== excepto && normalizar(c.nombre) === normalizar(nombre))) {
    throw validacion('Ya existe una categoría con ese nombre', {
      nombre: 'Ya existe una categoría con ese nombre',
    });
  }
}

export async function crearCategoria(ctx: Contexto, cuerpo: unknown): Promise<Categoria> {
  const { nombre } = esquemaCategoria.parse(cuerpo);
  const cs = await ctx.categorias.listar();
  nombreLibre(cs, nombre);
  const base = aSlug(nombre) || 'categoria';
  let id = base;
  for (let n = 2; cs.some((c) => c.id === id); n++) id = `${base}-${n}`;
  const categoria = {
    id,
    nombre,
    orden: Math.max(-1, ...cs.map((c) => c.orden)) + 1,
    activa: true,
  };
  await ctx.categorias.guardar(categoria);
  return categoria;
}

/** Renombrar no cambia el identificador: los enlaces y las fichas siguen funcionando. */
export async function renombrarCategoria(ctx: Contexto, id: string, cuerpo: unknown) {
  const { nombre } = esquemaCategoria.parse(cuerpo);
  const c = await exigir(ctx, id);
  nombreLibre(await ctx.categorias.listar(), nombre, id);
  const nueva = { ...c, nombre };
  await ctx.categorias.guardar(nueva);
  return nueva;
}

export async function ordenarCategoriasAdmin(ctx: Contexto, cuerpo: unknown) {
  const { ids } = esquemaOrdenCategorias.parse(cuerpo);
  const cs = await ctx.categorias.listar();
  if (
    ids.length !== cs.length ||
    new Set(ids).size !== ids.length ||
    !cs.every((c) => ids.includes(c.id))
  ) {
    throw validacion('El orden debe incluir cada categoría una sola vez');
  }
  await Promise.all(cs.map((c) => ctx.categorias.guardar({ ...c, orden: ids.indexOf(c.id) })));
  return categoriasAdmin(ctx);
}

/** HU-07 CA2: no se desactiva una categoría con fichas publicadas; primero se reasignan. */
export async function cambiarEstadoCategoria(ctx: Contexto, id: string, activa: boolean) {
  const c = await exigir(ctx, id);
  if (!activa) {
    const n = (await ctx.fichas.listarPorEstado('PUBLICADA')).filter(
      (f) => f.categoriaId === id,
    ).length;
    if (n > 0) {
      throw new ErrorDominio(
        'CONFLICTO',
        `La categoría tiene ${n} ${n === 1 ? 'ficha publicada' : 'fichas publicadas'}. Reasígnelas a otra categoría antes de desactivarla.`,
        { fichasPublicadas: String(n) },
      );
    }
  }
  const nueva = { ...c, activa };
  await ctx.categorias.guardar(nueva);
  return nueva;
}

/** Mueve todas las fichas de una categoría a otra activa (HU-07 CA2). */
export async function reasignarFichas(ctx: Contexto, id: string, cuerpo: unknown) {
  const { destinoId } = esquemaReasignarCategoria.parse(cuerpo);
  await exigir(ctx, id);
  const destino = await exigir(ctx, destinoId);
  if (destinoId === id || !destino.activa) {
    throw validacion('Elija otra categoría activa', { destinoId: 'Elija otra categoría activa' });
  }
  const fichas = (await todasLasFichas(ctx)).filter((f) => f.categoriaId === id);
  // Cambiar la categoría no altera la fecha «Vigente a»: el contenido no cambió.
  await Promise.all(fichas.map((f) => ctx.fichas.guardarMeta({ ...f, categoriaId: destinoId })));
  invalidarCatalogo(ctx);
  return { movidas: fichas.length };
}

/** HU-07 CA3: carga inicial idempotente; solo actúa si no hay categorías. */
export async function sembrarCategorias(ctx: Contexto) {
  if ((await ctx.categorias.listar()).length) return 0;
  await Promise.all(
    CATEGORIAS_INICIALES.map((nombre, orden) =>
      ctx.categorias.guardar({ id: aSlug(nombre), nombre, orden, activa: true }),
    ),
  );
  return CATEGORIAS_INICIALES.length;
}
