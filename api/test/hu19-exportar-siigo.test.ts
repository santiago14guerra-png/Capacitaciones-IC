import ExcelJS from 'exceljs';
import { beforeAll, describe, expect, it } from 'vitest';
import { sembrarCategorias } from '../src/application/categorias.js';
import { ADMIN, CLIENTE, OTRO_CLIENTE, prepararEntorno } from './entorno.js';
import { DATOS_PERFIL, fichaDePrueba } from './fabricas.js';
import { compraEnVerificacion } from './flujo-compra.js';

const e = prepararEntorno();
beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'f1', titulo: 'Arriendo', precio: 35000 }));
  await e.ctx.fichas.guardar(fichaDePrueba({ id: 'f2', titulo: 'Pensión', precio: 20000 }));
  await compraEnVerificacion(e, CLIENTE, 'f1');
  await compraEnVerificacion(e, OTRO_CLIENTE, 'f1');
  await compraEnVerificacion(e, CLIENTE, 'f2');
  await e.json('/admin/pagos/ana.f1/decision', { token: ADMIN, cuerpo: { decision: 'APROBAR' } }); // 2 nov
  await e.json('/admin/pagos/beto.f1/decision', {
    token: ADMIN,
    cuerpo: { decision: 'RECHAZAR', motivo: 'x' },
  });
  e.reloj.avanzar(24 * 30);
  await e.json('/admin/pagos/ana.f2/decision', { token: ADMIN, cuerpo: { decision: 'APROBAR' } }); // 2 dic
  // HU-23: el cliente corrige su dirección después de comprar.
  await e.json('/perfil', {
    metodo: 'PUT',
    token: CLIENTE,
    cuerpo: { ...DATOS_PERFIL, direccion: 'Carrera 7 # 1-1' },
  });
});

async function libro(q: string) {
  const r = await e.pedir(`/admin/exportaciones/siigo?${q}`, { token: ADMIN });
  const l = new ExcelJS.Workbook();
  await l.xlsx.load(await r.arrayBuffer());
  return { r, l };
}
const filas = (h: ExcelJS.Worksheet) =>
  h
    .getSheetValues()
    .slice(2)
    .map((f) => (f as unknown[]).slice(1));

describe('HU-19 · exportar datos de facturación para Siigo', () => {
  it('descarga un Excel con las compras verificadas del periodo y sus datos fiscales', async () => {
    const { r, l } = await libro('desde=2026-11-01&hasta=2026-11-30');
    expect(r.headers.get('content-type')).toContain('spreadsheetml');
    expect(r.headers.get('content-disposition')).toContain('siigo-2026-11-01-a-2026-11-30.xlsx');
    expect(filas(l.getWorksheet('Ventas')!)).toEqual([
      [
        '2026-11-02',
        'RPN-000001',
        'CC',
        '43123456',
        'Ana María Ruiz Gómez',
        'Respuesta: Arriendo',
        35000,
        '[PENDIENTE: código de producto en Siigo]',
      ],
    ]);
  });

  it('los terceros salen del perfil actual, sin repetir clientes', async () => {
    const { l } = await libro('desde=2026-11-01&hasta=2026-12-31');
    expect(filas(l.getWorksheet('Ventas')!)).toHaveLength(2);
    const terceros = filas(l.getWorksheet('Terceros')!);
    expect(terceros).toHaveLength(1);
    expect(terceros[0]).toContain('Carrera 7 # 1-1');
  });

  it('advierte que el formato es provisional', async () => {
    const { l } = await libro('desde=2026-11-01&hasta=2026-11-30');
    expect(JSON.stringify(l.getWorksheet('Léame')!.getSheetValues())).toContain(
      'FORMATO PROVISIONAL',
    );
  });

  it('valida el periodo y exige personal', async () => {
    expect(
      (
        await e.json('/admin/exportaciones/siigo?desde=2026-12-01&hasta=2026-11-01', {
          token: ADMIN,
        })
      ).estado,
    ).toBe(422);
    expect(
      (await e.json('/admin/exportaciones/siigo?desde=x&hasta=y', { token: ADMIN })).estado,
    ).toBe(422);
    expect(
      (
        await e.json('/admin/exportaciones/siigo?desde=2026-11-01&hasta=2026-11-30', {
          token: CLIENTE,
        })
      ).estado,
    ).toBe(403);
  });
});
