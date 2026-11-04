import {
  esquemaArchivo,
  esquemaConfirmarArchivo,
  EXTENSIONES,
  LIMITES,
  TIPOS_ARCHIVO,
  type CompraDto,
  type SubidaDto,
} from '@ic/shared';
import { esPersonal, exigirSesion, type Actor } from '../domain/actor.js';
import { partesIdCompra, type Compra } from '../domain/compra.js';
import { conflicto, noEncontrado, validacion } from '../domain/errores.js';
import { aCompraDto, exigirCompraPropia } from './compras.js';
import type { Contexto } from './contexto.js';

const prefijo = (c: Pick<Compra, 'sub' | 'fichaId'>) => `comprobantes/${c.sub}/${c.fichaId}/`;
const ADMITE_COMPROBANTE = new Set(['PENDIENTE_PAGO', 'EN_VERIFICACION']);

/** HU-12 CA1 y CA2: URL de subida directa al bucket privado, válida 5 minutos. */
export async function prepararComprobante(
  ctx: Contexto,
  a: Actor | null,
  id: string,
  cuerpo: unknown,
): Promise<SubidaDto> {
  const compra = await exigirCompraPropia(ctx, a, id);
  if (!ADMITE_COMPROBANTE.has(compra.estado))
    throw conflicto('Esta compra ya no recibe comprobantes');
  const { tipo } = esquemaArchivo.parse(cuerpo);
  const llave = `${prefijo(compra)}${ctx.ids.nuevo()}.${EXTENSIONES[tipo]}`;
  return ctx.archivos.firmarSubida(llave, tipo, LIMITES.archivoMaxBytes);
}

/** HU-12 CA3: tras subir el archivo, la compra pasa a «En verificación». */
export async function confirmarComprobante(
  ctx: Contexto,
  a: Actor | null,
  id: string,
  cuerpo: unknown,
): Promise<CompraDto> {
  const compra = await exigirCompraPropia(ctx, a, id);
  const { llave } = esquemaConfirmarArchivo.parse(cuerpo);
  if (!llave.startsWith(prefijo(compra)) || llave.includes('..'))
    throw validacion('Archivo inválido', { llave: 'Archivo inválido' });
  if (!ADMITE_COMPROBANTE.has(compra.estado))
    throw conflicto('Esta compra ya no recibe comprobantes');
  const info = await ctx.archivos.info(llave);
  if (!info)
    throw validacion('No recibimos el archivo. Intente subirlo de nuevo.', {
      llave: 'No recibimos el archivo',
    });
  if (
    info.tamano > LIMITES.archivoMaxBytes ||
    !(TIPOS_ARCHIVO as readonly string[]).includes(info.tipo)
  ) {
    throw validacion('Solo se aceptan JPG, PNG o PDF de máximo 5 MB', {
      llave: 'Archivo no permitido',
    });
  }
  const ahora = ctx.reloj.ahora().toISOString();
  const nueva: Compra = {
    ...compra,
    estado: 'EN_VERIFICACION',
    comprobanteLlave: llave,
    comprobanteSubidoEn: ahora,
    actualizadaEn: ahora,
  };
  if (!(await ctx.compras.reemplazar(nueva, compra)))
    throw conflicto('La compra cambió mientras subía el archivo. Recargue la página.');
  return aCompraDto(ctx, nueva);
}

/** HU-12 CA2: solo el cliente dueño y el personal descargan el comprobante. */
export async function urlComprobante(
  ctx: Contexto,
  a: Actor | null,
  id: string,
): Promise<{ url: string }> {
  const actor = exigirSesion(a);
  let compra: Compra | null;
  if (esPersonal(actor)) {
    const p = partesIdCompra(id);
    compra = p ? await ctx.compras.obtener(p.sub, p.fichaId) : null;
  } else {
    compra = await exigirCompraPropia(ctx, actor, id);
  }
  if (!compra?.comprobanteLlave) throw noEncontrado('La compra no tiene comprobante');
  return { url: await ctx.archivos.firmarDescarga(compra.comprobanteLlave) };
}
