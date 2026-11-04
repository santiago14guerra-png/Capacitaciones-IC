import { describe, expect, it } from 'vitest';
import { crearApp } from '../src/adapters/http/app.js';
import { verificadorDev } from '../src/adapters/local/token-dev.js';

describe('api', () => {
  it('responde salud y no permite caché', async () => {
    const r = await crearApp({ verificador: verificadorDev }).request('/api/salud');
    expect(r.status).toBe(200);
    expect(r.headers.get('cache-control')).toBe('no-store');
  });
});
