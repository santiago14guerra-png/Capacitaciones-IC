/**
 * Carga inicial en AWS (HU-07 CA3). Idempotente: no toca nada si ya hay categorías.
 *
 *   npm run sembrar --workspace api -- <nombre-de-la-tabla>
 */
import { Tabla } from '../src/adapters/dynamodb/tabla.js';
import { sembrarCategorias } from '../src/application/categorias.js';
import { componer } from '../src/bootstrap/componer.js';

const [nombre] = process.argv.slice(2);
if (!nombre) {
  console.error('Uso: sembrar <nombre-de-la-tabla> (salida NombreTabla de la pila IcDev)');
  process.exit(1);
}
const ctx = componer({
  tabla: new Tabla(nombre),
  directorio: { correo: () => Promise.reject(new Error('No se usa')) },
});
const n = await sembrarCategorias(ctx);
console.log(n ? `Se crearon ${n} categorías.` : 'Ya había categorías; no se cambió nada.');
