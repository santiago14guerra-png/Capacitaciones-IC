import { describe, expect, it } from 'vitest';
import { CLAVE_DEV } from '../src/adapters/local/autenticacion-dev.js';
import { CLIENTE, prepararEntorno } from './entorno.js';

const e = prepararEntorno();

describe('HU-03 · inicio y cierre de sesión', () => {
  it('sin token, /sesion responde 401', async () => {
    expect((await e.json('/sesion')).estado).toBe(401);
  });

  it('con un token inválido o vencido responde 401', async () => {
    expect((await e.json('/sesion', { token: 'Bearer dev.basura' })).estado).toBe(401);
    expect((await e.json('/sesion', { token: 'Bearer eyJhbGciOi.x.y' })).estado).toBe(401);
  });

  it('con sesión devuelve correo y grupos tomados del token verificado', async () => {
    const r = await e.json('/sesion', { token: CLIENTE });
    expect(r.estado).toBe(200);
    expect(r.datos).toEqual({
      sub: 'ana',
      correo: 'ana@correo.co',
      grupos: ['cliente'],
      perfil: null,
    });
  });

  describe('autenticación de desarrollo (reemplaza a Cognito en local)', () => {
    it('CA2: el error no indica si falló el correo o la contraseña', async () => {
      const malCorreo = await e.json('/dev/auth/ingresar', {
        cuerpo: { correo: 'nadie@x.co', clave: 'x' },
      });
      const malaClave = await e.json('/dev/auth/ingresar', {
        cuerpo: { correo: 'cliente@ic.local', clave: 'mala1234' },
      });
      expect(malCorreo).toEqual(malaClave);
      expect(malCorreo.datos.codigo).toBe('CREDENCIALES');
    });

    it('CA3: bloquea temporalmente desde el quinto intento fallido', async () => {
      const intento = (clave: string) =>
        e.json('/dev/auth/ingresar', { cuerpo: { correo: 'director@ic.local', clave } });
      for (let i = 0; i < 5; i++) await intento('mala1234');
      const r = await intento(CLAVE_DEV);
      expect(r.estado).toBe(429);
      expect(r.datos.codigo).toBe('BLOQUEADO');
    });

    it('CA1 y CA4: ingresa, refresca y al salir invalida el token de actualización', async () => {
      const ok = await e.json('/dev/auth/ingresar', {
        cuerpo: { correo: 'administrador@ic.local', clave: CLAVE_DEV },
      });
      expect(ok.estado).toBe(200);
      const sesion = await e.json('/sesion', { token: `Bearer ${ok.datos.acceso}` });
      expect(sesion.datos.grupos).toEqual(['administrador']);

      await e.json('/dev/auth/salir', { cuerpo: { actualizacion: ok.datos.actualizacion } });
      const refresco = await e.json('/dev/auth/refrescar', {
        cuerpo: { actualizacion: ok.datos.actualizacion },
      });
      expect(refresco.estado).toBe(401);
    });
  });
});
