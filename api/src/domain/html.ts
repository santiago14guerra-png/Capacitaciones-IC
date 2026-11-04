import sanitizeHtml from 'sanitize-html';

/**
 * Lista blanca del editor de respuestas (HU-05 CA1: negrita, listas y enlaces).
 * Se aplica al guardar en el servidor; el navegador vuelve a sanear al mostrar.
 */
export function sanearHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
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
    ],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
      div: 'p',
    },
  }).trim();
}
