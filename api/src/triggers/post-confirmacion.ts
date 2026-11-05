import {
  AdminAddUserToGroupCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { GRUPOS } from '@ic/shared';
import type { PostConfirmationTriggerHandler } from 'aws-lambda';

const cognito = new CognitoIdentityProviderClient({});

/**
 * HU-02 CA6 y HU-04 CA3: el registro público siempre queda en el grupo «cliente».
 * Los grupos de personal solo los asigna un administrador (scripts/crear-personal.ts).
 */
export const handler: PostConfirmationTriggerHandler = async (evento) => {
  if (evento.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    await cognito.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: evento.userPoolId,
        Username: evento.userName,
        GroupName: GRUPOS.cliente,
      }),
    );
  }
  return evento;
};
