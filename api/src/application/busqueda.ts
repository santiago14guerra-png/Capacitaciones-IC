import { LIMITES, terminosBusqueda, type ResultadoBusquedaDto } from '@ic/shared';
import { buscar, indexar, type Indexada } from '../domain/busqueda.js';
import { validacion } from '../domain/errores.js';
import type { FichaMeta } from '../domain/ficha.js';
import { aResumen, fichasPublicadas, nombresCategorias } from './catalogo.js';
import type { Contexto } from './contexto.js';

const MAXIMO = 50;
const indices = new WeakMap<FichaMeta[], Indexada[]>();
/** El índice se arma una vez por versión de la caché del catálogo. */
const indiceDe = (fichas: FichaMeta[]) => {
  let i = indices.get(fichas);
  if (!i) indices.set(fichas, (i = fichas.map(indexar)));
  return i;
};

/**
 * HU-09: búsqueda por palabra clave sobre las fichas publicadas.
 * Las sugerencias del formulario de consulta (HU-15) no se registran como búsquedas.
 * La ruta es pública: el registro tiene un cupo por minuto para acotar las escrituras. Si se
 * supera, la búsqueda responde igual y solo deja de contarse en los indicadores.
 */
export async function buscarFichas(
  ctx: Contexto,
  consultaCruda: string,
  opciones: { registrar: boolean; categorias?: string[] },
): Promise<ResultadoBusquedaDto> {
  const consulta = consultaCruda.trim().slice(0, 200);
  if (consulta.length < LIMITES.terminoMin) {
    throw validacion(`Escriba al menos ${LIMITES.terminoMin} letras para buscar`, {
      q: `Escriba al menos ${LIMITES.terminoMin} letras`,
    });
  }
  const terminos = terminosBusqueda(consulta);
  const [fichas, categorias] = await Promise.all([fichasPublicadas(ctx), nombresCategorias(ctx)]);
  const filtro = opciones.categorias ?? [];
  const visibles = fichas.filter(
    (f) =>
      categorias.get(f.categoriaId)?.activa &&
      (filtro.length === 0 || filtro.includes(f.categoriaId)),
  );
  const encontradas = buscar(indiceDe(visibles), terminos, consulta);
  if (opciones.registrar && ctx.cupoBusquedas.tomar()) {
    // HU-09 CA5: término, fecha y número de resultados, sin datos de quien busca.
    await ctx.busquedas.registrar({
      termino: consulta.toLocaleLowerCase('es'),
      fecha: ctx.reloj.ahora().toISOString(),
      resultados: encontradas.length,
    });
  }
  return {
    consulta,
    terminos,
    total: encontradas.length,
    elementos: encontradas.slice(0, MAXIMO).map((f) => aResumen(f, categorias)),
  };
}
