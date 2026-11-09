import type { RepoConsultas } from '../../application/puertos.js';
import type { Consulta } from '../../domain/consulta.js';
import { esCondicionFallida, type Item, type Tabla } from './tabla.js';

const INTERNOS = new Set(['pk', 'sk', 'gsi1pk', 'gsi1sk', 'gsi2pk', 'gsi2sk']);
const limpiar = (i: Item) =>
  Object.fromEntries(Object.entries(i).filter(([k]) => !INTERNOS.has(k))) as unknown as Consulta;
const item = (c: Consulta) => ({
  pk: `CONSULTA#${c.id}`,
  sk: 'META',
  gsi1pk: 'CONSULTAS',
  gsi1sk: c.recibidaEn,
  gsi2pk: `USER#${c.sub}#CONSULTAS`,
  gsi2sk: c.recibidaEn,
  ...c,
});

export class RepoConsultasDynamo implements RepoConsultas {
  constructor(private readonly tabla: Tabla) {}

  async guardar(c: Consulta) {
    await this.tabla.poner(item(c), 'attribute_not_exists(pk)');
  }

  async obtener(id: string) {
    const i = await this.tabla.obtener<Item>(`CONSULTA#${id}`, 'META');
    return i ? limpiar(i) : null;
  }

  async reemplazar(nueva: Consulta, previa: Consulta) {
    try {
      await this.tabla.poner(item(nueva), 'actualizadaEn = :a', { ':a': previa.actualizadaEn });
      return true;
    } catch (e) {
      if (esCondicionFallida(e)) return false;
      throw e;
    }
  }

  async listarTodas() {
    return (await this.tabla.consultarIndice<Item>('gsi1', 'CONSULTAS')).map(limpiar);
  }

  async listarDeUsuario(sub: string) {
    return (await this.tabla.consultarIndice<Item>('gsi2', `USER#${sub}#CONSULTAS`)).map(limpiar);
  }
}
