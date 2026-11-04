import type { PerfilDto } from '@ic/shared';

/** Datos personales y de facturación del cliente (HU-02, HU-23). */
export type Perfil = PerfilDto;

export const nombreCompleto = (p: Pick<Perfil, 'nombres' | 'apellidos'>) =>
  `${p.nombres} ${p.apellidos}`.trim();
