import { describe, expect, it } from 'vitest';
import { erroresGestion, estaAtrasada, type Consulta } from './consulta.js';

const c = { estado: 'RECIBIDA', recibidaEn: '2026-11-01T00:00:00Z' } as Consulta;

describe('consulta (HU-16)', () => {
  it('está atrasada si sigue abierta después de 48 horas', () => {
    expect(estaAtrasada(c, new Date('2026-11-03T00:00:00Z'), 48)).toBe(false);
    expect(estaAtrasada(c, new Date('2026-11-03T00:00:01Z'), 48)).toBe(true);
    expect(estaAtrasada({ ...c, estado: 'RESPONDIDA' }, new Date('2026-12-01'), 48)).toBe(false);
  });
  it('exige clasificación para avanzar', () =>
    expect(erroresGestion(c, { estado: 'EN_ANALISIS' }, '')).toHaveProperty('clasificacion'));
  it('responder exige respuesta y escalar exige condiciones', () => {
    expect(
      erroresGestion(c, { estado: 'RESPONDIDA', clasificacion: 'CONSULTA_RAPIDA' }, ''),
    ).toEqual({
      respuestaHtml: 'Escriba la respuesta',
    });
    expect(erroresGestion(c, { estado: 'ESCALADA', clasificacion: 'ASESORIA' }, '')).toHaveProperty(
      'condicionesAsesoria',
    );
  });
});
