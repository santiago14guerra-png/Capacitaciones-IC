import { GRUPOS, type Grupo } from '@ic/shared';
import { afterAll, beforeAll } from 'vitest';
import { crearApp } from '../src/adapters/http/app.js';
import { crearAutenticacionDev } from '../src/adapters/local/autenticacion-dev.js';
import { iniciarEmulador } from '../src/adapters/local/emulador.js';
import { directorioDev, firmarDev, verificadorDev } from '../src/adapters/local/token-dev.js';
import type { Contexto } from '../src/application/contexto.js';
import { componer } from '../src/bootstrap/componer.js';

export const token = (sub: string, ...grupos: Grupo[]) =>
  `Bearer ${firmarDev(sub, `${sub}@correo.co`, grupos)}`;

export const cabecera = (t?: string) => ({
  'content-type': 'application/json',
  ...(t ? { authorization: t } : {}),
});

export const ADMIN = token('admin', GRUPOS.administrador);
export const DIRECTOR = token('director', GRUPOS.director);
export const CLIENTE = token('ana', GRUPOS.cliente);
export const OTRO_CLIENTE = token('beto', GRUPOS.cliente);

/** Reloj que las pruebas pueden mover. */
export class RelojPrueba {
  constructor(public actual = new Date('2026-11-02T15:00:00.000Z')) {}
  ahora = () => new Date(this.actual);
  avanzar(horas: number) {
    this.actual = new Date(this.actual.getTime() + horas * 3_600_000);
  }
}

export interface Entorno {
  ctx: Contexto;
  reloj: RelojPrueba;
  pedir(
    ruta: string,
    opciones?: { metodo?: string; token?: string; cuerpo?: unknown },
  ): Promise<Response>;
  json<T = any>(
    ruta: string,
    opciones?: { metodo?: string; token?: string; cuerpo?: unknown },
  ): Promise<{ estado: number; datos: T }>;
}

/** App completa sobre DynamoDB emulado; una tabla nueva por archivo de prueba. */
export function prepararEntorno(): Entorno {
  const e = {} as Entorno & { cerrar?: () => void; app?: ReturnType<typeof crearApp> };
  beforeAll(async () => {
    const { tabla, cerrar } = await iniciarEmulador();
    e.reloj = new RelojPrueba();
    e.ctx = componer({ tabla, directorio: directorioDev, reloj: e.reloj });
    e.cerrar = cerrar;
    e.app = crearApp({ ...e.ctx, verificador: verificadorDev }, (a) =>
      a.route('/dev/auth', crearAutenticacionDev()),
    );
  });
  afterAll(() => e.cerrar?.());
  e.pedir = (ruta, o = {}) =>
    Promise.resolve(
      e.app!.request(`/api${ruta}`, {
        method: o.metodo ?? (o.cuerpo === undefined ? 'GET' : 'POST'),
        headers: cabecera(o.token),
        body: o.cuerpo === undefined ? undefined : JSON.stringify(o.cuerpo),
      }),
    );
  e.json = async (ruta, o) => {
    const r = await e.pedir(ruta, o);
    return { estado: r.status, datos: await r.json().catch(() => null) };
  };
  return e;
}
