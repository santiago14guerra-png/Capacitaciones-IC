import { describe, expect, it } from 'vitest';
import { CLIENTE, OTRO_CLIENTE, prepararEntorno } from './entorno.js';
import { DATOS_PERFIL } from './fabricas.js';

const e = prepararEntorno();
const { autorizaDatos: _, ...sinAutorizacion } = DATOS_PERFIL;

describe('HU-23 · editar mi perfil y datos de facturación', () => {
  it('crear el perfil sigue exigiendo la autorización', async () => {
    expect(
      (await e.json('/perfil', { metodo: 'PUT', token: OTRO_CLIENTE, cuerpo: sinAutorizacion }))
        .estado,
    ).toBe(422);
  });

  it('actualiza dirección, celular y datos de facturación sin volver a autorizar', async () => {
    await e.json('/perfil', { metodo: 'PUT', token: CLIENTE, cuerpo: DATOS_PERFIL });
    const r = await e.json('/perfil', {
      metodo: 'PUT',
      token: CLIENTE,
      cuerpo: {
        ...sinAutorizacion,
        direccion: 'Carrera 43A # 1-50',
        celular: '3109876543',
        tipoDocumento: 'NIT',
        numeroDocumento: '900123456',
      },
    });
    expect(r.estado).toBe(200);
    expect(r.datos).toMatchObject({
      direccion: 'Carrera 43A # 1-50',
      celular: '3109876543',
      tipoDocumento: 'NIT',
    });
    expect((await e.json('/sesion', { token: CLIENTE })).datos.perfil.direccion).toBe(
      'Carrera 43A # 1-50',
    );
  });

  it('valida igual que en el registro', async () => {
    const r = await e.json('/perfil', {
      metodo: 'PUT',
      token: CLIENTE,
      cuerpo: { ...sinAutorizacion, celular: '12' },
    });
    expect(r.datos.campos).toHaveProperty('celular');
  });
});
