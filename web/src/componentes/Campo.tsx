import type { ReactNode } from 'react';

export function Campo(p: {
  nombre: string;
  etiqueta: ReactNode;
  error?: string;
  ayuda?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="campo">
      <label htmlFor={p.nombre}>{p.etiqueta}</label>
      {p.children}
      {p.ayuda && <span className="ayuda">{p.ayuda}</span>}
      {p.error && (
        <span className="error-campo" id={`${p.nombre}-error`}>
          {p.error}
        </span>
      )}
    </div>
  );
}

export function AvisoError({ mensaje }: { mensaje?: string | null }) {
  if (!mensaje) return null;
  return (
    <div className="aviso error" role="alert">
      {mensaje}
    </div>
  );
}
