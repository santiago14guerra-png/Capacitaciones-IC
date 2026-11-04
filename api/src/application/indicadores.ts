import { esquemaPeriodo, type IndicadoresDto } from '@ic/shared';
import { calcularIndicadores } from '../domain/indicadores.js';
import { rangoBogota } from '../domain/periodo.js';
import type { Contexto } from './contexto.js';

function meses(desde: string, hasta: string): string[] {
  const r: string[] = [];
  const d = new Date(`${desde.slice(0, 7)}-01T00:00:00Z`);
  while (d.toISOString().slice(0, 7) <= hasta.slice(0, 7)) {
    r.push(d.toISOString().slice(0, 7));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return r;
}

/** HU-21: indicadores del periodo (hora de Colombia, día final incluido). */
export async function indicadores(
  ctx: Contexto,
  consulta: Record<string, string | undefined>,
): Promise<IndicadoresDto> {
  const p = esquemaPeriodo.parse(consulta);
  const { desde, hasta } = rangoBogota(p.desde, p.hasta);
  const dentro = (iso?: string) => !!iso && iso >= desde && iso <= hasta;
  const [consultas, ventas, busquedas, categorias] = await Promise.all([
    ctx.consultas.listarTodas(),
    ctx.compras.listarPorEstado('APROBADA', desde, hasta),
    Promise.all(meses(desde, hasta).map((m) => ctx.busquedas.listarMes(m))),
    ctx.categorias.listar(),
  ]);
  const nombres = new Map(categorias.map((c) => [c.id, c.nombre]));
  return calcularIndicadores({
    desde: p.desde,
    hasta: p.hasta,
    consultas: consultas.filter((c) => dentro(c.recibidaEn)),
    ventas,
    busquedas: busquedas.flat().filter((b) => dentro(b.fecha)),
    nombreCategoria: (id) => nombres.get(id) ?? '',
  });
}
