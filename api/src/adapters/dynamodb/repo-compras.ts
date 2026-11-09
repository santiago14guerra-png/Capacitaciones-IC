import type { EstadoCompra } from '@ic/shared';
import type { Contadores, RepoCompras } from '../../application/puertos.js';
import type { Compra } from '../../domain/compra.js';
import { esCondicionFallida, type Item, type Tabla } from './tabla.js';

const llave = (sub: string, fichaId: string) => ({ pk: `USER#${sub}`, sk: `COMPRA#${fichaId}` });
const INTERNOS = new Set(['pk', 'sk', 'gsi1pk', 'gsi1sk', 'gsi2pk', 'gsi2sk']);
const limpiar = (i: Item) =>
  Object.fromEntries(Object.entries(i).filter(([k]) => !INTERNOS.has(k))) as unknown as Compra;
const item = (c: Compra) => ({
  ...llave(c.sub, c.fichaId),
  gsi1pk: `COMPRA#${c.estado}`,
  gsi1sk: c.actualizadaEn,
  gsi2pk: 'COMPRAS',
  gsi2sk: c.creadaEn,
  ...c,
});
const condicional = async (f: () => Promise<void>) => {
  try {
    await f();
    return true;
  } catch (e) {
    if (esCondicionFallida(e)) return false;
    throw e;
  }
};

export class RepoComprasDynamo implements RepoCompras {
  constructor(private readonly tabla: Tabla) {}

  async obtener(sub: string, fichaId: string) {
    const { pk, sk } = llave(sub, fichaId);
    const i = await this.tabla.obtener<Item>(pk, sk);
    return i ? limpiar(i) : null;
  }

  crear(c: Compra) {
    return condicional(() =>
      this.tabla.poner(item(c), 'attribute_not_exists(pk) OR estado = :r', { ':r': 'RECHAZADA' }),
    );
  }

  reemplazar(nueva: Compra, previa: Compra) {
    return condicional(() =>
      this.tabla.poner(item(nueva), 'estado = :e AND actualizadaEn = :a', {
        ':e': previa.estado,
        ':a': previa.actualizadaEn,
      }),
    );
  }

  async listarDeUsuario(sub: string) {
    const items = await this.tabla.consultar<Item>({
      KeyConditionExpression: 'pk = :p AND begins_with(sk, :s)',
      ExpressionAttributeValues: { ':p': `USER#${sub}`, ':s': 'COMPRA#' },
    });
    return items.map(limpiar);
  }

  async listarPorEstado(estado: EstadoCompra, desde?: string, hasta?: string) {
    const rango = desde && hasta;
    const items = await this.tabla.consultar<Item>({
      IndexName: 'gsi1',
      KeyConditionExpression: rango ? 'gsi1pk = :p AND gsi1sk BETWEEN :d AND :h' : 'gsi1pk = :p',
      ExpressionAttributeValues: {
        ':p': `COMPRA#${estado}`,
        ...(rango ? { ':d': desde, ':h': hasta } : {}),
      },
    });
    return items.map(limpiar);
  }

  async listarCreadasEntre(desde: string, hasta: string) {
    const items = await this.tabla.consultar<Item>({
      IndexName: 'gsi2',
      KeyConditionExpression: 'gsi2pk = :p AND gsi2sk BETWEEN :d AND :h',
      ExpressionAttributeValues: { ':p': 'COMPRAS', ':d': desde, ':h': hasta },
    });
    return items.map(limpiar);
  }
}

export class ContadoresDynamo implements Contadores {
  constructor(private readonly tabla: Tabla) {}
  async siguiente(nombre: 'COMPRA' | 'CONSULTA') {
    const r = await this.tabla.actualizar('CONTADOR', nombre, {
      UpdateExpression: 'ADD valor :uno',
      ExpressionAttributeValues: { ':uno': 1 },
    });
    return Number(r.valor);
  }
}
