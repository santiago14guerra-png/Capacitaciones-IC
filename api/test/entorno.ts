import type { Grupo } from '@ic/shared';
import { firmarDev } from '../src/adapters/local/token-dev.js';

export const token = (sub: string, ...grupos: Grupo[]) =>
  `Bearer ${firmarDev(sub, `${sub}@correo.co`, grupos)}`;

export const cabecera = (t?: string) => ({
  'content-type': 'application/json',
  ...(t ? { authorization: t } : {}),
});
