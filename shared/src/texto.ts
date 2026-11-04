/** Minúsculas y sin tildes: «Pensión» → «pension» (HU-09 CA2). La ñ se conserva. */
export const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/(?<!n)[̀-ͯ]|(?<=n)[̀-̂̄-ͯ]/gi, '')
    .normalize('NFC')
    .toLocaleLowerCase('es');

/** Identificador legible para URL: «Sucesiones y herencias» → «sucesiones-y-herencias». */
export const aSlug = (texto: string) =>
  normalizar(texto)
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
