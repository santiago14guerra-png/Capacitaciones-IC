import { ETIQUETAS_ESTADO_COMPRA, type EstadoCompra as Estado } from '@ic/shared';

const COLOR: Record<Estado, string> = {
  PENDIENTE_PAGO: 'amarillo',
  EN_VERIFICACION: 'amarillo',
  APROBADA: 'verde',
  RECHAZADA: 'rojo',
};

export const EstadoCompra = ({ estado }: { estado: Estado }) => (
  <span className={`estado ${COLOR[estado]}`}>{ETIQUETAS_ESTADO_COMPRA[estado]}</span>
);
