import type { ResultadoIngreso, Tokens, Transporte } from './tipos';

const CLAVE = 'ic.sesion';
const SESION_MAXIMA_MS = 8 * 3600 * 1000; // HU-03 CA5: igual a la vigencia del token de actualización.

interface Guardado {
  actualizacion: string;
  hasta: number;
}

const leer = (): Guardado | null => {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Guardado | null;
    return g && g.hasta > Date.now() ? g : null;
  } catch {
    return null;
  }
};
const escribir = (g: Guardado | null) => {
  try {
    if (g) localStorage.setItem(CLAVE, JSON.stringify(g));
    else localStorage.removeItem(CLAVE);
  } catch {
    /* almacenamiento bloqueado: la sesión dura lo que la pestaña */
  }
};

/**
 * Maneja los tokens: el de acceso solo en memoria; el de actualización en localStorage hasta
 * que vence (8 horas) para no pedir la contraseña al recargar la página.
 */
export class Autenticador {
  private acceso: { token: string; vence: number } | null = null;
  private guardado = leer();
  private refrescando: Promise<string | null> | null = null;

  constructor(readonly transporte: Transporte) {}

  haySesion() {
    return !!this.guardado;
  }

  private aceptar(t: Tokens) {
    this.acceso = { token: t.acceso, vence: Date.now() + (t.expiraEn - 60) * 1000 };
    if (t.actualizacion) {
      this.guardado = { actualizacion: t.actualizacion, hasta: Date.now() + SESION_MAXIMA_MS };
      escribir(this.guardado);
    }
  }

  async ingresar(correo: string, clave: string): Promise<ResultadoIngreso> {
    const r = await this.transporte.ingresar(correo.trim().toLowerCase(), clave);
    if ('acceso' in r) this.aceptar(r);
    return r;
  }

  async completarNuevaContrasena(correo: string, sesion: string, clave: string) {
    this.aceptar(await this.transporte.nuevaContrasena(correo.trim().toLowerCase(), sesion, clave));
  }

  async tokenAcceso(): Promise<string | null> {
    if (this.acceso && this.acceso.vence > Date.now()) return this.acceso.token;
    if (!this.guardado) return null;
    this.refrescando ??= this.transporte
      .refrescar(this.guardado.actualizacion)
      .then((t) => {
        this.aceptar(t);
        return t.acceso;
      })
      .catch(() => {
        this.olvidar();
        return null;
      })
      .finally(() => {
        this.refrescando = null;
      });
    return this.refrescando;
  }

  olvidar() {
    this.acceso = null;
    this.guardado = null;
    escribir(null);
  }

  async salir() {
    const acceso = await this.tokenAcceso();
    const actualizacion = this.guardado?.actualizacion;
    this.olvidar();
    if (actualizacion)
      await this.transporte.salir(acceso ?? '', actualizacion).catch(() => undefined);
  }
}
