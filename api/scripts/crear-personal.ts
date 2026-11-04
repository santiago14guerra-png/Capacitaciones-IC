/**
 * HU-04 CA3: crea una cuenta de personal (administrador o director). Solo la ejecuta un
 * administrador con credenciales de AWS; el registro público nunca asigna estos grupos.
 *
 *   npm run crear-personal --workspace api -- <user-pool-id> <correo> <administrador|director>
 *
 * Cognito envía al correo una contraseña temporal que se cambia en el primer ingreso.
 */
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  CognitoIdentityProviderClient,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider';
import { GRUPOS } from '@ic/shared';

const [userPoolId, correoCrudo, grupo] = process.argv.slice(2);
const permitidos: string[] = [GRUPOS.administrador, GRUPOS.director];
if (!userPoolId || !correoCrudo || !grupo || !permitidos.includes(grupo)) {
  console.error('Uso: crear-personal <user-pool-id> <correo> <administrador|director>');
  process.exit(1);
}
const correo = correoCrudo.trim().toLowerCase();
const cognito = new CognitoIdentityProviderClient({});

try {
  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: correo,
      DesiredDeliveryMediums: ['EMAIL'],
      UserAttributes: [
        { Name: 'email', Value: correo },
        { Name: 'email_verified', Value: 'true' },
      ],
    }),
  );
  console.log(`Cuenta creada; Cognito envió la contraseña temporal a ${correo}.`);
} catch (e) {
  if (!(e instanceof UsernameExistsException)) throw e;
  console.log('La cuenta ya existía; solo se agrega al grupo.');
}
await cognito.send(
  new AdminAddUserToGroupCommand({ UserPoolId: userPoolId, Username: correo, GroupName: grupo }),
);
console.log(`Agregada al grupo «${grupo}».`);
