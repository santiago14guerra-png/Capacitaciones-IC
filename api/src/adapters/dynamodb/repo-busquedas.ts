import type { Busqueda, RepoBusquedas } from '../../application/puertos.js';
import type { Tabla } from './tabla.js';

/** Una partición por mes: BUSQUEDAS#aaaa-mm (modelo de datos). */
export class RepoBusquedasDynamo implements RepoBusquedas {
  constructor(
    private readonly tabla: Tabla,
    private readonly id: () => string,
  ) {}

  async registrar(b: Busqueda) {
    await this.tabla.poner({
      pk: `BUSQUEDAS#${b.fecha.slice(0, 7)}`,
      sk: `${b.fecha}#${this.id()}`,
      ...b,
    });
  }

  async listarMes(mes: string) {
    const items = await this.tabla.consultar<Busqueda & { pk: string; sk: string }>({
      KeyConditionExpression: 'pk = :p',
      ExpressionAttributeValues: { ':p': `BUSQUEDAS#${mes}` },
    });
    return items.map(({ termino, fecha, resultados }) => ({ termino, fecha, resultados }));
  }
}
