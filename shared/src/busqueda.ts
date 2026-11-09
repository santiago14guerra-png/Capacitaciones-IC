import { normalizar } from './texto.js';

/** Palabras que no ayudan a encontrar una ficha. */
const VACIAS = new Set(
  'a al ante con de del e el en es la las le les lo los mi mis me o para por que se si sin su sus un una unos unas y yo u tu como cual'.split(
    ' ',
  ),
);

/** Quita el plural más común para que «pensiones» encuentre «pensión». */
export const raiz = (palabra: string) =>
  palabra.length > 4 && palabra.endsWith('es')
    ? palabra.slice(0, -2)
    : palabra.length > 3 && palabra.endsWith('s')
      ? palabra.slice(0, -1)
      : palabra;

export const palabras = (texto: string) => normalizar(texto).match(/[\p{L}\p{N}]+/gu) ?? [];

/** Términos de búsqueda normalizados, sin palabras vacías ni repetidos. */
export function terminosBusqueda(consulta: string): string[] {
  const todas = [...new Set(palabras(consulta))].filter((p) => p.length >= 2);
  const utiles = todas.filter((p) => !VACIAS.has(p));
  return (utiles.length ? utiles : todas).map(raiz);
}

export interface Segmento {
  texto: string;
  marcado: boolean;
}

/** HU-09 CA3: parte el texto en segmentos y marca las palabras que coinciden con la búsqueda. */
export function resaltar(texto: string, terminos: string[]): Segmento[] {
  const original = texto.normalize('NFC');
  const base = normalizar(original);
  if (!terminos.length || base.length !== original.length)
    return [{ texto: original, marcado: false }];
  const segmentos: Segmento[] = [];
  let ultimo = 0;
  for (const m of base.matchAll(/[\p{L}\p{N}]+/gu)) {
    const r = raiz(m[0]);
    if (
      !terminos.some((t) => r.startsWith(t) || (t.length > 3 && t.startsWith(r) && r.length >= 4))
    )
      continue;
    if (m.index > ultimo)
      segmentos.push({ texto: original.slice(ultimo, m.index), marcado: false });
    segmentos.push({ texto: original.slice(m.index, m.index + m[0].length), marcado: true });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < original.length) segmentos.push({ texto: original.slice(ultimo), marcado: false });
  return segmentos;
}
