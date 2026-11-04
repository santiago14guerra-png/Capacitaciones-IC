import { GRUPOS, type Grupo } from '@ic/shared';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { VerificadorToken } from '../../application/puertos.js';

export function crearVerificadorCognito(userPoolId: string, clientId: string): VerificadorToken {
  const jwt = CognitoJwtVerifier.create({ userPoolId, clientId, tokenUse: 'access' });
  const validos = new Set<string>(Object.values(GRUPOS));
  return {
    async verificar(token) {
      try {
        const p = await jwt.verify(token);
        const grupos = (p['cognito:groups'] ?? []).filter((g) => validos.has(g)) as Grupo[];
        return { sub: p.sub, usuario: String(p.username), grupos };
      } catch {
        return null;
      }
    },
  };
}
