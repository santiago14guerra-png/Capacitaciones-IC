import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import type { DirectorioUsuarios } from '../../application/puertos.js';

export function crearDirectorioCognito(userPoolId: string): DirectorioUsuarios {
  const cognito = new CognitoIdentityProviderClient({});
  return {
    async correo(actor) {
      const r = await cognito.send(
        new AdminGetUserCommand({ UserPoolId: userPoolId, Username: actor.usuario }),
      );
      const correo = r.UserAttributes?.find((a) => a.Name === 'email')?.Value;
      if (!correo) throw new Error('La cuenta no tiene correo');
      return correo;
    },
  };
}
