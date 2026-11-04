import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADMIN, CLIENTE, DIRECTOR, prepararEntorno } from './entorno.js';

const e = prepararEntorno();
afterEach(() => vi.restoreAllMocks());

describe('HU-04 · acceso al panel', () => {
  it('CA2: sin token responde 401 y no entrega datos', async () => {
    const r = await e.json('/admin/yo');
    expect(r.estado).toBe(401);
    expect(r.datos).not.toHaveProperty('sub');
  });

  it('CA2: un cliente recibe 403 aunque llame la API directamente', async () => {
    const r = await e.json('/admin/yo', { token: CLIENTE });
    expect(r.estado).toBe(403);
    expect(r.datos).not.toHaveProperty('sub');
  });

  it('CA1: administrador y director entran', async () => {
    expect((await e.json('/admin/yo', { token: ADMIN })).estado).toBe(200);
    expect((await e.json('/admin/yo', { token: DIRECTOR })).estado).toBe(200);
  });

  it('CA4: registra usuario, fecha, hora y ruta de cada acción, sin datos del cliente', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await e.json('/admin/yo', { token: ADMIN });
    const registro = JSON.parse(log.mock.calls.at(-1)![0] as string);
    expect(registro).toEqual({
      evento: 'accion-admin',
      usuario: 'admin',
      grupos: ['administrador'],
      metodo: 'GET',
      ruta: '/api/admin/yo',
      estado: 200,
      fecha: e.reloj.ahora().toISOString(),
    });
  });

  it('CA3: un token con un grupo inventado no da acceso', async () => {
    const falso = `Bearer dev.${Buffer.from(JSON.stringify({ sub: 'x', usuario: 'x', grupos: ['root'] })).toString('base64url')}`;
    expect((await e.json('/admin/yo', { token: falso })).estado).toBe(403);
  });
});
