import type { ReactNode } from 'react';
import { Link } from 'react-router';

/** Marcador visible de un dato que debe completar la empresa. */
export const Pendiente = ({ children }: { children: ReactNode }) => (
  <mark title="Dato pendiente de completar">[PENDIENTE: {children}]</mark>
);

export function DocumentoLegal({
  titulo,
  version,
  children,
}: {
  titulo: string;
  version: string;
  children: ReactNode;
}) {
  return (
    <article className="pila legal" style={{ maxWidth: 780 }}>
      <div className="aviso info" role="note">
        <strong>Borrador pendiente de revisión del abogado.</strong> Este texto no es definitivo y
        no debe publicarse en producción sin su aval (Acta 002, Ley 1581 de 2012).
      </div>
      <h1>{titulo}</h1>
      <p className="suave pequeno">Versión {version}</p>
      {children}
      <p>
        <Link to="/">Volver al inicio</Link>
      </p>
    </article>
  );
}
