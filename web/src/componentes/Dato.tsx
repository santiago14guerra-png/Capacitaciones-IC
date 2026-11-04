import { esPendiente } from '@ic/shared';
import { useState } from 'react';

/** Un dato para copiar (cuenta, referencia). Los marcadores [PENDIENTE] se resaltan y no se copian. */
export function DatoCopiable({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [copiado, setCopiado] = useState(false);
  const pendiente = esPendiente(valor);
  return (
    <div className="dato">
      <dt>{etiqueta}</dt>
      <dd>
        {pendiente ? <mark>{valor}</mark> : <strong>{valor}</strong>}
        {!pendiente && typeof navigator !== 'undefined' && navigator.clipboard && (
          <button
            type="button"
            className="enlace-boton pequeno"
            onClick={async () => {
              await navigator.clipboard.writeText(valor).catch(() => undefined);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            }}
            aria-label={`Copiar ${etiqueta.toLowerCase()}`}
          >
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        )}
      </dd>
    </div>
  );
}
