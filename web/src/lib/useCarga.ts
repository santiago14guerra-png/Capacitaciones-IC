import { useCallback, useEffect, useState, type DependencyList } from 'react';
import { ErrorApi } from './api';

/** Carga datos de la API y expone estado de carga, error y recarga. */
export function useCarga<T>(cargar: (senal: AbortSignal) => Promise<T>, deps: DependencyList) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<ErrorApi | null>(null);
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const control = new AbortController();
    setCargando(true);
    setError(null);
    cargar(control.signal)
      .then((d) => !control.signal.aborted && setDatos(d))
      .catch((e) => {
        if (control.signal.aborted) return;
        setError(
          e instanceof ErrorApi
            ? e
            : new ErrorApi(0, 'RED', 'No pudimos conectarnos. Revise su conexión.'),
        );
      })
      .finally(() => !control.signal.aborted && setCargando(false));
    return () => control.abort();
  }, [...deps, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return { datos, setDatos, error, cargando, recargar };
}
