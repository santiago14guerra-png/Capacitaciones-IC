import type { Actor } from '../domain/actor.js';
import type { Categoria } from '../domain/categoria.js';
import type { Ficha, FichaMeta } from '../domain/ficha.js';
import type { Perfil } from '../domain/perfil.js';
import type { EstadoCompra, EstadoFicha, SubidaDto, TipoArchivo } from '@ic/shared';
import type { Compra } from '../domain/compra.js';
import type { Consulta } from '../domain/consulta.js';

/** Verifica un token y devuelve el actor; null si es inválido o venció. */
export interface VerificadorToken {
  verificar(token: string): Promise<Actor | null>;
}

/** Datos de la cuenta que guarda Cognito y no vienen en el token de acceso. */
export interface DirectorioUsuarios {
  correo(actor: Actor): Promise<string>;
}

export interface Reloj {
  ahora(): Date;
}

export interface Ids {
  nuevo(): string;
}

export interface Sistema {
  reloj: Reloj;
  ids: Ids;
}

export interface RepoPerfiles {
  obtener(sub: string): Promise<Perfil | null>;
  guardar(perfil: Perfil): Promise<void>;
}

export interface RepoCategorias {
  listar(): Promise<Categoria[]>;
  obtener(id: string): Promise<Categoria | null>;
  guardar(categoria: Categoria): Promise<void>;
}

export interface RepoFichas {
  listarPorEstado(estado: EstadoFicha): Promise<FichaMeta[]>;
  obtenerMeta(id: string): Promise<FichaMeta | null>;
  obtener(id: string): Promise<Ficha | null>;
  /** Guarda metadatos y contenido. */
  guardar(ficha: Ficha): Promise<void>;
  guardarMeta(meta: FichaMeta): Promise<void>;
  borrar(id: string): Promise<void>;
}

export interface Busqueda {
  termino: string;
  fecha: string;
  resultados: number;
}

export interface RepoBusquedas {
  registrar(b: Busqueda): Promise<void>;
  /** `mes` en formato aaaa-mm. */
  listarMes(mes: string): Promise<Busqueda[]>;
}

export interface RepoCompras {
  obtener(sub: string, fichaId: string): Promise<Compra | null>;
  /** Crea si no existe o si la anterior fue rechazada; false si otra petición ganó. */
  crear(compra: Compra): Promise<boolean>;
  /** Reemplaza solo si nadie la cambió desde `previa` (escritura condicional). */
  reemplazar(nueva: Compra, previa: Compra): Promise<boolean>;
  listarDeUsuario(sub: string): Promise<Compra[]>;
  listarPorEstado(estado: EstadoCompra, desde?: string, hasta?: string): Promise<Compra[]>;
  /** Todas las compras creadas en el periodo (índice gsi2). */
  listarCreadasEntre(desde: string, hasta: string): Promise<Compra[]>;
}

/** Números consecutivos atómicos (UpdateItem ADD). */
export interface Contadores {
  siguiente(nombre: 'COMPRA' | 'CONSULTA'): Promise<number>;
}

/** Archivos privados (comprobantes y adjuntos). Las URL vencen a los 5 minutos. */
export interface Almacen {
  /** URL para subir directo desde el navegador, limitada a `maxBytes` y al tipo indicado. */
  firmarSubida(llave: string, tipo: TipoArchivo, maxBytes: number): Promise<SubidaDto>;
  info(llave: string): Promise<{ tamano: number; tipo: string } | null>;
  firmarDescarga(llave: string): Promise<string>;
}

export interface RepoConsultas {
  guardar(c: Consulta): Promise<void>;
  obtener(id: string): Promise<Consulta | null>;
  /** Reemplaza solo si nadie la cambió desde `previa`. */
  reemplazar(nueva: Consulta, previa: Consulta): Promise<boolean>;
  listarTodas(): Promise<Consulta[]>;
  listarDeUsuario(sub: string): Promise<Consulta[]>;
}
