import { useEffect } from 'react';

const BASE = 'Respuestas para Personas Naturales';
export function useTitulo(titulo?: string) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${BASE}` : `${BASE} · Capacitaciones IC`;
  }, [titulo]);
}
