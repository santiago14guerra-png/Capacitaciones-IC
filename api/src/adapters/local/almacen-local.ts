import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { LIMITES } from '@ic/shared';
import { Hono } from 'hono';
import type { Almacen } from '../../application/puertos.js';

interface Archivo {
  datos: Uint8Array;
  tipo: string;
}

/**
 * Sustituto de S3 para local y pruebas: aplica la misma política que la URL prefirmada
 * (tipo exacto, tamaño máximo y vencimiento a los 5 minutos). Nunca se usa en AWS.
 */
export function crearAlmacenLocal(ahora: () => number = Date.now) {
  const archivos = new Map<string, Archivo>();
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
      const a = archivos.get(llave);
      return a ? { tamano: a.datos.byteLength, tipo: a.tipo } : null;
    },
    async firmarDescarga(llave) {
      const hasta = vence();
      return `/api/dev/archivos/descarga?${new URLSearchParams({ llave, hasta, firma: firmar(`${llave}|${hasta}`) })}`;
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
      archivos.set(llave, { datos: new Uint8Array(await archivo.arrayBuffer()), tipo });
      return c.body(null, 204);
    })
    .get('/descarga', (c) => {
      const { llave = '', hasta = '0', firma } = c.req.query();
      const a = archivos.get(llave);
      if (!valida(`${llave}|${hasta}`, firma) || Number(hasta) < ahora() || !a)
        return c.text('AccessDenied', 403);
      return c.body(a.datos as Uint8Array<ArrayBuffer>, 200, { 'content-type': a.tipo });
    });

  return { almacen, rutas };
}
