import type { SubidaDto } from '@ic/shared';
import type { Entorno } from './entorno.js';

/** Sube un archivo como lo haría el navegador con la URL prefirmada. */
export async function subir(
  e: Entorno,
  s: SubidaDto,
  bytes: number,
  tipo = s.campos['Content-Type']!,
) {
  const f = new FormData();
  for (const [k, v] of Object.entries(s.campos)) f.append(k, v);
  f.append('file', new File([new Uint8Array(bytes)], 'archivo', { type: tipo }));
  return e.crudo(s.url, { method: 'POST', body: f });
}
