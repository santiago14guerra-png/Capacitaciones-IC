import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import { rutas } from '../App';
import { Autenticador } from '../lib/autenticacion/autenticador';
import type { Transporte } from '../lib/autenticacion/tipos';
import { ProveedorSesion } from '../lib/sesion';

type Respuesta = unknown | ((cuerpo: any, url: URL) => unknown);
export type RutasFalsas = Record<string, Respuesta>;

/** Reemplaza fetch: las llaves son «MÉTODO /ruta» sin el prefijo /api y sin parámetros. */
export function simularApi(rutasApi: RutasFalsas) {
  const llamadas: { metodo: string; ruta: string; cuerpo: any; url: URL }[] = [];
  const f = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(entrada), 'http://localhost');
    const metodo = init?.method ?? 'GET';
    const ruta = url.pathname.replace(/^\/api/, '');
    const cuerpo = init?.body ? JSON.parse(String(init.body)) : undefined;
    llamadas.push({ metodo, ruta, cuerpo, url });
    const r = rutasApi[`${metodo} ${ruta}`];
    if (r === undefined) {
      return new Response(JSON.stringify({ error: 'NO_ENCONTRADO', mensaje: 'No encontrado' }), {
        status: 404,
      });
    }
    const valor =
      typeof r === 'function' ? await (r as (c: any, u: URL) => unknown)(cuerpo, url) : r;
    if (valor instanceof Response) return valor;
    return new Response(JSON.stringify(valor), { status: 200 });
  });
  vi.stubGlobal('fetch', f);
  return llamadas;
}

export const respuestaError = (estado: number, error: string, mensaje = 'Error', campos = {}) =>
  new Response(JSON.stringify({ error, mensaje, campos }), { status: estado });

export function transporteFalso(cambios: Partial<Transporte> = {}): Transporte {
  const tokens = { acceso: 'acceso', actualizacion: 'actualizacion', expiraEn: 900 };
  return {
    ingresar: vi.fn(async () => tokens),
    nuevaContrasena: vi.fn(async () => tokens),
    refrescar: vi.fn(async () => tokens),
    salir: vi.fn(async () => undefined),
    registrar: vi.fn(async () => undefined),
    confirmar: vi.fn(async () => undefined),
    reenviarCodigo: vi.fn(async () => undefined),
    olvido: vi.fn(async () => undefined),
    restablecer: vi.fn(async () => undefined),
    ...cambios,
  };
}

export const SESION_CLIENTE = {
  sub: 'ana',
  correo: 'ana@correo.co',
  grupos: ['cliente'],
  perfil: {
    sub: 'ana',
    correo: 'ana@correo.co',
    nombres: 'Ana',
    apellidos: 'Ruiz',
    tipoDocumento: 'CC',
    numeroDocumento: '123',
    celular: '3001234567',
    direccion: 'Calle 1',
    ciudad: 'Medellín',
    autorizacionDatosEn: '2026-11-01T00:00:00.000Z',
  },
};
export const SESION_ADMIN = {
  sub: 'adm',
  correo: 'adm@ic.co',
  grupos: ['administrador'],
  perfil: null,
};

/** Monta la app completa en una ruta. Con `conSesion` simula un token de actualización guardado. */
export function renderizar(
  ruta: string,
  opciones: { conSesion?: boolean; transporte?: Transporte } = {},
) {
  localStorage.clear();
  if (opciones.conSesion) {
    localStorage.setItem(
      'ic.sesion',
      JSON.stringify({ actualizacion: 'r', hasta: Date.now() + 3_600_000 }),
    );
  }
  const transporte = opciones.transporte ?? transporteFalso();
  const autenticador = new Autenticador(transporte);
  const enrutador = createMemoryRouter(rutas, { initialEntries: [ruta] });
  const vista = render(
    <ProveedorSesion autenticador={autenticador}>
      <RouterProvider router={enrutador} />
    </ProveedorSesion>,
  );
  return { ...vista, enrutador, transporte, autenticador };
}
