import type { Grupo } from '@ic/shared';
import type { DirectorioUsuarios, VerificadorToken } from '../../application/puertos.js';

/** Token sin firma, exclusivo de pruebas y desarrollo local. bootstrap/lambda.ts no lo importa. */
export const firmarDev = (sub: string, correo: string, grupos: Grupo[]) =>
  'dev.' + Buffer.from(JSON.stringify({ sub, usuario: correo, grupos })).toString('base64url');

export const verificadorDev: VerificadorToken = {
  async verificar(token) {
    if (!token.startsWith('dev.')) return null;
    try {
      return JSON.parse(Buffer.from(token.slice(4), 'base64url').toString());
    } catch {
      return null;
    }
  },
};

/** En local el nombre de usuario del token de desarrollo es el correo. */
export const directorioDev: DirectorioUsuarios = {
  async correo(actor) {
    return actor.usuario;
  },
};
