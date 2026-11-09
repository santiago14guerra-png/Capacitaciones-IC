import { beforeAll, describe, expect, it } from 'vitest';
import { sembrarCategorias } from '../src/application/categorias.js';
import { CLIENTE, DIRECTOR, OTRO_CLIENTE, prepararEntorno } from './entorno.js';
import { DATOS_PERFIL } from './fabricas.js';

const e = prepararEntorno();
let id = '';
beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.json('/mi/perfil', { metodo: 'PUT', token: CLIENTE, cuerpo: DATOS_PERFIL });
  id = (
    await e.json('/consultas', {
      token: CLIENTE,
      cuerpo: { categoriaId: 'arrendamientos', asunto: 'Mi duda', descripcion: 'Detalle' },
    })
  ).datos.id;
});
const gestionar = (cuerpo: object) =>
  e.json(`/admin/consultas/${id}`, { metodo: 'PATCH', token: DIRECTOR, cuerpo });

describe('HU-17 · seguimiento de mis consultas', () => {
  it('el cliente ve sus consultas con radicado, estado y fecha; nadie más las ve', async () => {
    const r = await e.json('/mi/consultas', { token: CLIENTE });
    expect(r.datos).toHaveLength(1);
    expect(r.datos[0]).toMatchObject({
      radicado: 'RAD-000001',
      estado: 'RECIBIDA',
      recibidaEn: expect.any(String),
    });
    expect((await e.json('/mi/consultas', { token: OTRO_CLIENTE })).datos).toEqual([]);
    expect((await e.json(`/mi/consultas/${id}`, { token: OTRO_CLIENTE })).estado).toBe(404);
  });

  it('no ve un borrador de respuesta mientras está en análisis', async () => {
    await gestionar({
      estado: 'EN_ANALISIS',
      clasificacion: 'CONSULTA_RAPIDA',
      respuestaHtml: '<p>borrador</p>',
    });
    const r = await e.json(`/mi/consultas/${id}`, { token: CLIENTE });
    expect(r.datos.estado).toBe('EN_ANALISIS');
    expect(r.datos.respuestaHtml).toBeUndefined();
  });

  it('ve la respuesta dentro de la plataforma cuando está respondida', async () => {
    await gestionar({ estado: 'RESPONDIDA', respuestaHtml: '<p>Así se declara</p>' });
    expect((await e.json(`/mi/consultas/${id}`, { token: CLIENTE })).datos.respuestaHtml).toBe(
      '<p>Así se declara</p>',
    );
  });

  it('si fue escalada ve las condiciones de la asesoría', async () => {
    await gestionar({
      estado: 'ESCALADA',
      clasificacion: 'ASESORIA',
      condicionesAsesoria: 'Condiciones X',
    });
    expect((await e.json(`/mi/consultas/${id}`, { token: CLIENTE })).datos).toMatchObject({
      estado: 'ESCALADA',
      condicionesAsesoria: 'Condiciones X',
    });
  });
});
