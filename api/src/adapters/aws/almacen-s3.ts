import {
  DeleteObjectTaggingCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  S3Client,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { LIMITES } from '@ic/shared';
import type { Almacen } from '../../application/puertos.js';

/** La regla de ciclo de vida del bucket (infra) borra los objetos con esta etiqueta. */
const ETIQUETA_SIN_CONFIRMAR =
  '<Tagging><TagSet><Tag><Key>estado</Key><Value>sin-confirmar</Value></Tag></TagSet></Tagging>';

/** Bucket privado; el navegador sube y descarga con URL prefirmadas de 5 minutos (HU-12). */
export function crearAlmacenS3(bucket: string): Almacen {
  const s3 = new S3Client({});
  return {
    async firmarSubida(llave, tipo, maxBytes) {
      const { url, fields } = await createPresignedPost(s3, {
        Bucket: bucket,
        Key: llave,
        Fields: { 'Content-Type': tipo, tagging: ETIQUETA_SIN_CONFIRMAR },
        // La política de S3 rechaza archivos de otro tipo o de más de maxBytes (HU-12 CA1).
        Conditions: [
          ['content-length-range', 1, maxBytes],
          ['eq', '$Content-Type', tipo],
          ['eq', '$tagging', ETIQUETA_SIN_CONFIRMAR],
        ],
        Expires: LIMITES.urlFirmadaSegundos,
      });
      return { url, campos: fields, llave };
    },
    async info(llave) {
      try {
        const r = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: llave }));
        return { tamano: r.ContentLength ?? 0, tipo: r.ContentType ?? '', version: r.VersionId };
      } catch (e) {
        if (e instanceof NotFound || (e as { name?: string }).name === 'NotFound') return null;
        throw e;
      }
    },
    async conservar(llave, version) {
      await s3.send(
        new DeleteObjectTaggingCommand({ Bucket: bucket, Key: llave, VersionId: version }),
      );
    },
    firmarDescarga(llave, version) {
      const orden = new GetObjectCommand({ Bucket: bucket, Key: llave, VersionId: version });
      return getSignedUrl(s3, orden, { expiresIn: LIMITES.urlFirmadaSegundos });
    },
  };
}
