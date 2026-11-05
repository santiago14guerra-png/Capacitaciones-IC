import type { EstadoCompra } from '@ic/shared';

/**
 * ADR 0002: una compra por par usuario–ficha. El acceso es que esté APROBADA; aprobar es una
 * escritura condicional sobre un solo ítem, sin transacciones.
 */
export interface Compra {
  sub: string;
  fichaId: string;
  referencia: string;
  fichaTitulo: string;
  valor: number;
  estado: EstadoCompra;
  clienteNombre: string;
  clienteCorreo: string;
  creadaEn: string;
  actualizadaEn: string;
  motivoRechazo?: string;
  comprobanteLlave?: string;
  /** Versión de S3 que se confirmó: es la que descarga quien revisa el pago. */
  comprobanteVersion?: string;
  comprobanteSubidoEn?: string;
  aprobadaEn?: string;
  decididaPor?: string;
  decididaEn?: string;
}

/** Identificador público: de él sale la llave sin otro índice (modelo de datos). */
export const idCompra = (c: Pick<Compra, 'sub' | 'fichaId'>) => `${c.sub}.${c.fichaId}`;

export function partesIdCompra(id: string): { sub: string; fichaId: string } | null {
  const i = id.lastIndexOf('.');
  if (i <= 0 || i === id.length - 1) return null;
  return { sub: id.slice(0, i), fichaId: id.slice(i + 1) };
}

/** HU-11: referencia única de pago, p. ej. RPN-000123. */
export const formatoReferencia = (n: number) => `RPN-${String(n).padStart(6, '0')}`;

/** Transiciones válidas del pago (HU-11 a HU-13). */
export const TRANSICIONES: Record<EstadoCompra, EstadoCompra[]> = {
  PENDIENTE_PAGO: ['EN_VERIFICACION'],
  EN_VERIFICACION: ['EN_VERIFICACION', 'APROBADA', 'RECHAZADA'],
  APROBADA: [],
  RECHAZADA: ['PENDIENTE_PAGO'],
};
