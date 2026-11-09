import { esquemaPeriodo, pendiente } from '@ic/shared';
import ExcelJS from 'exceljs';
import { fechaBogota, rangoBogota } from '../domain/periodo.js';
import type { Contexto } from './contexto.js';

/**
 * HU-19: datos fiscales de las compras verificadas en un periodo, en Excel, para facturar
 * en Siigo sin volver a digitar. FORMATO PROVISIONAL: la plantilla exacta de importación de
 * terceros y ventas de Siigo está pendiente de validar con la directora (riesgo del backlog).
 * Los datos del cliente salen de su perfil actual (HU-23), no de la fecha de compra.
 */
export async function exportarSiigo(ctx: Contexto, consulta: Record<string, string | undefined>) {
  const p = esquemaPeriodo.parse(consulta);
  const rango = rangoBogota(p.desde, p.hasta);
  const compras = (await ctx.compras.listarPorEstado('APROBADA', rango.desde, rango.hasta)).sort(
    (a, b) => (a.aprobadaEn ?? '').localeCompare(b.aprobadaEn ?? ''),
  );
  const perfiles = new Map(
    await Promise.all(
      [...new Set(compras.map((c) => c.sub))].map(
        async (s) => [s, await ctx.perfiles.obtener(s)] as const,
      ),
    ),
  );

  const libro = new ExcelJS.Workbook();
  libro.creator = 'Capacitaciones IC';
  libro.created = ctx.reloj.ahora();
  const encabezado = (hoja: ExcelJS.Worksheet) => {
    hoja.getRow(1).font = { bold: true };
    hoja.views = [{ state: 'frozen', ySplit: 1 }];
  };

  const ventas = libro.addWorksheet('Ventas');
  ventas.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Referencia', key: 'referencia', width: 14 },
    { header: 'Tipo de documento', key: 'tipo', width: 12 },
    { header: 'Número de documento', key: 'numero', width: 18 },
    { header: 'Cliente', key: 'cliente', width: 32 },
    { header: 'Concepto', key: 'concepto', width: 48 },
    { header: 'Valor (COP)', key: 'valor', width: 14, style: { numFmt: '#,##0' } },
    { header: 'Código de producto en Siigo', key: 'producto', width: 28 },
  ];
  for (const c of compras) {
    const perfil = perfiles.get(c.sub);
    ventas.addRow({
      fecha: fechaBogota(c.aprobadaEn ?? c.actualizadaEn),
      referencia: c.referencia,
      tipo: perfil?.tipoDocumento ?? '',
      numero: perfil?.numeroDocumento ?? '',
      cliente: perfil ? `${perfil.nombres} ${perfil.apellidos}` : c.clienteNombre,
      concepto: `Respuesta: ${c.fichaTitulo}`,
      valor: c.valor,
      producto: pendiente('código de producto en Siigo'),
    });
  }
  encabezado(ventas);

  const terceros = libro.addWorksheet('Terceros');
  terceros.columns = [
    { header: 'Tipo de documento', key: 'tipoDocumento', width: 12 },
    { header: 'Número de documento', key: 'numeroDocumento', width: 18 },
    { header: 'Nombres', key: 'nombres', width: 22 },
    { header: 'Apellidos', key: 'apellidos', width: 22 },
    { header: 'Correo', key: 'correo', width: 30 },
    { header: 'Celular', key: 'celular', width: 14 },
    { header: 'Dirección', key: 'direccion', width: 30 },
    { header: 'Ciudad', key: 'ciudad', width: 16 },
  ];
  for (const perfil of perfiles.values()) if (perfil) terceros.addRow(perfil);
  // Los documentos como texto: Excel no debe quitar ceros a la izquierda.
  for (const hoja of [ventas, terceros])
    hoja.getColumn(hoja === ventas ? 'numero' : 'numeroDocumento').numFmt = '@';
  encabezado(terceros);

  const lea = libro.addWorksheet('Léame');
  lea.getColumn(1).width = 110;
  [
    `Compras verificadas entre ${p.desde} y ${p.hasta} (hora de Colombia): ${compras.length}.`,
    'FORMATO PROVISIONAL: pendiente de validar con la directora la plantilla de importación de terceros y ventas de Siigo.',
    'Los datos de cada cliente son los de su perfil al momento de exportar.',
    'El código de producto en Siigo está marcado como [PENDIENTE] hasta que la empresa lo defina.',
  ].forEach((t) => lea.addRow([t]));

  return {
    nombre: `siigo-${p.desde}-a-${p.hasta}.xlsx`,
    contenido: new Uint8Array(await libro.xlsx.writeBuffer()),
  };
}
