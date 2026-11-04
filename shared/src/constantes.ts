export const GRUPOS = {
  cliente: 'cliente',
  administrador: 'administrador',
  director: 'director',
} as const;
export type Grupo = (typeof GRUPOS)[keyof typeof GRUPOS];

export const TIPOS_DOCUMENTO = ['CC', 'CE', 'NIT', 'PASAPORTE'] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const ESTADOS_FICHA = ['BORRADOR', 'PUBLICADA', 'DESPUBLICADA'] as const;
export type EstadoFicha = (typeof ESTADOS_FICHA)[number];

export const ESTADOS_COMPRA = [
  'PENDIENTE_PAGO',
  'EN_VERIFICACION',
  'APROBADA',
  'RECHAZADA',
] as const;
export type EstadoCompra = (typeof ESTADOS_COMPRA)[number];

export const ESTADOS_CONSULTA = [
  'RECIBIDA',
  'EN_ANALISIS',
  'RESPONDIDA',
  'ESCALADA',
  'CERRADA',
] as const;
export type EstadoConsulta = (typeof ESTADOS_CONSULTA)[number];

export const CLASIFICACIONES = ['CONSULTA_RAPIDA', 'ASESORIA'] as const;
export type Clasificacion = (typeof CLASIFICACIONES)[number];

export const ETIQUETAS_ESTADO_FICHA: Record<EstadoFicha, string> = {
  BORRADOR: 'Borrador',
  PUBLICADA: 'Publicada',
  DESPUBLICADA: 'Despublicada',
};
export const ETIQUETAS_ESTADO_COMPRA: Record<EstadoCompra, string> = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  EN_VERIFICACION: 'En verificación',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
};
export const ETIQUETAS_ESTADO_CONSULTA: Record<EstadoConsulta, string> = {
  RECIBIDA: 'Recibida',
  EN_ANALISIS: 'En análisis',
  RESPONDIDA: 'Respondida',
  ESCALADA: 'Escalada a asesoría',
  CERRADA: 'Cerrada',
};

export const ETIQUETAS_CLASIFICACION: Record<Clasificacion, string> = {
  CONSULTA_RAPIDA: 'Consulta rápida',
  ASESORIA: 'Asesoría',
};

export const LIMITES = {
  tituloMax: 120,
  resumenMax: 300,
  fichasPorPagina: 12,
  fichasRecientes: 6,
  fichasRelacionadas: 3,
  terminoMin: 3,
  archivoMaxBytes: 5 * 1024 * 1024,
  urlFirmadaSegundos: 300,
  horasAlertaConsulta: 48,
} as const;

export const TIPOS_ARCHIVO = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export type TipoArchivo = (typeof TIPOS_ARCHIVO)[number];
export const EXTENSIONES: Record<TipoArchivo, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

export const AVISO_ASESORIA =
  'Información de carácter general que no reemplaza una asesoría personalizada';

/**
 * HU-25: versión de la política que acepta el cliente al registrarse (HU-02 CA4).
 * Cambiarla cuando el abogado apruebe el texto definitivo.
 */
export const VERSION_POLITICA_DATOS = '0.1-borrador';

/** Un dato que la empresa aún no ha entregado. Nunca se inventa: se muestra así. */
export const pendiente = (que: string) => `[PENDIENTE: ${que}]`;
export const esPendiente = (valor: string) => valor.startsWith('[PENDIENTE');
