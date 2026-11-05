import { ETIQUETAS_ESTADO_CONSULTA, type EstadoConsulta as Estado } from '@ic/shared';

const COLOR: Record<Estado, string> = {
  RECIBIDA: 'amarillo',
  EN_ANALISIS: 'amarillo',
  RESPONDIDA: 'verde',
  ESCALADA: '',
  CERRADA: '',
};

export const EstadoConsulta = ({ estado }: { estado: Estado }) => (
  <span className={`estado ${COLOR[estado]}`}>{ETIQUETAS_ESTADO_CONSULTA[estado]}</span>
);
