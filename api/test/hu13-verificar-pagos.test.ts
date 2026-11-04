import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { sembrarCategorias } from '../src/application/categorias.js';
import { ADMIN, CLIENTE, DIRECTOR, OTRO_CLIENTE, prepararEntorno } from './entorno.js';
import { fichaDePrueba } from './fabricas.js';
import { compraEnVerificacion } from './flujo-compra.js';

const e = prepararEntorno();
const SECRETO = 'RESPUESTA-PAGADA';
beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.ctx.fichas.guardar(
    fichaDePrueba({
      id: 'f1',
      titulo: 'Arriendo',
      precio: 35000,
      respuestaHtml: `<p>${SECRETO}</p>`,
    }),
  );
  await compraEnVerificacion(e, CLIENTE, 'f1');
  await compraEnVerificacion(e, OTRO_CLIENTE, 'f1');
});
afterEach(() => vi.restoreAllMocks());

describe('HU-13 · verificar o rechazar pagos', () => {
  it('solo el personal ve la bandeja', async () => {
    expect((await e.json('/admin/pagos', { token: CLIENTE })).estado).toBe(403);
  });

  it('lista compras en verificación con cliente, ficha, valor, referencia y comprobante', async () => {
    const r = await e.json('/admin/pagos', { token: ADMIN });
    expect(r.datos).toHaveLength(2);
    expect(r.datos[0]).toMatchObject({
      id: 'ana.f1',
      clienteNombre: 'Ana María Ruiz Gómez',
      clienteCorreo: 'ana@correo.co',
      fichaTitulo: 'Arriendo',
      valor: 35000,
      referencia: 'RPN-000001',
      tieneComprobante: true,
    });
    expect(r.datos[0]).not.toHaveProperty('datosBancarios');
    expect(
      (await e.json('/admin/pagos/ana.f1/comprobante', { token: ADMIN })).datos.url,
    ).toBeTruthy();
  });

  it('aprobar habilita el acceso de inmediato y registra quién y cuándo', async () => {
    expect((await e.json('/fichas/f1', { token: CLIENTE })).datos.tieneAcceso).toBe(false);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const r = await e.json('/admin/pagos/ana.f1/decision', {
      token: DIRECTOR,
      cuerpo: { decision: 'APROBAR' },
    });
    expect(r.datos).toMatchObject({
      estado: 'APROBADA',
      decididaPor: 'director',
      decididaEn: e.reloj.ahora().toISOString(),
      aprobadaEn: e.reloj.ahora().toISOString(),
    });
    expect(JSON.parse(log.mock.calls[0]![0] as string)).toMatchObject({
      evento: 'decision-pago',
      usuario: 'director',
      referencia: 'RPN-000001',
      estado: 'APROBADA',
    });
    const ficha = await e.json('/fichas/f1', { token: CLIENTE });
    expect(ficha.datos).toMatchObject({ tieneAcceso: true, respuestaHtml: `<p>${SECRETO}</p>` });
  });

  it('impide la doble aprobación', async () => {
    const r = await e.json('/admin/pagos/ana.f1/decision', {
      token: ADMIN,
      cuerpo: { decision: 'APROBAR' },
    });
    expect(r.estado).toBe(409);
  });

  it('rechazar exige un motivo que luego ve el cliente', async () => {
    const sin = await e.json('/admin/pagos/beto.f1/decision', {
      token: ADMIN,
      cuerpo: { decision: 'RECHAZAR', motivo: ' ' },
    });
    expect(sin.estado).toBe(422);
    await e.json('/admin/pagos/beto.f1/decision', {
      token: ADMIN,
      cuerpo: { decision: 'RECHAZAR', motivo: 'El valor transferido no coincide' },
    });
    const vista = await e.json('/compras/beto.f1', { token: OTRO_CLIENTE });
    expect(vista.datos).toMatchObject({
      estado: 'RECHAZADA',
      motivoRechazo: 'El valor transferido no coincide',
    });
    expect((await e.json('/fichas/f1', { token: OTRO_CLIENTE })).datos.tieneAcceso).toBe(false);
  });

  it('tras un rechazo el cliente puede volver a comprar con una referencia nueva', async () => {
    const r = await e.json('/fichas/f1/compra', { token: OTRO_CLIENTE, cuerpo: {} });
    expect(r.datos).toMatchObject({ estado: 'PENDIENTE_PAGO', referencia: 'RPN-000003' });
    expect(r.datos.motivoRechazo).toBeUndefined();
  });

  it('la bandeja puede consultar el historial por estado', async () => {
    const aprobadas = await e.json('/admin/pagos?estado=APROBADA', { token: ADMIN });
    expect(aprobadas.datos.map((c: { id: string }) => c.id)).toEqual(['ana.f1']);
    expect((await e.json('/admin/pagos', { token: ADMIN })).datos).toEqual([]);
  });
});
