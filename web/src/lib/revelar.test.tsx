import { act, render } from '@testing-library/react';
import { StrictMode, useCallback, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRevelar } from './revelar';

const visores = new Set<VisorFalso>();

/** Como el navegador: avisa después (no dentro de observe) y deja de avisar al desconectarse. */
class VisorFalso {
  private pendientes: Element[] = [];
  constructor(private avisar: IntersectionObserverCallback) {
    visores.add(this);
  }
  observe(el: Element) {
    this.pendientes.push(el);
  }
  unobserve() {}
  disconnect() {
    visores.delete(this);
  }
  entregar() {
    const entradas = this.pendientes.map(
      (target) => ({ isIntersecting: true, target }) as IntersectionObserverEntry,
    );
    this.pendientes = [];
    this.avisar(entradas, this as never);
  }
}

function Pagina() {
  const ref = useRef<HTMLDivElement>(null);
  useRevelar(useCallback(() => ref.current, []));
  return (
    <div ref={ref}>
      <p className="revelar">Busque su caso</p>
      <p className="revelar">Obtenga la respuesta</p>
    </div>
  );
}

describe('useRevelar', () => {
  beforeEach(() => {
    visores.clear();
    vi.stubGlobal('IntersectionObserver', VisorFalso);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('muestra los elementos aunque React monte el efecto dos veces (primer ingreso)', () => {
    const { getByText } = render(
      <StrictMode>
        <Pagina />
      </StrictMode>,
    );
    act(() => visores.forEach((v) => v.entregar()));
    expect(getByText('Busque su caso').classList.contains('revelado')).toBe(true);
    expect(getByText('Obtenga la respuesta').classList.contains('revelado')).toBe(true);
  });
});
