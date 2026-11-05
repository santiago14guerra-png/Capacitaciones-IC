import type { Entorno } from './entorno.js';
import { DATOS_PERFIL } from './fabricas.js';
import { subir } from './subir.js';

/** Lleva una compra hasta «En verificación» como lo haría el cliente. */
export async function compraEnVerificacion(e: Entorno, token: string, fichaId: string) {
  await e.json('/mi/perfil', { metodo: 'PUT', token, cuerpo: DATOS_PERFIL });
  const compra = (await e.json('/compras', { token, cuerpo: { fichaId } })).datos;
  const s = (
    await e.json(`/compras/${compra.id}/comprobante`, {
      token,
      cuerpo: { nombre: 'c.pdf', tipo: 'application/pdf', tamano: 100 },
    })
  ).datos;
  await subir(e, s, 100);
  return (
    await e.json(`/compras/${compra.id}/comprobante`, {
      metodo: 'PUT',
      token,
      cuerpo: { llave: s.llave },
    })
  ).datos;
}
