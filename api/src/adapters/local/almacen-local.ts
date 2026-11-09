import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { LIMITES } from '@ic/shared';
import { Hono } from 'hono';
import type { Almacen } from '../../application/puertos.js';

interface Archivo {
  datos: Uint8Array;
  tipo: string;
  version: string;
  sinConfirmar: boolean;
}

/**
 * Sustituto de S3 para local y pruebas: aplica la misma política que la URL prefirmada
 * (tipo exacto, tamaño máximo y vencimiento a los 5 minutos) y, como el bucket, guarda
 * versiones: volver a subir a la misma llave crea una nueva. Nunca se usa en AWS.
 */
export function crearAlmacenLocal(ahora: () => number = Date.now) {
  const archivos = new Map<string, Archivo[]>();
  const actual = (llave: string) => archivos.get(llave)?.at(-1);
  const secreto = randomBytes(16);
  const firmar = (texto: string) => createHmac('sha256', secreto).update(texto).digest('hex');
  const valida = (texto: string, firma = '') => {
    const esperada = Buffer.from(firmar(texto));
    const dada = Buffer.from(firma);
    return dada.length === esperada.length && timingSafeEqual(dada, esperada);
  };
  const vence = () => String(ahora() + LIMITES.urlFirmadaSegundos * 1000);

  const almacen: Almacen = {
    async firmarSubida(llave, tipo, maxBytes) {
      const hasta = vence();
      const politica = `${llave}|${tipo}|${maxBytes}|${hasta}`;
      return {
        url: '/api/dev/archivos',
        llave,
        campos: {
          key: llave,
          'Content-Type': tipo,
          max: String(maxBytes),
          hasta,
          firma: firmar(politica),
        },
      };
    },
    async info(llave) {
      const a = actual(llave);
      return a ? { tamano: a.datos.byteLength, tipo: a.tipo, version: a.version } : null;
    },
    async conservar(llave, version) {
      const a = archivos.get(llave)?.find((v) => v.version === version);
      if (a) a.sinConfirmar = false;
    },
    async firmarDescarga(llave, version = '') {
      const hasta = vence();
      const firma = firmar(`${llave}|${version}|${hasta}`);
      return `/api/dev/archivos/descarga?${new URLSearchParams({ llave, version, hasta, firma })}`;
    },
  };

  const rutas = new Hono()
    .post('/', async (c) => {
      const f = await c.req.parseBody();
      const [llave, tipo, max, hasta, firma] = ['key', 'Content-Type', 'max', 'hasta', 'firma'].map(
        (k) => String(f[k] ?? ''),
      ) as [string, string, string, string, string];
      const archivo = f.file;
      if (!valida(`${llave}|${tipo}|${max}|${hasta}`, firma) || Number(hasta) < ahora()) {
        return c.text('AccessDenied: política inválida o vencida', 403);
      }
      if (!(archivo instanceof File)) return c.text('Falta el archivo', 400);
      if (archivo.size < 1 || archivo.size > Number(max)) return c.text('EntityTooLarge', 400);
      const versiones = archivos.get(llave) ?? [];
      versiones.push({
        datos: new Uint8Array(await archivo.arrayBuffer()),
        tipo,
        version: String(versiones.length + 1),
        sinConfirmar: true,
      });
      archivos.set(llave, versiones);
      return c.body(null, 204);
    })
    .get('/descarga', (c) => {
      const { llave = '', version = '', hasta = '0', firma } = c.req.query();
      const a = version ? archivos.get(llave)?.find((v) => v.version === version) : actual(llave);
      if (!valida(`${llave}|${version}|${hasta}`, firma) || Number(hasta) < ahora() || !a)
        return c.text('AccessDenied', 403);
      return c.body(a.datos as Uint8Array<ArrayBuffer>, 200, { 'content-type': a.tipo });
    });

  /** Llaves cuya última versión seguiría marcada para borrarse. */
  const sinConfirmar = () => [...archivos.keys()].filter((k) => actual(k)?.sinConfirmar);

  return { almacen, rutas, sinConfirmar };
}
