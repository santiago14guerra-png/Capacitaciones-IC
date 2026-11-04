import { useEffect } from 'react';

/**
 * Muestra con una entrada suave los elementos `.revelar` cuando llegan a la pantalla.
 * Si el navegador no puede o la persona pidió reducir el movimiento, no se oculta nada.
 */
export function useRevelar(raiz: () => HTMLElement | null) {
  useEffect(() => {
    const contenedor = raiz();
    const reducir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!contenedor || reducir || typeof IntersectionObserver === 'undefined') return;
    document.documentElement.classList.add('con-revelar');

    const visor = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('revelado');
          visor.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    const observar = () => {
      contenedor.querySelectorAll<HTMLElement>('.revelar:not(.revelado)').forEach((el) => {
        if (el.dataset.observado) return;
        el.dataset.observado = '1';
        const hermanos = [...(el.parentElement?.children ?? [])].filter((h) =>
          h.classList.contains('revelar'),
        );
        el.style.setProperty('--orden', String(Math.min(hermanos.indexOf(el), 5)));
        visor.observe(el);
      });
    };
    observar();
    const cambios = new MutationObserver(observar);
    cambios.observe(contenedor, { childList: true, subtree: true });
    return () => {
      visor.disconnect();
      cambios.disconnect();
      document.documentElement.classList.remove('con-revelar');
    };
  }, [raiz]);
}
