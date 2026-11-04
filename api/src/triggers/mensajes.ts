import type { CustomMessageTriggerHandler } from 'aws-lambda';

const SERVICIO = 'Respuestas para Personas Naturales';

/** Correos de Cognito en español. Cognito exige que el mensaje contenga {####}. */
export const handler: CustomMessageTriggerHandler = async (evento) => {
  const r = evento.response;
  const codigo = evento.request.codeParameter;
  switch (evento.triggerSource) {
    case 'CustomMessage_SignUp':
    case 'CustomMessage_ResendCode':
      r.emailSubject = `Su código de verificación · ${SERVICIO}`;
      r.emailMessage =
        `<p>Hola:</p><p>Su código para activar la cuenta es <strong>${codigo}</strong>.</p>` +
        `<p>Si usted no creó esta cuenta, ignore este mensaje.</p>`;
      break;
    case 'CustomMessage_ForgotPassword': {
      // HU-22: enlace al sitio con el código; Cognito reemplaza {####} por el código real.
      const correo = encodeURIComponent(evento.request.userAttributes.email ?? '');
      const enlace = `${process.env.SITIO_URL ?? ''}/recuperar?correo=${correo}&codigo=${codigo}`;
      r.emailSubject = `Restablecer su contraseña · ${SERVICIO}`;
      r.emailMessage =
        `<p>Hola:</p><p>Para crear una contraseña nueva, abra este enlace: <a href="${enlace}">restablecer contraseña</a>.</p>` +
        `<p>Si el enlace no abre, use el código <strong>${codigo}</strong> en la página «Olvidé mi contraseña».</p>` +
        `<p>Si usted no lo pidió, ignore este mensaje: su contraseña no cambia.</p>`;
      break;
    }
    case 'CustomMessage_AdminCreateUser':
      r.emailSubject = `Su cuenta de personal · ${SERVICIO}`;
      r.emailMessage =
        `<p>Se creó su cuenta. Usuario: <strong>${evento.request.usernameParameter}</strong>. ` +
        `Contraseña temporal: <strong>${codigo}</strong>. Deberá cambiarla al ingresar.</p>`;
      break;
  }
  return evento;
};
