import { beforeAll, describe, expect, it } from 'vitest';
import { invalidarCatalogo } from '../src/application/catalogo.js';
import { sembrarCategorias } from '../src/application/categorias.js';
import { ADMIN, CLIENTE, OTRO_CLIENTE, prepararEntorno } from './entorno.js';
import { DATOS_PERFIL, fichaDePrueba } from './fabricas.js';
import { subir } from './subir.js';

const e = prepararEntorno();
const consulta = {
  categoriaId: 'arrendamientos',
  asunto: 'Arriendo de un local comercial',
  descripcion: 'Recibo arriendo de un local y quiero saber cómo declararlo.',
};
beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.ctx.fichas.guardar(
    fichaDePrueba({ id: 'f-arriendo', titulo: 'Ingresos por arriendo de locales' }),
  );
  invalidarCatalogo(e.ctx);
  await e.json('/perfil', { metodo: 'PUT', token: CLIENTE, cuerpo: DATOS_PERFIL });
});

describe('HU-15 · enviar consulta', () => {
  it('sugiere fichas relacionadas con el asunto sin registrar la búsqueda', async () => {
    const r = await e.json('/buscar?q=arriendo de local&sugerencia=1');
    expect(r.datos.elementos[0].id).toBe('f-arriendo');
    expect(await e.ctx.busquedas.listarMes('2026-11')).toEqual([]);
  });

  it('exige sesión, categoría, asunto y descripción', async () => {
    expect((await e.json('/consultas', { cuerpo: consulta })).estado).toBe(401);
    const r = await e.json('/consultas', {
      token: CLIENTE,
      cuerpo: { categoriaId: '', asunto: '', descripcion: '' },
    });
    expect(Object.keys(r.datos.campos).sort()).toEqual(['asunto', 'categoriaId', 'descripcion']);
  });

  it('asigna radicado y fecha de recepción', async () => {
    const r = await e.json('/consultas', { token: CLIENTE, cuerpo: consulta });
    expect(r.estado).toBe(201);
    expect(r.datos).toMatchObject({
      radicado: 'RAD-000001',
      estado: 'RECIBIDA',
      recibidaEn: e.reloj.ahora().toISOString(),
      categoriaNombre: 'Arrendamientos',
      tieneAdjunto: false,
    });
  });

  it('acepta un adjunto opcional de máximo 5 MB que solo ven el cliente y el personal', async () => {
    const s = (
      await e.json('/consultas/adjunto/subida', {
        token: CLIENTE,
        cuerpo: { nombre: 'contrato.pdf', tipo: 'application/pdf', tamano: 500 },
      })
    ).datos;
    expect(s.llave).toMatch(/^consultas\/ana\//);
    await subir(e, s, 500);
    const r = await e.json('/consultas', {
      token: CLIENTE,
      cuerpo: { ...consulta, adjuntoLlave: s.llave },
    });
    expect(r.datos).toMatchObject({ radicado: 'RAD-000002', tieneAdjunto: true });
    expect((await e.json(`/consultas/${r.datos.id}/adjunto`, { token: CLIENTE })).estado).toBe(200);
    expect((await e.json(`/consultas/${r.datos.id}/adjunto`, { token: ADMIN })).estado).toBe(200);
    expect((await e.json(`/consultas/${r.datos.id}/adjunto`, { token: OTRO_CLIENTE })).estado).toBe(
      404,
    );
    const grande = await e.json('/consultas/adjunto/subida', {
      token: CLIENTE,
      cuerpo: { nombre: 'x.pdf', tipo: 'application/pdf', tamano: 6_000_000 },
    });
    expect(grande.estado).toBe(422);
  });

  it('no acepta como adjunto el archivo de otra persona', async () => {
    const r = await e.json('/consultas', {
      token: CLIENTE,
      cuerpo: { ...consulta, adjuntoLlave: 'consultas/beto/x.pdf' },
    });
    expect(r.estado).toBe(422);
  });

  it('un segundo envío de la misma consulta devuelve el mismo radicado', async () => {
    const otra = { ...consulta, asunto: 'Pregunta enviada dos veces' };
    const a = await e.json('/consultas', { token: CLIENTE, cuerpo: otra });
    const b = await e.json('/consultas', { token: CLIENTE, cuerpo: otra });
    expect(b.datos.radicado).toBe(a.datos.radicado);
    const mias = (await e.json('/consultas', { token: CLIENTE })).datos.filter(
      (x: { asunto: string }) => x.asunto === otra.asunto,
    );
    expect(mias).toHaveLength(1);
  });

  it('pasados dos minutos se puede volver a enviar la misma pregunta', async () => {
    const otra = { ...consulta, asunto: 'Pregunta repetida después' };
    const a = await e.json('/consultas', { token: CLIENTE, cuerpo: otra });
    e.reloj.avanzar(1);
    const b = await e.json('/consultas', { token: CLIENTE, cuerpo: otra });
    expect(b.datos.radicado).not.toBe(a.datos.radicado);
  });
});
