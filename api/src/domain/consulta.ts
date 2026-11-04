import type { Clasificacion, EstadoConsulta } from '@ic/shared';

/** Consulta nueva del cliente (HU-15) que gestiona el director (HU-16). */
export interface Consulta {
  id: string;
  radicado: string;
  sub: string;
  clienteNombre: string;
  clienteCorreo: string;
  categoriaId: string;
  asunto: string;
  descripcion: string;
  adjuntoLlave?: string;
  estado: EstadoConsulta;
  clasificacion?: Clasificacion;
  respuestaHtml?: string;
  condicionesAsesoria?: string;
  recibidaEn: string;
  actualizadaEn: string;
  /** Primera vez que se respondió o escaló: mide el tiempo de respuesta (objetivo 1). */
  respondidaEn?: string;
  gestionadaPor?: string;
  /** Ficha creada a partir de la respuesta (HU-20). */
  fichaId?: string;
}

export const formatoRadicado = (n: number) => `RAD-${String(n).padStart(6, '0')}`;

const ABIERTAS: EstadoConsulta[] = ['RECIBIDA', 'EN_ANALISIS'];

/** HU-16: se resaltan las consultas sin responder de más de 48 horas. */
export const estaAtrasada = (
  c: Pick<Consulta, 'estado' | 'recibidaEn'>,
  ahora: Date,
  horas: number,
) =>
  ABIERTAS.includes(c.estado) &&
  ahora.getTime() - new Date(c.recibidaEn).getTime() > horas * 3_600_000;

export interface CambioConsulta {
  estado: EstadoConsulta;
  clasificacion?: Clasificacion;
  respuestaHtml?: string;
  condicionesAsesoria?: string;
}

/**
 * HU-16: reglas de la gestión. La clasificación es obligatoria para avanzar; responder
 * exige la respuesta y escalar exige las condiciones de la asesoría (HU-17).
 * Devuelve los errores por campo (vacío si es válido).
 */
export function erroresGestion(
  previa: Consulta,
  cambio: CambioConsulta,
  textoRespuesta: string,
): Record<string, string> {
  const e: Record<string, string> = {};
  if (cambio.estado === 'RECIBIDA' && previa.estado !== 'RECIBIDA')
    e.estado = 'Una consulta no puede volver a «Recibida»';
  if (cambio.estado !== 'RECIBIDA' && !(cambio.clasificacion ?? previa.clasificacion)) {
    e.clasificacion = 'Clasifique la consulta como consulta rápida o asesoría';
  }
  if (cambio.estado === 'RESPONDIDA' && !textoRespuesta) e.respuestaHtml = 'Escriba la respuesta';
  if (
    cambio.estado === 'ESCALADA' &&
    !(cambio.condicionesAsesoria ?? previa.condicionesAsesoria)?.trim()
  ) {
    e.condicionesAsesoria = 'Indique las condiciones de la asesoría';
  }
  return e;
}
