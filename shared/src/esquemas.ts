import { z } from 'zod';
import {
  CLASIFICACIONES,
  ESTADOS_CONSULTA,
  LIMITES,
  TIPOS_ARCHIVO,
  TIPOS_DOCUMENTO,
} from './constantes.js';

const requerido = 'Este campo es obligatorio';
const texto = (max = 200) => z.string().trim().min(1, requerido).max(max);

/** HU-02 CA3: reglas de contraseña compartidas por formulario y recuperación (HU-22). */
export const esquemaContrasena = z
  .string()
  .min(8, 'Debe tener mínimo 8 caracteres')
  .regex(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/, 'Debe tener al menos una letra')
  .regex(/\d/, 'Debe tener al menos un número');

const datosFacturacion = z.object({
  nombres: texto(),
  apellidos: texto(),
  tipoDocumento: z.enum(TIPOS_DOCUMENTO, { error: requerido }),
  numeroDocumento: texto(30),
  celular: z
    .string()
    .trim()
    .regex(/^\+?\d{7,15}$/, 'Escriba un celular válido, solo números'),
  direccion: texto(),
  ciudad: texto(100),
});

const validarDocumento = (d: { tipoDocumento: string; numeroDocumento: string }) =>
  d.tipoDocumento === 'PASAPORTE' || /^\d+$/.test(d.numeroDocumento);
const errorDocumento = {
  path: ['numeroDocumento'],
  message: 'El documento debe contener solo números',
};

export const esquemaPerfil = datosFacturacion.refine(validarDocumento, errorDocumento);
export type DatosPerfil = z.infer<typeof esquemaPerfil>;

export const esquemaGuardarPerfil = datosFacturacion
  .extend({ autorizaDatos: z.literal(true, { error: 'Debe autorizar el tratamiento de datos' }) })
  .refine(validarDocumento, errorDocumento);

export const esquemaRegistro = datosFacturacion
  .extend({
    correo: z.email('Escriba un correo válido'),
    contrasena: esquemaContrasena,
    confirmacion: z.string().min(1, requerido),
    autorizaDatos: z.literal(true, { error: 'Debe autorizar el tratamiento de datos' }),
  })
  .refine(validarDocumento, errorDocumento)
  .refine((d) => d.contrasena === d.confirmacion, {
    path: ['confirmacion'],
    message: 'Las contraseñas no coinciden',
  });
export type DatosRegistro = z.infer<typeof esquemaRegistro>;

export const esquemaFicha = z.object({
  titulo: z.string().trim().max(LIMITES.tituloMax, `Máximo ${LIMITES.tituloMax} caracteres`),
  pregunta: z.string().trim().max(5000),
  resumen: z.string().trim().max(LIMITES.resumenMax, `Máximo ${LIMITES.resumenMax} caracteres`),
  respuestaHtml: z.string().max(200_000),
  categoriaId: z.string().max(64),
  etiquetas: z.array(z.string().trim().min(1).max(50)).max(20),
  normas: z.array(z.string().trim().min(1).max(200)).max(20),
  precio: z.number().int('Debe ser un valor entero').min(0, 'No puede ser negativo').nullable(),
  publicar: z.boolean(),
});
export type DatosFicha = z.infer<typeof esquemaFicha>;

/** Texto visible de un HTML, para saber si el editor quedó vacío. */
export const textoDeHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** HU-05 CA2: para publicar son obligatorios título, pregunta, resumen, respuesta, categoría y precio. */
export function erroresPublicacion(d: DatosFicha): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.titulo) e.titulo = requerido;
  if (!d.pregunta) e.pregunta = requerido;
  if (!d.resumen) e.resumen = requerido;
  if (!textoDeHtml(d.respuestaHtml)) e.respuestaHtml = requerido;
  if (!d.categoriaId) e.categoriaId = 'Elija una categoría';
  if (d.precio === null) e.precio = 'Indique el precio (0 si es gratuita)';
  return e;
}

/** Un borrador puede guardarse incompleto; una ficha publicada no. */
export const esquemaGuardarFicha = esquemaFicha.superRefine((d, ctx) => {
  if (!d.publicar) return;
  for (const [campo, message] of Object.entries(erroresPublicacion(d))) {
    ctx.addIssue({ code: 'custom', path: [campo], message });
  }
});

export const esquemaCategoria = z.object({ nombre: texto(80) });
export const esquemaOrdenCategorias = z.object({ ids: z.array(z.string()).min(1) });
export const esquemaReasignarCategoria = z.object({ destinoId: texto(64) });

export const esquemaArchivo = z.object({
  nombre: texto(200),
  tipo: z.enum(TIPOS_ARCHIVO, { error: 'Solo se aceptan JPG, PNG o PDF' }),
  tamano: z.number().int().positive().max(LIMITES.archivoMaxBytes, 'El archivo supera 5 MB'),
});

export const esquemaConsulta = z.object({
  categoriaId: texto(64),
  asunto: texto(200),
  descripcion: texto(5000),
  adjuntoLlave: z.string().max(300).optional(),
});
export type DatosConsulta = z.infer<typeof esquemaConsulta>;

export const esquemaGestionConsulta = z.object({
  estado: z.enum(ESTADOS_CONSULTA),
  clasificacion: z.enum(CLASIFICACIONES).optional(),
  respuestaHtml: z.string().max(200_000).optional(),
  condicionesAsesoria: z.string().trim().max(2000).optional(),
});

export const esquemaDecisionPago = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('APROBAR') }),
  z.object({ decision: z.literal('RECHAZAR'), motivo: texto(500) }),
]);

export const esquemaPeriodo = z.object({
  desde: z.iso.date('Fecha inválida'),
  hasta: z.iso.date('Fecha inválida'),
});
