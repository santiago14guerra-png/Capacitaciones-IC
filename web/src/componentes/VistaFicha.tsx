import { AVISO_ASESORIA, type FichaDetalleDto } from '@ic/shared';
import type { ReactNode } from 'react';
import { formatoFecha, formatoPrecio } from '../lib/formato';

export type DatosVistaFicha = Pick<
  FichaDetalleDto,
  'titulo' | 'pregunta' | 'resumen' | 'categoriaNombre' | 'etiquetas' | 'normas' | 'precio'
> & { vigenteA?: string };

/**
 * La ficha tal como la ve el cliente (HU-10 CA1). La usa también la vista previa del panel
 * (HU-05 CA6). `respuesta` es la respuesta completa o el bloque bloqueado.
 */
export function VistaFicha({
  ficha,
  respuesta,
  aviso,
}: {
  ficha: DatosVistaFicha;
  respuesta: ReactNode;
  aviso?: ReactNode;
}) {
  return (
    <article className="ficha pila">
      <div className="fila">
        {ficha.categoriaNombre && <span className="chip">{ficha.categoriaNombre}</span>}
        {ficha.vigenteA && (
          <span className="suave pequeno">Vigente a {formatoFecha(ficha.vigenteA)}</span>
        )}
      </div>
      <h1>{ficha.titulo || 'Sin título'}</h1>
      <p className="ficha-precio">{formatoPrecio(ficha.precio)}</p>
      <section>
        <h2 className="ficha-subtitulo">La pregunta</h2>
        <p className="ficha-pregunta">{ficha.pregunta}</p>
      </section>
      <section>
        <h2 className="ficha-subtitulo">Resumen</h2>
        <p>{ficha.resumen}</p>
      </section>
      {ficha.normas.length > 0 && (
        <section>
          <h2 className="ficha-subtitulo">Normas de referencia</h2>
          <ul>
            {ficha.normas.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}
      {ficha.etiquetas.length > 0 && (
        <p className="fila" aria-label="Etiquetas">
          {ficha.etiquetas.map((t) => (
            <span key={t} className="chip">
              #{t}
            </span>
          ))}
        </p>
      )}
      <section aria-label="Respuesta">{respuesta}</section>
      <p className="aviso info pequeno">
        {AVISO_ASESORIA}. {aviso}
      </p>
    </article>
  );
}
