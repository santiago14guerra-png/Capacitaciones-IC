import {
  CLASIFICACIONES,
  ESTADOS_CONSULTA,
  ETIQUETAS_CLASIFICACION,
  ETIQUETAS_ESTADO_CONSULTA,
  type CategoriaDto,
  type ConsultaAdminDto,
} from '@ic/shared';
import { Link, useSearchParams } from 'react-router';
import { AvisoError } from '../../componentes/Campo';
import { EstadoConsulta } from '../../componentes/EstadoConsulta';
import { api } from '../../lib/api';
import { formatoFechaHora } from '../../lib/formato';
import { useCarga } from '../../lib/useCarga';

/** HU-16: bandeja de consultas con filtros; se resaltan las de más de 48 horas. */
export default function Consultas() {
  const [params, setParams] = useSearchParams();
  const categorias = useCarga((s) => api<CategoriaDto[]>('/categorias', { senal: s }), []);
  const { datos, error } = useCarga(
    (s) => api<ConsultaAdminDto[]>(`/admin/consultas?${params}`, { senal: s }),
    [params.toString()],
  );
  const filtro = (clave: string, valor: string) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    setParams(p, { replace: true });
  };
  const atrasadas = datos?.filter((c) => c.atrasada).length ?? 0;
  const select = (clave: string, etiqueta: string, opciones: [string, string][]) => (
    <div className="campo" style={{ flex: '1 1 180px', margin: 0 }}>
      <label htmlFor={`f-${clave}`}>{etiqueta}</label>
      <select
        id={`f-${clave}`}
        value={params.get(clave) ?? ''}
        onChange={(e) => filtro(clave, e.target.value)}
      >
        <option value="">Todas</option>
        {opciones.map(([v, n]) => (
          <option key={v} value={v}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
  return (
    <section className="pila">
      <h1>Consultas</h1>
      {atrasadas > 0 && (
        <p className="aviso error" role="status">
          {atrasadas} {atrasadas === 1 ? 'consulta lleva' : 'consultas llevan'} más de 48 horas sin
          respuesta.
        </p>
      )}
      <div className="fila" style={{ alignItems: 'flex-end' }}>
        {select(
          'estado',
          'Estado',
          ESTADOS_CONSULTA.map((e) => [e, ETIQUETAS_ESTADO_CONSULTA[e]]),
        )}
        {select(
          'categoria',
          'Categoría',
          (categorias.datos ?? []).map((c) => [c.id, c.nombre]),
        )}
        {select(
          'clasificacion',
          'Clasificación',
          CLASIFICACIONES.map((c) => [c, ETIQUETAS_CLASIFICACION[c]]),
        )}
        {select('antiguedad', 'Antigüedad', [
          ['atrasadas', 'Más de 48 h sin responder'],
          ['7', 'Más de 7 días'],
          ['30', 'Más de 30 días'],
        ])}
      </div>
      <AvisoError mensaje={error?.message} />
      <div className="tabla-envoltura">
        <table>
          <thead>
            <tr>
              <th scope="col">Radicado</th>
              <th scope="col">Asunto</th>
              <th scope="col">Cliente</th>
              <th scope="col">Categoría</th>
              <th scope="col">Estado</th>
              <th scope="col">Recibida</th>
            </tr>
          </thead>
          <tbody>
            {datos?.map((c) => (
              <tr key={c.id} className={c.atrasada ? 'fila-alerta' : undefined}>
                <td>
                  <Link to={`/panel/consultas/${c.id}`}>{c.radicado}</Link>
                </td>
                <td>{c.asunto}</td>
                <td>{c.clienteNombre}</td>
                <td>{c.categoriaNombre}</td>
                <td>
                  <EstadoConsulta estado={c.estado} />
                  {c.clasificacion && (
                    <div className="pequeno suave">{ETIQUETAS_CLASIFICACION[c.clasificacion]}</div>
                  )}
                </td>
                <td>
                  {formatoFechaHora(c.recibidaEn)}
                  {c.atrasada && <div className="error-campo pequeno">+48 h</div>}
                </td>
              </tr>
            ))}
            {datos?.length === 0 && (
              <tr>
                <td colSpan={6} className="suave">
                  No hay consultas con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
