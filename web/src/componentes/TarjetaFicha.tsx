import type { FichaResumenDto } from '@ic/shared';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatoFecha, formatoPrecio } from '../lib/formato';

/** Tarjeta del catálogo (HU-08 CA1): título, resumen, categoría, etiquetas, precio y vigencia. */
export function TarjetaFicha({
  ficha,
  titulo,
  resumen,
}: {
  ficha: FichaResumenDto;
  titulo?: ReactNode;
  resumen?: ReactNode;
}) {
  return (
    <article className="tarjeta tarjeta-ficha">
      <div className="fila entre">
        <span className="chip">{ficha.categoriaNombre}</span>
        <strong className="tarjeta-precio">{formatoPrecio(ficha.precio)}</strong>
      </div>
      <h3>
        <Link to={`/fichas/${ficha.id}`}>{titulo ?? ficha.titulo}</Link>
      </h3>
      <p>{resumen ?? ficha.resumen}</p>
      {ficha.etiquetas.length > 0 && (
        <p className="pequeno suave" style={{ margin: 0 }}>
          {ficha.etiquetas.map((t) => `#${t}`).join(' ')}
        </p>
      )}
      <p className="pequeno suave" style={{ marginTop: 'auto', marginBottom: 0 }}>
        Vigente a {formatoFecha(ficha.vigenteA)}
      </p>
    </article>
  );
}
