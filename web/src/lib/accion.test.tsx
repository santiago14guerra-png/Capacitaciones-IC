import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAccion } from './accion';

function Prueba({ hacer }: { hacer: () => Promise<void> }) {
  const [ejecutar, ocupado] = useAccion(hacer);
  return (
    <button type="button" onClick={ejecutar} aria-busy={ocupado}>
      Hacer
    </button>
  );
}

describe('useAccion', () => {
  it('ignora el segundo clic mientras la acción está en curso', async () => {
    let terminar = () => {};
    const hacer = vi.fn(() => new Promise<void>((r) => (terminar = r)));
    render(<Prueba hacer={hacer} />);
    const boton = screen.getByRole('button');
    fireEvent.click(boton);
    fireEvent.click(boton);
    fireEvent.doubleClick(boton);
    expect(hacer).toHaveBeenCalledTimes(1);
    expect(boton.getAttribute('aria-busy')).toBe('true');
    await act(async () => terminar());
    expect(boton.getAttribute('aria-busy')).toBe('false');
    fireEvent.click(boton);
    expect(hacer).toHaveBeenCalledTimes(2);
  });

  it('se libera aunque la acción falle', async () => {
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {});
    const hacer = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(undefined);
    render(<Prueba hacer={hacer} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(hacer).toHaveBeenCalledTimes(2);
    consola.mockRestore();
  });
});
