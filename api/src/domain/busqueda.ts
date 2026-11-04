import { normalizar, palabras, raiz } from '@ic/shared';
import type { FichaMeta } from './ficha.js';

/** Registro de una búsqueda (HU-09 CA5), sin datos de quien busca. */
export interface Busqueda {
  termino: string;
  fecha: string;
  resultados: number;
}

type Campo = 'titulo' | 'etiquetas' | 'resumen' | 'pregunta';
/** HU-09 CA1: campos en los que se busca y cuánto pesa cada uno. */
const PESOS: Record<Campo, number> = { titulo: 5, etiquetas: 4, resumen: 2, pregunta: 1 };

export interface Indexada {
  ficha: FichaMeta;
  raices: Record<Campo, string[]>;
  titulo: string;
}

/** Prepara una ficha una sola vez para puntuarla muchas veces. */
export const indexar = (ficha: FichaMeta): Indexada => ({
  ficha,
  titulo: normalizar(ficha.titulo),
  raices: {
    titulo: palabras(ficha.titulo).map(raiz),
    etiquetas: palabras(ficha.etiquetas.join(' ')).map(raiz),
    resumen: palabras(ficha.resumen).map(raiz),
    pregunta: palabras(ficha.pregunta).map(raiz),
  },
});

function coincidencia(raices: string[], termino: string): number {
  let mejor = 0;
  for (const r of raices) {
    if (r === termino) return 1;
    if (termino.length >= 3 && r.startsWith(termino)) mejor = Math.max(mejor, 0.6);
  }
  return mejor;
}

/**
 * HU-09 CA3: relevancia. Por cada término cuenta el campo más importante donde aparece;
 * premia que aparezcan todos los términos y que el título contenga la frase completa.
 */
export function puntuar(f: Indexada, terminos: string[], frase: string): number {
  let total = 0;
  let encontrados = 0;
  for (const t of terminos) {
    let mejor = 0;
    for (const campo of Object.keys(PESOS) as Campo[]) {
      mejor = Math.max(mejor, PESOS[campo] * coincidencia(f.raices[campo], t));
    }
    if (mejor > 0) encontrados++;
    total += mejor;
  }
  if (!encontrados) return 0;
  const cobertura = encontrados / terminos.length;
  const bonoFrase = frase.length >= 3 && f.titulo.includes(frase) ? 3 : 0;
  return total * cobertura * cobertura + bonoFrase;
}

export function buscar(indice: Indexada[], terminos: string[], consulta: string): FichaMeta[] {
  const frase = normalizar(consulta.trim());
  return indice
    .map((f) => ({ f: f.ficha, p: puntuar(f, terminos, frase) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p || (b.f.vigenteA ?? '').localeCompare(a.f.vigenteA ?? ''))
    .map((x) => x.f);
}
