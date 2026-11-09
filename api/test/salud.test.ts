import { describe, expect, it } from 'vitest';
import { prepararEntorno } from './entorno.js';

const e = prepararEntorno();

describe('api', () => {
  it('responde salud y no permite caché', async () => {
    const r = await e.pedir('/salud');
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('no-store');
  });
  it('responde 404 en JSON para rutas inexistentes', async () => {
    const r = await e.json('/no-existe');
    expect(r).toEqual({ estado: 404, datos: expect.objectContaining({ error: 'NO_ENCONTRADO' }) });
  });
});
