/** Error devuelto por la API con su código y los errores por campo. */
export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: string,
    mensaje: string,
    readonly campos: Record<string, string> = {},
  ) {
    super(mensaje);
  }
}

type ObtenerToken = () => Promise<string | null>;
let obtenerToken: ObtenerToken = async () => null;
let alNoAutenticado: () => void = () => {};

export function configurarApi(token: ObtenerToken, noAutenticado: () => void) {
  obtenerToken = token;
  alNoAutenticado = noAutenticado;
}

export async function api<T>(
  ruta: string,
  opciones: { metodo?: string; cuerpo?: unknown; senal?: AbortSignal } = {},
): Promise<T> {
  const token = await obtenerToken();
  const r = await fetch(`/api${ruta}`, {
    method: opciones.metodo ?? (opciones.cuerpo === undefined ? 'GET' : 'POST'),
    headers: {
      ...(opciones.cuerpo !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
    signal: opciones.senal,
  });
  if (r.status === 204) return undefined as T;
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && token) alNoAutenticado();
    throw new ErrorApi(
      r.status,
      datos.error ?? 'DESCONOCIDO',
      datos.mensaje ?? 'Ocurrió un error. Intente de nuevo.',
      datos.campos ?? {},
    );
  }
  return datos as T;
}

/** Descarga un archivo binario de la API (p. ej. Excel) respetando la sesión. */
export async function descargar(ruta: string, nombre: string) {
  const token = await obtenerToken();
  const r = await fetch(`/api${ruta}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new ErrorApi(
      r.status,
      d.error ?? 'DESCONOCIDO',
      d.mensaje ?? 'No se pudo descargar',
      d.campos,
    );
  }
  const url = URL.createObjectURL(await r.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
