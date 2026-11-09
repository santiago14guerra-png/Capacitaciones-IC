import type { Perfil } from './perfil.js';

const VARIANTES: Record<string, string> = {
  a: 'aáàä',
  e: 'eéèë',
  i: 'iíìï',
  o: 'oóòö',
  u: 'uúùü',
  n: 'nñ',
};
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Patrón que encuentra la palabra sin importar tildes ni mayúsculas. */
const flexible = (palabra: string) =>
  [...palabra.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()]
    .map((ch) => (VARIANTES[ch] ? `[${VARIANTES[ch]}]` : escapar(ch)))
    .join('');
const palabraCompleta = (patron: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${patron}(?![\\p{L}\\p{N}])`, 'giu');
const soloDigitos = (s: string) => s.replace(/\D/g, '');
/** Dígitos con separadores opcionales: 43123456 también encuentra 43.123.456. */
const digitosFlexibles = (d: string) => [...d].map(escapar).join('[\\s.\\-]?');

/**
 * HU-20: quita los datos del cliente antes de convertir una respuesta en ficha.
 * Reemplaza sus nombres, documento, correo, celular y dirección, y además cualquier correo,
 * celular colombiano o número de documento precedido de «C.C.», «cédula», «NIT» o similar.
 * El resultado es un borrador: el director lo revisa antes de publicar.
 */
export function anonimizar(texto: string, p?: Partial<Perfil>): string {
  let r = texto;
  const reemplazar = (re: RegExp, por: string) => (r = r.replace(re, por));

  if (p?.correo) reemplazar(new RegExp(escapar(p.correo), 'gi'), '[correo]');
  reemplazar(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[correo]');

  if (p?.direccion?.trim())
    reemplazar(
      new RegExp(flexible(p.direccion.trim()).replace(/\\? /g, '\\s+'), 'giu'),
      '[dirección]',
    );

  const doc = soloDigitos(p?.numeroDocumento ?? '');
  if (doc.length >= 5) reemplazar(palabraCompleta(digitosFlexibles(doc)), '[documento]');
  reemplazar(
    /\b(c\.?\s?c\.?|c[eé]dula(\s+de\s+ciudadan[ií]a)?|nit|documento(\s+de\s+identidad)?|pasaporte)(\s*(n[oº°.]*|número)?\s*[:#]?\s*)[\d.\s-]{5,15}\d/giu,
    '$1$4[documento]',
  );

  const cel = soloDigitos(p?.celular ?? '').replace(/^57(?=3\d{9}$)/, '');
  if (cel.length >= 7)
    reemplazar(new RegExp(`(\\+?57[\\s-]?)?${digitosFlexibles(cel)}`, 'g'), '[celular]');
  reemplazar(/(?<!\d)(\+?57[\s-]?)?3\d{2}[\s-]?\d{3}[\s-]?\d{4}(?!\d)/g, '[celular]');

  const nombres = `${p?.nombres ?? ''} ${p?.apellidos ?? ''}`
    .split(/\s+/)
    .filter((n) => n.length >= 3);
  for (const n of [...new Set(nombres)].sort((a, b) => b.length - a.length)) {
    reemplazar(palabraCompleta(flexible(n)), '[cliente]');
  }
  // «[cliente] [cliente]» → «[cliente]»
  return r.replace(/\[cliente\](\s+\[cliente\])+/g, '[cliente]');
}
