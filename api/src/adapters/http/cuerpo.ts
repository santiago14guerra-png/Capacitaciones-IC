import type { Context } from 'hono';
import { validacion } from '../../domain/errores.js';

/** Lee el cuerpo JSON; si no es JSON válido responde 422 en lugar de 500. */
export async function cuerpoJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw validacion('El cuerpo de la petición no es JSON válido');
  }
}
