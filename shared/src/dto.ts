import type {
  Clasificacion,
  EstadoCompra,
  EstadoConsulta,
  EstadoFicha,
  Grupo,
  TipoDocumento,
} from './constantes.js';

export interface CategoriaDto {
  id: string;
  nombre: string;
  orden: number;
  activa: boolean;
}

export interface CategoriaAdminDto extends CategoriaDto {
  fichasPublicadas: number;
  fichasTotal: number;
}

/** Lo que cualquiera puede ver. Nunca incluye la respuesta. */
export interface FichaResumenDto {
  id: string;
  titulo: string;
  resumen: string;
  categoriaId: string;
  categoriaNombre: string;
  etiquetas: string[];
  precio: number;
  vigenteA: string;
  fragmentos?: { titulo?: string; resumen?: string };
}

export interface FichaDetalleDto extends FichaResumenDto {
  pregunta: string;
  normas: string[];
  estado: EstadoFicha;
  /** Solo presente si el usuario tiene acceso (HU-10 CA2). */
  respuestaHtml?: string;
  tieneAcceso: boolean;
  compra?: { id: string; estado: EstadoCompra; referencia: string };
  enRevision: boolean;
  relacionadas: FichaResumenDto[];
}

export interface FichaAdminDto {
  id: string;
  titulo: string;
  pregunta: string;
  resumen: string;
  respuestaHtml: string;
  categoriaId: string;
  etiquetas: string[];
  normas: string[];
  precio: number | null;
  estado: EstadoFicha;
  publicadaAlgunaVez: boolean;
  autor: string;
  creadaEn: string;
  actualizadaEn: string;
  vigenteA?: string;
  origenConsultaId?: string;
}

export interface Pagina<T> {
  elementos: T[];
  pagina: number;
  totalPaginas: number;
  total: number;
}

export interface PerfilDto {
  sub: string;
  correo: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  celular: string;
  direccion: string;
  ciudad: string;
  autorizacionDatosEn: string;
  /** Versión de la política aceptada (HU-25). */
  versionPoliticaDatos: string;
  actualizadoEn: string;
}

export interface SesionDto {
  sub: string;
  correo: string;
  grupos: Grupo[];
  perfil: PerfilDto | null;
}

export interface DatosBancariosDto {
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  titular: string;
}

export interface CompraDto {
  id: string;
  referencia: string;
  fichaId: string;
  fichaTitulo: string;
  valor: number;
  estado: EstadoCompra;
  motivoRechazo?: string;
  tieneComprobante: boolean;
  creadaEn: string;
  actualizadaEn: string;
  aprobadaEn?: string;
  datosBancarios?: DatosBancariosDto;
  fichaEnRevision?: boolean;
}

export interface CompraAdminDto extends CompraDto {
  clienteNombre: string;
  clienteCorreo: string;
}

export interface SubidaDto {
  url: string;
  campos: Record<string, string>;
  llave: string;
}

export interface ConsultaDto {
  id: string;
  radicado: string;
  categoriaId: string;
  categoriaNombre: string;
  asunto: string;
  descripcion: string;
  estado: EstadoConsulta;
  clasificacion?: Clasificacion;
  respuestaHtml?: string;
  condicionesAsesoria?: string;
  tieneAdjunto: boolean;
  recibidaEn: string;
  respondidaEn?: string;
}

export interface ConsultaAdminDto extends ConsultaDto {
  clienteNombre: string;
  clienteCorreo: string;
  atrasada: boolean;
}

export interface IndicadoresDto {
  desde: string;
  hasta: string;
  consultasPorSemana: { semana: string; total: number }[];
  tiempoRespuestaHoras: number | null;
  temas: { categoria: string; total: number }[];
  busquedasSinResultado: { termino: string; veces: number }[];
  ventas: { cantidad: number; valor: number };
  autoservicioPct: number | null;
  cobroPct: number | null;
}

export interface ConfigPublicaDto {
  correo: string;
  whatsapp: string;
  tarifas: { consultaRapida: string; asesoria: string };
}
