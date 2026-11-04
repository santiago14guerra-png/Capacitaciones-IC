import { esPendiente, type ConfigPublicaDto } from '@ic/shared';
import { useEffect, useState } from 'react';
import { api } from './api';

let promesa: Promise<ConfigPublicaDto> | null = null;

/** Contacto y tarifas, una sola vez por carga del sitio. */
export function useConfigPublica() {
  const [config, setConfig] = useState<ConfigPublicaDto | null>(null);
  useEffect(() => {
    promesa ??= api<ConfigPublicaDto>('/config').catch((e) => {
      promesa = null;
      throw e;
    });
    promesa.then(setConfig).catch(() => undefined);
  }, []);
  return config;
}

export const enlaceWhatsapp = (numero: string) =>
  esPendiente(numero) || !/^\d{8,15}$/.test(numero) ? null : `https://wa.me/${numero}`;
export const enlaceCorreo = (correo: string) => (esPendiente(correo) ? null : `mailto:${correo}`);
