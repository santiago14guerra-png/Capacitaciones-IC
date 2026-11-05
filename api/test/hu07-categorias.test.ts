import { beforeAll, describe, expect, it } from 'vitest';
import { sembrarCategorias } from '../src/application/categorias.js';
import { ADMIN, CLIENTE, prepararEntorno } from './entorno.js';
import { fichaDePrueba } from './fabricas.js';

const e = prepararEntorno();
beforeAll(() => sembrarCategorias(e.ctx));
const nombres = async (ruta = '/categorias', token?: string) =>
  ((await e.json(ruta, { token })).datos as { nombre: string }[]).map((c) => c.nombre);

describe('HU-07 · categorías temáticas', () => {
  it('CA3: arranca con la carga inicial propuesta y la siembra es idempotente', async () => {
    expect(await nombres()).toEqual([
      'Arrendamientos',
      'Pensionados',
      'Asalariados e independientes',
      'Sucesiones y herencias',
      'Patrimonio y bienes',
      'Declaración de renta',
      'Obligaciones con la DIAN',
    ]);
    expect(await sembrarCategorias(e.ctx)).toBe(0);
  });

  it('solo el personal administra categorías', async () => {
    expect((await e.json('/admin/categorias', { token: CLIENTE })).estado).toBe(403);
    expect(
      (await e.json('/admin/categorias', { metodo: 'POST', cuerpo: { nombre: 'X' } })).estado,
    ).toBe(401);
  });

  it('CA1: crea, renombra y evita nombres repetidos sin importar tildes', async () => {
    const r = await e.json('/admin/categorias', {
      token: ADMIN,
      cuerpo: { nombre: 'Régimen simple' },
    });
    expect(r).toMatchObject({
      estado: 201,
      datos: { id: 'regimen-simple', orden: 7, activa: true },
    });
    const repetida = await e.json('/admin/categorias', {
      token: ADMIN,
      cuerpo: { nombre: 'REGIMEN SIMPLE' },
    });
    expect(repetida.estado).toBe(422);
    const renombrada = await e.json('/admin/categorias/regimen-simple', {
      metodo: 'PUT',
      token: ADMIN,
      cuerpo: { nombre: 'Régimen Simple de Tributación' },
    });
    expect(renombrada.datos).toMatchObject({
      id: 'regimen-simple',
      nombre: 'Régimen Simple de Tributación',
    });
  });

  it('CA1 y CA4: el orden del panel es el orden público', async () => {
    const admin = (await e.json('/admin/categorias', { token: ADMIN })).datos as { id: string }[];
    const ids = admin.map((c) => c.id).reverse();
    const r = await e.json('/admin/categorias/orden', {
      metodo: 'PUT',
      token: ADMIN,
      cuerpo: { ids },
    });
    expect(r.estado).toBe(200);
    expect((await e.json('/categorias')).datos.map((c: { id: string }) => c.id)).toEqual(ids);
    const incompleto = await e.json('/admin/categorias/orden', {
      metodo: 'PUT',
      token: ADMIN,
      cuerpo: { ids: ids.slice(1) },
    });
    expect(incompleto.estado).toBe(422);
  });

  it('CA2: no desactiva una categoría con fichas publicadas e informa cuántas tiene', async () => {
    await e.ctx.fichas.guardar(fichaDePrueba({ categoriaId: 'pensionados' }));
    await e.ctx.fichas.guardar(fichaDePrueba({ categoriaId: 'pensionados' }));
    await e.ctx.fichas.guardar(fichaDePrueba({ categoriaId: 'pensionados', estado: 'BORRADOR' }));
    const r = await e.json('/admin/categorias/pensionados/desactivar', {
      token: ADMIN,
      cuerpo: {},
    });
    expect(r.estado).toBe(409);
    expect(r.datos.mensaje).toContain('2 fichas publicadas');
    expect(r.datos.campos).toEqual({ fichasPublicadas: '2' });
    const admin = (await e.json('/admin/categorias', { token: ADMIN })).datos;
    expect(admin.find((c: { id: string }) => c.id === 'pensionados')).toMatchObject({
      fichasPublicadas: 2,
      fichasTotal: 3,
    });
  });

  it('CA2: tras reasignar las fichas, se desactiva y deja de verse en público', async () => {
    const reasignar = await e.json('/admin/categorias/pensionados/reasignar', {
      token: ADMIN,
      cuerpo: { destinoId: 'declaracion-de-renta' },
    });
    expect(reasignar.datos).toEqual({ movidas: 3 });
    const r = await e.json('/admin/categorias/pensionados/desactivar', {
      token: ADMIN,
      cuerpo: {},
    });
    expect(r.datos.activa).toBe(false);
    expect(await nombres()).not.toContain('Pensionados');
    expect(await nombres('/admin/categorias', ADMIN)).toContain('Pensionados');
    const aInactiva = await e.json('/admin/categorias/arrendamientos/reasignar', {
      token: ADMIN,
      cuerpo: { destinoId: 'pensionados' },
    });
    expect(aInactiva.estado).toBe(422);
  });

  it('responde 404 para una categoría que no existe', async () => {
    expect(
      (await e.json('/admin/categorias/nada/activar', { token: ADMIN, cuerpo: {} })).estado,
    ).toBe(404);
  });
});
