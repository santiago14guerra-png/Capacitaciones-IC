import { pendiente, type DatosBancariosDto } from '@ic/shared';

/**
 * Datos del negocio que entrega la empresa. No se inventan: si faltan, se muestran como
 * marcadores [PENDIENTE: …] para que nadie los confunda con datos reales.
 */
export interface ConfigNegocio {
  contactoCorreo: string;
  contactoWhatsapp: string;
  tarifas: { consultaRapida: string; asesoria: string };
  banco: DatosBancariosDto;
}

export function configNegocio(env: Record<string, string | undefined> = {}): ConfigNegocio {
  const v = (clave: string, que: string) => env[clave]?.trim() || pendiente(que);
  return {
    contactoCorreo: v('CONTACTO_CORREO', 'correo institucional'),
    contactoWhatsapp: v('CONTACTO_WHATSAPP', 'número de WhatsApp'),
    tarifas: {
      consultaRapida: v('TARIFA_CONSULTA_RAPIDA', 'tarifa de la consulta rápida'),
      asesoria: v('TARIFA_ASESORIA', 'tarifa de la asesoría'),
    },
    banco: {
      banco: v('BANCO_NOMBRE', 'banco'),
      tipoCuenta: v('BANCO_TIPO_CUENTA', 'tipo de cuenta'),
      numeroCuenta: v('BANCO_NUMERO_CUENTA', 'número de cuenta'),
      titular: v('BANCO_TITULAR', 'titular de la cuenta'),
    },
  };
}
