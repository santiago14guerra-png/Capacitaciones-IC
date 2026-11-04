import type { EstadoFicha } from '@ic/shared';

/** Metadatos de la ficha. Nunca incluye la respuesta completa (ítem aparte, ADR y HU-10 CA2). */
export interface FichaMeta {
  id: string;
  titulo: string;
  pregunta: string;
  resumen: string;
  categoriaId: string;
  etiquetas: string[];
  normas: string[];
  precio: number | null;
  estado: EstadoFicha;
  publicadaAlgunaVez: boolean;
  autor: string;
  creadaEn: string;
  actualizadaEn: string;
  /** Fecha «Vigente a» que ve el cliente: la última vez que se guardó publicada (HU-06 CA2). */
  vigenteA?: string;
  /** Consulta de la que salió la ficha (HU-20). */
  origenConsultaId?: string;
}

export interface Ficha extends FichaMeta {
  respuestaHtml: string;
}
