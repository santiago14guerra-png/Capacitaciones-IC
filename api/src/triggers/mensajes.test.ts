import type { CustomMessageTriggerEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
import { handler } from './mensajes.js';

const evento = (triggerSource: string) =>
  ({
    triggerSource,
    request: {
      codeParameter: '{####}',
      usernameParameter: '{username}',
      userAttributes: { email: 'ana+x@correo.co' },
    },
    response: {},
  }) as unknown as CustomMessageTriggerEvent;
type Manejador = (
  e: CustomMessageTriggerEvent,
  c: object,
  cb: () => void,
) => Promise<CustomMessageTriggerEvent>;
const correr = (e: CustomMessageTriggerEvent) => (handler as unknown as Manejador)(e, {}, () => {});

describe('mensajes de Cognito', () => {
  it('HU-22: el correo de recuperación trae un enlace con el código', async () => {
    process.env.SITIO_URL = 'https://sitio.co';
    const r = await correr(evento('CustomMessage_ForgotPassword'));
    expect(r.response.emailMessage).toContain(
      'https://sitio.co/recuperar?correo=ana%2Bx%40correo.co&codigo={####}',
    );
    expect(r.response.emailSubject).toContain('Restablecer');
  });
  it('HU-02: el código de verificación está en español y contiene {####}', async () => {
    const r = await correr(evento('CustomMessage_SignUp'));
    expect(r.response.emailMessage).toContain('{####}');
    expect(r.response.emailMessage).toContain('activar la cuenta');
  });
});
