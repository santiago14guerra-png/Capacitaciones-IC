import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderizar, respuestaError, SESION_CLIENTE, simularApi } from '../../prueba/utilidades';

const ficha = {
  id: 'f1',
  titulo: 'Arriendo',
  resumen: 'R',
  pregunta: 'P',
  categoriaId: 'a',
  categoriaNombre: 'A',
  etiquetas: [],
  normas: [],
  precio: 35000,
  vigenteA: '2026-10-01T00:00:00Z',
  estado: 'PUBLICADA',
  enRevision: false,
  relacionadas: [],
  tieneAcceso: false,
};
const compra = {
  id: 'ana.f1',
  referencia: 'RPN-000123',
  fichaId: 'f1',
  fichaTitulo: 'Arriendo',
  valor: 35000,
  estado: 'PENDIENTE_PAGO',
  tieneComprobante: false,
  creadaEn: '2026-11-01T00:00:00Z',
  actualizadaEn: '2026-11-01T00:00:00Z',
  datosBancarios: {
    banco: '[PENDIENTE: banco]',
    tipoCuenta: 'Ahorros',
    numeroCuenta: '[PENDIENTE: número de cuenta]',
    titular: 'X',
  },
};

describe('HU-11 · solicitar compra', () => {
  it('desde la ficha crea la compra y muestra referencia, valor y datos bancarios', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_CLIENTE,
      'GET /fichas/f1': ficha,
      'POST /fichas/f1/compra': compra,
      'GET /compras/ana.f1': compra,
    });
    const { enrutador } = renderizar('/fichas/f1', { conSesion: true });
    fireEvent.click(await screen.findByRole('button', { name: /Comprar por transferencia/ }));
    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/compras/ana.f1'));
    expect(llamadas.some((l) => l.metodo === 'POST' && l.ruta === '/fichas/f1/compra')).toBe(true);
    expect(await screen.findByText('RPN-000123')).toBeTruthy();
    const texto = document.body.textContent!;
    for (const t of [
      'Pendiente de pago',
      'Ahorros',
      '[PENDIENTE: banco]',
      '[PENDIENTE: número de cuenta]',
      'Titular',
    ]) {
      expect(texto).toContain(t);
    }
    expect(texto.replace(/\s/g, ' ')).toMatch(/\$ ?35\.000/);
  });

  it('si faltan los datos de facturación lleva a completarlos y regresa a la ficha', async () => {
    simularApi({
      'GET /sesion': SESION_CLIENTE,
      'GET /fichas/f1': ficha,
      'POST /fichas/f1/compra': () =>
        respuestaError(422, 'VALIDACION', 'Complete', { perfil: 'x' }),
    });
    const { enrutador } = renderizar('/fichas/f1', { conSesion: true });
    fireEvent.click(await screen.findByRole('button', { name: /Comprar por transferencia/ }));
    await waitFor(() => expect(enrutador.state.location.pathname).toBe('/cuenta/completar'));
    expect(enrutador.state.location.search).toBe('?volver=%2Ffichas%2Ff1');
  });

  it('con una compra en curso lleva a sus datos en lugar de crear otra', async () => {
    simularApi({
      'GET /sesion': SESION_CLIENTE,
      'GET /fichas/f1': {
        ...ficha,
        compra: { id: 'ana.f1', estado: 'EN_VERIFICACION', referencia: 'RPN-000123' },
      },
    });
    renderizar('/fichas/f1', { conSesion: true });
    expect(
      await screen.findByRole('link', { name: 'Ver datos de pago y comprobante' }),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Comprar/ })).toBeNull();
    expect(screen.getByText('En verificación')).toBeTruthy();
  });
});

describe('HU-12 · cargar comprobante', () => {
  it('CA1: rechaza en el navegador tipos y tamaños no permitidos', async () => {
    simularApi({ 'GET /sesion': SESION_CLIENTE, 'GET /compras/ana.f1': compra });
    renderizar('/compras/ana.f1', { conSesion: true });
    const input = await screen.findByLabelText('Comprobante de la transferencia');
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'a.gif', { type: 'image/gif' })] },
    });
    expect((await screen.findByRole('alert')).textContent).toContain('JPG, PNG o PDF');
    const grande = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'a.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(input, { target: { files: [grande] } });
    expect((await screen.findByRole('alert')).textContent).toContain('supera 5 MB');
    expect(
      (screen.getByRole('button', { name: 'Enviar comprobante' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('CA2 y CA3: sube directo con la URL firmada, confirma y muestra «En verificación»', async () => {
    const llamadas = simularApi({
      'GET /sesion': SESION_CLIENTE,
      'GET /compras/ana.f1': compra,
      'POST /compras/ana.f1/comprobante/subida': {
        url: '/api/dev/archivos',
        llave: 'comprobantes/ana/f1/x.pdf',
        campos: { key: 'k' },
      },
      'POST /dev/archivos': () => new Response(null, { status: 204 }),
      'POST /compras/ana.f1/comprobante': {
        ...compra,
        estado: 'EN_VERIFICACION',
        tieneComprobante: true,
      },
    });
    renderizar('/compras/ana.f1', { conSesion: true });
    fireEvent.change(await screen.findByLabelText('Comprobante de la transferencia'), {
      target: { files: [new File(['%PDF'], 'c.pdf', { type: 'application/pdf' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar comprobante' }));
    expect(await screen.findByText(/Recibimos su comprobante/)).toBeTruthy();
    expect(llamadas.find((l) => l.ruta === '/compras/ana.f1/comprobante/subida')!.cuerpo).toEqual({
      nombre: 'c.pdf',
      tipo: 'application/pdf',
      tamano: 4,
    });
    expect(
      llamadas.find((l) => l.ruta === '/compras/ana.f1/comprobante' && l.metodo === 'POST')!.cuerpo,
    ).toEqual({
      llave: 'comprobantes/ana/f1/x.pdf',
    });
    expect(screen.getAllByText('En verificación').length).toBeGreaterThan(0);
  });
});
