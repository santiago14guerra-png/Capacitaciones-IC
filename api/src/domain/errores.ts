export type CodigoError =
  'NO_AUTENTICADO' | 'PROHIBIDO' | 'NO_ENCONTRADO' | 'CONFLICTO' | 'VALIDACION' | 'LIMITE_EXCEDIDO';

const ESTADOS: Record<CodigoError, number> = {
  NO_AUTENTICADO: 401,
  PROHIBIDO: 403,
  NO_ENCONTRADO: 404,
  CONFLICTO: 409,
  VALIDACION: 422,
  LIMITE_EXCEDIDO: 429,
};

/** Error esperado del negocio. Su mensaje es seguro para mostrarlo al usuario. */
export class ErrorDominio extends Error {
  constructor(
    readonly codigo: CodigoError,
    mensaje: string,
    readonly campos?: Record<string, string>,
  ) {
    super(mensaje);
  }
  get estadoHttp(): number {
    return ESTADOS[this.codigo];
  }
}

export const noEncontrado = (m = 'No encontramos lo que busca') =>
  new ErrorDominio('NO_ENCONTRADO', m);
export const conflicto = (m: string) => new ErrorDominio('CONFLICTO', m);
export const limiteExcedido = (m: string) => new ErrorDominio('LIMITE_EXCEDIDO', m);
export const prohibido = (m = 'No tiene permiso para esta acción') =>
  new ErrorDominio('PROHIBIDO', m);
export const validacion = (m: string, campos?: Record<string, string>) =>
  new ErrorDominio('VALIDACION', m, campos);
