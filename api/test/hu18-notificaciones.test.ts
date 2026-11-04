import { beforeAll, describe, expect, it, vi } from 'vitest';
import { sembrarCategorias } from '../src/application/categorias.js';
import { ADMIN, CLIENTE, DIRECTOR, OTRO_CLIENTE, prepararEntorno } from './entorno.js';
import { DATOS_PERFIL, fichaDePrueba } from './fabricas.js';
import { compraEnVerificacion } from './flujo-compra.js';

const e = prepararEntorno();
const SECRETO = 'CONTENIDO-PRIVADO-DE-LA-RESPUESTA';
beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'f1', precio: 1000 }));
  await compraEnVerificacion(e, CLIENTE, 'f1');
  await compraEnVerificacion(e, OTRO_CLIENTE, 'f1');
});

describe('HU-18 · notificaciones por correo', () => {
  it('avisa al verificar un pago, con enlace y sin datos privados', async () => {
    e.correos.length = 0;
    await e.json('/admin/pagos/ana.f1/decision', { token: ADMIN, cuerpo: { decision: 'APROBAR' } });
    expect(e.correos).toHaveLength(1);
    expect(e.correos[0]).toMatchObject({
      para: 'ana@correo.co',
      asunto: expect.stringContaining('verificado'),
    });
    expect(e.correos[0]!.texto).toContain('https://sitio.prueba/compras/ana.f1');
  });

  it('avisa al rechazar, sin incluir el motivo', async () => {
    e.correos.length = 0;
    await e.json('/admin/pagos/beto.f1/decision', {
      token: ADMIN,
      cuerpo: { decision: 'RECHAZAR', motivo: 'Motivo interno detallado' },
    });
    expect(e.correos[0]!.para).toBe('beto@correo.co');
    expect(e.correos[0]!.texto + e.correos[0]!.html).not.toContain('Motivo interno');
  });

  it('avisa al responder una consulta sin incluir la respuesta, una sola vez', async () => {
    await e.json('/perfil', { metodo: 'PUT', token: CLIENTE, cuerpo: DATOS_PERFIL });
    const id = (
      await e.json('/consultas', {
        token: CLIENTE,
        cuerpo: { categoriaId: 'pensionados', asunto: 'A', descripcion: 'B' },
      })
    ).datos.id;
    e.correos.length = 0;
    const responder = () =>
      e.json(`/admin/consultas/${id}`, {
        metodo: 'PUT',
        token: DIRECTOR,
        cuerpo: {
          estado: 'RESPONDIDA',
          clasificacion: 'CONSULTA_RAPIDA',
          respuestaHtml: `<p>${SECRETO}</p>`,
        },
      });
    await responder();
    await responder();
    expect(e.correos).toHaveLength(1);
    expect(e.correos[0]!.texto).toContain(`https://sitio.prueba/cuenta/consultas/${id}`);
    expect(JSON.stringify(e.correos)).not.toContain(SECRETO);
  });

  it('si el correo falla, la decisión se conserva', async () => {
    const original = e.ctx.notificador.enviar;
    e.ctx.notificador.enviar = async () => {
      throw new Error('SES caído');
    };
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await e.ctx.fichas.guardar(fichaDePrueba({ id: 'f2', precio: 1000 }));
    await compraEnVerificacion(e, CLIENTE, 'f2');
    const r = await e.json('/admin/pagos/ana.f2/decision', {
      token: ADMIN,
      cuerpo: { decision: 'APROBAR' },
    });
    expect(r.datos.estado).toBe('APROBADA');
    expect(err).toHaveBeenCalled();
    e.ctx.notificador.enviar = original;
    err.mockRestore();
  });
});
