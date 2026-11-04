/**
 * HU-18: textos de los avisos por correo. Nunca incluyen el contenido de la respuesta
 * ni el motivo del rechazo: solo un enlace a la plataforma.
 */
export interface Correo {
  para: string;
  asunto: string;
  texto: string;
  html: string;
}

const SERVICIO = 'Respuestas para Personas Naturales';
const escapar = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function armar(
  para: string,
  asunto: string,
  parrafos: string[],
  enlace: string,
  boton: string,
): Correo {
  return {
    para,
    asunto: `${asunto} · ${SERVICIO}`,
    texto: `${parrafos.join('\n\n')}\n\n${boton}: ${enlace}\n\nCapacitaciones IC`,
    html:
      parrafos.map((p) => `<p>${escapar(p)}</p>`).join('') +
      `<p><a href="${escapar(enlace)}">${escapar(boton)}</a></p><p>Capacitaciones IC</p>`,
  };
}

export const correoPagoAprobado = (
  para: string,
  referencia: string,
  sitio: string,
  compraId: string,
) =>
  armar(
    para,
    'Su pago fue verificado',
    [
      'Hola:',
      `Verificamos el pago con referencia ${referencia}. Ya puede leer la respuesta en su cuenta.`,
    ],
    `${sitio}/compras/${encodeURIComponent(compraId)}`,
    'Ver mi compra',
  );

export const correoPagoRechazado = (
  para: string,
  referencia: string,
  sitio: string,
  compraId: string,
) =>
  armar(
    para,
    'Revise su pago',
    [
      'Hola:',
      `No pudimos verificar el pago con referencia ${referencia}. En su cuenta verá el motivo y cómo continuar.`,
    ],
    `${sitio}/compras/${encodeURIComponent(compraId)}`,
    'Ver el motivo',
  );

export const correoConsultaRespondida = (
  para: string,
  radicado: string,
  sitio: string,
  id: string,
  escalada: boolean,
) =>
  armar(
    para,
    escalada ? 'Su consulta requiere una asesoría' : 'Su consulta tiene respuesta',
    [
      'Hola:',
      escalada
        ? `Revisamos su consulta ${radicado}. Requiere una asesoría; en su cuenta verá las condiciones.`
        : `Respondimos su consulta ${radicado}. Puede leer la respuesta en su cuenta.`,
    ],
    `${sitio}/cuenta/consultas/${encodeURIComponent(id)}`,
    'Ver mi consulta',
  );
