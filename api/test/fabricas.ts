import type { Ficha } from '../src/domain/ficha.js';

let n = 0;
/** Ficha publicada válida; se sobrescribe lo que cada prueba necesite. */
export function fichaDePrueba(cambios: Partial<Ficha> = {}): Ficha {
  n++;
  const fecha = new Date(Date.UTC(2026, 9, 1, 12, n)).toISOString();
  return {
    id: `ficha-${n}`,
    titulo: `Ficha de prueba ${n}`,
    pregunta: 'Pregunta de prueba',
    resumen: 'Resumen de prueba',
    respuestaHtml: '<p>Respuesta de prueba</p>',
    categoriaId: 'declaracion-de-renta',
    etiquetas: [],
    normas: [],
    precio: 10000,
    estado: 'PUBLICADA',
    publicadaAlgunaVez: true,
    autor: 'director',
    creadaEn: fecha,
    actualizadaEn: fecha,
    vigenteA: fecha,
    ...cambios,
  };
}
