import type { Cuotas } from '../../application/puertos.js';
import { esCondicionFallida, type Tabla } from './tabla.js';

const DOS_DIAS_MS = 2 * 86_400_000;

/** Un ítem por cuenta y día. El atributo `expira` activa el TTL de la tabla. */
export class CuotasDynamo implements Cuotas {
  constructor(private readonly tabla: Tabla) {}

  async consumirSubida(sub: string, dia: string, maximo: number) {
    try {
      await this.tabla.actualizar(`USUARIO#${sub}`, `CUOTA#SUBIDAS#${dia}`, {
        UpdateExpression: 'ADD usadas :uno SET expira = :e',
        ConditionExpression: 'attribute_not_exists(usadas) OR usadas < :m',
        ExpressionAttributeValues: {
          ':uno': 1,
          ':m': maximo,
          ':e': Math.floor((new Date(dia).getTime() + DOS_DIAS_MS) / 1000),
        },
      });
      return true;
    } catch (e) {
      if (esCondicionFallida(e)) return false;
      throw e;
    }
  }
}
