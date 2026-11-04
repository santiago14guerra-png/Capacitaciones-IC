import { GetObjectCommand, HeadObjectCommand, NotFound, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { LIMITES } from '@ic/shared';
import type { Almacen } from '../../application/puertos.js';

/** Bucket privado; el navegador sube y descarga con URL prefirmadas de 5 minutos (HU-12). */
export function crearAlmacenS3(bucket: string): Almacen {
  const s3 = new S3Client({});
  return {
    async firmarSubida(llave, tipo, maxBytes) {
      const { url, fields } = await createPresignedPost(s3, {
        Bucket: bucket,
        Key: llave,
        Fields: { 'Content-Type': tipo },
        // La política de S3 rechaza archivos de otro tipo o de más de maxBytes (HU-12 CA1).
        Conditions: [
          ['content-length-range', 1, maxBytes],
          ['eq', '$Content-Type', tipo],
        ],
        Expires: LIMITES.urlFirmadaSegundos,
      });
      return { url, campos: fields, llave };
    },
    async info(llave) {
      try {
        const r = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: llave }));
        return { tamano: r.ContentLength ?? 0, tipo: r.ContentType ?? '' };
      } catch (e) {
        if (e instanceof NotFound || (e as { name?: string }).name === 'NotFound') return null;
        throw e;
      }
    },
    firmarDescarga(llave) {
      return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: llave }), {
        expiresIn: LIMITES.urlFirmadaSegundos,
      });
    },
  };
}
