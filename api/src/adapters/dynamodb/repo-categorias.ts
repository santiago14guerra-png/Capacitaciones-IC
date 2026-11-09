import type { RepoCategorias } from '../../application/puertos.js';
import type { Categoria } from '../../domain/categoria.js';
import type { Tabla } from './tabla.js';

const PK = 'CATEGORIA';
const limpiar = ({ pk: _p, sk: _s, ...c }: Categoria & { pk?: string; sk?: string }): Categoria =>
  c;

export class RepoCategoriasDynamo implements RepoCategorias {
  constructor(private readonly tabla: Tabla) {}

  async listar() {
    const items = await this.tabla.consultar<Categoria>({
      KeyConditionExpression: 'pk = :p',
      ExpressionAttributeValues: { ':p': PK },
    });
    return items.map(limpiar);
  }

  async obtener(id: string) {
    const c = await this.tabla.obtener<Categoria>(PK, `CAT#${id}`);
    return c ? limpiar(c) : null;
  }

  async guardar(c: Categoria) {
    await this.tabla.poner({ pk: PK, sk: `CAT#${c.id}`, ...c });
  }
}
