import { beforeAll, describe, expect, it } from 'vitest';
import { sembrarCategorias } from '../src/application/categorias.js';
import { ADMIN, CLIENTE, OTRO_CLIENTE, prepararEntorno } from './entorno.js';
import { DATOS_PERFIL, fichaDePrueba } from './fabricas.js';
import { subir } from './subir.js';

const e = prepararEntorno();
const ID = 'ana.f1';
beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'f1', precio: 35000 }));
  await e.json('/perfil', { metodo: 'PUT', token: CLIENTE, cuerpo: DATOS_PERFIL });
  await e.json('/fichas/f1/compra', { token: CLIENTE, cuerpo: {} });
});
const pedirSubida = (cuerpo: object, token = CLIENTE) =>
  e.json(`/compras/${ID}/comprobante/subida`, { token, cuerpo });

describe('HU-12 · cargar comprobante', () => {
  it('CA1: acepta solo JPG, PNG o PDF de máximo 5 MB', async () => {
    expect((await pedirSubida({ nombre: 'x.gif', tipo: 'image/gif', tamano: 100 })).estado).toBe(
      422,
    );
    const grande = await pedirSubida({
      nombre: 'x.pdf',
      tipo: 'application/pdf',
      tamano: 6 * 1024 * 1024,
    });
    expect(grande.datos.campos.tamano).toBe('El archivo supera 5 MB');
  });

  it('CA1: la política de la URL rechaza un archivo más grande o de otro tipo que el declarado', async () => {
    const s = (await pedirSubida({ nombre: 'c.pdf', tipo: 'application/pdf', tamano: 1000 })).datos;
    expect((await subir(e, s, 5 * 1024 * 1024 + 1)).status).toBe(400);
    const otra = { ...s, campos: { ...s.campos, 'Content-Type': 'image/png' } };
    expect((await subir(e, otra, 1000)).status).toBe(403);
  });

  it('CA2: solo el dueño pide la URL de subida', async () => {
    expect(
      (await pedirSubida({ nombre: 'c.pdf', tipo: 'application/pdf', tamano: 10 }, OTRO_CLIENTE))
        .estado,
    ).toBe(404);
  });

  it('CA3: al confirmar la subida la compra pasa a «En verificación»', async () => {
    const s = (await pedirSubida({ nombre: 'c.png', tipo: 'image/png', tamano: 2000 })).datos;
    expect(s.llave).toMatch(/^comprobantes\/ana\/f1\/.+\.png$/);
    expect((await subir(e, s, 2000)).status).toBe(204);
    const r = await e.json(`/compras/${ID}/comprobante`, {
      token: CLIENTE,
      cuerpo: { llave: s.llave },
    });
    expect(r.estado).toBe(200);
    expect(r.datos).toMatchObject({ estado: 'EN_VERIFICACION', tieneComprobante: true });
  });

  it('no acepta una llave ajena ni un archivo que no llegó', async () => {
    const ajena = await e.json(`/compras/${ID}/comprobante`, {
      token: CLIENTE,
      cuerpo: { llave: 'comprobantes/beto/f1/x.png' },
    });
    expect(ajena.estado).toBe(422);
    const noLlego = await e.json(`/compras/${ID}/comprobante`, {
      token: CLIENTE,
      cuerpo: { llave: 'comprobantes/ana/f1/no-existe.png' },
    });
    expect(noLlego.datos.mensaje).toContain('No recibimos el archivo');
  });

  it('CA2: el dueño y el personal descargan con URL temporal; otros no', async () => {
    const propia = await e.json(`/compras/${ID}/comprobante`, { token: CLIENTE });
    expect(propia.datos.url).toContain('firma=');
    expect((await e.crudo(propia.datos.url)).status).toBe(200);
    expect((await e.json(`/compras/${ID}/comprobante`, { token: ADMIN })).estado).toBe(200);
    expect((await e.json(`/compras/${ID}/comprobante`, { token: OTRO_CLIENTE })).estado).toBe(404);
    expect((await e.crudo(propia.datos.url.replace('firma=', 'firma=x'))).status).toBe(403);
  });
});

describe('integridad del comprobante', () => {
  const esperado = 'ana.f2';
  it('reutilizar la URL no cambia lo que descarga quien revisa el pago', async () => {
    await e.ctx.fichas.guardar(fichaDePrueba({ id: 'f2', precio: 35000 }));
    const compra = (await e.json('/fichas/f2/compra', { token: CLIENTE, cuerpo: {} })).datos;
    expect(compra.id).toBe(esperado);
    const s = (
      await e.json(`/compras/${compra.id}/comprobante/subida`, {
        token: CLIENTE,
        cuerpo: { nombre: 'c.pdf', tipo: 'application/pdf', tamano: 100 },
      })
    ).datos;
    await subir(e, s, 100);
    await e.json(`/compras/${compra.id}/comprobante`, {
      token: CLIENTE,
      cuerpo: { llave: s.llave },
    });

    expect((await subir(e, s, 300)).status).toBe(204);

    const { url } = (await e.json(`/admin/pagos/${compra.id}/comprobante`, { token: ADMIN })).datos;
    const descarga = await e.crudo(url);
    expect((await descarga.arrayBuffer()).byteLength).toBe(100);
  });

  it('un comprobante confirmado no queda marcado para borrarse', async () => {
    const compra = (await e.ctx.compras.obtener('ana', 'f2'))!;
    const s = await e.ctx.archivos.firmarSubida(
      'comprobantes/ana/f2/huerfano.pdf',
      'application/pdf',
      100,
    );
    await subir(e, s, 10);
    expect(e.sinConfirmar()).toContain(s.llave);
    expect(compra.comprobanteVersion).toBe('1');
    expect(await e.ctx.archivos.info(compra.comprobanteLlave!)).toMatchObject({ tamano: 300 });
  });
});
