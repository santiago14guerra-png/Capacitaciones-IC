import { beforeAll, describe, expect, it } from 'vitest';
import { sembrarCategorias } from '../src/application/categorias.js';
import { ADMIN, prepararEntorno } from './entorno.js';

const e = prepararEntorno();
beforeAll(() => sembrarCategorias(e.ctx));

const base = {
  titulo: 'Arriendo de un apartamento',
  pregunta: '¿Cómo declaro el arriendo?',
  resumen: 'Resumen',
  respuestaHtml: '<p>Respuesta</p>',
  categoriaId: 'arrendamientos',
  etiquetas: [],
  normas: [],
  precio: 15000,
  publicar: true,
};
const crear = async (cambios = {}) =>
  (await e.json('/admin/fichas', { token: ADMIN, cuerpo: { ...base, ...cambios } })).datos;

describe('HU-06 · editar y despublicar', () => {
  it('CA1: lista con filtro por estado y búsqueda por título sin tildes', async () => {
    await crear({ titulo: 'Sucesión intestada', categoriaId: 'sucesiones-y-herencias' });
    await crear({ titulo: 'Borrador de sucesión', publicar: false });
    const todas = (await e.json('/admin/fichas?q=SUCESION', { token: ADMIN })).datos;
    expect(todas.map((f: { titulo: string }) => f.titulo).sort()).toEqual([
      'Borrador de sucesión',
      'Sucesión intestada',
    ]);
    const publicadas = (await e.json('/admin/fichas?estado=PUBLICADA&q=sucesion', { token: ADMIN }))
      .datos;
    expect(publicadas).toHaveLength(1);
    expect(publicadas[0]).toMatchObject({
      titulo: 'Sucesión intestada',
      categoriaNombre: 'Sucesiones y herencias',
      estado: 'PUBLICADA',
      precio: 15000,
    });
  });

  it('CA2: editar una ficha publicada actualiza «Vigente a»', async () => {
    const f = await crear();
    e.reloj.avanzar(48);
    const r = await e.json(`/admin/fichas/${f.id}`, {
      metodo: 'PUT',
      token: ADMIN,
      cuerpo: { ...base, resumen: 'Nuevo' },
    });
    expect(r.datos.vigenteA).toBe(e.reloj.ahora().toISOString());
    expect(r.datos.vigenteA).not.toBe(f.vigenteA);
    expect(r.datos.creadaEn).toBe(f.creadaEn);
  });

  it('CA3: despublicar la saca del catálogo pero la conserva', async () => {
    const f = await crear();
    const r = await e.json(`/admin/fichas/${f.id}/despublicar`, { token: ADMIN, cuerpo: {} });
    expect(r.datos.estado).toBe('DESPUBLICADA');
    expect((await e.ctx.fichas.listarPorEstado('PUBLICADA')).map((x) => x.id)).not.toContain(f.id);
    expect(await e.ctx.fichas.obtener(f.id)).toMatchObject({ respuestaHtml: '<p>Respuesta</p>' });
    expect(
      (await e.json(`/admin/fichas/${f.id}/despublicar`, { token: ADMIN, cuerpo: {} })).estado,
    ).toBe(409);
  });

  it('guardar sin publicar una ficha que ya se publicó la deja despublicada, no borrador', async () => {
    const f = await crear();
    const r = await e.json(`/admin/fichas/${f.id}`, {
      metodo: 'PUT',
      token: ADMIN,
      cuerpo: { ...base, publicar: false },
    });
    expect(r.datos).toMatchObject({ estado: 'DESPUBLICADA', publicadaAlgunaVez: true });
  });

  it('CA4: solo se eliminan borradores que nunca se publicaron', async () => {
    const borrador = await crear({ publicar: false });
    const publicada = await crear();
    expect(
      (await e.pedir(`/admin/fichas/${publicada.id}`, { metodo: 'DELETE', token: ADMIN })).status,
    ).toBe(409);
    expect(
      (await e.pedir(`/admin/fichas/${borrador.id}`, { metodo: 'DELETE', token: ADMIN })).status,
    ).toBe(204);
    expect((await e.json(`/admin/fichas/${borrador.id}`, { token: ADMIN })).estado).toBe(404);
  });
});
