import type { IndicadoresDto } from '@ic/shared';
import { useState } from 'react';
import { Link } from 'react-router';
import { AvisoError, Campo } from '../../componentes/Campo';
import { api } from '../../lib/api';
import { hoyLocal } from '../../lib/fechas';
import { formatoFecha, formatoPrecio } from '../../lib/formato';
import { Cargando } from '../../lib/sesion';
import { useCarga } from '../../lib/useCarga';

const hace = (dias: number) => hoyLocal(new Date(Date.now() - dias * 86_400_000));

function Tarjeta({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <div className="tarjeta indicador">
      <p className="ficha-subtitulo">{titulo}</p>
      <p className="indicador-valor">{valor}</p>
      <p className="pequeno suave" style={{ margin: 0 }}>
        {detalle}
      </p>
    </div>
  );
}

/** Barras horizontales con el número visible (no depende solo del color). */
function Barras({
  titulo,
  datos,
}: {
  titulo: string;
  datos: { etiqueta: string; valor: number }[];
}) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <section className="tarjeta pila" aria-label={titulo}>
      <h2 style={{ fontSize: '1.1rem' }}>{titulo}</h2>
      {datos.length === 0 ? (
        <p className="suave">Sin datos en el periodo.</p>
      ) : (
        <ul className="barras">
          {datos.map((d) => (
            <li key={d.etiqueta}>
              <span className="barras-etiqueta">{d.etiqueta}</span>
              <span className="barras-pista">
                <span className="barras-barra" style={{ width: `${(d.valor / max) * 100}%` }} />
              </span>
              <strong>{d.valor}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const porcentaje = (v: number | null) => (v === null ? '—' : `${v.toLocaleString('es-CO')} %`);

/** HU-21: indicadores para medir los objetivos del proyecto y decidir qué contenido crear. */
export default function Indicadores() {
  const [desde, setDesde] = useState(hace(29));
  const [hasta, setHasta] = useState(hoyLocal());
  const {
    datos: d,
    error,
    cargando,
  } = useCarga(
    (s) =>
      api<IndicadoresDto>(`/admin/indicadores?${new URLSearchParams({ desde, hasta })}`, {
        senal: s,
      }),
    [desde, hasta],
  );
  const recibidas = d?.consultasPorSemana.reduce((s, x) => s + x.total, 0) ?? 0;
  return (
    <section className="pila">
      <h1>Indicadores</h1>
      <div className="fila">
        <div style={{ flex: '0 1 200px' }}>
          <Campo nombre="i-desde" etiqueta="Desde">
            <input
              id="i-desde"
              type="date"
              value={desde}
              max={hasta}
              onChange={(e) => setDesde(e.target.value)}
            />
          </Campo>
        </div>
        <div style={{ flex: '0 1 200px' }}>
          <Campo nombre="i-hasta" etiqueta="Hasta">
            <input
              id="i-hasta"
              type="date"
              value={hasta}
              min={desde}
              onChange={(e) => setHasta(e.target.value)}
            />
          </Campo>
        </div>
      </div>
      <AvisoError mensaje={error?.message} />
      {cargando && !d && <Cargando />}
      {d && (
        <>
          <div className="rejilla indicadores">
            <Tarjeta
              titulo="Consultas recibidas"
              valor={String(recibidas)}
              detalle="Objetivo 6: todas quedan registradas."
            />
            <Tarjeta
              titulo="Tiempo de respuesta"
              valor={
                d.tiempoRespuestaHoras === null
                  ? '—'
                  : `${d.tiempoRespuestaHoras.toLocaleString('es-CO')} h`
              }
              detalle="Promedio hasta la primera respuesta. Objetivo 1: reducirlo 50 %."
            />
            <Tarjeta
              titulo="Ventas"
              valor={formatoPrecio(d.ventas.valor).replace('Gratis', '$ 0')}
              detalle={`${d.ventas.cantidad} ${d.ventas.cantidad === 1 ? 'pago aprobado' : 'pagos aprobados'}.`}
            />
            <Tarjeta
              titulo="Autoservicio"
              valor={porcentaje(d.autoservicioPct)}
              detalle="Compras de fichas frente a compras + consultas nuevas. Meta ≥ 40 %."
            />
            <Tarjeta
              titulo="Consultas con cobro"
              valor={porcentaje(d.cobroPct)}
              detalle="Pagos aprobados frente a solicitudes atendidas. Meta ≥ 30 %."
            />
          </div>
          <div className="dos-columnas" style={{ gap: '1rem' }}>
            <Barras
              titulo="Consultas por semana"
              datos={d.consultasPorSemana.map((s) => ({
                etiqueta: `Semana del ${formatoFecha(`${s.semana}T12:00:00Z`)}`,
                valor: s.total,
              }))}
            />
            <Barras
              titulo="Temas de las consultas"
              datos={d.temas.map((t) => ({ etiqueta: t.categoria, valor: t.total }))}
            />
          </div>
          <section className="tarjeta pila" aria-labelledby="sin-resultado">
            <h2 id="sin-resultado" style={{ fontSize: '1.1rem' }}>
              Búsquedas sin resultado
            </h2>
            <p className="suave pequeno">Temas que la gente busca y aún no tienen ficha.</p>
            {d.busquedasSinResultado.length === 0 ? (
              <p className="suave">Ninguna en el periodo.</p>
            ) : (
              <div className="tabla-envoltura">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Término</th>
                      <th scope="col">Veces</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.busquedasSinResultado.map((b) => (
                      <tr key={b.termino}>
                        <td>{b.termino}</td>
                        <td>{b.veces}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Link to="/panel/fichas/nueva">Crear una ficha</Link>
          </section>
        </>
      )}
    </section>
  );
}
