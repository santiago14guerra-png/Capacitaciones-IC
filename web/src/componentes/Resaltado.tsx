import { resaltar } from '@ic/shared';

/** Marca las palabras buscadas (HU-09 CA3) sin usar HTML del servidor. */
export function Resaltado({ texto, terminos }: { texto: string; terminos: string[] }) {
  return (
    <>
      {resaltar(texto, terminos).map((s, i) =>
        s.marcado ? <mark key={i}>{s.texto}</mark> : <span key={i}>{s.texto}</span>,
      )}
    </>
  );
}
