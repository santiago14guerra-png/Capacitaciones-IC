import type { IndicadoresDto } from '@ic/shared';
import type { Busqueda } from './busqueda.js';
import type { Compra } from './compra.js';
import type { Consulta } from './consulta.js';
import { fechaBogota } from './periodo.js';

const ATENDIDAS = new Set(['RESPONDIDA', 'ESCALADA', 'CERRADA']);
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : null);

/** Lunes (aaaa-mm-dd, hora de Colombia) de la semana de un instante. */
export function lunesDe(iso: string): string {
  const d = new Date(`${fechaBogota(iso)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

interface Entrada {
  desde: string;
  hasta: string;
  /** Consultas recibidas en el periodo. */
  consultas: Consulta[];
  /** Compras aprobadas en el periodo. */
  ventas: Compra[];
  busquedas: Busqueda[];
  nombreCategoria(id: string): string;
}

/**
 * HU-21: indicadores del MVP (Entrega 2, tabla 5).
 * - Tiempo de respuesta (objetivo 1): de la recepción a la primera respuesta o escalamiento.
 * - Autoservicio (objetivo 2): compras de fichas frente a compras + consultas nuevas.
 * - Cobro (objetivo 3): pagos aprobados frente al total de solicitudes atendidas
 *   (pagos aprobados + consultas respondidas, escaladas o cerradas).
 */
export function calcularIndicadores(e: Entrada): IndicadoresDto {
  const semanas = new Map<string, number>();
  for (const c of e.consultas)
    semanas.set(lunesDe(c.recibidaEn), (semanas.get(lunesDe(c.recibidaEn)) ?? 0) + 1);

  const respondidas = e.consultas.filter((c) => c.respondidaEn);
  const horas = respondidas.map(
    (c) => (Date.parse(c.respondidaEn!) - Date.parse(c.recibidaEn)) / 3_600_000,
  );

  const temas = new Map<string, number>();
  for (const c of e.consultas) temas.set(c.categoriaId, (temas.get(c.categoriaId) ?? 0) + 1);

  const sinResultado = new Map<string, number>();
  for (const b of e.busquedas)
    if (b.resultados === 0) sinResultado.set(b.termino, (sinResultado.get(b.termino) ?? 0) + 1);

  const atendidas = e.consultas.filter((c) => ATENDIDAS.has(c.estado)).length;
  return {
    desde: e.desde,
    hasta: e.hasta,
    consultasPorSemana: [...semanas]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semana, total]) => ({ semana, total })),
    tiempoRespuestaHoras: horas.length
      ? Math.round((horas.reduce((a, b) => a + b, 0) / horas.length) * 10) / 10
      : null,
    temas: [...temas]
      .map(([id, total]) => ({ categoria: e.nombreCategoria(id) || id, total }))
      .sort((a, b) => b.total - a.total),
    busquedasSinResultado: [...sinResultado]
      .map(([termino, veces]) => ({ termino, veces }))
      .sort((a, b) => b.veces - a.veces || a.termino.localeCompare(b.termino))
      .slice(0, 15),
    ventas: { cantidad: e.ventas.length, valor: e.ventas.reduce((s, c) => s + c.valor, 0) },
    autoservicioPct: pct(e.ventas.length, e.ventas.length + e.consultas.length),
    cobroPct: pct(e.ventas.length, e.ventas.length + atendidas),
  };
}
