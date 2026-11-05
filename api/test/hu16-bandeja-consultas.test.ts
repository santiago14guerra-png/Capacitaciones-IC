import { beforeAll, describe, expect, it } from 'vitest';
import { sembrarCategorias } from '../src/application/categorias.js';
import { CLIENTE, DIRECTOR, prepararEntorno } from './entorno.js';
import { DATOS_PERFIL } from './fabricas.js';

const e = prepararEntorno();
const ids: Record<string, string> = {};
const enviar = async (nombre: string, categoriaId: string) => {
  const r = await e.json('/consultas', {
    token: CLIENTE,
    cuerpo: { categoriaId, asunto: nombre, descripcion: `Descripción ${nombre}` },
  });
  ids[nombre] = r.datos.id;
};
const gestionar = (nombre: string, cuerpo: object) =>
  e.json(`/admin/consultas/${ids[nombre]}`, { metodo: 'PUT', token: DIRECTOR, cuerpo });

beforeAll(async () => {
  await sembrarCategorias(e.ctx);
  await e.json('/perfil', { metodo: 'PUT', token: CLIENTE, cuerpo: DATOS_PERFIL });
  await enviar('vieja', 'arrendamientos');
  e.reloj.avanzar(49);
  await enviar('nueva', 'pensionados');
});

describe('HU-16 · bandeja de consultas', () => {
  it('lista con datos del cliente y resalta primero las de más de 48 horas', async () => {
    const r = await e.json('/admin/consultas', { token: DIRECTOR });
    expect(
      r.datos.map((c: { asunto: string; atrasada: boolean }) => [c.asunto, c.atrasada]),
    ).toEqual([
      ['vieja', true],
      ['nueva', false],
    ]);
    expect(r.datos[0]).toMatchObject({
      clienteNombre: 'Ana María Ruiz Gómez',
      estado: 'RECIBIDA',
      radicado: 'RAD-000001',
    });
  });

  it('filtra por estado, categoría y antigüedad', async () => {
    const por = async (q: string) =>
      (await e.json(`/admin/consultas?${q}`, { token: DIRECTOR })).datos.map(
        (c: { asunto: string }) => c.asunto,
      );
    expect(await por('categoria=pensionados')).toEqual(['nueva']);
    expect(await por('antiguedad=atrasadas')).toEqual(['vieja']);
    expect(await por('antiguedad=2')).toEqual(['vieja']);
    expect(await por('estado=RESPONDIDA')).toEqual([]);
  });

  it('la clasificación es obligatoria para avanzar', async () => {
    const r = await gestionar('vieja', { estado: 'EN_ANALISIS' });
    expect(r.estado).toBe(422);
    expect(r.datos.campos).toHaveProperty('clasificacion');
    const ok = await gestionar('vieja', {
      estado: 'EN_ANALISIS',
      clasificacion: 'CONSULTA_RAPIDA',
    });
    expect(ok.datos).toMatchObject({
      estado: 'EN_ANALISIS',
      clasificacion: 'CONSULTA_RAPIDA',
      atrasada: true,
    });
  });

  it('responder exige la respuesta, la sanea y marca la fecha de respuesta', async () => {
    expect(
      (await gestionar('vieja', { estado: 'RESPONDIDA', respuestaHtml: '<p> </p>' })).estado,
    ).toBe(422);
    const r = await gestionar('vieja', {
      estado: 'RESPONDIDA',
      respuestaHtml: '<p>Respuesta<script>x</script></p>',
    });
    expect(r.datos).toMatchObject({
      estado: 'RESPONDIDA',
      respuestaHtml: '<p>Respuesta</p>',
      respondidaEn: e.reloj.ahora().toISOString(),
      atrasada: false,
    });
  });

  it('escalar a asesoría exige las condiciones', async () => {
    expect(
      (await gestionar('nueva', { estado: 'ESCALADA', clasificacion: 'ASESORIA' })).estado,
    ).toBe(422);
    const r = await gestionar('nueva', {
      estado: 'ESCALADA',
      clasificacion: 'ASESORIA',
      condicionesAsesoria: 'Requiere revisar documentos. Tarifa según la página de tarifas.',
    });
    expect(r.datos.estado).toBe('ESCALADA');
  });

  it('cierra y no permite volver a «Recibida»', async () => {
    expect((await gestionar('vieja', { estado: 'CERRADA' })).datos.estado).toBe('CERRADA');
    expect((await gestionar('vieja', { estado: 'RECIBIDA' })).estado).toBe(422);
  });

  it('solo el personal accede', async () => {
    expect((await e.json('/admin/consultas', { token: CLIENTE })).estado).toBe(403);
  });
});
