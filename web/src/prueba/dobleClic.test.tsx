import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  renderizar,
  SESION_ADMIN,
  SESION_CLIENTE,
  simularApi,
  transporteFalso,
} from './utilidades';

/** Respuesta que tarda: así el segundo clic llega mientras la primera acción sigue en curso. */
const lenta = (valor: unknown) => () => new Promise((r) => setTimeout(() => r(valor), 50));
const dobleClic = (boton: HTMLElement) => {
  fireEvent.click(boton);
  fireEvent.click(boton);
  fireEvent.doubleClick(boton);
};

describe('doble clic: cada acción se hace una sola vez', () => {
  it('aprobar un pago', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_ADMIN,
      'GET /admin/compras': [
        {
          id: 'ana.f1',
          referencia: 'RPN-1',
          fichaId: 'f1',
          fichaTitulo: 'F',
          valor: 1,
          estado: 'EN_VERIFICACION',
          tieneComprobante: true,
          creadaEn: '2026-11-01T00:00:00Z',
          actualizadaEn: '2026-11-01T00:00:00Z',
          clienteNombre: 'Ana',
          clienteCorreo: 'a@b.co',
        },
      ],
      'PATCH /admin/compras/ana.f1': lenta({}),
    });
    renderizar('/panel/pagos', { conSesion: true });
    const aprobar = await screen.findByRole('button', { name: 'Aprobar' });
    dobleClic(aprobar);
    expect(aprobar.getAttribute('aria-busy')).toBe('true');
    await waitFor(() => expect(llamadas.filter((l) => l.metodo === 'PATCH')).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 80));
    expect(llamadas.filter((l) => l.metodo === 'PATCH')).toHaveLength(1);
  });

  it('comprar una ficha', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_CLIENTE,
      'GET /fichas/f1': {
        id: 'f1',
        titulo: 'F',
        resumen: 'R',
        pregunta: 'P',
        categoriaId: 'a',
        categoriaNombre: 'A',
        etiquetas: [],
        normas: [],
        precio: 1000,
        vigenteA: '2026-10-01T00:00:00Z',
        estado: 'PUBLICADA',
        enRevision: false,
        relacionadas: [],
        tieneAcceso: false,
      },
      'POST /compras': lenta({ id: 'ana.f1' }),
      'GET /compras/ana.f1': {},
    });
    renderizar('/fichas/f1', { conSesion: true });
    dobleClic(await screen.findByRole('button', { name: /Comprar por transferencia/ }));
    await waitFor(() => expect(llamadas.filter((l) => l.metodo === 'POST')).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 80));
    expect(llamadas.filter((l) => l.metodo === 'POST')).toHaveLength(1);
  });

  it('enviar una consulta con doble clic o Enter repetido', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_CLIENTE,
      'GET /categorias': [{ id: 'a', nombre: 'Arrendamientos', orden: 0, activa: true }],
      'POST /consultas': lenta({ id: 'c1', radicado: 'RAD-1', recibidaEn: '2026-11-02T15:00:00Z' }),
    });
    renderizar('/consultas/nueva', { conSesion: true });
    await screen.findByRole('option', { name: 'Arrendamientos' });
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'a' } });
    fireEvent.change(screen.getByLabelText('Asunto'), { target: { value: 'Arriendo' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'Mi caso' } });
    const boton = screen.getByRole('button', { name: 'Enviar consulta' });
    dobleClic(boton);
    fireEvent.submit(boton.closest('form')!);
    await screen.findByText('RAD-1');
    expect(llamadas.filter((l) => l.metodo === 'POST' && l.ruta === '/consultas')).toHaveLength(1);
  });

  it('ingresar', async () => {
    simularApi({ 'GET /sesion': SESION_CLIENTE });
    const transporte = transporteFalso({
      ingresar: async () => {
        await new Promise((r) => setTimeout(r, 50));
        return { acceso: 'a', actualizacion: 'r', expiraEn: 900 };
      },
    });
    const espia = transporte.ingresar;
    const contador = { n: 0 };
    transporte.ingresar = async (...a) => {
      contador.n++;
      return espia(...a);
    };
    renderizar('/ingresar', { transporte });
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'a@b.co' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'x' } });
    dobleClic(screen.getByRole('button', { name: 'Ingresar' }));
    await waitFor(() => expect(contador.n).toBe(1));
    await new Promise((r) => setTimeout(r, 80));
    expect(contador.n).toBe(1);
  });
});
