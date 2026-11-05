import { useEffect, useRef, useState } from 'react';
import { limpiarHtml } from '../lib/html';

interface Props {
  id: string;
  valor: string;
  alCambiar(html: string): void;
  invalido?: boolean;
  etiquetadoPor: string;
}

/**
 * Editor mínimo (HU-05 CA1): negrita, listas y enlaces. Lo que se pega entra como texto plano
 * para no arrastrar formatos de Word o del correo. El servidor sanea el resultado.
 */
export function EditorTexto({ id, valor, alCambiar, invalido, etiquetadoPor }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const seleccion = useRef<Range | null>(null);
  const [enlace, setEnlace] = useState<string | null>(null);

  useEffect(() => {
    // Solo entra aquí con contenido que llega de afuera, nunca mientras se escribe.
    if (ref.current && ref.current.innerHTML !== valor) ref.current.innerHTML = limpiarHtml(valor);
  }, [valor]);

  const emitir = () => alCambiar(ref.current?.innerHTML ?? '');
  const guardarSeleccion = () => {
    const s = window.getSelection();
    if (s && s.rangeCount && ref.current?.contains(s.anchorNode))
      seleccion.current = s.getRangeAt(0);
  };
  const restaurar = () => {
    const s = window.getSelection();
    ref.current?.focus();
    if (s && seleccion.current) {
      s.removeAllRanges();
      s.addRange(seleccion.current);
    }
  };
  const comando = (nombre: string, valorComando?: string) => {
    restaurar();
    document.execCommand(nombre, false, valorComando);
    emitir();
  };

  return (
    <div className="editor">
      <div
        className="editor-barra"
        role="toolbar"
        aria-label="Formato"
        onMouseDown={guardarSeleccion}
      >
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => comando('bold')}
        >
          <strong>N</strong> <span className="oculto-visual">Negrita</span>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => comando('insertUnorderedList')}
        >
          • Lista
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => comando('insertOrderedList')}
        >
          1. Lista
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setEnlace('https://')}
        >
          Enlace
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => comando('unlink')}
        >
          Quitar enlace
        </button>
      </div>
      {enlace !== null && (
        <div className="fila editor-enlace">
          <label htmlFor={`${id}-url`}>Dirección del enlace</label>
          <input
            id={`${id}-url`}
            type="url"
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
            style={{ flex: 1, width: 'auto' }}
          />
          <button
            type="button"
            className="boton pequeno"
            onClick={() => {
              if (/^(https?:\/\/|mailto:)/i.test(enlace)) comando('createLink', enlace);
              setEnlace(null);
            }}
          >
            Aplicar
          </button>
          <button type="button" className="enlace-boton" onClick={() => setEnlace(null)}>
            Cancelar
          </button>
        </div>
      )}
      <div
        id={id}
        ref={ref}
        className="editor-area contenido-html"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-labelledby={etiquetadoPor}
        aria-invalid={invalido || undefined}
        aria-describedby={invalido ? `${id}-error` : undefined}
        onInput={emitir}
        onBlur={guardarSeleccion}
        onKeyUp={guardarSeleccion}
        onMouseUp={guardarSeleccion}
        onPaste={(e) => {
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
          emitir();
        }}
        suppressContentEditableWarning
      />
    </div>
  );
}
