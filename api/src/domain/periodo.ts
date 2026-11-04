import { validacion } from './errores.js';

/** Colombia no tiene horario de verano: el día empieza a las 05:00 UTC. */
const DESFASE = 'T05:00:00.000Z';

/** Convierte fechas locales aaaa-mm-dd (inclusive) en un rango ISO UTC [desde, hasta). */
export function rangoBogota(desde: string, hasta: string, maxDias = 366) {
  if (desde > hasta)
    throw validacion('La fecha inicial debe ser anterior a la final', {
      desde: 'Revise el periodo',
    });
  const inicio = new Date(`${desde}${DESFASE}`);
  const fin = new Date(`${hasta}${DESFASE}`);
  fin.setUTCDate(fin.getUTCDate() + 1);
  if ((fin.getTime() - inicio.getTime()) / 86_400_000 > maxDias) {
    throw validacion('El periodo no puede superar un año', { hasta: 'Máximo un año' });
  }
  return { desde: inicio.toISOString(), hasta: new Date(fin.getTime() - 1).toISOString() };
}

/** Fecha local de Bogotá (aaaa-mm-dd) de un instante ISO. */
export const fechaBogota = (iso: string) =>
  new Date(new Date(iso).getTime() - 5 * 3_600_000).toISOString().slice(0, 10);
