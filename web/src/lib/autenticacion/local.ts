import { ErrorAuth, type CodigoAuth, type Tokens, type Transporte } from './tipos';

/** Desarrollo local: la API expone /api/dev/auth con el mismo flujo que Cognito. */
export function transporteLocal(): Transporte {
  const llamar = async <T>(ruta: string, cuerpo: object): Promise<T> => {
    const r = await fetch(`/api/dev/auth/${ruta}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) throw new ErrorAuth((datos.codigo as CodigoAuth) ?? 'DESCONOCIDO');
    return datos as T;
  };
  return {
    ingresar: (correo, clave) => llamar<Tokens>('ingresar', { correo, clave }),
    nuevaContrasena: () => Promise.reject(new ErrorAuth('DESCONOCIDO')),
    refrescar: async (actualizacion) => {
      try {
        return await llamar<Tokens>('refrescar', { actualizacion });
      } catch {
        throw new ErrorAuth('SESION_VENCIDA');
      }
    },
    salir: async (_acceso, actualizacion) => {
      await llamar('salir', { actualizacion });
    },
    registrar: async (correo, clave) => {
      await llamar('registro', { correo, clave });
    },
    confirmar: async (correo, codigo) => {
      await llamar('confirmar', { correo, codigo });
    },
    reenviarCodigo: async (correo) => {
      await llamar('reenviar', { correo });
    },
    olvido: async (correo) => {
      await llamar('olvido', { correo });
    },
    restablecer: async (correo, codigo, clave) => {
      await llamar('restablecer', { correo, codigo, clave });
    },
  };
}
