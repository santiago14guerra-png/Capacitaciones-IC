import type { EstadoFicha } from '@ic/shared';
import type { RepoFichas } from '../../application/puertos.js';
import type { Ficha, FichaMeta } from '../../domain/ficha.js';
import type { Item, Tabla } from './tabla.js';

const pk = (id: string) => `FICHA#${id}`;
const INTERNOS = ['pk', 'sk', 'gsi1pk', 'gsi1sk', 'gsi2pk', 'gsi2sk'];
const limpiar = <T>(item: Item) =>
  Object.fromEntries(Object.entries(item).filter(([k]) => !INTERNOS.includes(k))) as T;

/** Ficha en dos ítems: META (catálogo, búsqueda) y CONTENIDO (solo con acceso). */
export class RepoFichasDynamo implements RepoFichas {
  constructor(private readonly tabla: Tabla) {}

  async listarPorEstado(estado: EstadoFicha) {
    const items = await this.tabla.consultarIndice<Item>('gsi1', `FICHAS#${estado}`);
    return items.map((i) => limpiar<FichaMeta>(i));
  }

  async obtenerMeta(id: string) {
    const i = await this.tabla.obtener<Item>(pk(id), 'META');
    return i ? limpiar<FichaMeta>(i) : null;
  }

  async obtener(id: string) {
    const [meta, contenido] = await Promise.all([
      this.obtenerMeta(id),
      this.tabla.obtener<{ respuestaHtml: string }>(pk(id), 'CONTENIDO'),
    ]);
    return meta ? { ...meta, respuestaHtml: contenido?.respuestaHtml ?? '' } : null;
  }

  async guardar({ respuestaHtml, ...meta }: Ficha) {
    await this.tabla.poner({ pk: pk(meta.id), sk: 'CONTENIDO', respuestaHtml });
    await this.guardarMeta(meta);
  }

  async guardarMeta(meta: FichaMeta) {
    await this.tabla.poner({
      pk: pk(meta.id),
      sk: 'META',
      gsi1pk: `FICHAS#${meta.estado}`,
      gsi1sk: meta.actualizadaEn,
      ...meta,
    });
  }

  async borrar(id: string) {
    await Promise.all([this.tabla.borrar(pk(id), 'META'), this.tabla.borrar(pk(id), 'CONTENIDO')]);
  }
}
