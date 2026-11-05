import {
  ErrorAuth,
  type CodigoAuth,
  type ResultadoIngreso,
  type Tokens,
  type Transporte,
} from './tipos';

interface RespuestaAuth {
  AuthenticationResult?: { AccessToken: string; RefreshToken?: string; ExpiresIn: number };
  ChallengeName?: string;
  Session?: string;
}

export function codigoCognito(tipo: string, mensaje = ''): CodigoAuth {
  const t = tipo.split('#').pop() ?? tipo;
  switch (t) {
    case 'NotAuthorizedException':
      return /attempts exceeded/i.test(mensaje) ? 'BLOQUEADO' : 'CREDENCIALES';
    case 'UserNotFoundException':
      return 'CREDENCIALES';
    case 'UserNotConfirmedException':
      return 'SIN_CONFIRMAR';
    case 'UsernameExistsException':
      return 'CORREO_EXISTE';
    case 'CodeMismatchException':
      return 'CODIGO_INVALIDO';
    case 'ExpiredCodeException':
      return 'CODIGO_VENCIDO';
    case 'InvalidPasswordException':
      return 'CONTRASENA_DEBIL';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
    case 'TooManyFailedAttemptsException':
      return 'LIMITE';
    default:
      return 'DESCONOCIDO';
  }
}

/** Habla directamente con la API JSON de Cognito (ADR 0004), sin SDK en el navegador. */
export function transporteCognito(region: string, clientId: string): Transporte {
  const llamar = async <T>(operacion: string, cuerpo: object): Promise<T> => {
    const r = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-amz-json-1.1',
        'x-amz-target': `AWSCognitoIdentityProviderService.${operacion}`,
      },
      body: JSON.stringify({ ClientId: clientId, ...cuerpo }),
    });
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) throw new ErrorAuth(codigoCognito(datos.__type ?? '', datos.message));
    return datos as T;
  };
  const tokens = (r: RespuestaAuth): Tokens => {
    const a = r.AuthenticationResult!;
    return { acceso: a.AccessToken, actualizacion: a.RefreshToken, expiraEn: a.ExpiresIn };
  };

  return {
    async ingresar(correo, clave): Promise<ResultadoIngreso> {
      const r = await llamar<RespuestaAuth>('InitiateAuth', {
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: { USERNAME: correo, PASSWORD: clave },
      });
      if (r.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        return { desafio: 'NUEVA_CONTRASENA', sesion: r.Session! };
      }
      return tokens(r);
    },
    async nuevaContrasena(correo, sesion, clave) {
      return tokens(
        await llamar<RespuestaAuth>('RespondToAuthChallenge', {
          ChallengeName: 'NEW_PASSWORD_REQUIRED',
          Session: sesion,
          ChallengeResponses: { USERNAME: correo, NEW_PASSWORD: clave },
        }),
      );
    },
    async refrescar(actualizacion) {
      try {
        return tokens(
          await llamar<RespuestaAuth>('InitiateAuth', {
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            AuthParameters: { REFRESH_TOKEN: actualizacion },
          }),
        );
      } catch {
        throw new ErrorAuth('SESION_VENCIDA');
      }
    },
    async salir(acceso, actualizacion) {
      // HU-03 CA4: invalida en el servidor los tokens de actualización emitidos.
      await llamar('GlobalSignOut', { AccessToken: acceso }).catch(() => undefined);
      await llamar('RevokeToken', { Token: actualizacion }).catch(() => undefined);
    },
    async registrar(correo, clave) {
      await llamar('SignUp', {
        Username: correo,
        Password: clave,
        UserAttributes: [{ Name: 'email', Value: correo }],
      });
    },
    async confirmar(correo, codigo) {
      await llamar('ConfirmSignUp', { Username: correo, ConfirmationCode: codigo });
    },
    async reenviarCodigo(correo) {
      await llamar('ResendConfirmationCode', { Username: correo });
    },
    async olvido(correo) {
      await llamar('ForgotPassword', { Username: correo });
    },
    async restablecer(correo, codigo, clave) {
      await llamar('ConfirmForgotPassword', {
        Username: correo,
        ConfirmationCode: codigo,
        Password: clave,
      });
    },
  };
}
