import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useAccion } from '../lib/accion';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type'> & {
  /** La acción; aunque se haga doble clic, se ejecuta una sola vez a la vez. */
  alPulsar(): unknown;
  /** Texto mientras trabaja (opcional). */
  ocupadoTexto?: ReactNode;
};

export function BotonAccion({ alPulsar, ocupadoTexto, children, disabled, ...resto }: Props) {
  const [ejecutar, ocupado] = useAccion(alPulsar);
  return (
    <button
      {...resto}
      type="button"
      onClick={ejecutar}
      disabled={disabled || ocupado}
      aria-busy={ocupado}
    >
      {ocupado && ocupadoTexto ? ocupadoTexto : children}
    </button>
  );
}
