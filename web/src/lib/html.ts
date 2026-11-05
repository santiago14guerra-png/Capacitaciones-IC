import DOMPurify from 'dompurify';

const ETIQUETAS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'a',
  'h3',
  'h4',
  'blockquote',
];

DOMPurify.addHook('afterSanitizeAttributes', (nodo) => {
  if (nodo.tagName === 'A') {
    nodo.setAttribute('target', '_blank');
    nodo.setAttribute('rel', 'noopener noreferrer');
  }
});

/** Segunda capa: el servidor ya sanea al guardar; aquí se vuelve a sanear al mostrar. */
export const limpiarHtml = (html: string) =>
  DOMPurify.sanitize(html, { ALLOWED_TAGS: ETIQUETAS, ALLOWED_ATTR: ['href', 'target', 'rel'] });
