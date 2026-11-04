import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { esquemaContrasena, GRUPOS, type Grupo } from '@ic/shared';
import { Hono, type Context } from 'hono';
import { firmarDev } from './token-dev.js';

/**
 * Sustituto de Cognito SOLO para desarrollo local y pruebas: mismo flujo (registro con código,
 * ingreso, bloqueo tras 5 intentos, recuperación). bootstrap/lambda.ts nunca lo importa.
 * El código de verificación siempre es 123456 y se imprime en la consola.
 */
export const CODIGO_DEV = '123456';
export const CLAVE_DEV = 'Clave1234';

interface Cuenta {
  sub: string;
  correo: string;
  hash: string;
  grupos: Grupo[];
  confirmada: boolean;
  fallos: number;
  bloqueadaHasta: number;
}

const hashear = (clave: string, sal = randomBytes(16).toString('hex')) =>
  `${sal}:${scryptSync(clave, sal, 32).toString('hex')}`;
const coincide = (clave: string, hash: string) => {
  const [sal, h] = hash.split(':') as [string, string];
  return timingSafeEqual(Buffer.from(h, 'hex'), scryptSync(clave, sal, 32));
};

export const CUENTAS_SEMILLA = [
  { sub: 'dev-administrador', correo: 'administrador@ic.local', grupos: [GRUPOS.administrador] },
  { sub: 'dev-director', correo: 'director@ic.local', grupos: [GRUPOS.director] },
  { sub: 'dev-cliente', correo: 'cliente@ic.local', grupos: [GRUPOS.cliente] },
] as const;

export function crearAutenticacionDev(ahora: () => number = Date.now) {
  const cuentas = new Map<string, Cuenta>();
  const actualizaciones = new Map<string, string>();
  for (const c of CUENTAS_SEMILLA) {
    cuentas.set(c.correo, {
      ...c,
      grupos: [...c.grupos],
      hash: hashear(CLAVE_DEV),
      confirmada: true,
      fallos: 0,
      bloqueadaHasta: 0,
    });
  }

  const error = (c: Context, estado: 400 | 401 | 409 | 429, codigo: string, mensaje: string) =>
    c.json({ codigo, mensaje }, estado);
  const cuerpo = async (c: Context) =>
    (await c.req.json().catch(() => ({}))) as Record<string, string>;
  const normalizar = (correo = '') => correo.trim().toLowerCase();
  const tokens = (cuenta: Cuenta) => {
    const actualizacion = randomUUID();
    actualizaciones.set(actualizacion, cuenta.correo);
    return {
      acceso: firmarDev(cuenta.sub, cuenta.correo, cuenta.grupos),
      actualizacion,
      expiraEn: 15 * 60,
    };
  };
  const validarClave = (clave: string) => esquemaContrasena.safeParse(clave).success;

  const rutas = new Hono()
    .post('/registro', async (c) => {
      const { correo: crudo, clave = '' } = await cuerpo(c);
      const correo = normalizar(crudo);
      if (cuentas.has(correo)) return error(c, 409, 'CORREO_EXISTE', 'El correo ya existe');
      if (!validarClave(clave)) return error(c, 400, 'CONTRASENA_DEBIL', 'Contraseña débil');
      cuentas.set(correo, {
        sub: randomUUID(),
        correo,
        hash: hashear(clave),
        grupos: [GRUPOS.cliente],
        confirmada: false,
        fallos: 0,
        bloqueadaHasta: 0,
      });
      console.log(`[auth-dev] Código de verificación para ${correo}: ${CODIGO_DEV}`);
      return c.json({ ok: true });
    })
    .post('/confirmar', async (c) => {
      const { correo, codigo } = await cuerpo(c);
      const cuenta = cuentas.get(normalizar(correo));
      if (!cuenta || codigo !== CODIGO_DEV)
        return error(c, 400, 'CODIGO_INVALIDO', 'Código inválido');
      cuenta.confirmada = true;
      return c.json({ ok: true });
    })
    .post('/reenviar', async (c) => {
      console.log(`[auth-dev] Código reenviado: ${CODIGO_DEV}`);
      return c.json({ ok: true });
    })
    .post('/ingresar', async (c) => {
      const { correo, clave = '' } = await cuerpo(c);
      const cuenta = cuentas.get(normalizar(correo));
      if (cuenta && cuenta.bloqueadaHasta > ahora()) {
        return error(c, 429, 'BLOQUEADO', 'Demasiados intentos');
      }
      if (!cuenta || !coincide(clave, cuenta.hash)) {
        if (cuenta && ++cuenta.fallos >= 5) cuenta.bloqueadaHasta = ahora() + 60_000;
        return error(c, 401, 'CREDENCIALES', 'Credenciales inválidas');
      }
      if (!cuenta.confirmada) return error(c, 400, 'SIN_CONFIRMAR', 'Cuenta sin confirmar');
      cuenta.fallos = 0;
      return c.json(tokens(cuenta));
    })
    .post('/refrescar', async (c) => {
      const { actualizacion = '' } = await cuerpo(c);
      const cuenta = cuentas.get(actualizaciones.get(actualizacion) ?? '');
      if (!cuenta) return error(c, 401, 'CREDENCIALES', 'Sesión vencida');
      actualizaciones.delete(actualizacion);
      return c.json(tokens(cuenta));
    })
    .post('/salir', async (c) => {
      const { actualizacion = '' } = await cuerpo(c);
      actualizaciones.delete(actualizacion);
      return c.json({ ok: true });
    })
    .post('/olvido', async (c) => {
      const { correo } = await cuerpo(c);
      console.log(`[auth-dev] Código de recuperación para ${normalizar(correo)}: ${CODIGO_DEV}`);
      return c.json({ ok: true });
    })
    .post('/restablecer', async (c) => {
      const { correo, codigo, clave = '' } = await cuerpo(c);
      const cuenta = cuentas.get(normalizar(correo));
      if (!cuenta || codigo !== CODIGO_DEV)
        return error(c, 400, 'CODIGO_INVALIDO', 'Código inválido');
      if (!validarClave(clave)) return error(c, 400, 'CONTRASENA_DEBIL', 'Contraseña débil');
      cuenta.hash = hashear(clave);
      cuenta.fallos = 0;
      cuenta.bloqueadaHasta = 0;
      return c.json({ ok: true });
    });

  return rutas;
}
