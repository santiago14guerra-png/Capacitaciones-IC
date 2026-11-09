import { describe, expect, it } from 'vitest';
import { CLIENTE, prepararEntorno } from './entorno.js';

const e = prepararEntorno();
const datos = {
  nombres: 'Ana María',
  apellidos: 'Ruiz Gómez',
  tipoDocumento: 'CC',
  numeroDocumento: '43123456',
  celular: '3001234567',
  direccion: 'Calle 10 # 20-30',
  ciudad: 'Medellín',
  autorizaDatos: true,
};

describe('HU-02 · registro con datos de facturación', () => {
  it('exige sesión', async () => {
    expect((await e.json('/mi/perfil', { metodo: 'PUT', cuerpo: datos })).estado).toBe(401);
  });

  it('CA3: valida cada campo y devuelve el error junto al campo', async () => {
    const r = await e.json('/mi/perfil', {
      metodo: 'PUT',
      token: CLIENTE,
      cuerpo: { ...datos, numeroDocumento: '43.123', celular: 'abc', ciudad: '' },
    });
    expect(r.estado).toBe(422);
    expect(Object.keys(r.datos.campos).sort()).toEqual(['celular', 'ciudad', 'numeroDocumento']);
  });

  it('CA4: sin autorización de datos no guarda', async () => {
    const r = await e.json('/mi/perfil', {
      metodo: 'PUT',
      token: CLIENTE,
      cuerpo: { ...datos, autorizaDatos: false },
    });
    expect(r.estado).toBe(422);
    expect(r.datos.campos).toHaveProperty('autorizaDatos');
  });

  it('CA4 y CA6: guarda el perfil con la fecha y versión de la autorización', async () => {
    const r = await e.json('/mi/perfil', { metodo: 'PUT', token: CLIENTE, cuerpo: datos });
    expect(r.estado).toBe(200);
    expect(r.datos).toMatchObject({
      sub: 'ana',
      correo: 'ana@correo.co',
      nombres: 'Ana María',
      autorizacionDatosEn: e.reloj.ahora().toISOString(),
      versionPoliticaDatos: expect.stringContaining('borrador'),
    });
    expect(r.datos).not.toHaveProperty('autorizaDatos');
    const sesion = await e.json('/sesion', { token: CLIENTE });
    expect(sesion.datos.perfil.nombres).toBe('Ana María');
  });

  it('al editar conserva la fecha original de autorización e ignora el correo enviado', async () => {
    const antes = e.reloj.ahora().toISOString();
    e.reloj.avanzar(24);
    const r = await e.json('/mi/perfil', {
      metodo: 'PUT',
      token: CLIENTE,
      cuerpo: { ...datos, ciudad: 'Envigado', correo: 'otro@x.co' },
    });
    expect(r.datos).toMatchObject({
      ciudad: 'Envigado',
      correo: 'ana@correo.co',
      autorizacionDatosEn: antes,
    });
  });

  it('acepta letras en el documento solo para pasaporte', async () => {
    const pasaporte = { ...datos, tipoDocumento: 'PASAPORTE', numeroDocumento: 'AB123456' };
    expect(
      (await e.json('/mi/perfil', { metodo: 'PUT', token: CLIENTE, cuerpo: pasaporte })).estado,
    ).toBe(200);
  });

  it('responde 422 si el cuerpo no es JSON', async () => {
    const r = await e.pedir('/mi/perfil', { metodo: 'PUT', token: CLIENTE, cuerpo: undefined });
    expect(r.status).toBe(422);
  });
});
