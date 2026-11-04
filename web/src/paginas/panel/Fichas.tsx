import { ESTADOS_FICHA, ETIQUETAS_ESTADO_FICHA, type FichaAdminResumenDto } from '@ic/shared';
import { useState } from 'react';
import { Link } from 'react-router';
import { AvisoError } from '../../componentes/Campo';
import { api } from '../../lib/api';
import { formatoFecha, formatoPrecio } from '../../lib/formato';
import { useCarga } from '../../lib/useCarga';

const COLOR = { PUBLICADA: 'verde', BORRADOR: '', DESPUBLICADA: 'amarillo' } as const;

/** HU-06 CA1: fichas con título, categoría, estado, precio y fecha; filtro y búsqueda. */
export default function Fichas() {
  const [estado, setEstado] = useState('');
  const [q, setQ] = useState('');
  const { datos, error, cargando } = useCarga(
    (s) =>
      api<FichaAdminResumenDto[]>(`/admin/fichas?${new URLSearchParams({ estado, q })}`, {
        senal: s,
      }),
    [estado, q],
  );
  return (
    <section className="pila">
      <div className="fila entre">
        <h1 style={{ margin: 0 }}>Fichas</h1>
        <Link className="boton" to="/panel/fichas/nueva">
          Nueva ficha
        </Link>
      </div>
      <div className="fila">
        <div className="campo" style={{ flex: '1 1 260px', margin: 0 }}>
          <label htmlFor="buscar-titulo">Buscar por título</label>
          <input
            id="buscar-titulo"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="campo" style={{ flex: '0 1 220px', margin: 0 }}>
          <label htmlFor="filtro-estado">Estado</label>
          <select id="filtro-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS_FICHA.map((e) => (
              <option key={e} value={e}>
                {ETIQUETAS_ESTADO_FICHA[e]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <AvisoError mensaje={error?.message} />
      <div className="tabla-envoltura" aria-busy={cargando}>
        <table>
          <thead>
            <tr>
              <th scope="col">Título</th>
              <th scope="col">Categoría</th>
              <th scope="col">Estado</th>
              <th scope="col">Precio</th>
              <th scope="col">Actualizada</th>
            </tr>
          </thead>
          <tbody>
            {datos?.map((f) => (
              <tr key={f.id}>
                <td>
                  <Link to={`/panel/fichas/${f.id}`}>{f.titulo || 'Sin título'}</Link>
                </td>
                <td>{f.categoriaNombre || '—'}</td>
                <td>
                  <span className={`estado ${COLOR[f.estado]}`}>
                    {ETIQUETAS_ESTADO_FICHA[f.estado]}
                  </span>
                </td>
                <td>{f.precio === null ? '—' : formatoPrecio(f.precio)}</td>
                <td>{formatoFecha(f.actualizadaEn)}</td>
              </tr>
            ))}
            {datos?.length === 0 && (
              <tr>
                <td colSpan={5} className="suave">
                  No hay fichas con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
