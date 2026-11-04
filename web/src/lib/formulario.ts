import { useState, type ChangeEvent } from 'react';
import type { ZodType } from 'zod';
import { ErrorApi } from './api';

export type Errores = Record<string, string>;

export function erroresDe(issues: { path: PropertyKey[]; message: string }[]): Errores {
  const e: Errores = {};
  for (const i of issues) e[i.path.join('.')] ??= i.message;
  return e;
}

/** Estado de un formulario con validación compartida (zod) y errores junto a cada campo. */
export function useFormulario<T extends Record<string, unknown>>(inicial: T) {
  const [valores, setValores] = useState<T>(inicial);
  const [errores, setErrores] = useState<Errores>({});

  const poner = <K extends keyof T>(nombre: K, valor: T[K]) => {
    setValores((v) => ({ ...v, [nombre]: valor }));
    setErrores(({ [nombre as string]: _, ...resto }) => resto);
  };

  const campo = (nombre: keyof T & string) => ({
    id: nombre,
    name: nombre,
    value: String(valores[nombre] ?? ''),
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      poner(nombre, e.target.value as T[typeof nombre]),
    'aria-invalid': errores[nombre] ? true : undefined,
    'aria-describedby': errores[nombre] ? `${nombre}-error` : undefined,
  });

  const enfocarPrimerError = (e: Errores) => {
    const primero = Object.keys(e)[0];
    if (primero) setTimeout(() => document.getElementById(primero)?.focus(), 0);
  };

  /** Devuelve los datos válidos o null y marca los errores. */
  const validar = <S>(esquema: ZodType<S>, datos: unknown = valores): S | null => {
    const r = esquema.safeParse(datos);
    if (r.success) {
      setErrores({});
      return r.data;
    }
    const e = erroresDe(r.error.issues);
    setErrores(e);
    enfocarPrimerError(e);
    return null;
  };

  /** Lleva a los campos los errores 422 que devuelve la API. */
  const errorApi = (err: unknown) => {
    if (err instanceof ErrorApi && Object.keys(err.campos).length) {
      setErrores(err.campos);
      enfocarPrimerError(err.campos);
      return true;
    }
    return false;
  };

  return { valores, setValores, errores, setErrores, poner, campo, validar, errorApi };
}
