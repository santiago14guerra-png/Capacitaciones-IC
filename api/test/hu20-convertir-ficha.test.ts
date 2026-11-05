import { beforeAll, describe, expect, it } from 'vitest';
import { sembrarCategorias } from '../src/application/categorias.js';
import { CLIENTE, DIRECTOR, prepararEntorno } from './entorno.js';
import { DATOS_PERFIL } from './fabricas.js';

const e = prepararEntorno();
let id = '';
beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.json('/mi/perfil', { metodo: 'PUT', token: CLIENTE, cuerpo: DATOS_PERFIL });
  id = (
    await e.json('/consultas', {
      token: CLIENTE,
      cuerpo: {
        categoriaId: 'arrendamientos',
        asunto: 'Arriendo de Ana María',
        descripcion: 'Soy Ana María Ruiz, CC 43.123.456, cel 3001234567. Recibo arriendo.',
      },
    })
  ).datos.id;
});
const convertir = () => e.json(`/admin/consultas/${id}/ficha`, { token: DIRECTOR, cuerpo: {} });

describe('HU-20 · convertir una respuesta en ficha', () => {
  it('solo convierte consultas respondidas', async () => {
    expect((await convertir()).estado).toBe(409);
  });

  it('crea un borrador anonimizado ligado a la consulta', async () => {
    await e.json(`/admin/consultas/${id}`, {
      metodo: 'PATCH',
      token: DIRECTOR,
      cuerpo: {
        estado: 'RESPONDIDA',
        clasificacion: 'CONSULTA_RAPIDA',
        respuestaHtml:
          '<p>Señora Ruiz: el arriendo se declara como renta. Escriba a ana@correo.co si duda.</p>',
      },
    });
    const r = await convertir();
    expect(r.estado).toBe(201);
    expect(r.datos).toMatchObject({
      estado: 'BORRADOR',
      titulo: 'Arriendo de [cliente]',
      pregunta: 'Soy [cliente], CC [documento], cel [celular]. Recibo arriendo.',
      respuestaHtml:
        '<p>Señora [cliente]: el arriendo se declara como renta. Escriba a [correo] si duda.</p>',
      categoriaId: 'arrendamientos',
      precio: null,
      origenConsultaId: id,
    });
    expect(JSON.stringify(r.datos)).not.toMatch(/Ruiz|43\.?123|3001234567|ana@correo/);
    expect((await e.ctx.fichas.listarPorEstado('PUBLICADA')).length).toBe(0);
    expect((await e.json(`/admin/consultas/${id}`, { token: DIRECTOR })).datos.fichaId).toBe(
      r.datos.id,
    );
  });

  it('no crea una segunda ficha de la misma consulta', async () => {
    expect((await convertir()).estado).toBe(409);
    expect((await e.ctx.fichas.listarPorEstado('BORRADOR')).length).toBe(1);
  });
});
