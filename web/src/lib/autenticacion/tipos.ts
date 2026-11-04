export type CodigoAuth =
  | 'CREDENCIALES'
  | 'BLOQUEADO'
  | 'SIN_CONFIRMAR'
  | 'CORREO_EXISTE'
  | 'CODIGO_INVALIDO'
  | 'CODIGO_VENCIDO'
  | 'CONTRASENA_DEBIL'
  | 'LIMITE'
  | 'SESION_VENCIDA'
  | 'DESCONOCIDO';

export const MENSAJES_AUTH: Record<CodigoAuth, string> = {
  // HU-03 CA2: mensaje genérico, sin decir cuál dato falló.
  CREDENCIALES: 'Correo o contraseña incorrectos',
  // HU-03 CA3: bloqueo progresivo de Cognito (hasta 15 minutos).
  BLOQUEADO:
    'Por seguridad, su cuenta quedó bloqueada temporalmente por varios intentos fallidos. Espere unos minutos (hasta 15) e intente de nuevo.',
  SIN_CONFIRMAR: 'Su cuenta aún no está activada. Escriba el código que le enviamos al correo.',
  CORREO_EXISTE: 'Este correo ya tiene una cuenta',
  CODIGO_INVALIDO: 'El código no es correcto. Revíselo e intente de nuevo.',
  CODIGO_VENCIDO: 'El código venció. Pida uno nuevo.',
  CONTRASENA_DEBIL:
    'La contraseña debe tener mínimo 8 caracteres, con al menos una letra y un número.',
  LIMITE: 'Hizo demasiados intentos seguidos. Espere unos minutos e intente de nuevo.',
  SESION_VENCIDA: 'Su sesión terminó. Ingrese de nuevo.',
  DESCONOCIDO: 'No pudimos completar la operación. Intente de nuevo.',
};

export class ErrorAuth extends Error {
  constructor(readonly codigo: CodigoAuth) {
    super(MENSAJES_AUTH[codigo]);
  }
}

export interface Tokens {
  acceso: string;
  /** Cognito no siempre devuelve uno nuevo al refrescar. */
  actualizacion?: string;
  expiraEn: number;
}

export type ResultadoIngreso = Tokens | { desafio: 'NUEVA_CONTRASENA'; sesion: string };

/** Lo que cambia entre Cognito y la autenticación de desarrollo. */
export interface Transporte {
  ingresar(correo: string, clave: string): Promise<ResultadoIngreso>;
  nuevaContrasena(correo: string, sesion: string, clave: string): Promise<Tokens>;
  refrescar(actualizacion: string): Promise<Tokens>;
  salir(acceso: string, actualizacion: string): Promise<void>;
  registrar(correo: string, clave: string): Promise<void>;
  confirmar(correo: string, codigo: string): Promise<void>;
  reenviarCodigo(correo: string): Promise<void>;
  olvido(correo: string): Promise<void>;
  restablecer(correo: string, codigo: string, clave: string): Promise<void>;
}
