import { LIMITES } from '@ic/shared';
import { beforeAll, describe, expect, it } from 'vitest';
import { invalidarCatalogo } from '../src/application/catalogo.js';
import { sembrarCategorias } from '../src/application/categorias.js';
import { prepararEntorno } from './entorno.js';
import { fichaDePrueba } from './fabricas.js';

const e = prepararEntorno();
const mes = () => e.reloj.ahora().toISOString().slice(0, 7);

beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.ctx.fichas.guardar(
    fichaDePrueba({ id: 'p1', titulo: 'Pensión de vejez', etiquetas: ['mesada'] }),
  );
  await e.ctx.fichas.guardar(
    fichaDePrueba({ id: 'p2', titulo: 'Renta', pregunta: '¿La pensión paga impuesto?' }),
  );
  await e.ctx.fichas.guardar(
    fichaDePrueba({ id: 'b', titulo: 'Pensión en borrador', estado: 'BORRADOR' }),
  );
  invalidarCatalogo(e.ctx);
});

describe('HU-09 · búsqueda por palabra clave', () => {
  it('CA1, CA2 y CA3: busca en publicadas sin importar tildes y ordena por relevancia', async () => {
    const r = await e.json('/buscar?q=PENSION');
    expect(r.estado).toBe(200);
    expect(r.datos.elementos.map((f: { id: string }) => f.id)).toEqual(['p1', 'p2']);
    expect(r.datos.terminos).toEqual(['pension']);
    expect(JSON.stringify(r.datos)).not.toContain('respuestaHtml');
  });

  it('busca también en etiquetas y pregunta', async () => {
    expect((await e.json('/buscar?q=mesada')).datos.elementos[0].id).toBe('p1');
    expect((await e.json('/buscar?q=impuesto')).datos.elementos[0].id).toBe('p2');
  });

  it('CA4: con menos de 3 letras no busca ni registra', async () => {
    const antes = (await e.ctx.busquedas.listarMes(mes())).length;
    const r = await e.json('/buscar?q=%20pe%20');
    expect(r.estado).toBe(422);
    expect(r.datos.campos.q).toContain('3 letras');
    expect((await e.ctx.busquedas.listarMes(mes())).length).toBe(antes);
  });

  it('CA5: registra término, fecha y número de resultados; las sugerencias no se registran', async () => {
    e.reloj.avanzar(1);
    await e.json('/buscar?q=Sucesión intestada');
    const contar = async () => (await e.ctx.busquedas.listarMes(mes())).length;
    const antes = await contar();
    await e.json('/buscar?q=pension&sugerencia=1');
    expect(await contar()).toBe(antes);
    const registros = await e.ctx.busquedas.listarMes(mes());
    expect(registros.at(-1)).toEqual({
      termino: 'sucesión intestada',
      fecha: e.reloj.ahora().toISOString(),
      resultados: 0,
    });
  });
});

describe('registro de búsquedas', () => {
  it('deja de escribir al agotar el cupo por minuto, sigue respondiendo y se repone', async () => {
    e.reloj.avanzar(1);
    const contar = async () => (await e.ctx.busquedas.listarMes(mes())).length;
    const antes = await contar();
    const peticiones = LIMITES.registrosBusquedaPorMinuto + 5;
    for (let i = 0; i < peticiones; i++) {
      expect((await e.json(`/buscar?q=termino${i}`)).estado).toBe(200);
    }
    expect((await contar()) - antes).toBe(LIMITES.registrosBusquedaPorMinuto);
    e.reloj.avanzar(1);
    await e.json('/buscar?q=otra busqueda');
    expect((await contar()) - antes).toBe(LIMITES.registrosBusquedaPorMinuto + 1);
  });
});

describe('HU-09 CA6 · rendimiento con 500 fichas', () => {
  const e2 = prepararEntorno();
  beforeAll(async () => {
    await sembrarCategorias(e2.ctx);
    for (let i = 0; i < 500; i += 50) {
      await Promise.all(
        Array.from({ length: 50 }, (_, j) =>
          e2.ctx.fichas.guardar(
            fichaDePrueba({
              titulo: `Caso ${i + j}: ${(i + j) % 3 ? 'arrendamiento de local' : 'pensión y renta'}`,
              pregunta: 'Descripción detallada del caso '.repeat(30),
              resumen: 'Resumen de la respuesta '.repeat(8),
              etiquetas: ['renta', 'dian', 'persona natural'],
            }),
          ),
        ),
      );
    }
    invalidarCatalogo(e2.ctx);
  }, 60_000);

  it('responde en menos de 2 segundos incluso leyendo de la base (caché fría)', async () => {
    const inicio = performance.now();
    const r = await e2.json('/buscar?q=pension renta');
    const ms = performance.now() - inicio;
    expect(r.datos.total).toBe(500);
    expect(ms).toBeLessThan(2000);
  });
});
