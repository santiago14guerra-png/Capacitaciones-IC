import { beforeAll, describe, expect, it } from 'vitest';
import { invalidarCatalogo } from '../src/application/catalogo.js';
import { sembrarCategorias } from '../src/application/categorias.js';
import { ADMIN, CLIENTE, OTRO_CLIENTE, prepararEntorno } from './entorno.js';
import { DATOS_PERFIL, fichaDePrueba } from './fabricas.js';

const e = prepararEntorno();
beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'f1', titulo: 'Arriendo', precio: 35000 }));
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'f2', precio: 20000 }));
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'gratis', precio: 0 }));
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'borr', estado: 'BORRADOR' }));
  invalidarCatalogo(e.ctx);
});
const comprar = (id: string, token = CLIENTE) =>
  e.json(`/fichas/${id}/compra`, { token, cuerpo: {} });

describe('HU-11 · solicitar compra', () => {
  it('exige sesión y datos de facturación', async () => {
    expect((await comprar('f1', '')).estado).toBe(401);
    const r = await comprar('f1');
    expect(r.estado).toBe(422);
    expect(r.datos.campos).toHaveProperty('perfil');
  });

  it('crea la compra con referencia única, datos bancarios y estado «Pendiente de pago»', async () => {
    await e.json('/perfil', { metodo: 'PUT', token: CLIENTE, cuerpo: DATOS_PERFIL });
    const r = await comprar('f1');
    expect(r.estado).toBe(201);
    expect(r.datos).toMatchObject({
      id: 'ana.f1',
      referencia: 'RPN-000001',
      fichaTitulo: 'Arriendo',
      valor: 35000,
      estado: 'PENDIENTE_PAGO',
      tieneComprobante: false,
      datosBancarios: {
        banco: '[PENDIENTE: banco]',
        tipoCuenta: '[PENDIENTE: tipo de cuenta]',
        numeroCuenta: '[PENDIENTE: número de cuenta]',
        titular: '[PENDIENTE: titular de la cuenta]',
      },
    });
  });

  it('es idempotente: pedirla otra vez devuelve la misma referencia', async () => {
    expect((await comprar('f1')).datos.referencia).toBe('RPN-000001');
  });

  it('las referencias son consecutivas aun con solicitudes simultáneas', async () => {
    await e.json('/perfil', { metodo: 'PUT', token: OTRO_CLIENTE, cuerpo: DATOS_PERFIL });
    const [a, b] = await Promise.all([comprar('f2'), comprar('f2', OTRO_CLIENTE)]);
    expect(new Set([a.datos.referencia, b.datos.referencia])).toEqual(
      new Set(['RPN-000002', 'RPN-000003']),
    );
  });

  it('solo el dueño ve su compra', async () => {
    expect((await e.json('/compras/ana.f1', { token: CLIENTE })).estado).toBe(200);
    expect((await e.json('/compras/ana.f1', { token: OTRO_CLIENTE })).estado).toBe(404);
    expect((await e.json('/compras/basura', { token: CLIENTE })).estado).toBe(404);
  });

  it('el detalle de la ficha muestra la compra en curso sin dar acceso', async () => {
    const r = await e.json('/fichas/f1', { token: CLIENTE });
    expect(r.datos).toMatchObject({
      tieneAcceso: false,
      compra: { id: 'ana.f1', estado: 'PENDIENTE_PAGO', referencia: 'RPN-000001' },
    });
    expect(r.datos.respuestaHtml).toBeUndefined();
  });

  it('no permite comprar fichas gratuitas, no publicadas ni al personal', async () => {
    expect((await comprar('gratis')).estado).toBe(409);
    expect((await comprar('borr')).estado).toBe(404);
    expect((await comprar('f1', ADMIN)).estado).toBe(409);
  });
});
