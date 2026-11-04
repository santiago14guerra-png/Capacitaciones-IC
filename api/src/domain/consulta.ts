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
