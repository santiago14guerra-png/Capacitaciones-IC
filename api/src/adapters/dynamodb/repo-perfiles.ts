import type { RepoPerfiles } from '../../application/puertos.js';
import type { Perfil } from '../../domain/perfil.js';
import type { Tabla } from './tabla.js';

const llave = (sub: string) => ({ pk: `USUARIO#${sub}`, sk: 'PERFIL' });

export class RepoPerfilesDynamo implements RepoPerfiles {
  constructor(private readonly tabla: Tabla) {}

  async obtener(sub: string) {
    const { pk, sk } = llave(sub);
    const item = await this.tabla.obtener<Perfil & { pk: string; sk: string }>(pk, sk);
    if (!item) return null;
    const { pk: _p, sk: _s, ...perfil } = item;
    return perfil;
  }

  async guardar(perfil: Perfil) {
    await this.tabla.poner({ ...llave(perfil.sub), ...perfil });
  }
}
