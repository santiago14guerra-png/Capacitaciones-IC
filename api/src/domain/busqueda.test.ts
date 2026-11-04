import { terminosBusqueda } from '@ic/shared';
import { describe, expect, it } from 'vitest';
import { fichaDePrueba } from '../../test/fabricas.js';
import { buscar, indexar } from './busqueda.js';

const indice = [
  fichaDePrueba({ id: 'pension', titulo: 'Pensión de vejez y declaración de renta' }),
  fichaDePrueba({ id: 'arriendo', titulo: 'Ingresos por arriendo', etiquetas: ['pensionado'] }),
  fichaDePrueba({
    id: 'herencia',
    titulo: 'Herencias',
    resumen: 'Qué hacer con una pensión heredada',
  }),
  fichaDePrueba({ id: 'nada', titulo: 'Facturación electrónica' }),
].map(indexar);
const ids = (q: string) => buscar(indice, terminosBusqueda(q), q).map((f) => f.id);

describe('HU-09 · relevancia', () => {
  it('CA2: no distingue mayúsculas ni tildes', () => {
    expect(ids('PENSION')).toEqual(ids('pensión'));
    expect(ids('pension')[0]).toBe('pension');
  });
  it('CA1 y CA3: título pesa más que etiquetas y estas más que el resumen', () =>
    expect(ids('pension')).toEqual(['pension', 'arriendo', 'herencia']));
  it('encuentra plurales y palabras que empiezan igual', () =>
    expect(ids('pensiones')).toContain('pension'));
  it('premia las fichas que contienen todos los términos', () =>
    expect(ids('arriendo pensionado')[0]).toBe('arriendo'));
  it('no devuelve fichas sin coincidencias', () => expect(ids('pension')).not.toContain('nada'));

  it('CA6: busca en 500 fichas muy por debajo de 2 segundos', () => {
    const grande = Array.from({ length: 500 }, (_, i) =>
      indexar(
        fichaDePrueba({
          titulo: `Ficha ${i} sobre ${i % 2 ? 'pensión' : 'arriendo'} y renta`,
          pregunta: 'Pregunta larga '.repeat(40),
          resumen: 'Resumen de la ficha '.repeat(10),
          etiquetas: ['renta', 'dian'],
        }),
      ),
    );
    const inicio = performance.now();
    const r = buscar(grande, terminosBusqueda('pensión de renta'), 'pensión de renta');
    expect(performance.now() - inicio).toBeLessThan(200);
    expect(r.length).toBe(500);
  });
});
