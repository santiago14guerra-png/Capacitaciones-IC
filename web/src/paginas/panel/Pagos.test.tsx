import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, SESION_ADMIN, simularApi } from '../../prueba/utilidades';

const pago = {
  id: 'ana.f1',
  referencia: 'RPN-000123',
  fichaId: 'f1',
  fichaTitulo: 'Arriendo',
  valor: 35000,
  estado: 'EN_VERIFICACION',
  tieneComprobante: true,
  creadaEn: '2026-11-01T00:00:00Z',
  actualizadaEn: '2026-11-01T00:00:00Z',
  clienteNombre: 'Ana Ruiz',
  clienteCorreo: 'ana@correo.co',
};

describe('HU-13 · bandeja de pagos', () => {
  it('muestra cliente, ficha, valor, referencia y comprobante, y aprueba', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/compras': [pago],
      'PATCH /admin/compras/ana.f1': {},
    });
    renderizar('/panel/pagos', { conSesion: true });
    const fila = (await screen.findByText('Ana Ruiz')).closest('tr')!;
    for (const t of ['ana@correo.co', 'Arriendo', 'RPN-000123', 'Ver comprobante'])
      expect(fila.textContent).toContain(t);
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    await waitFor(() =>
      expect(llamadas.find((l) => l.metodo === 'PATCH')?.cuerpo).toEqual({ decision: 'APROBAR' }),
    );
  });

  it('rechazar exige escribir un motivo', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/compras': [pago],
      'PATCH /admin/compras/ana.f1': {},
    });
    renderizar('/panel/pagos', { conSesion: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Rechazar' }));
    const confirmar = screen.getByRole('button', {
      name: 'Confirmar rechazo',
    }) as HTMLButtonElement;
    expect(confirmar.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Motivo (lo verá el cliente)'), {
      target: { value: 'No coincide el valor' },
    });
    fireEvent.click(confirmar);
    await waitFor(() =>
      expect(llamadas.find((l) => l.metodo === 'PATCH')?.cuerpo).toEqual({
        decision: 'RECHAZAR',
        motivo: 'No coincide el valor',
      }),
    );
  });
});
