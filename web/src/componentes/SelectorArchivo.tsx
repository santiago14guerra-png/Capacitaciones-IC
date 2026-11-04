import { useState } from 'react';
import { errorArchivo } from '../lib/subida';

/** Selector de archivo grande y claro (JPG, PNG o PDF, máx. 5 MB). */
export function SelectorArchivo({
  id,
  etiqueta,
  alElegir,
}: {
  id: string;
  etiqueta: string;
  alElegir(f: File | null): void;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-ayuda`}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          const err = f ? errorArchivo(f) : null;
          setError(err);
          alElegir(err ? null : f);
        }}
      />
      <span className="ayuda" id={`${id}-ayuda`}>
        JPG, PNG o PDF de máximo 5 MB.
      </span>
      {error && (
        <span className="error-campo" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
