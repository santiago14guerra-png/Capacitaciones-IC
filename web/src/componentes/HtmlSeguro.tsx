import { limpiarHtml } from '../lib/html';

export function HtmlSeguro({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={className ?? 'contenido-html'}
      dangerouslySetInnerHTML={{ __html: limpiarHtml(html) }}
    />
  );
}
