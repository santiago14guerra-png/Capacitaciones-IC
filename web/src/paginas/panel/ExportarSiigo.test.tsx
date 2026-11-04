import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderizar, SESION_ADMIN, simularApi } from '../../prueba/utilidades';

describe('HU-19 · exportar para Siigo', () => {
  it('pide el Excel del periodo elegido', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const llamadas = simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/exportaciones/siigo': () => new Response(new Blob(['xlsx']), { status: 200 }),
    });
    renderizar('/panel/siigo', { conSesion: true });
    fireEvent.change(await screen.findByLabelText('Desde'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Descargar Excel' }));
    await waitFor(() => {
      const u = llamadas.find((l) => l.ruta === '/admin/exportaciones/siigo')!.url;
      expect([u.searchParams.get('desde'), u.searchParams.get('hasta')]).toEqual([
        '2026-11-01',
        '2026-11-30',
      ]);
    });
  });
});
