import { LIMITES, type CategoriaDto, type FichaResumenDto, type Pagina } from '@ic/shared';
import type { FichaMeta } from '../domain/ficha.js';
import type { Contexto } from './contexto.js';

const VIGENCIA_MS = 60_000;
const caches = new WeakMap<Contexto, { hasta: number; datos: Promise<FichaMeta[]> }>();

/**
 * ADR 0003: metadatos de las fichas publicadas en memoria de la Lambda por 60 segundos.
 * Catálogo, búsqueda e inicio leen de aquí. Los cambios del panel invalidan la caché.
 */
export function fichasPublicadas(ctx: Contexto): Promise<FichaMeta[]> {
  const c = caches.get(ctx);
  if (c && c.hasta > Date.now()) return c.datos;
  const datos = ctx.fichas
    .listarPorEstado('PUBLICADA')
    .then((fs) => fs.filter((f) => f.precio !== null));
  datos.catch(() => caches.delete(ctx));
  caches.set(ctx, { hasta: Date.now() + VIGENCIA_MS, datos });
  return datos;
}

export const invalidarCatalogo = (ctx: Contexto) => void caches.delete(ctx);

export async function nombresCategorias(ctx: Contexto) {
  return new Map((await ctx.categorias.listar()).map((c) => [c.id, c] as [string, CategoriaDto]));
}

export const aResumen = (f: FichaMeta, categorias: Map<string, CategoriaDto>): FichaResumenDto => ({
  id: f.id,
  titulo: f.titulo,
  resumen: f.resumen,
  categoriaId: f.categoriaId,
  categoriaNombre: categorias.get(f.categoriaId)?.nombre ?? '',
  etiquetas: f.etiquetas,
  precio: f.precio ?? 0,
  vigenteA: f.vigenteA ?? f.actualizadaEn,
});

export const masRecientes = (a: FichaMeta, b: FichaMeta) =>
  (b.vigenteA ?? b.actualizadaEn).localeCompare(a.vigenteA ?? a.actualizadaEn);

export interface FiltroCatalogo {
  categorias?: string[];
  orden?: string;
  pagina?: number;
}

/** HU-08: solo publicadas (CA1), filtro por categorías y orden (CA2), 12 por página (CA3). */
export async function catalogo(
  ctx: Contexto,
  filtro: FiltroCatalogo,
): Promise<Pagina<FichaResumenDto>> {
  const [fichas, categorias] = await Promise.all([fichasPublicadas(ctx), nombresCategorias(ctx)]);
  const elegidas = new Set(filtro.categorias?.filter(Boolean));
  const lista = fichas
    .filter((f) => categorias.get(f.categoriaId)?.activa)
    .filter((f) => !elegidas.size || elegidas.has(f.categoriaId))
    .sort(
      filtro.orden === 'precio'
        ? (a, b) => a.precio! - b.precio! || masRecientes(a, b)
        : masRecientes,
    );
  const porPagina = LIMITES.fichasPorPagina;
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const pagina = Math.min(Math.max(1, Math.trunc(filtro.pagina ?? 1) || 1), totalPaginas);
  return {
    elementos: lista
      .slice((pagina - 1) * porPagina, pagina * porPagina)
      .map((f) => aResumen(f, categorias)),
    pagina,
    totalPaginas,
    total: lista.length,
  };
}
