import type { Correo } from '../domain/correos.js';
import type { Contexto } from './contexto.js';

/** Un correo que falla no debe deshacer la decisión ya guardada; se registra y se sigue. */
export async function avisar(ctx: Contexto, correo: Correo) {
  try {
    await ctx.notificador.enviar(correo);
  } catch (e) {
    console.error(
      JSON.stringify({ evento: 'error-correo', tipo: (e as Error).name, asunto: correo.asunto }),
    );
  }
}
