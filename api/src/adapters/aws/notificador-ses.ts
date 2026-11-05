import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import type { Notificador } from '../../application/puertos.js';

/** Amazon SES desde el dominio institucional verificado (DKIM). */
export function crearNotificadorSes(remitente: string): Notificador {
  const ses = new SESv2Client({});
  return {
    async enviar(c) {
      await ses.send(
        new SendEmailCommand({
          FromEmailAddress: `Capacitaciones IC <${remitente}>`,
          Destination: { ToAddresses: [c.para] },
          Content: {
            Simple: {
              Subject: { Data: c.asunto, Charset: 'UTF-8' },
              Body: {
                Text: { Data: c.texto, Charset: 'UTF-8' },
                Html: { Data: c.html, Charset: 'UTF-8' },
              },
            },
          },
        }),
      );
    },
  };
}

/** Sin remitente verificado: solo deja constancia en CloudWatch, sin la dirección del cliente. */
export const notificadorRegistro: Notificador = {
  async enviar(c) {
    console.log(
      JSON.stringify({
        evento: 'correo-no-enviado',
        motivo: 'SES sin configurar',
        asunto: c.asunto,
      }),
    );
  },
};
