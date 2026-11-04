import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta una acción una sola vez aunque se haga doble clic o se pulse Enter dos veces.
 * El bloqueo es inmediato (una referencia, no un estado), así que el segundo clic se ignora
 * incluso antes de que React vuelva a pintar. `ocupado` sirve para deshabilitar el botón y
 * mostrar que está trabajando.
 */
export function useAccion<A extends unknown[]>(accion: (...args: A) => unknown) {
  const enCurso = useRef(false);
  const montado = useRef(true);
  const actual = useRef(accion);
  const [ocupado, setOcupado] = useState(false);
  actual.current = accion;

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const ejecutar = useCallback(async (...args: A) => {
    const evento = args[0] as { preventDefault?: () => void } | undefined;
    if (evento && typeof evento === 'object' && typeof evento.preventDefault === 'function') {
      evento.preventDefault();
    }
    if (enCurso.current) return;
    enCurso.current = true;
    setOcupado(true);
    try {
      await actual.current(...args);
    } catch (e) {
      // Cada pantalla muestra sus propios errores; aquí solo se evita una promesa sin atender.
      console.error(e);
    } finally {
      enCurso.current = false;
      if (montado.current) setOcupado(false);
    }
  }, []);

  return [ejecutar, ocupado] as const;
}
